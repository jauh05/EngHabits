import { useId } from 'react';

/** Wajah sederhana: dua mata putih dengan pupil, dan mulut senyum. */
function Face({ x, y, scale = 1, mouth = 'smile' }: { x: number; y: number; scale?: number; mouth?: 'smile' | 'open' }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx={-12} cy={0} rx={9} ry={10} fill="#fff" />
      <ellipse cx={12} cy={0} rx={9} ry={10} fill="#fff" />
      <circle cx={-10} cy={2} r={4.5} fill="#12331d" />
      <circle cx={14} cy={2} r={4.5} fill="#12331d" />
      {mouth === 'smile' ? (
        <path d="M -10 16 Q 1 26 12 16" fill="none" stroke="#12331d" strokeWidth={4} strokeLinecap="round" />
      ) : (
        <ellipse cx={1} cy={20} rx={9} ry={7} fill="#12331d" />
      )}
    </g>
  );
}

/**
 * Kumpulan karakter bulat berwarna dengan wajah dan coretan hitam, pola seperti gambar 1 (moimoi).
 * Dibuat sendiri dengan SVG, bukan salinan ilustrasi referensi.
 */
export function BlobCluster({ className = '', bubble }: { className?: string; bubble?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 320 280" className={className} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${id}-green`} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#dcff9a" />
          <stop offset="1" stopColor="#8fe05a" />
        </radialGradient>
        <radialGradient id={`${id}-red`} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#e4f7cf" />
          <stop offset="1" stopColor="#a6e05a" />
        </radialGradient>
        <radialGradient id={`${id}-blue`} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#d7f3df" />
          <stop offset="1" stopColor="#5bbf3e" />
        </radialGradient>
        <radialGradient id={`${id}-yellow`} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#fff1a8" />
          <stop offset="1" stopColor="#ffc53d" />
        </radialGradient>
        <radialGradient id={`${id}-pink`} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#ffd0e6" />
          <stop offset="1" stopColor="#ff7fb8" />
        </radialGradient>
        <radialGradient id={`${id}-orange`} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#ffd9b5" />
          <stop offset="1" stopColor="#ff9f5c" />
        </radialGradient>
      </defs>

      {/* Coretan hitam: rambut, lengkung, dan garis gerak. */}
      <path d="M 20 110 Q 40 60 70 60" fill="none" stroke="#12331d" strokeWidth={5} strokeLinecap="round" />
      <path d="M 210 46 Q 240 26 262 52" fill="none" stroke="#12331d" strokeWidth={5} strokeLinecap="round" />
      <path d="M 244 26 Q 268 14 272 40" fill="none" stroke="#12331d" strokeWidth={5} strokeLinecap="round" />
      <path d="M 20 205 Q 60 180 96 186" fill="none" stroke="#12331d" strokeWidth={5} strokeLinecap="round" />
      <path d="M 290 170 Q 306 200 300 232" fill="none" stroke="#12331d" strokeWidth={5} strokeLinecap="round" />
      <path d="M 136 232 Q 124 252 138 262" fill="none" stroke="#12331d" strokeWidth={4} strokeLinecap="round" />

      {/* Karakter. Urutan menentukan susunan tumpukan. */}
      <circle cx={68} cy={104} r={52} fill={`url(#${id}-green)`} />
      <Face x={60} y={96} scale={0.85} />

      <circle cx={172} cy={44} r={30} fill={`url(#${id}-pink)`} />
      <rect x={160} y={36} width={6} height={16} rx={3} fill="#12331d" />
      <rect x={176} y={36} width={6} height={16} rx={3} fill="#12331d" />

      <circle cx={246} cy={100} r={58} fill={`url(#${id}-red)`} />
      <Face x={242} y={96} scale={1.05} mouth="open" />

      <circle cx={92} cy={210} r={66} fill={`url(#${id}-blue)`} />
      <Face x={86} y={198} scale={1.05} />

      <circle cx={236} cy={206} r={64} fill={`url(#${id}-yellow)`} />
      <Face x={232} y={200} scale={1} />

      <circle cx={160} cy={232} r={24} fill={`url(#${id}-orange)`} />
      <circle cx={153} cy={226} r={8} fill="none" stroke="#12331d" strokeWidth={3} />
      <circle cx={167} cy={226} r={8} fill="none" stroke="#12331d" strokeWidth={3} />

      {bubble && (
        <g>
          <rect x={112} y={124} width={124} height={54} rx={27} fill="#12331d" />
          <path d="M 150 176 L 140 194 L 166 178 Z" fill="#12331d" />
          <text x={174} y={158} textAnchor="middle" fontSize={24} fontWeight={800} fill="#fff" fontFamily="inherit">
            {bubble}
          </text>
        </g>
      )}
    </svg>
  );
}
