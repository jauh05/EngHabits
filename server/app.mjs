// API EngHabits: akun, ID publik, sinkron hari lulus, dan battle real-time.
// Hanya memakai modul bawaan Node 22.13 atau lebih baru (node:sqlite). Kata sandi di-hash dengan scrypt,
// token sesi dan ID publik tidak disimpan dalam bentuk mentah.
import { createHash, randomBytes, randomInt, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { promisify } from 'node:util';
import { BattleError, createBattleService, ensureBattleSchema, levelFromMastered } from './battle.mjs';
import { ensureSyncSchema, readSync, syncUser } from './sync.mjs';

const scryptAsync = promisify(scrypt);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const MAX_BODY_BYTES = 10_000;
const MAX_SYNC_BYTES = 5_000_000;
const SESSION_DAYS = 180;
const PUBLIC_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const PUBLIC_ID_PATTERN = /^EH-[A-HJ-NP-Z2-9]{6}$/;
// Batas percobaan: gagal masuk 5 kali per email dalam 15 menit, 20 kali per alamat dalam 15 menit,
// dan 20 pendaftaran per alamat dalam satu jam.
const LOGIN_WINDOW_MS = 15 * 60_000;
const LOGIN_MAX_PER_EMAIL = 5;
const LOGIN_MAX_PER_IP = 20;
const REGISTER_WINDOW_MS = 60 * 60_000;
const REGISTER_MAX_PER_IP = 20;
const DEFAULT_BANK_DIR = fileURLToPath(new URL('../content/battle/', import.meta.url));

class HttpError extends Error {
  constructor(status, message, retryAfter) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

/** Penghitung percobaan per kunci. Disimpan di memori, jadi ulang saat service dimulai. */
function createLimiter(windowMs) {
  const hits = new Map();
  return {
    /** Sisa detik sebelum kunci boleh mencoba lagi, atau 0 bila masih boleh. */
    retryAfter(key, max, now = Date.now()) {
      const entry = hits.get(key);
      if (!entry || entry.resetAt <= now || entry.count < max) return 0;
      return Math.ceil((entry.resetAt - now) / 1000);
    },
    hit(key, now = Date.now()) {
      const entry = hits.get(key);
      if (!entry || entry.resetAt <= now) hits.set(key, { count: 1, resetAt: now + windowMs });
      else entry.count += 1;
    },
    reset(key) {
      hits.delete(key);
    },
  };
}

// Alamat asli pengunjung diambil dari header Cloudflare atau nginx. Aman karena API hanya bisa dihubungi dari 127.0.0.1.
function clientIp(req) {
  const forwarded = req.headers['cf-connecting-ip'] ?? req.headers['x-forwarded-for'];
  return String(forwarded ?? req.socket.remoteAddress ?? 'unknown').split(',')[0].trim();
}

const tooMany = (retryAfter) =>
  new HttpError(429, 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.', retryAfter);

function generatePublicId() {
  let code = '';
  for (let index = 0; index < 6; index += 1) code += PUBLIC_ID_ALPHABET[randomInt(PUBLIC_ID_ALPHABET.length)];
  return `EH-${code}`;
}

function uniquePublicId(db) {
  const taken = db.prepare('SELECT 1 FROM users WHERE public_id = ?');
  let candidate = generatePublicId();
  while (taken.get(candidate)) candidate = generatePublicId();
  return candidate;
}

/** Menyiapkan kolom ID publik dan tabel baru. Aman dijalankan berulang pada database lama maupun baru. */
function migrate(db) {
  const columns = db.prepare('PRAGMA table_info(users)').all().map((column) => column.name);
  if (!columns.includes('public_id')) db.exec('ALTER TABLE users ADD COLUMN public_id TEXT');
  if (!columns.includes('public_id_changed')) {
    db.exec('ALTER TABLE users ADD COLUMN public_id_changed INTEGER NOT NULL DEFAULT 0');
  }
  const missing = db.prepare('SELECT id FROM users WHERE public_id IS NULL').all();
  const assign = db.prepare('UPDATE users SET public_id = ? WHERE id = ?');
  for (const row of missing) assign.run(uniquePublicId(db), row.id);
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS users_public_id ON users(public_id)');
  ensureBattleSchema(db);
  ensureSyncSchema(db);
}

export function openDatabase(path) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      salt TEXT NOT NULL,
      hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      expires_at TEXT NOT NULL
    );
  `);
  migrate(db);
  return db;
}

/** Membaca semua bank soal battle dari folder content/battle. Berkas yang tidak ada berarti bank kosong. */
export function loadBattleBank(dir = DEFAULT_BANK_DIR) {
  try {
    return readdirSync(dir)
      .filter((name) => name.endsWith('.json'))
      .flatMap((name) => JSON.parse(readFileSync(join(dir, name), 'utf8')));
  } catch {
    return [];
  }
}

const normalizeEmail = (value) => String(value ?? '').trim().toLowerCase();
const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const derive = (password, salt) => scryptAsync(password, salt, 64);

async function hashPassword(password) {
  const salt = randomBytes(16);
  return { salt: salt.toString('base64'), hash: (await derive(password, salt)).toString('base64') };
}

async function checkPassword(password, salt, hash) {
  const candidate = await derive(password, Buffer.from(salt, 'base64'));
  const expected = Buffer.from(hash, 'base64');
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

function validateRegistration({ name, email, password }) {
  if (!name || name.length > 40) return 'Nama panggilan wajib diisi, maksimal 40 karakter.';
  if (!EMAIL_PATTERN.test(email)) return 'Format email belum benar.';
  if (password.length < PASSWORD_MIN_LENGTH || password.length > 200) return `Kata sandi minimal ${PASSWORD_MIN_LENGTH} karakter.`;
  return null;
}

async function readJson(req, maxBytes = MAX_BODY_BYTES) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw new HttpError(413, 'Data terlalu besar.');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    throw new HttpError(400, 'Data tidak valid.');
  }
}

function bearerToken(req) {
  const header = req.headers.authorization ?? '';
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(body === null ? undefined : JSON.stringify(body));
}

/** Mencocokkan pola path seperti /api/battles/:id. Mengembalikan null bila tidak cocok. */
function matchPath(pattern, pathname) {
  const want = pattern.split('/');
  const got = pathname.split('/');
  if (want.length !== got.length) return null;
  const params = {};
  for (let index = 0; index < want.length; index += 1) {
    if (want[index].startsWith(':')) {
      params[want[index].slice(1)] = decodeURIComponent(got[index]);
    } else if (want[index] !== got[index]) {
      return null;
    }
  }
  return params;
}

export function createApp(db, options = {}) {
  const loginLimiter = createLimiter(LOGIN_WINDOW_MS);
  const registerLimiter = createLimiter(REGISTER_WINDOW_MS);
  const streams = new Map();
  const bank = options.bank ?? loadBattleBank();

  const insertUser = db.prepare(
    'INSERT INTO users (id, email, name, salt, hash, created_at, public_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
  );
  const findUser = db.prepare('SELECT id, email, name, salt, hash FROM users WHERE email = ?');
  const insertSession = db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)');
  const findSession = db.prepare(
    'SELECT users.id, users.email, users.name, users.public_id, users.public_id_changed FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ? AND sessions.expires_at > ?',
  );
  const deleteSession = db.prepare('DELETE FROM sessions WHERE token_hash = ?');
  const findByPublicId = db.prepare('SELECT name, public_id FROM users WHERE public_id = ?');
  const setPublicId = db.prepare('UPDATE users SET public_id = ?, public_id_changed = 1 WHERE id = ?');
  const clearMastered = db.prepare('DELETE FROM mastered_days WHERE user_id = ?');
  const insertMastered = db.prepare('INSERT INTO mastered_days (user_id, day) VALUES (?, ?)');
  const unauthorized = { status: 401, body: { error: 'Email atau kata sandi salah.' } };

  const notify = (userId, event, data) => {
    const set = streams.get(userId);
    if (!set) return;
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of set) res.write(payload);
  };

  const battles = createBattleService({ db, bank, notify, timeScale: options.timeScale ?? 1 });
  battles.cancelInterrupted();

  function issueSession(userId) {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString();
    insertSession.run(hashToken(token), userId, expiresAt);
    return token;
  }

  /** Pengguna dari token Bearer. Melempar 401 bila sesi tidak valid. */
  function requireUser(req) {
    const user = findSession.get(hashToken(bearerToken(req)), new Date().toISOString());
    if (!user) throw new HttpError(401, 'Sesi tidak valid. Silakan masuk lagi.');
    return user;
  }

  function accountView(user) {
    return {
      email: user.email,
      name: user.name,
      publicId: user.public_id,
      canChangePublicId: user.public_id_changed === 0,
    };
  }

  const handlers = {
    async register({ req }) {
      const ipKey = `ip:${clientIp(req)}`;
      const wait = registerLimiter.retryAfter(ipKey, REGISTER_MAX_PER_IP);
      if (wait) throw tooMany(wait);
      registerLimiter.hit(ipKey);
      const input = await readJson(req);
      const account = { name: String(input.name ?? '').trim(), email: normalizeEmail(input.email) };
      const password = String(input.password ?? '');
      const problem = validateRegistration({ ...account, password });
      if (problem) return { status: 400, body: { error: problem } };
      if (findUser.get(account.email)) return { status: 409, body: { error: 'Email sudah terdaftar. Silakan masuk.' } };
      const { salt, hash } = await hashPassword(password);
      const id = randomUUID();
      const publicId = uniquePublicId(db);
      insertUser.run(id, account.email, account.name, salt, hash, new Date().toISOString(), publicId);
      return { status: 201, body: { token: issueSession(id), account: { ...account, publicId, canChangePublicId: true } } };
    },

    async login({ req }) {
      const input = await readJson(req);
      const email = normalizeEmail(input.email);
      const password = String(input.password ?? '');
      const emailKey = `email:${email}`;
      const ipKey = `ip:${clientIp(req)}`;
      const wait = Math.max(
        loginLimiter.retryAfter(emailKey, LOGIN_MAX_PER_EMAIL),
        loginLimiter.retryAfter(ipKey, LOGIN_MAX_PER_IP),
      );
      if (wait) throw tooMany(wait);

      const user = findUser.get(email);
      const ok = user ? await checkPassword(password, user.salt, user.hash) : (await hashPassword(password), false);
      if (!ok) {
        loginLimiter.hit(emailKey);
        loginLimiter.hit(ipKey);
        return unauthorized;
      }
      loginLimiter.reset(emailKey);
      const full = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
      return { status: 200, body: { token: issueSession(user.id), account: accountView(full) } };
    },

    async logout({ req }) {
      const token = bearerToken(req);
      if (token) deleteSession.run(hashToken(token));
      return { status: 204, body: null };
    },

    async me({ req }) {
      const user = requireUser(req);
      return { status: 200, body: { account: accountView(user) } };
    },

    async regeneratePublicId({ req }) {
      const user = requireUser(req);
      if (user.public_id_changed !== 0) return { status: 409, body: { error: 'ID hanya bisa diganti sekali.' } };
      const publicId = uniquePublicId(db);
      setPublicId.run(publicId, user.id);
      return { status: 200, body: { account: accountView({ ...user, public_id: publicId, public_id_changed: 1 }) } };
    },

    async userLookup({ req, params }) {
      requireUser(req);
      const row = findByPublicId.get(params.publicId.toUpperCase());
      if (!row) return { status: 404, body: { error: 'ID tidak ditemukan.' } };
      return { status: 200, body: { publicId: row.public_id, name: row.name } };
    },

    async saveMastered({ req }) {
      const user = requireUser(req);
      const input = await readJson(req);
      const days = Array.isArray(input.days) ? input.days : [];
      const valid = [...new Set(days.map(Number))].filter((day) => Number.isInteger(day) && day >= 1 && day <= 90);
      db.exec('BEGIN');
      try {
        clearMastered.run(user.id);
        for (const day of valid) insertMastered.run(user.id, day);
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
      return { status: 200, body: { level: levelFromMastered(valid), count: valid.length } };
    },

    async syncGet({ req }) {
      const user = requireUser(req);
      return { status: 200, body: readSync(db, user.id) };
    },

    /** Data dari perangkat digabung dengan data server. Hasil gabungan dikembalikan ke perangkat. */
    async syncPut({ req }) {
      const user = requireUser(req);
      const input = await readJson(req, MAX_SYNC_BYTES);
      return { status: 200, body: syncUser(db, user.id, input) };
    },

    async battleCreate({ req }) {
      const user = requireUser(req);
      const input = await readJson(req);
      return { status: 201, body: battles.createInvite(user.id, input) };
    },

    async battleRespond({ req, params }) {
      const user = requireUser(req);
      const input = await readJson(req);
      return { status: 200, body: battles.respond(params.id, user.id, input.accept === true) };
    },

    async battleAnswer({ req, params }) {
      const user = requireUser(req);
      const input = await readJson(req);
      return { status: 200, body: battles.answer(params.id, user.id, Number(input.idx), input.answer) };
    },

    async battleRate({ req, params }) {
      const user = requireUser(req);
      const input = await readJson(req);
      return { status: 200, body: battles.rate(params.id, user.id, Number(input.idx), input.scores) };
    },

    async battleGet({ req, params }) {
      const user = requireUser(req);
      return { status: 200, body: battles.stateFor(params.id, user.id) };
    },

    async battleList({ req }) {
      const user = requireUser(req);
      return { status: 200, body: { battles: battles.history(user.id), invites: battles.pendingInvites(user.id) } };
    },

    /** Aliran SSE: undangan dan perubahan battle dikirim tanpa perlu muat ulang halaman. */
    async battleEvents({ req, res }) {
      const user = requireUser(req);
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-store',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      });
      res.write(': terhubung\n\n');
      const set = streams.get(user.id) ?? new Set();
      set.add(res);
      streams.set(user.id, set);
      res.write(`event: invites\ndata: ${JSON.stringify(battles.pendingInvites(user.id))}\n\n`);
      const ping = setInterval(() => res.write(': ping\n\n'), 25_000);
      req.on('close', () => {
        clearInterval(ping);
        set.delete(res);
        if (set.size === 0) streams.delete(user.id);
      });
      return null;
    },
  };

  const routes = [
    ['POST', '/api/register', handlers.register],
    ['POST', '/api/login', handlers.login],
    ['POST', '/api/logout', handlers.logout],
    ['GET', '/api/me', handlers.me],
    ['POST', '/api/me/public-id/regenerate', handlers.regeneratePublicId],
    ['GET', '/api/users/:publicId', handlers.userLookup],
    ['PUT', '/api/progress/mastered', handlers.saveMastered],
    ['GET', '/api/sync', handlers.syncGet],
    ['PUT', '/api/sync', handlers.syncPut],
    ['GET', '/api/battles/events', handlers.battleEvents],
    ['GET', '/api/battles', handlers.battleList],
    ['POST', '/api/battles', handlers.battleCreate],
    ['GET', '/api/battles/:id', handlers.battleGet],
    ['POST', '/api/battles/:id/respond', handlers.battleRespond],
    ['POST', '/api/battles/:id/answer', handlers.battleAnswer],
    ['POST', '/api/battles/:id/rate', handlers.battleRate],
  ];

  function findRoute(method, pathname) {
    for (const [routeMethod, pattern, handler] of routes) {
      if (routeMethod !== method) continue;
      const params = matchPath(pattern, pathname);
      if (params) return { handler, params };
    }
    return null;
  }

  return createServer(async (req, res) => {
    try {
      const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
      const found = findRoute(req.method, pathname);
      if (!found) return send(res, 404, { error: 'Tidak ditemukan.' });
      const result = await found.handler({ req, res, params: found.params });
      if (result === null) return; // Respons sudah ditangani sendiri, misalnya SSE.
      send(res, result.status, result.body, result.headers);
    } catch (error) {
      if (error instanceof HttpError) {
        const headers = error.retryAfter ? { 'Retry-After': String(error.retryAfter) } : {};
        return send(res, error.status, { error: error.message }, headers);
      }
      if (error instanceof BattleError) return send(res, error.status, { error: error.message });
      console.error(error);
      send(res, 500, { error: 'Terjadi kesalahan di server.' });
    }
  });
}
