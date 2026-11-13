import type { AuthSession } from './auth';

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
  if (!response.ok) throw new Error(data.error ?? 'Permintaan gagal. Coba lagi.');
  return data;
}

/** Alamat halaman Kauiz untuk masuk. Server membuat kode state, lalu pengguna dikirim ke sana. */
export async function startKauizLogin(): Promise<string> {
  return (await post<{ url: string }>('/kauiz/login/start', {})).url;
}

/** Alamat halaman Kauiz untuk menghubungkan akun EngHabits yang sedang masuk. */
export async function startKauizLink(token: string): Promise<string> {
  return (await post<{ url: string }>('/kauiz/connect', {}, token)).url;
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
