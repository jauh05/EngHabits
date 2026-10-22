/**
 * Akun lokal. Akun hanya ada di perangkat ini (IndexedDB) dan belum tersinkron ke server.
 * Kata sandi tidak disimpan. Yang disimpan adalah hasil PBKDF2-SHA256 dengan salt acak,
 * supaya kata sandi tidak terbaca dari isi penyimpanan.
 */

export type Account = {
  email: string;
  name: string;
  /** Salt acak, base64. */
  salt: string;
  /** Hasil PBKDF2, base64. */
  hash: string;
};

export const PASSWORD_MIN_LENGTH = 8;
const ITERATIONS = 100_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const encoder = new TextEncoder();

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(text: string): Uint8Array {
  return Uint8Array.from(atob(text), (char) => char.charCodeAt(0));
}

async function derive(password: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  );
  return toBase64(new Uint8Array(bits));
}

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

export async function createAccount(input: { name: string; email: string; password: string }): Promise<Account> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return {
    email: normalizeEmail(input.email),
    name: input.name.trim(),
    salt: toBase64(salt),
    hash: await derive(input.password, salt),
  };
}

/** Cocokkan email dan kata sandi dengan akun lokal. */
export async function checkCredentials(account: Account, email: string, password: string): Promise<boolean> {
  if (normalizeEmail(email) !== account.email) return false;
  const candidate = await derive(password, fromBase64(account.salt));
  return candidate === account.hash;
}
