import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp, openDatabase } from './app.mjs';

const KAUIZ = { clientId: 'enghabits', clientSecret: 'rahasia-uji', baseUrl: 'https://kauiz.test', appUrl: 'https://enghabits.test' };
const VALID_CODE = 'kode-uji-valid';
const SECOND_CODE = 'kode-uji-kedua';
let server;
let base;
let db;

/** Kauiz palsu: menukar kode dan mengembalikan identitas. Hanya menerima secret dan kode yang benar. */
async function fakeKauiz(url, init = {}) {
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  if (url === 'https://kauiz.test/v1/oauth/token') {
    const body = JSON.parse(init.body);
    if (body.client_secret !== KAUIZ.clientSecret || ![VALID_CODE, SECOND_CODE].includes(body.code)) {
      return json({ error: 'invalid_grant' }, 400);
    }
    if (body.redirect_uri !== 'https://enghabits.test/api/kauiz/callback') return json({ error: 'invalid_grant' }, 400);
    return json({ access_token: `token-${body.code}`, token_type: 'Bearer' });
  }
  if (url === 'https://kauiz.test/v1/oauth/userinfo') {
    if (init.headers.Authorization === `Bearer token-${VALID_CODE}`) {
      return json({ sub: '42', email: 'Ani@Kauiz.test', name: 'Ani Kauiz', email_verified: true });
    }
    if (init.headers.Authorization === `Bearer token-${SECOND_CODE}`) {
      return json({ sub: '77', email: 'Sinta@Kauiz.test', name: 'Sinta Kauiz', email_verified: true });
    }
    return json({ message: 'Unauthenticated.' }, 401);
  }
  return json({ message: 'not found' }, 404);
}

