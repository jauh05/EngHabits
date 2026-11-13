import { useState } from 'react';
import { startKauizLogin } from '../../lib/kauiz';
import { buttonClass } from '../ui/Button';
import { useToast } from '../ui/Toast';

/** Tombol masuk lewat Kauiz dengan logo Kauiz. Pengguna dikirim ke halaman masuk Kauiz, lalu kembali ke EngHabits. */
export function KauizButton() {
  const { show } = useToast();
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    try {
      window.location.assign(await startKauizLogin());
    } catch (caught) {
      show(caught instanceof Error ? caught.message : 'Masuk dengan Kauiz belum bisa dimulai.', 'error');
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 text-xs font-semibold text-muted" aria-hidden="true">
        <span className="h-[3px] flex-1 rounded-full bg-line" />
        atau
        <span className="h-[3px] flex-1 rounded-full bg-line" />
      </div>
      <button type="button" onClick={start} disabled={busy} className={buttonClass('secondary', 'lg', 'w-full gap-3')}>
        <img src={`${import.meta.env.BASE_URL}kauiz-logo-mark.png`} alt="" width={28} height={22} className="shrink-0" />
        {busy ? 'Membuka Kauiz…' : 'Masuk dengan Kauiz'}
      </button>
    </div>
  );
}
