/**
 * Latar visual hijau untuk halaman: blob lembut, jalur putus berkelok, daun, dan percikan.
 * Semua bentuk asli, bukan salinan gambar referensi. Warnanya diambil dari token supaya ikut mode gelap.
 * Dipakai sebagai lapisan absolut di belakang konten. Induknya harus punya `isolate`.
 */
export function BackgroundArt({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 800"
      preserveAspectRatio="xMidYMid slice"
      className={`pointer-events-none absolute inset-0 -z-10 h-full w-full ${className}`}
    >
      <path
        d="M 250 -20 C 430 40 420 230 300 262 C 190 292 150 150 250 -20 Z"
        style={{ fill: 'color-mix(in srgb, var(--bg), var(--shade) 16%)' }}
      />
      <path
        d="M -40 520 C 40 470 150 520 140 610 C 130 700 20 760 -40 720 Z"
        style={{ fill: 'color-mix(in srgb, var(--bg), var(--shade) 10%)' }}
      />
      <path
        d="M 390 430 C 470 470 470 580 390 600 C 320 620 300 500 390 430 Z"
        style={{ fill: 'color-mix(in srgb, var(--bg), var(--surface) 40%)' }}
      />
      <path
        d="M 40 330 C 160 280 250 410 170 480 S 40 570 120 670 S 300 780 360 700"
        fill="none"
        strokeLinecap="round"
        strokeWidth={3}
        strokeDasharray="6 12"
        style={{ stroke: 'var(--surface)', opacity: 0.7 }}
      />
      <path
        d="M 60 110 q 18 -30 52 -18 q -8 34 -52 18 z"
        style={{ fill: 'var(--surface)', opacity: 0.35 }}
      />
      <path
        d="M 300 640 q 18 -30 52 -18 q -8 34 -52 18 z"
        style={{ fill: 'var(--surface)', opacity: 0.35 }}
      />
      <circle cx={330} cy={60} r={4} style={{ fill: 'var(--surface)', opacity: 0.8 }} />
      <circle cx={90} cy={400} r={3} style={{ fill: 'var(--surface)', opacity: 0.8 }} />
      <circle cx={300} cy={330} r={5} style={{ fill: 'var(--surface)', opacity: 0.6 }} />
    </svg>
  );
}
