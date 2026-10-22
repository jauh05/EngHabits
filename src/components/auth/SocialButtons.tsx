/**
 * Tombol masuk lewat Google dan Apple, gaya pil seperti gambar 1. Belum berfungsi, karena butuh
 * layanan identitas dan kunci dari pemilik proyek. Ditampilkan nonaktif dengan keterangan.
 */
export function SocialButtons() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-xs font-semibold text-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        atau
        <span className="h-px flex-1 bg-line" />
      </div>
      <button
        type="button"
        disabled
        className="flex min-h-13 items-center justify-between rounded-full border border-line bg-surface px-6 text-sm font-bold text-ink shadow-card cursor-not-allowed"
      >
        <span className="flex items-center gap-3">
          <span className="grid size-6 place-items-center rounded-full bg-tint-sky text-xs font-extrabold text-ink" aria-hidden="true">
            G
          </span>
          Masuk dengan Google
        </span>
        <span className="text-xs font-semibold text-muted">segera hadir</span>
      </button>
      <button
        type="button"
        disabled
        className="flex min-h-13 items-center justify-between rounded-full bg-ink px-6 text-sm font-bold text-bg shadow-card cursor-not-allowed"
      >
        <span className="flex items-center gap-3">
          <span className="grid size-6 place-items-center rounded-full bg-surface text-xs font-extrabold text-ink" aria-hidden="true">
            A
          </span>
          Masuk dengan Apple
        </span>
        <span className="text-xs font-semibold text-bg/70">segera hadir</span>
      </button>
    </div>
  );
}
