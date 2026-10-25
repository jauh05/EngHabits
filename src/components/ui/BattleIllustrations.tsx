import { useId } from 'react';

/**
 * Ilustrasi battle buatan sendiri, bergaya 3D lewat gradien dan bayangan lembut.
 * Tidak menyalin ilustrasi dari referensi. Warnanya memakai token hijau dan kuning.
 */

/** Lencana VS: dua bilah silang di atas cakram 3D. */
export function VersusBadge({ className = '' }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${id}-disc`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffe08a" />
          <stop offset="1" stopColor="#f5b82e" />
        </radialGradient>
      </defs>
      <ellipse cx="40" cy="70" rx="26" ry="5" fill="#173d25" opacity="0.2" />
      <circle cx="40" cy="38" r="30" fill="#c98a12" />
      <circle cx="40" cy="35" r="30" fill={`url(#${id}-disc)`} />
      <path d="M26 46 L40 22 L54 46" fill="none" stroke="#1f7a3a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M26 30 L54 50" stroke="#1f7a3a" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

/** Lambang lobi: perisai hijau 3D dengan dua pedang kecil. */
export function BattleCrest({ className = '' }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-shield`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3f9f4f" />
          <stop offset="1" stopColor="#1f7a3a" />
        </linearGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe08a" />
          <stop offset="1" stopColor="#f5b82e" />
        </linearGradient>
      </defs>
      <ellipse cx="48" cy="90" rx="30" ry="4" fill="#173d25" opacity="0.2" />
      <path d="M48 6 L84 20 V48 C84 70 68 84 48 90 C28 84 12 70 12 48 V20 Z" fill="#12331d" transform="translate(0 4)" />
      <path d="M48 6 L84 20 V48 C84 70 68 84 48 90 C28 84 12 70 12 48 V20 Z" fill={`url(#${id}-shield)`} />
      <path d="M48 12 L78 23 V48 C78 66 65 78 48 84" fill="none" stroke={`url(#${id}-rim)`} strokeWidth="3" opacity="0.8" />
      <path d="M36 30 L60 62 M60 30 L36 62" stroke="#f7fbef" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

/** Piala 3D untuk layar hasil. */
export function TrophyIllustration({ className = '' }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 96 96" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-cup`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffe08a" />
          <stop offset="0.5" stopColor="#ffd45c" />
          <stop offset="1" stopColor="#e9a420" />
        </linearGradient>
      </defs>
      <ellipse cx="48" cy="90" rx="26" ry="4" fill="#173d25" opacity="0.2" />
      <path d="M26 16 H70 V36 C70 56 60 66 48 66 C36 66 26 56 26 36 Z" fill={`url(#${id}-cup)`} />
      <path d="M26 22 C12 22 10 36 16 42 C22 48 28 46 30 42" fill="none" stroke="#e9a420" strokeWidth="5" />
      <path d="M70 22 C84 22 86 36 80 42 C74 48 68 46 66 42" fill="none" stroke="#e9a420" strokeWidth="5" />
      <rect x="44" y="66" width="8" height="12" fill="#c98a12" />
      <rect x="32" y="78" width="32" height="8" rx="3" fill="#1f7a3a" />
      <rect x="32" y="78" width="32" height="3" rx="1.5" fill="#3f9f4f" />
    </svg>
  );
}

/** Podium tiga tiang, untuk klasemen dua pemain atau hasil. */
export function PodiumIllustration({ className = '' }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 120 80" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-first`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffe08a" />
          <stop offset="1" stopColor="#f5b82e" />
        </linearGradient>
        <linearGradient id={`${id}-second`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7fd77a" />
          <stop offset="1" stopColor="#3f9f4f" />
        </linearGradient>
      </defs>
      <rect x="44" y="12" width="32" height="60" rx="6" fill={`url(#${id}-first)`} />
      <rect x="8" y="34" width="32" height="38" rx="6" fill={`url(#${id}-second)`} />
      <rect x="80" y="46" width="32" height="26" rx="6" fill="#bde8d0" />
      <rect x="44" y="12" width="32" height="6" rx="3" fill="#fff6c8" opacity="0.8" />
    </svg>
  );
}
