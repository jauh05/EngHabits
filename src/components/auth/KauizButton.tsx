import { buttonClass } from '../ui/Button';

/**
 * Tombol masuk lewat Kauiz dengan logo Kauiz. Belum berfungsi, karena cara masuk ke Kauiz belum diputuskan.
 * Ditampilkan nonaktif dengan keterangan, sama seperti tombol Google dan Apple sebelumnya.
 */
export function KauizButton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 text-xs font-semibold text-muted" aria-hidden="true">
        <span className="h-[3px] flex-1 rounded-full bg-line" />
        atau
        <span className="h-[3px] flex-1 rounded-full bg-line" />
      </div>
      <button type="button" disabled aria-label="Masuk dengan Kauiz, segera hadir" className={buttonClass('secondary', 'lg', 'w-full gap-3')}>
        <img src={`${import.meta.env.BASE_URL}kauiz-logo-mark.png`} alt="" width={28} height={22} className="shrink-0" />
        Masuk dengan Kauiz
      </button>
      <p className="text-center text-xs font-semibold text-muted">Masuk dengan Kauiz segera hadir.</p>
    </div>
  );
}
