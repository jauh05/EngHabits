import { randomBytes } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp, openDatabase } from './app.mjs';
import { buildLearningSummary, openToken, requestedScope, sealToken } from './kauiz.mjs';

const KEY = randomBytes(32).toString('base64');
const CODE = 'kode-ok';
const KAUIZ = {
  clientId: 'enghabits',
  clientSecret: 'rahasia-uji',
  baseUrl: 'https://kauiz.test',
  appUrl: 'https://enghabits.test',
  tokenKey: KEY,
  learningEnabled: true,
};

let server;
let base;
let db;
let calls;
let snapshotStatus;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** Kauiz palsu untuk tes: token, userinfo, pengiriman ringkasan, dan pencabutan. */
async function fakeKauiz(url, init = {}) {
  calls.push({ url, method: init.method ?? 'GET', auth: init.headers?.Authorization ?? null, body: init.body ?? null });
  if (url === 'https://kauiz.test/v1/oauth/token') {
    const body = JSON.parse(init.body);
    if (body.code !== CODE) return json({ error: 'invalid_grant' }, 400);
    return json({ access_token: 'access-uji', token_type: 'Bearer', integration_token: 'int-uji-123' });
  }
  if (url === 'https://kauiz.test/v1/oauth/userinfo') {
    return json({ sub: '501', email: 'Rani@Kauiz.test', name: 'Rani' });
  }
  if (url === 'https://kauiz.test/v1/integrations/enghabits/snapshot') {
    return snapshotStatus === 200 ? json({ status: 'ok' }) : json({ message: 'Unauthenticated.' }, snapshotStatus);
  }
  if (url === 'https://kauiz.test/v1/integrations/enghabits' && init.method === 'DELETE') {
    return new Response(null, { status: 204 });
  }
  return json({ message: 'not found' }, 404);
}

