import { useEffect, useRef } from 'react';
import { fetchAccount, saveMastered } from './battle';
import { useSettings } from './settings';
import { useProgressData } from './useProgressData';

/**
 * Menjaga data akun di perangkat tetap sama dengan server: mengisi ID publik untuk akun lama,
 * dan mengirim daftar hari lulus setiap kali berubah. Gagal kirim tidak mengganggu pemakaian aplikasi.
 */
export function useAccountSync() {
  const { settings, update } = useSettings();
  const data = useProgressData();
  const lastSent = useRef('');
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

  useEffect(() => {
    if (!data.loaded || !signedIn || !token) return;
    const days = [...data.mastered].sort((a, b) => a - b);
    const key = days.join(',');
    if (key === lastSent.current) return;
    lastSent.current = key;
    saveMastered(token, days).catch(() => {
      lastSent.current = '';
    });
  }, [data.loaded, data.mastered, signedIn, token]);
}
