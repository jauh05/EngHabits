import { randomBytes } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp, openDatabase } from './app.mjs';
import { openToken } from './kauiz.mjs';

const KEY = randomBytes(32).toString('base64');
const SECRET = 'rahasia-tautan-uji';
const KAUIZ = {
  clientId: 'enghabits',
  clientSecret: SECRET,
  baseUrl: 'https://kauiz.test',
  appUrl: 'https://enghabits.test',
  tokenKey: KEY,
  learningEnabled: true,
};

let server;
let base;
let db;
let calls;
let kauizFailure = null;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

async function fakeKauiz(url, init = {}) {
  calls.push({
    url,
    method: init.method ?? 'GET',
    headers: init.headers ?? {},
    body: init.body ? JSON.parse(init.body) : null,
  });

  if (kauizFailure) {
    const failure = kauizFailure;
    kauizFailure = null;
    throw failure;
  }
  if (url === 'https://kauiz.test/v1/enghabits/link/request-by-enghabits') {
    return json({ message: 'Jika email itu terdaftar di EngHabits, kode sudah dikirim.' }, 202);
  }
  if (url === 'https://kauiz.test/v1/enghabits/link/verify-by-enghabits') {
    const body = JSON.parse(init.body);
    if (body.code !== '123456') return json({ message: 'Kode tidak valid atau sudah kedaluwarsa.' }, 422);
    return json({
      kauiz_id: 'kauiz-77',
      kauiz_email: 'kauiz@test.localhost',
      integration_token: 'int-tautan-77',
    });
  }
  if (url === 'https://kauiz.test/v1/integrations/enghabits/snapshot') return json({ status: 'ok' });
  return json({ message: 'not found' }, 404);
}

function call(path, { method = 'GET', body, token, secret } = {}) {
  return fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(secret ? { 'X-Enghabits-Secret': secret } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function register(email) {
  const response = await call('/api/register', {
    method: 'POST',
    body: { name: 'Tautan', email, password: 'Uji12345' },
  });
  expect(response.status).toBe(201);
  return response.json();
}

async function waitFor(check, timeoutMs = 2000) {
  const started = Date.now();
  while (!check()) {
    if (Date.now() - started > timeoutMs) throw new Error('waktu habis');
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

beforeAll(async () => {
  db = openDatabase(':memory:');
  calls = [];
  server = createApp(db, { kauiz: KAUIZ, fetch: fakeKauiz });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

describe('tautan email Kauiz', () => {
  it('meminta kode meneruskan email dan secret ke Kauiz', async () => {
    const { token } = await register('minta@test.localhost');
    calls.length = 0;

    const response = await call('/api/kauiz/link/request', {
      method: 'POST',
      token,
      body: { kauiz_email: 'kauiz@test.localhost' },
    });

    expect(response.status).toBe(202);
    expect((await response.json()).message).toContain('kode sudah dikirim');
    const request = calls.find((item) => item.url.endsWith('/request-by-enghabits'));
    expect(request.headers['X-Enghabits-Secret']).toBe(SECRET);
    expect(request.body).toEqual({ kauiz_email: 'kauiz@test.localhost' });
  });

  it('Kauiz yang melewati batas waktu memberi pesan yang jelas', async () => {
    const { token } = await register('lambat@test.localhost');
    kauizFailure = Object.assign(new Error('timeout'), { name: 'TimeoutError' });

    const response = await call('/api/kauiz/link/request', {
      method: 'POST',
      token,
      body: { kauiz_email: 'kauiz@test.localhost' },
    });

    expect(response.status).toBe(502);
    expect((await response.json()).error).toBe('Kauiz terlalu lama membalas. Coba lagi.');
  });

  it('memverifikasi kode menyimpan tautan, email Kauiz, dan token terenkripsi', async () => {
    const { token } = await register('verifikasi@test.localhost');
    calls.length = 0;

    const response = await call('/api/kauiz/link/verify', {
      method: 'POST',
      token,
      body: { kauiz_email: 'kauiz@test.localhost', code: '123456' },
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.account).toMatchObject({
      kauizConnected: true,
      kauizSharing: true,
      kauizEmail: 'kauiz@test.localhost',
    });

    const user = db.prepare("SELECT id FROM users WHERE email = 'verifikasi@test.localhost'").get();
    const row = db.prepare('SELECT integration_token_enc FROM kauiz_links WHERE user_id = ?').get(user.id);
    expect(openToken(Buffer.from(KEY, 'base64'), row.integration_token_enc)).toBe('int-tautan-77');
    await waitFor(() => calls.some((item) => item.url.endsWith('/snapshot')));
  });

  it('kode yang salah ditolak tanpa menautkan akun', async () => {
    const { token } = await register('salah@test.localhost');
    const response = await call('/api/kauiz/link/verify', {
      method: 'POST',
      token,
      body: { kauiz_email: 'kauiz@test.localhost', code: '000000' },
    });

    expect(response.status).toBe(422);
    expect((await response.json()).error).toContain('Kode tidak valid');
    const user = db.prepare("SELECT id FROM users WHERE email = 'salah@test.localhost'").get();
    expect(db.prepare('SELECT 1 FROM kauiz_links WHERE user_id = ?').get(user.id)).toBeUndefined();
  });

  it('lookup hanya mengembalikan status email dan menolak secret salah', async () => {
    const wrong = await call('/api/kauiz/lookup', {
      method: 'POST',
      secret: 'secret-salah',
      body: { email: 'verifikasi@test.localhost' },
    });
    expect(wrong.status).toBe(401);

    const found = await call('/api/kauiz/lookup', {
      method: 'POST',
      secret: SECRET,
      body: { email: 'Verifikasi@Test.Localhost' },
    });
    expect(found.status).toBe(200);
    expect(await found.json()).toEqual({ exists: true });

    const missing = await call('/api/kauiz/lookup', {
      method: 'POST',
      secret: SECRET,
      body: { email: 'tidak-ada@test.localhost' },
    });
    expect(await missing.json()).toEqual({ exists: false });
  });

  it('link-confirm menautkan dari sisi Kauiz', async () => {
    await register('konfirmasi@test.localhost');
    const response = await call('/api/kauiz/link-confirm', {
      method: 'POST',
      secret: SECRET,
      body: {
        email: 'konfirmasi@test.localhost',
        kauiz_id: 'kauiz-88',
        kauiz_email: 'kauiz88@test.localhost',
        integration_token: 'int-konfirmasi-88',
      },
    });

    expect(response.status).toBe(200);
    const user = db.prepare("SELECT id FROM users WHERE email = 'konfirmasi@test.localhost'").get();
    expect(db.prepare('SELECT kauiz_id, kauiz_email FROM kauiz_links WHERE user_id = ?').get(user.id)).toEqual({
      kauiz_id: 'kauiz-88',
      kauiz_email: 'kauiz88@test.localhost',
    });
  });

  it('unlink-by-kauiz menghapus tautan pengguna', async () => {
    const { token } = await register('putus@test.localhost');
    await call('/api/kauiz/link-confirm', {
      method: 'POST',
      secret: SECRET,
      body: {
        email: 'putus@test.localhost',
        kauiz_id: 'kauiz-99',
        kauiz_email: 'kauiz99@test.localhost',
        integration_token: 'int-putus-99',
      },
    });

    const response = await call('/api/kauiz/unlink-by-kauiz', {
      method: 'POST',
      secret: SECRET,
      body: { kauiz_id: 'kauiz-99' },
    });
    expect(response.status).toBe(200);

    const me = await (await call('/api/me', { token })).json();
    expect(me.account).toMatchObject({ kauizConnected: false, kauizEmail: null });
  });
});
