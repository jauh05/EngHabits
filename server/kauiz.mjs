/**
 * Tautan akun EngHabits ke akun Kauiz, alur OAuth ke Kauiz, dan pengiriman ringkasan progres.
 * Satu akun EngHabits hanya punya satu tautan, dan satu akun Kauiz hanya bisa ditautkan ke satu akun EngHabits.
 * Kode OAuth dan token integrasi hanya dipakai di server. Token integrasi disimpan terenkripsi.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const FLOW_TTL_MS = { link: 10 * 60_000, login: 10 * 60_000, handoff: 2 * 60_000 };
const REQUEST_TIMEOUT_MS = 10_000;
const PARTS = ['comprehension', 'partA', 'partB', 'hard'];
const LAST_DAY = 90;

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
  ensureColumn(db, 'kauiz_links', 'integration_token_enc', 'TEXT');
  ensureColumn(db, 'kauiz_links', 'last_pushed_at', 'TEXT');
}

function ensureColumn(db, table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all().map((row) => row.name);
  if (!columns.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
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

/** Pengiriman ringkasan aktif bila token integrasi tersimpan. */
export function kauizSharing(db, userId) {
  const row = db.prepare('SELECT integration_token_enc FROM kauiz_links WHERE user_id = ?').get(userId);
  return Boolean(row?.integration_token_enc);
}

export function kauizLastSentAt(db, userId) {
  return db.prepare('SELECT last_pushed_at FROM kauiz_links WHERE user_id = ?').get(userId)?.last_pushed_at ?? null;
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

/** Memutus tautan dan menghapus token integrasi lokal. Pencabutan di Kauiz dilakukan terpisah. */
export function unlinkKauiz(db, userId) {
  db.prepare('DELETE FROM kauiz_links WHERE user_id = ?').run(userId);
}

export function clearIntegrationToken(db, userId) {
  db.prepare('UPDATE kauiz_links SET integration_token_enc = NULL, last_pushed_at = NULL WHERE user_id = ?').run(userId);
}

export function markPushed(db, userId, now = new Date()) {
  db.prepare('UPDATE kauiz_links SET last_pushed_at = ? WHERE user_id = ?').run(now.toISOString(), userId);
}

/** Pengaturan Kauiz dari environment. Kosong berarti fitur belum dikonfigurasi. */
export function kauizSettingsFromEnv(env = process.env) {
  return {
    clientId: env.KAUIZ_CLIENT_ID ?? 'enghabits',
    clientSecret: env.KAUIZ_CLIENT_SECRET ?? '',
    baseUrl: (env.KAUIZ_BASE_URL ?? '').replace(/\/+$/, ''),
    appUrl: (env.PUBLIC_APP_URL ?? '').replace(/\/+$/, ''),
    tokenKey: env.KAUIZ_TOKEN_KEY ?? '',
    learningEnabled: ['1', 'true'].includes(String(env.KAUIZ_LEARNING_ENABLED ?? '').toLowerCase()),
  };
}

export function kauizReady(settings) {
  return Boolean(settings.clientSecret && settings.baseUrl && settings.appUrl);
}

/** Kunci enkripsi token integrasi. Null bila tidak valid, dan berbagi ringkasan otomatis nonaktif. */
export function encryptionKey(settings) {
  if (!settings.tokenKey) return null;
  const key = Buffer.from(settings.tokenKey, 'base64');
  return key.length === 32 ? key : null;
}

/** Scope yang diminta saat menghubungkan. learning:share hanya bila fitur aktif dan kunci enkripsi valid. */
export function requestedScope(settings) {
  return settings.learningEnabled && encryptionKey(settings) ? 'identity learning:share' : 'identity';
}

export function sealToken(key, plain) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((part) => part.toString('base64')).join('.');
}

export function openToken(key, sealed) {
  const [iv, tag, data] = sealed.split('.').map((part) => Buffer.from(part, 'base64'));
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

export function saveIntegrationToken(db, key, userId, token) {
  if (!key || !token) return;
  db.prepare('UPDATE kauiz_links SET integration_token_enc = ? WHERE user_id = ?').run(sealToken(key, token), userId);
}

export function readIntegrationToken(db, key, userId) {
  const row = db.prepare('SELECT integration_token_enc FROM kauiz_links WHERE user_id = ?').get(userId);
  if (!key || !row?.integration_token_enc) return null;
  try {
    return openToken(key, row.integration_token_enc);
  } catch {
    // Kunci berubah atau data rusak. Berbagi dihentikan sampai pengguna menghubungkan ulang.
    return null;
  }
}

export function callbackUrl(settings) {
  return `${settings.appUrl}/api/kauiz/callback`;
}

export function authorizeUrl(settings, state, scope = 'identity') {
  const url = new URL(`${settings.baseUrl}/oauth/authorize`);
  url.search = new URLSearchParams({
    client_id: settings.clientId,
    redirect_uri: callbackUrl(settings),
    response_type: 'code',
    scope,
    state,
  }).toString();
  return url.toString();
}

/** Menukar kode di Kauiz dan mengembalikan identitas pengguna, serta token integrasi bila diberikan. */
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
    integrationToken: typeof token.integration_token === 'string' ? token.integration_token : null,
  };
}

