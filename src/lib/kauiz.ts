import type { Account, AuthSession } from './auth';

const API = '/api';

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
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? `Server belum merespons dengan benar (HTTP ${response.status}). Coba lagi.`);
  return data;
}

/** Alamat halaman Kauiz untuk masuk. Server membuat kode state, lalu pengguna dikirim ke sana. */
export async function startKauizLogin(): Promise<string> {
  return (await post<{ url: string }>('/kauiz/login/start', {})).url;
}

/** Meminta Kauiz mengirim kode 6 digit ke email akun Kauiz yang dimasukkan. */
export async function requestKauizEmailCode(token: string, kauizEmail: string): Promise<string> {
  const data = await post<{ message?: string }>('/kauiz/link/request', { kauiz_email: kauizEmail }, token);
  return data.message ?? 'Jika email itu terdaftar di EngHabits, kode sudah dikirim.';
}

/** Memverifikasi kode dan mengembalikan akun EngHabits yang sudah tertaut. */
export async function verifyKauizEmailCode(token: string, kauizEmail: string, code: string): Promise<Account> {
  return (await post<{ account: Account }>('/kauiz/link/verify', { kauiz_email: kauizEmail, code }, token)).account;
}

/** Memutus tautan Kauiz. Server mencabut token integrasi di Kauiz juga, jadi berbagi ringkasan ikut berhenti. */
export async function disconnectKauiz(token: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API}/kauiz`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  } catch {
    throw new Error('Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.');
  }
  if (!response.ok) throw new Error('Tautan Kauiz belum bisa diputus. Coba lagi.');
}

/** Menukar kode serah-terima dari server menjadi sesi. Kode hanya bisa dipakai sekali. */
export function exchangeKauizSession(code: string): Promise<AuthSession> {
  return post<AuthSession>('/kauiz/session', { code });
}

/** Pesan untuk hasil koneksi Kauiz, sesuai parameter `kauiz` di alamat halaman. */
export const KAUIZ_RESULT_MESSAGES: Record<string, string> = {
  terhubung: 'Akun berhasil dihubungkan dengan Kauiz.',
  gagal: 'Koneksi Kauiz belum berhasil. Coba lagi.',
  batal: 'Koneksi Kauiz dibatalkan.',
  'email-terpakai':
    'Email ini sudah punya akun EngHabits. Masuk dengan email dan kata sandi, lalu hubungkan Kauiz dari beranda.',
};