async function waitFor(check, timeoutMs = 2000) {
  const started = Date.now();
  while (!check()) {
    if (Date.now() - started > timeoutMs) throw new Error('waktu habis');
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

function call(path, { method = 'GET', body, token } = {}) {
  return fetch(`${base}${path}`, {
    method,
    redirect: 'manual',
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeAll(async () => {
  db = openDatabase(':memory:');
  calls = [];
  snapshotStatus = 200;
  server = createApp(db, { kauiz: KAUIZ, fetch: fakeKauiz });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

describe('ringkasan dan enkripsi', () => {
  it('ringkasan hanya berisi angka, tanpa catatan atau jawaban', () => {
    db.prepare('INSERT INTO users (id, email, name, salt, hash, created_at, public_id) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      'u-sum', 'sum@test.localhost', 'Sum', 's', 'h', new Date().toISOString(), 'EH-SUMXYZ',
    );
    for (const day of [1, 2, 3]) {
      db.prepare('INSERT INTO mastered_days (user_id, day) VALUES (?, ?)').run('u-sum', day);
    }
    const progress = (day, completedDate, correct, total) => ({
      day, completedDate, completedAt: `${completedDate}T08:00:00Z`, firstCorePercent: 70, bestCorePercent: 70,
      firstParts: { comprehension: { correct, total }, partA: { correct: 0, total: 0 }, partB: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 } },
      notes: 'rahasia',
    });
    db.prepare("INSERT INTO sync_items (user_id, kind, key, data) VALUES ('u-sum', 'progress', '1', ?)").run(JSON.stringify(progress(1, '2026-11-10', 4, 5)));
    db.prepare("INSERT INTO sync_items (user_id, kind, key, data) VALUES ('u-sum', 'progress', '2', ?)").run(JSON.stringify(progress(2, '2026-11-11', 6, 10)));
    const mistake = (key, day, mastered) => JSON.stringify({ key, day, questionId: 'Q', box: 1, due: '2026-11-20', wrongCount: 1, mastered, lastWrong: '2026-11-12' });
    db.prepare("INSERT INTO sync_items (user_id, kind, key, data) VALUES ('u-sum', 'mistakes', '4:a', ?)").run(mistake('4:a', 4, false));
    db.prepare("INSERT INTO sync_items (user_id, kind, key, data) VALUES ('u-sum', 'mistakes', '4:b', ?)").run(mistake('4:b', 4, false));
    db.prepare("INSERT INTO sync_items (user_id, kind, key, data) VALUES ('u-sum', 'mistakes', '2:c', ?)").run(mistake('2:c', 2, true));

    const summary = buildLearningSummary(db, 'u-sum', new Date('2026-11-14T10:00:00Z'));
    expect(summary.version).toBe(1);
    expect(summary.progress).toMatchObject({ days_mastered: 3, current_day: 4, last_completed_date: '2026-11-11' });
    expect(summary.parts.comprehension).toEqual({ correct: 10, total: 15 });
    expect(summary.mistakes).toEqual({ open: 2, by_day: [{ day: 4, open: 2 }] });
    expect(JSON.stringify(summary)).not.toContain('rahasia');
  });

  it('token integrasi terenkripsi dan tidak bisa dibuka dengan kunci lain', () => {
    const key = Buffer.from(KEY, 'base64');
    const sealed = sealToken(key, 'int-uji-123');
    expect(sealed).not.toContain('int-uji-123');
    expect(openToken(key, sealed)).toBe('int-uji-123');
    expect(() => openToken(randomBytes(32), sealed)).toThrow();
  });

  it('scope learning:share hanya diminta bila fitur dan kunci aktif', () => {
    expect(requestedScope({ ...KAUIZ, learningEnabled: false })).toBe('identity');
    expect(requestedScope({ ...KAUIZ, tokenKey: '' })).toBe('identity');
    expect(requestedScope(KAUIZ)).toBe('identity learning:share');
  });
});

describe('alur berbagi ringkasan', () => {
  let token;
  let userId;

  it('menghubungkan akun mengirim ringkasan dengan token integrasi', async () => {
    const register = await call('/api/register', { method: 'POST', body: { name: 'Rani', email: 'rani@test.localhost', password: 'Uji12345' } });
    token = (await register.json()).token;
    userId = db.prepare("SELECT id FROM users WHERE email = 'rani@test.localhost'").get().id;

    const connect = await call('/api/kauiz/connect', { method: 'POST', token });
    const url = new URL((await connect.json()).url);
    expect(url.searchParams.get('scope')).toBe('identity learning:share');

    const callback = await call(`/api/kauiz/callback?${new URLSearchParams({ state: url.searchParams.get('state'), code: CODE })}`);
    expect(callback.headers.get('Location')).toBe('https://enghabits.test/?kauiz=terhubung');

    await waitFor(() => calls.some((c) => c.url.endsWith('/snapshot')));
    const push = calls.find((c) => c.url.endsWith('/snapshot'));
    expect(push.auth).toBe('Bearer int-uji-123');
    expect(JSON.parse(push.body).version).toBe(1);

    const me = await (await call('/api/me', { token })).json();
    expect(me.account).toMatchObject({ kauizConnected: true, kauizSharing: true });
  });

  it('memutus tautan mencabut token di Kauiz dan menghapus berbagi lokal', async () => {
    const response = await call('/api/kauiz', { method: 'DELETE', token });
    expect(response.status).toBe(200);

    const revoke = calls.find((c) => c.method === 'DELETE' && c.url.endsWith('/v1/integrations/enghabits'));
    expect(revoke.auth).toBe('Bearer int-uji-123');

    const me = await (await call('/api/me', { token })).json();
    expect(me.account).toMatchObject({ kauizConnected: false, kauizSharing: false });
    expect(userId).toBeTruthy();
  });

  it('token yang ditolak Kauiz menghentikan berbagi tetapi tautan tetap ada', async () => {
    const register = await call('/api/register', { method: 'POST', body: { name: 'Budi', email: 'budi@test.localhost', password: 'Uji12345' } });
    const budiToken = (await register.json()).token;
    const connect = await call('/api/kauiz/connect', { method: 'POST', token: budiToken });
    const state = new URL((await connect.json()).url).searchParams.get('state');

    snapshotStatus = 403;
    calls.length = 0;
    await call(`/api/kauiz/callback?${new URLSearchParams({ state, code: CODE })}`);
    await waitFor(() => calls.some((c) => c.url.endsWith('/snapshot')));
    const budiId = db.prepare("SELECT id FROM users WHERE email = 'budi@test.localhost'").get().id;
    await waitFor(() => {
      const row = db.prepare('SELECT integration_token_enc FROM kauiz_links WHERE user_id = ?').get(budiId);
      return row !== undefined && row.integration_token_enc === null;
    });

    const me = await (await call('/api/me', { token: budiToken })).json();
    expect(me.account).toMatchObject({ kauizConnected: true, kauizSharing: false });
    snapshotStatus = 200;
  });
});
