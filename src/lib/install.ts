/**
 * Pemasangan aplikasi (PWA). Browser berbasis Chromium memberi sinyal `beforeinstallprompt` yang bisa dipakai
 * tombol sendiri. Safari di iPhone tidak punya sinyal itu, jadi tombolnya menampilkan petunjuk manual.
 * Sinyal disimpan sejak aplikasi dimuat, supaya tidak hilang kalau halaman masuk dibuka belakangan.
 */

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export type InstallPlatform = 'installed' | 'ios' | 'other';

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event as InstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
}

/** Dipanggil saat sinyal pemasangan berubah. Mengembalikan fungsi berhenti berlangganan. */
export function subscribeInstall(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function canPromptInstall(): boolean {
  return deferred !== null;
}

/** Menampilkan dialog pasang dari browser. Mengembalikan 'unavailable' bila browser belum memberi sinyal. */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const event = deferred;
  if (!event) return 'unavailable';
  await event.prompt();
  const { outcome } = await event.userChoice;
  deferred = null;
  notify();
  return outcome;
}

/** Menentukan jenis petunjuk dari user agent dan mode tampilan. */
export function detectInstallPlatform(userAgent: string, standalone: boolean): InstallPlatform {
  if (standalone) return 'installed';
  if (/iPhone|iPad|iPod/.test(userAgent)) return 'ios';
  return 'other';
}

export function currentInstallPlatform(): InstallPlatform {
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return detectInstallPlatform(navigator.userAgent, standalone);
}
