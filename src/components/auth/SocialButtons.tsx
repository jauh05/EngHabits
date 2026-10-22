/**
 * Tombol masuk lewat Google dan Apple. Belum berfungsi, karena butuh layanan identitas dan kunci dari pemilik proyek.
 * Ditampilkan nonaktif dengan keterangan supaya tidak terkesan sudah bisa dipakai.
 */
export function SocialButtons() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-xs font-semibold text-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        atau
        <span className="h-px flex-1 bg-line" />
      </div>
      {['Lanjut dengan Google', 'Lanjut dengan Apple'].map((label) => (
        <button
          key={label}
          type="button"
          disabled
          className="flex min-h-12 items-center justify-between rounded-full border border-line bg-surface px-5 text-sm font-semibold text-ink opacity-60"
        >
          {label}
          <span className="text-xs font-semibold text-muted">segera hadir</span>
        </button>
      ))}
    </div>
  );
}
