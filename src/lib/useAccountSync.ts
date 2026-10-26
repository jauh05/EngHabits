import { useCallback, useEffect, useRef } from 'react';
import { fetchAccount, sendPresence } from './battle';
import { readAllData, replaceAllData } from './db';
import { mergeData } from './syncMerge';
import { syncWithServer } from './sync';
import { useSettings } from './settings';
import { useProgressData } from './useProgressData';

/** Jeda antar sinkron otomatis. Sinkron juga dijalankan saat halaman kembali aktif. */
const SYNC_INTERVAL_MS = 60_000;

/**
 * Menjaga data akun dan progres tetap sama di semua perangkat: mengisi ID publik untuk akun lama,
 * dan menggabungkan progres lokal dengan server. Gagal sinkron tidak mengganggu pemakaian aplikasi.
 */
export function useAccountSync() {
  const { settings, update } = useSettings();
  const data = useProgressData();
  const { refresh } = data;
  const running = useRef(false);
  const { token, signedIn } = settings;
  const publicId = settings.account?.publicId;

  useEffect(() => {
    if (!signedIn || !token || publicId) return;
    fetchAccount(token)
      .then(({ account }) => {
        update({
          account: {
            email: account.email,
            name: account.name,
            publicId: account.publicId,
            canChangePublicId: account.canChangePublicId,
          },
        });
      })
      .catch(() => undefined);
  }, [signedIn, token, publicId, update]);

  const sync = useCallback(async () => {
    if (!signedIn || !token || running.current) return;
    running.current = true;
    try {
      const local = await readAllData();
      const remote = await syncWithServer(token, local);
      // Data lokal bisa berubah selama menunggu server, jadi dibaca ulang sebelum digabung.
      const latest = await readAllData();
      await replaceAllData(mergeData(latest, remote));
      await refresh();
    } catch {
      // Dicoba lagi pada sinkron berikutnya.
    } finally {
      running.current = false;
    }
  }, [signedIn, token, refresh]);

  // Kehadiran: ping berkala selama aplikasi terbuka, supaya teman bisa melihat status online.
  useEffect(() => {
    if (!signedIn || !token) return;
    void sendPresence(token);
    const timer = window.setInterval(() => void sendPresence(token), 30_000);
    return () => window.clearInterval(timer);
  }, [signedIn, token]);

  useEffect(() => {
    if (!data.loaded) return;
    void sync();
    const timer = window.setInterval(() => void sync(), SYNC_INTERVAL_MS);
    const onFocus = () => void sync();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [data.loaded, sync]);
}
