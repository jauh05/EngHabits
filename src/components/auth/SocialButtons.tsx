/** Logo Google berwarna resmi, dibuat sebagai SVG di sini. */
function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" width="22" height="22" aria-hidden="true" className="shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/** Logo Apple dalam satu warna, mengikuti warna teks tombol. */
function AppleLogo() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor" className="shrink-0">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.02 1.4-2.44 1.246-3.83-1.205.052-2.662.8-3.53 1.82-.774.9-1.454 2.34-1.27 3.72 1.343.104 2.715-.68 3.554-1.71z" />
    </svg>
  );
}

/**
 * Tombol masuk lewat Google dan Apple, gaya pil seperti gambar 1, dengan logo resmi.
 * Belum berfungsi, karena butuh layanan identitas dan kunci dari pemilik proyek. Ditampilkan nonaktif dengan keterangan.
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
        className="flex min-h-13 items-center justify-between rounded-full bg-surface px-6 text-sm font-bold text-ink shadow-card cursor-not-allowed"
      >
        <span className="flex items-center gap-3">
          <GoogleLogo />
          Masuk dengan Google
        </span>
        <span className="text-xs font-semibold text-muted">segera hadir</span>
      </button>
      <button
        type="button"
        disabled
        className="flex min-h-13 items-center justify-between rounded-full bg-charcoal px-6 text-sm font-bold text-white shadow-card [--edge:color-mix(in_srgb,var(--charcoal),var(--shade)_50%)] cursor-not-allowed"
      >
        <span className="flex items-center gap-3">
          <AppleLogo />
          Masuk dengan Apple
        </span>
        <span className="text-xs font-semibold text-white/70">segera hadir</span>
      </button>
    </div>
  );
}