beforeAll(async () => {
  db = openDatabase(':memory:');
  server = createApp(db, { kauiz: KAUIZ, fetch: fakeKauiz });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

function call(path, { method = 'GET', body, token } = {}) {
  return fetch(`${base}${path}`, {
    method,
    redirect: 'manual',
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function registerManual(email) {
  const response = await call('/api/register', { method: 'POST', body: { name: 'Manual', email, password: 'Uji12345' } });
  return (await response.json()).token;
}

async function startLogin() {
  const data = await (await call('/api/kauiz/login/start', { method: 'POST' })).json();
  return new URL(data.url).searchParams.get('state');
}

async function startLink(token) {
  const data = await (await call('/api/kauiz/connect', { method: 'POST', token })).json();
  return new URL(data.url).searchParams.get('state');
}

function callback(state, extra = {}) {
  return call(`/api/kauiz/callback?${new URLSearchParams({ state, ...extra })}`);
}

describe('alur OAuth Kauiz', () => {
  it('belum dikonfigurasi, tombol Kauiz menolak dengan 503', async () => {
    const unconfigured = createApp(openDatabase(':memory:'));
    await new Promise((resolve) => unconfigured.listen(0, '127.0.0.1', resolve));
    const response = await fetch(`http://127.0.0.1:${unconfigured.address().port}/api/kauiz/login/start`, { method: 'POST' });
    expect(response.status).toBe(503);
    await new Promise((resolve) => unconfigured.close(resolve));
  });

  it('masuk dengan Kauiz membuat akun baru lalu mengarahkan ke serah-terima sesi', async () => {
    const state = await startLogin();
    const response = await callback(state, { code: VALID_CODE });
    expect(response.status).toBe(302);
    const location = new URL(response.headers.get('Location'));
    expect(location.pathname).toBe('/masuk/kauiz');

    const session = await call('/api/kauiz/session', { method: 'POST', body: { code: location.searchParams.get('code') } });
    expect(session.status).toBe(200);
    const data = await session.json();
    expect(data.account).toMatchObject({ email: 'ani@kauiz.test', name: 'Ani Kauiz', kauizConnected: true });
    expect(typeof data.token).toBe('string');
  });

  it('kode serah-terima hanya bisa dipakai sekali', async () => {
    const state = await startLogin();
    const location = new URL((await callback(state, { code: VALID_CODE })).headers.get('Location'));
    const code = location.searchParams.get('code');
    expect((await call('/api/kauiz/session', { method: 'POST', body: { code } })).status).toBe(200);
    expect((await call('/api/kauiz/session', { method: 'POST', body: { code } })).status).toBe(400);
  });

  it('masuk lagi dengan akun Kauiz yang sama memakai akun yang sudah ada', async () => {
    const state = await startLogin();
    const location = new URL((await callback(state, { code: VALID_CODE })).headers.get('Location'));
    const data = await (await call('/api/kauiz/session', { method: 'POST', body: { code: location.searchParams.get('code') } })).json();
    expect(data.account.email).toBe('ani@kauiz.test');
    const count = db.prepare("SELECT COUNT(*) AS total FROM users WHERE email = 'ani@kauiz.test'").get().total;
    expect(count).toBe(1);
  });

  it('email yang sudah dipakai akun manual tidak ditautkan otomatis', async () => {
    await registerManual('budi@kauiz.test');
    // Kauiz memberi identitas sub baru dengan email akun manual yang sudah ada.
    const originalFetch = fakeKauiz;
    const state = await startLogin();
    const server2 = createApp(db, {
      kauiz: KAUIZ,
      fetch: async (url, init) => {
        if (url.endsWith('/userinfo')) {
          return new Response(JSON.stringify({ sub: '99', email: 'budi@kauiz.test', name: 'Budi' }), { status: 200 });
        }
        return originalFetch(url, init);
      },
    });
    await new Promise((resolve) => server2.listen(0, '127.0.0.1', resolve));
    const response = await fetch(
      `http://127.0.0.1:${server2.address().port}/api/kauiz/callback?${new URLSearchParams({ state, code: VALID_CODE })}`,
      { redirect: 'manual' },
    );
    expect(response.headers.get('Location')).toBe('https://enghabits.test/masuk?kauiz=email-terpakai');
    await new Promise((resolve) => server2.close(resolve));
  });

  it('menghubungkan dari beranda menautkan akun manual yang sedang masuk', async () => {
    const token = await registerManual('sinta@kauiz.test');
    const state = await startLink(token);
    const response = await callback(state, { code: SECOND_CODE });
    expect(response.headers.get('Location')).toBe('https://enghabits.test/?kauiz=terhubung');

    const me = await (await call('/api/me', { token })).json();
    expect(me.account.kauizConnected).toBe(true);
  });

  it('akun Kauiz yang sudah dipakai akun lain tidak bisa dihubungkan lagi', async () => {
    const token = await registerManual('dewi@kauiz.test');
    const state = await startLink(token);
    const response = await callback(state, { code: VALID_CODE });
    expect(response.headers.get('Location')).toBe('https://enghabits.test/?kauiz=gagal');
  });

  it('state yang salah atau dipakai ulang ditolak', async () => {
    expect((await callback('state-palsu-tidak-ada', { code: VALID_CODE })).headers.get('Location')).toBe(
      'https://enghabits.test/masuk?kauiz=gagal',
    );
    const state = await startLogin();
    await callback(state, { code: VALID_CODE });
    expect((await callback(state, { code: VALID_CODE })).headers.get('Location')).toBe(
      'https://enghabits.test/masuk?kauiz=gagal',
    );
  });

  it('pengguna yang menolak di Kauiz kembali tanpa kode', async () => {
    const state = await startLogin();
    const response = await callback(state, { error: 'access_denied' });
    expect(response.headers.get('Location')).toBe('https://enghabits.test/masuk?kauiz=batal');
  });

  it('kode Kauiz yang tidak valid ditolak dan tidak membuat akun', async () => {
    const before = db.prepare('SELECT COUNT(*) AS total FROM users').get().total;
    const state = await startLogin();
    const response = await callback(state, { code: 'kode-salah' });
    expect(response.headers.get('Location')).toBe('https://enghabits.test/masuk?kauiz=gagal');
    expect(db.prepare('SELECT COUNT(*) AS total FROM users').get().total).toBe(before);
  });
});
