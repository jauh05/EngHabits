/**
 * Tautan akun EngHabits ke akun Kauiz, dan alur OAuth kode ke Kauiz.
 * Satu akun EngHabits hanya punya satu tautan, dan satu akun Kauiz hanya bisa ditautkan ke satu akun EngHabits.
 * Kode OAuth hanya ditukar di server, jadi secret klien tidak pernah sampai ke perangkat.
 */
import { createHash, randomBytes } from 'node:crypto';

const FLOW_TTL_MS = { link: 10 * 60_000, login: 10 * 60_000, handoff: 2 * 60_000 };
const REQUEST_TIMEOUT_MS = 10_000;

export class KauizError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function ensureKauizSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS kauiz_links (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      kauiz_id TEXT NOT NULL UNIQUE,
      linked_at TEXT NOT NULL
    );
    -- Kode sekali pakai: state OAuth ('link' atau 'login') dan kode serah-terima sesi ('handoff').
    -- Yang disimpan hanya hash-nya, dan setiap kode hangus begitu dipakai.
    CREATE TABLE IF NOT EXISTS kauiz_flows (
      hash TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      user_id TEXT,
      expires_at TEXT NOT NULL
    );
  `);
}

function hashValue(raw) {
  return createHash('sha256').update(raw).digest('hex');
}

/** Membuat kode sekali pakai dan mengembalikan nilai mentahnya. Hanya hash-nya yang masuk database. */
export function createFlow(db, kind, userId = null, now = Date.now()) {
  db.prepare('DELETE FROM kauiz_flows WHERE expires_at < ?').run(new Date(now).toISOString());
  const raw = randomBytes(32).toString('base64url');
  db.prepare('INSERT INTO kauiz_flows (hash, kind, user_id, expires_at) VALUES (?, ?, ?, ?)').run(
    hashValue(raw),
    kind,
    userId,
    new Date(now + FLOW_TTL_MS[kind]).toISOString(),
  );
  return raw;
}

/** Memakai kode sekali. Kode yang salah jenis, sudah dipakai, atau kedaluwarsa mengembalikan null. */
export function consumeFlow(db, kinds, raw, now = Date.now()) {
  if (typeof raw !== 'string' || raw === '') return null;
  const hash = hashValue(raw);
  const row = db.prepare('SELECT kind, user_id, expires_at FROM kauiz_flows WHERE hash = ?').get(hash);
  if (!row) return null;
  // Database sinkron dan satu proses, jadi baris dihapus sebelum kode lain bisa membacanya.
  db.prepare('DELETE FROM kauiz_flows WHERE hash = ?').run(hash);
  if (!kinds.includes(row.kind) || Date.parse(row.expires_at) < now) return null;
  return { kind: row.kind, userId: row.user_id };
}

export function kauizConnected(db, userId) {
  return Boolean(db.prepare('SELECT 1 FROM kauiz_links WHERE user_id = ?').get(userId));
}

export function kauizUserId(db, kauizId) {
  const row = db.prepare('SELECT user_id FROM kauiz_links WHERE kauiz_id = ?').get(kauizId);
  return row?.user_id ?? null;
}

export function linkKauiz(db, userId, kauizId, now = new Date().toISOString()) {
  const id = String(kauizId ?? '').trim();
  if (!id) throw new KauizError(400, 'ID akun Kauiz tidak valid.');
  const own = db.prepare('SELECT kauiz_id FROM kauiz_links WHERE user_id = ?').get(userId);
  if (own && own.kauiz_id !== id) {
    throw new KauizError(409, 'Akun ini sudah terhubung ke Kauiz lain. Putuskan dulu sebelum menghubungkan yang baru.');
  }
  if (own) return;
  const taken = kauizUserId(db, id);
  if (taken) throw new KauizError(409, 'Akun Kauiz ini sudah terhubung ke akun EngHabits lain.');
  db.prepare('INSERT INTO kauiz_links (user_id, kauiz_id, linked_at) VALUES (?, ?, ?)').run(userId, id, now);
}

export function unlinkKauiz(db, userId) {
  db.prepare('DELETE FROM kauiz_links WHERE user_id = ?').run(userId);
}

/** Pengaturan Kauiz dari environment. Kosong berarti fitur belum dikonfigurasi. */
export function kauizSettingsFromEnv(env = process.env) {
  return {
    clientId: env.KAUIZ_CLIENT_ID ?? 'enghabits',
    clientSecret: env.KAUIZ_CLIENT_SECRET ?? '',
    baseUrl: (env.KAUIZ_BASE_URL ?? '').replace(/\/+$/, ''),
    appUrl: (env.PUBLIC_APP_URL ?? '').replace(/\/+$/, ''),
  };
}

export function kauizReady(settings) {
  return Boolean(settings.clientSecret && settings.baseUrl && settings.appUrl);
}

export function callbackUrl(settings) {
  return `${settings.appUrl}/api/kauiz/callback`;
}

export function authorizeUrl(settings, state) {
  const url = new URL(`${settings.baseUrl}/oauth/authorize`);
  url.search = new URLSearchParams({
    client_id: settings.clientId,
    redirect_uri: callbackUrl(settings),
    response_type: 'code',
    state,
  }).toString();
  return url.toString();
}

/** Menukar kode di Kauiz dan mengembalikan identitas pengguna. Galat jaringan atau penolakan jadi KauizError. */
export async function fetchKauizIdentity(settings, code, fetchImpl = fetch) {
  const tokenResponse = await fetchKauiz(fetchImpl, `${settings.baseUrl}/v1/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      client_id: settings.clientId,
      client_secret: settings.clientSecret,
      redirect_uri: callbackUrl(settings),
    }),
  });
  const token = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !token.access_token) throw new KauizError(502, 'Kauiz menolak permintaan masuk.');

  const infoResponse = await fetchKauiz(fetchImpl, `${settings.baseUrl}/v1/oauth/userinfo`, {
    headers: { Authorization: `Bearer ${token.access_token}`, Accept: 'application/json' },
  });
  const info = await infoResponse.json().catch(() => ({}));
  if (!infoResponse.ok || !info.sub || !info.email) throw new KauizError(502, 'Data akun Kauiz tidak lengkap.');

  const email = String(info.email).trim().toLowerCase();
  return {
    sub: String(info.sub),
    email,
    name: String(info.name ?? '').trim() || email.split('@')[0],
  };
}

async function fetchKauiz(fetchImpl, url, init) {
  try {
    return await fetchImpl(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch {
    throw new KauizError(502, 'Tidak bisa terhubung ke Kauiz. Coba lagi.');
  }
}
