import { useEffect } from 'react';
import { localISO } from '../../lib/dates';
import { useSettings } from '../../lib/settings';

export const REMINDER_HOUR = 6;

const CHECK_EVERY_MS = 60_000;

/** Kirim notifikasi harian. Lewat service worker bila ada, karena Chrome Android tidak mengizinkan `new Notification`. */
async function showReminder(): Promise<void> {
  const options: NotificationOptions = {
    body: 'Waktunya belajar hari ini. Buka EngHabits untuk memulai sesi.',
    icon: `${import.meta.env.BASE_URL}icons/icon-192.png`,
    tag: 'enghabits-daily',
  };
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration) {
      await registration.showNotification('EngHabits', options);
      return;
    }
    new Notification('EngHabits', options);
  } catch {
    // Notifikasi tidak didukung di perangkat ini. Aplikasi tetap berjalan tanpa pengingat.
  }
}

/**
 * Pengingat jam 06.00. Hanya berjalan saat aplikasi terbuka atau sudah ada di latar belakang.
 * Tidak ada server push, jadi jika aplikasi ditutup sepanjang pagi, pengingat tidak muncul.
 */
export function ReminderWatcher() {
  const { settings, loaded, update } = useSettings();

  useEffect(() => {
    if (!loaded || !settings.reminderEnabled) return;

    const check = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      const now = new Date();
      const today = localISO(now);
      if (now.getHours() < REMINDER_HOUR || settings.lastReminderDate === today) return;
      update({ lastReminderDate: today });
      void showReminder();
    };

    check();
    const timer = window.setInterval(check, CHECK_EVERY_MS);
    return () => window.clearInterval(timer);
  }, [loaded, settings.reminderEnabled, settings.lastReminderDate, update]);

  return null;
}
