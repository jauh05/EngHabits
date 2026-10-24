// API akun EngHabits. Hanya memakai modul bawaan Node 22.13 atau lebih baru (node:sqlite).
// Kata sandi di-hash dengan scrypt dan sesi disimpan dalam bentuk hash SHA-256, jadi token mentah tidak tersimpan.
import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const MAX_BODY_BYTES = 10_000;
const SESSION_DAYS = 180;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
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
  return db;
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

async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new HttpError(413, 'Data terlalu besar.');
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

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body === null ? undefined : JSON.stringify(body));
}

export function createApp(db) {
  const insertUser = db.prepare('INSERT INTO users (id, email, name, salt, hash, created_at) VALUES (?, ?, ?, ?, ?, ?)');
  const findUser = db.prepare('SELECT id, email, name, salt, hash FROM users WHERE email = ?');
  const insertSession = db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)');
  const findSession = db.prepare(
    'SELECT users.email, users.name FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ? AND sessions.expires_at > ?',
  );
  const deleteSession = db.prepare('DELETE FROM sessions WHERE token_hash = ?');
  const unauthorized = { status: 401, body: { error: 'Email atau kata sandi salah.' } };

  function issueSession(userId) {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString();
    insertSession.run(hashToken(token), userId, expiresAt);
    return token;
  }

  const routes = {
    async 'POST /api/register'(req) {
      const input = await readJson(req);
      const account = { name: String(input.name ?? '').trim(), email: normalizeEmail(input.email) };
      const password = String(input.password ?? '');
      const problem = validateRegistration({ ...account, password });
      if (problem) return { status: 400, body: { error: problem } };
      if (findUser.get(account.email)) return { status: 409, body: { error: 'Email sudah terdaftar. Silakan masuk.' } };
      const { salt, hash } = await hashPassword(password);
      const id = randomUUID();
      insertUser.run(id, account.email, account.name, salt, hash, new Date().toISOString());
      return { status: 201, body: { token: issueSession(id), account } };
    },

    async 'POST /api/login'(req) {
      const input = await readJson(req);
      const email = normalizeEmail(input.email);
      const password = String(input.password ?? '');
      const user = findUser.get(email);
      if (!user) {
        // Tetap menghitung hash supaya waktu jawabannya tidak membocorkan email yang terdaftar.
        await hashPassword(password);
        return unauthorized;
      }
      if (!(await checkPassword(password, user.salt, user.hash))) return unauthorized;
      return { status: 200, body: { token: issueSession(user.id), account: { email: user.email, name: user.name } } };
    },

    async 'POST /api/logout'(req) {
      const token = bearerToken(req);
      if (token) deleteSession.run(hashToken(token));
      return { status: 204, body: null };
    },

    async 'GET /api/me'(req) {
      const user = findSession.get(hashToken(bearerToken(req)), new Date().toISOString());
      if (!user) return { status: 401, body: { error: 'Sesi tidak valid. Silakan masuk lagi.' } };
      return { status: 200, body: { account: { email: user.email, name: user.name } } };
    },
  };

  return createServer(async (req, res) => {
    try {
      const route = routes[`${req.method} ${new URL(req.url ?? '/', 'http://localhost').pathname}`];
      if (!route) return send(res, 404, { error: 'Tidak ditemukan.' });
      const { status, body } = await route(req);
      send(res, status, body);
    } catch (error) {
      if (error instanceof HttpError) return send(res, error.status, { error: error.message });
      console.error(error);
      send(res, 500, { error: 'Terjadi kesalahan di server.' });
    }
  });
}
