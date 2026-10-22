import { describe, expect, it } from 'vitest';
import { checkCredentials, createAccount, normalizeEmail, validateRegistration } from './auth';

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

describe('akun lokal', () => {
  it('email dinormalisasi ke huruf kecil tanpa spasi', () => {
    expect(normalizeEmail('  Sinta@Contoh.ID ')).toBe('sinta@contoh.id');
  });

  it('kata sandi yang benar lolos, yang salah ditolak', async () => {
    const account = await createAccount({ name: 'Sinta', email: 'sinta@contoh.id', password: 'rahasia123' });
    expect(account.hash).not.toContain('rahasia123');
    expect(await checkCredentials(account, 'SINTA@contoh.id', 'rahasia123')).toBe(true);
    expect(await checkCredentials(account, 'sinta@contoh.id', 'salah-sandi')).toBe(false);
    expect(await checkCredentials(account, 'orang@lain.id', 'rahasia123')).toBe(false);
  });

  it('salt berbeda membuat hash berbeda untuk kata sandi yang sama', async () => {
    const first = await createAccount({ name: 'A', email: 'a@b.id', password: 'rahasia123' });
    const second = await createAccount({ name: 'A', email: 'a@b.id', password: 'rahasia123' });
    expect(first.salt).not.toBe(second.salt);
    expect(first.hash).not.toBe(second.hash);
  });
});
