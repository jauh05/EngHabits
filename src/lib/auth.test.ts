import { afterEach, describe, expect, it, vi } from 'vitest';
import { loginAccount, normalizeEmail, registerAccount, validateRegistration } from './auth';

describe('validateRegistration', () => {
  it('menolak nama kosong, email salah, dan kata sandi pendek', () => {
    expect(validateRegistration({ name: ' ', email: 'a@b.id', password: 'rahasia123' })).toMatch('Nama');
    expect(validateRegistration({ name: 'Sinta', email: 'bukan-email', password: 'rahasia123' })).toMatch('email');
    expect(validateRegistration({ name: 'Sinta', email: 'a@b.id', password: 'pendek' })).toMatch('8 karakter');
  });

  it('menerima data yang benar', () => {
    expect(validateRegistration({ name: 'Sinta', email: 'sinta@contoh.id', password: 'rahasia123' })).toBeNull();
  });
});

describe('akun di server', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('email dinormalisasi ke huruf kecil tanpa spasi', () => {
    expect(normalizeEmail('  Sinta@Contoh.ID ')).toBe('sinta@contoh.id');
  });

  it('daftar mengirim email yang sudah dinormalisasi dan mengembalikan sesi', async () => {
    const fetchMock = vi.fn(
      async (_url: string, _init?: RequestInit) =>
        new Response(JSON.stringify({ token: 'token-uji', account: { email: 'sinta@contoh.id', name: 'Sinta' } }), {
          status: 201,
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const session = await registerAccount({ name: ' Sinta ', email: 'Sinta@Contoh.id', password: 'rahasia123' });

    expect(session).toEqual({ token: 'token-uji', account: { email: 'sinta@contoh.id', name: 'Sinta' } });
    const sent = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(sent).toEqual({ name: 'Sinta', email: 'sinta@contoh.id', password: 'rahasia123' });
  });

  it('pesan galat dari server ditampilkan apa adanya', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: 'Email atau kata sandi salah.' }), { status: 401 })),
    );
    await expect(loginAccount('sinta@contoh.id', 'salah-sandi')).rejects.toThrow('Email atau kata sandi salah.');
  });

  it('kalau server tidak bisa dihubungi, pesannya jelas', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    await expect(loginAccount('sinta@contoh.id', 'rahasia123')).rejects.toThrow('Tidak bisa terhubung ke server');
  });
});
