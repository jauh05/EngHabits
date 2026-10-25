import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp, openDatabase } from './app.mjs';

let server;
let base;

beforeAll(async () => {
  server = createApp(openDatabase(':memory:'));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

function post(path, body, token) {
  return fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
}

describe('API akun', () => {
  it('daftar membuat akun dan mengembalikan token', async () => {
    const response = await post('/api/register', { name: 'Sinta', email: 'Sinta@Contoh.id', password: 'Uji12345' });
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.account).toMatchObject({ name: 'Sinta', email: 'sinta@contoh.id', canChangePublicId: true });
    expect(data.account.publicId).toMatch(/^EH-[A-HJ-NP-Z2-9]{6}$/);
    expect(typeof data.token).toBe('string');
  });

  it('email yang sama tidak bisa didaftarkan dua kali', async () => {
    const response = await post('/api/register', { name: 'Lain', email: 'sinta@contoh.id', password: 'Uji12345' });
    expect(response.status).toBe(409);
  });

  it('masuk dengan kata sandi benar dan menolak yang salah', async () => {
    const good = await post('/api/login', { email: 'sinta@contoh.id', password: 'Uji12345' });
    expect(good.status).toBe(200);
    const bad = await post('/api/login', { email: 'sinta@contoh.id', password: 'salah-sekali' });
    expect(bad.status).toBe(401);
    const unknown = await post('/api/login', { email: 'tidak@ada.id', password: 'Uji12345' });
    expect(unknown.status).toBe(401);
  });

  it('token dipakai untuk /api/me, dan hilang setelah keluar', async () => {
    const login = await (await post('/api/login', { email: 'sinta@contoh.id', password: 'Uji12345' })).json();
    const me = await fetch(`${base}/api/me`, { headers: { Authorization: `Bearer ${login.token}` } });
    expect(me.status).toBe(200);
    expect((await me.json()).account.email).toBe('sinta@contoh.id');

    await post('/api/logout', {}, login.token);
    const after = await fetch(`${base}/api/me`, { headers: { Authorization: `Bearer ${login.token}` } });
    expect(after.status).toBe(401);
  });

  it('gagal masuk berkali-kali membuat email itu kena batas sementara', async () => {
    await post('/api/register', { name: 'Dewi', email: 'dewi@contoh.id', password: 'Uji12345' });
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await post('/api/login', { email: 'dewi@contoh.id', password: 'salah-sekali' });
      expect(response.status).toBe(401);
    }
    const blocked = await post('/api/login', { email: 'dewi@contoh.id', password: 'Uji12345' });
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0);
  });

  it('kata sandi pendek ditolak saat daftar', async () => {
    const response = await post('/api/register', { name: 'Budi', email: 'budi@contoh.id', password: 'pendek' });
    expect(response.status).toBe(400);
  });
});