/** Mengirim ringkasan ke Kauiz. Status 401 atau 403 berarti token sudah dicabut di Kauiz. */
export async function pushLearningSummary(settings, integrationToken, summary, fetchImpl = fetch) {
  const response = await fetchKauiz(fetchImpl, `${settings.baseUrl}/v1/integrations/enghabits/snapshot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${integrationToken}` },
    body: JSON.stringify(summary),
  });
  if (response.status === 401 || response.status === 403) throw new KauizError(response.status, 'Token integrasi sudah dicabut.');
  if (!response.ok) throw new KauizError(502, 'Kauiz menolak ringkasan progres.');
  return true;
}

/** Mencabut token integrasi di Kauiz. Token yang sudah tidak berlaku dianggap sudah dicabut. */
export async function revokeLearningSharing(settings, integrationToken, fetchImpl = fetch) {
  const response = await fetchKauiz(fetchImpl, `${settings.baseUrl}/v1/integrations/enghabits`, {
    method: 'DELETE',
    headers: { Accept: 'application/json', Authorization: `Bearer ${integrationToken}` },
  });
  return response.ok || response.status === 401 || response.status === 403 || response.status === 404;
}

/**
 * Ringkasan progres untuk Kauiz. Berisi angka saja: hari lulus, skor per bagian, dan kesalahan terbuka per hari.
 * Catatan, jawaban mentah, dan data akun tidak ikut.
 */
export function buildLearningSummary(db, userId, now = new Date()) {
  const masteredDays = db
    .prepare('SELECT day FROM mastered_days WHERE user_id = ? ORDER BY day')
    .all(userId)
    .map((row) => row.day);
  const progressRows = db
    .prepare("SELECT data FROM sync_items WHERE user_id = ? AND kind = 'progress'")
    .all(userId)
    .map((row) => JSON.parse(row.data));
  const mistakeRows = db
    .prepare("SELECT data FROM sync_items WHERE user_id = ? AND kind = 'mistakes'")
    .all(userId)
    .map((row) => JSON.parse(row.data));

  const parts = Object.fromEntries(PARTS.map((part) => [part, { correct: 0, total: 0 }]));
  for (const row of progressRows) {
    for (const part of PARTS) {
      const counts = row.firstParts?.[part];
      if (!counts) continue;
      parts[part].correct += wholeNumber(counts.correct);
      parts[part].total += wholeNumber(counts.total);
    }
  }

  const recentScores = [...progressRows]
    .sort((a, b) => b.day - a.day)
    .slice(0, 14)
    .map((row) => ({ day: row.day, core_percent: percent(row.firstCorePercent) }));

  const lastCompleted = progressRows.map((row) => row.completedDate).filter(Boolean).sort().at(-1) ?? null;
  const mastered = new Set(masteredDays);
  let currentDay = LAST_DAY;
  for (let day = 1; day <= LAST_DAY; day += 1) {
    if (!mastered.has(day)) {
      currentDay = day;
      break;
    }
  }

  const openByDay = new Map();
  let open = 0;
  for (const mistake of mistakeRows) {
    if (mistake.mastered) continue;
    open += 1;
    openByDay.set(mistake.day, (openByDay.get(mistake.day) ?? 0) + 1);
  }
  const byDay = [...openByDay]
    .map(([day, count]) => ({ day, open: count }))
    .sort((a, b) => b.open - a.open || a.day - b.day)
    .slice(0, 10);

  return {
    version: 1,
    generated_at: now.toISOString(),
    progress: {
      days_mastered: masteredDays.length,
      current_day: currentDay,
      last_completed_date: lastCompleted,
      recent_scores: recentScores,
    },
    parts,
    mistakes: { open, by_day: byDay },
  };
}

function wholeNumber(value) {
  return Math.max(0, Math.round(Number(value) || 0));
}

function percent(value) {
  return Math.min(100, wholeNumber(value));
}

async function fetchKauiz(fetchImpl, url, init) {
  try {
    return await fetchImpl(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch {
    throw new KauizError(502, 'Tidak bisa terhubung ke Kauiz. Coba lagi.');
  }
}
