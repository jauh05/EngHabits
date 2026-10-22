import { useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';

export type SceneKind = 'sunrise' | 'books' | 'chart';

/**
 * Ilustrasi 3D untuk slide sambutan, digambar sendiri sebagai SVG. Setiap adegan punya sorotan bola
 * (radialGradient), sisi benda yang lebih gelap (linearGradient), dan bayangan tanah yang blur.
 * Warna memakai token, jadi mode gelap ikut berubah. Melayang pelan kecuali pengguna memilih "Kurangi animasi".
 */
export function SlideScene({ kind, className = '' }: { kind: SceneKind; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`relative aspect-square h-[min(15rem,30dvh)] ${className}`}
      animate={reduce ? undefined : { y: [0, -6, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      {kind === 'sunrise' && <Sunrise />}
      {kind === 'books' && <Books />}
      {kind === 'chart' && <Chart />}
    </motion.div>
  );
}

/** Bayangan tanah: elips blur di bawah benda, dipakai di ketiga adegan. */
function GroundShadow({ id, cx = 120, cy = 214, rx = 84, ry = 11 }: { id: string; cx?: number; cy?: number; rx?: number; ry?: number }) {
  return (
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} style={{ fill: 'var(--drop)' }} filter={`url(#${id}-blur)`} />
  );
}

function BlurFilter({ id }: { id: string }) {
  return (
    <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" />
    </filter>
  );
}

function Sunrise() {
  const id = useId();
  return (
    <svg viewBox="0 0 240 240" className="size-full overflow-visible" aria-hidden="true" focusable="false">
      <defs>
        <BlurFilter id={id} />
        <radialGradient id={`${id}-sun`} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset="0.5" stopColor="#ffc04d" />
          <stop offset="1" stopColor="#f5a524" />
        </radialGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff3c4" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff3c4" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-hill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a6e05a" />
          <stop offset="1" stopColor="#5bbf3e" />
        </linearGradient>
        <linearGradient id={`${id}-side`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2f6b3f" />
          <stop offset="1" stopColor="#173d25" />
        </linearGradient>
        <radialGradient id={`${id}-cloud`} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d6e8dc" />
        </radialGradient>
      </defs>
      <circle cx="120" cy="120" r="92" fill={`url(#${id}-glow)`} />
      <circle cx="120" cy="134" r="56" style={{ fill: 'var(--shade)', opacity: 0.18 }} />
      <circle cx="120" cy="122" r="56" fill={`url(#${id}-sun)`} />
      {/* Alas bukit berbentuk pulau: sisi gelap di bawah memberi tebal, permukaan lime di atas. */}
      <path d="M 24 206 Q 120 160 216 206 Q 234 220 222 236 Q 204 246 120 246 Q 36 246 18 236 Q 6 220 24 206 Z" fill={`url(#${id}-side)`} />
      <path d="M 30 196 Q 120 150 210 196 Q 228 208 214 222 Q 196 232 120 232 Q 44 232 26 222 Q 12 208 30 196 Z" fill={`url(#${id}-hill)`} />
      <path d="M 44 198 Q 120 168 196 198" fill="none" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
      <g fill={`url(#${id}-cloud)`}>
        <circle cx="54" cy="84" r="15" />
        <circle cx="72" cy="76" r="20" />
        <circle cx="92" cy="88" r="14" />
      </g>
      <g fill={`url(#${id}-cloud)`} opacity="0.9">
        <circle cx="190" cy="66" r="11" />
        <circle cx="204" cy="60" r="14" />
        <circle cx="218" cy="70" r="9" />
      </g>
      <GroundShadow id={id} cy={246} rx={96} ry={7} />
    </svg>
  );
}

function Books() {
  const id = useId();
  // Satu buku isometrik: sisi depan, sisi atas yang lebih terang, dan sisi kanan yang lebih gelap.
  const book = (x: number, y: number, w: number, h: number, tone: string, key: string) => (
    <g key={key}>
      <rect x={x} y={y} width={w} height={h} rx="8" fill={`url(#${id}-${tone})`} />
      <path d={`M ${x} ${y} L ${x + w} ${y} L ${x + w + 16} ${y - 14} L ${x + 16} ${y - 14} Z`} style={{ fill: 'var(--tint-pale)' }} />
      <path d={`M ${x + w} ${y} L ${x + w + 16} ${y - 14} L ${x + w + 16} ${y + h - 14} L ${x + w} ${y + h} Z`} style={{ fill: 'var(--shade)', opacity: 0.25 }} />
      <rect x={x + 10} y={y + 8} width={w - 26} height="4" rx="2" fill="#ffffff" opacity="0.55" />
    </g>
  );
  return (
    <svg viewBox="0 0 240 240" className="size-full overflow-visible" aria-hidden="true" focusable="false">
      <defs>
        <BlurFilter id={id} />
        <linearGradient id={`${id}-forest`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2f6b3f" />
          <stop offset="0.5" stopColor="#3f8a55" />
          <stop offset="1" stopColor="#2f6b3f" />
        </linearGradient>
        <linearGradient id={`${id}-lime`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a6e05a" />
          <stop offset="0.5" stopColor="#d6f57f" />
          <stop offset="1" stopColor="#a6e05a" />
        </linearGradient>
        <linearGradient id={`${id}-sun`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffc04d" />
          <stop offset="0.5" stopColor="#fff3c4" />
          <stop offset="1" stopColor="#ffc04d" />
        </linearGradient>
        <radialGradient id={`${id}-check`} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#5bbf3e" />
          <stop offset="1" stopColor="#1f7a3a" />
        </radialGradient>
      </defs>
      {book(54, 176, 132, 34, 'forest', 'b1')}
      {book(64, 140, 116, 30, 'sun', 'b2')}
      {book(56, 104, 124, 28, 'lime', 'b3')}
      <g>
        <circle cx="186" cy="66" r="28" fill={`url(#${id}-check)`} />
        <circle cx="186" cy="66" r="28" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="2" />
        <circle cx="176" cy="56" r="7" fill="#ffffff" opacity="0.5" />
        <path d="M 172 67 L 182 77 L 200 58" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <GroundShadow id={id} cy={216} rx={80} ry={9} />
    </svg>
  );
}

function Chart() {
  const id = useId();
  // Batang silinder: sisi kiri gelap, tengah terang, sisi kanan gelap, dan tutup elips di atas.
  const bar = (x: number, height: number, tone: string, key: string) => {
    const top = 200 - height;
    return (
      <g key={key}>
        <rect x={x} y={top} width="38" height={height} rx="6" fill={`url(#${id}-${tone})`} />
        <ellipse cx={x + 19} cy={top} rx="19" ry="6" style={{ fill: 'var(--tint-pale)' }} />
      </g>
    );
  };
  return (
    <svg viewBox="0 0 240 240" className="size-full overflow-visible" aria-hidden="true" focusable="false">
      <defs>
        <BlurFilter id={id} />
        {(['mint', 'lime', 'forest'] as const).map((tone) => (
          <linearGradient key={tone} id={`${id}-${tone}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={tone === 'mint' ? '#8ed6ab' : tone === 'lime' ? '#a6e05a' : '#2f6b3f'} />
            <stop offset="0.5" stopColor={tone === 'mint' ? '#d7f3df' : tone === 'lime' ? '#d6f57f' : '#5bbf3e'} />
            <stop offset="1" stopColor={tone === 'mint' ? '#8ed6ab' : tone === 'lime' ? '#a6e05a' : '#2f6b3f'} />
          </linearGradient>
        ))}
        <radialGradient id={`${id}-coin`} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset="0.6" stopColor="#ffc04d" />
          <stop offset="1" stopColor="#f5a524" />
        </radialGradient>
      </defs>
      <g>
        {bar(48, 62, 'mint', 'c1')}
        {bar(100, 102, 'lime', 'c2')}
        {bar(152, 144, 'forest', 'c3')}
      </g>
      <path
        d="M 52 150 Q 110 120 150 86 T 204 40"
        fill="none"
        style={{ stroke: 'var(--btn-bg)' }}
        strokeWidth="10"
        strokeLinecap="round"
        filter={`url(#${id}-blur)`}
        opacity="0.35"
      />
      <path d="M 52 146 Q 110 116 150 82 T 200 44" fill="none" style={{ stroke: 'var(--btn-bg)' }} strokeWidth="10" strokeLinecap="round" />
      <path d="M 186 36 L 210 34 L 204 58 Z" style={{ fill: 'var(--btn-bg)' }} />
      <g>
        <circle cx="50" cy="66" r="22" fill={`url(#${id}-coin)`} />
        <circle cx="50" cy="66" r="22" fill="none" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="2" />
        <path d="M 50 54 L 53.5 62 L 62 62.5 L 55 67.5 L 57.5 76 L 50 71 L 42.5 76 L 45 67.5 L 38 62.5 L 46.5 62 Z" fill="#ffffff" opacity="0.85" />
      </g>
      <GroundShadow id={id} cy={216} rx={86} ry={9} />
    </svg>
  );
}
