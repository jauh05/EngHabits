/**
 * Akun disimpan di server (API di server/app.mjs), jadi bisa dipakai dari perangkat mana pun.
 * Kata sandi hanya dikirim sekali saat masuk atau daftar, lalu di-hash di server.
 * Di perangkat hanya disimpan email, nama panggilan, dan token sesi.
 */

export type Account = {
  email: string;
  name: string;
  /** ID publik untuk diundang battle, format EH-XXXXXX. */
  publicId?: string;
  /** False setelah ID pernah diganti sekali. */
  canChangePublicId?: boolean;
};

export type AuthSession = {
  token: string;
  account: Account;
};

export const PASSWORD_MIN_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const API = '/api';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Pesan galat berbahasa Indonesia, atau null bila data sudah benar. */
export function validateRegistration(input: { name: string; email: string; password: string }): string | null {
  if (!input.name.trim()) return 'Nama panggilan wajib diisi.';
  if (!EMAIL_PATTERN.test(normalizeEmail(input.email))) return 'Format email belum benar.';
  if (input.password.length < PASSWORD_MIN_LENGTH) return `Kata sandi minimal ${PASSWORD_MIN_LENGTH} karakter.`;
  return null;
}

async function post<T>(path: string, body: unknown, token?: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.');
  }
  // Keluar membalas 204 tanpa isi, jadi isi kosong tidak dianggap galat.
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? 'Permintaan gagal. Coba lagi.');
  return data;
}

export function registerAccount(input: { name: string; email: string; password: string }): Promise<AuthSession> {
  return post<AuthSession>('/register', {
    name: input.name.trim(),
    email: normalizeEmail(input.email),
    password: input.password,
  });
}

export function loginAccount(email: string, password: string): Promise<AuthSession> {
  return post<AuthSession>('/login', { email: normalizeEmail(email), password });
}

/** Mencabut sesi di server. Kegagalan tidak menghalangi keluar di perangkat ini. */
export async function logoutAccount(token: string): Promise<void> {
  await post('/logout', {}, token).catch(() => undefined);
}
