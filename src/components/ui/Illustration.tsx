import { useId } from 'react';

/**
 * Ilustrasi SVG buatan sendiri untuk banner: tumpukan bentuk membulat dengan gradien ungu dan kuning.
 * Tidak meniru gaya 3D dari referensi. Warnanya tetap sama di mode terang dan gelap.
 */
export function StackIllustration({ className = '' }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 160 150" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-lilac`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f3ecff" />
          <stop offset="1" stopColor="#c4a8ff" />
        </linearGradient>
        <linearGradient id={`${id}-dark`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5c3fa6" />
          <stop offset="1" stopColor="#2b2140" />
        </linearGradient>
        <linearGradient id={`${id}-sun`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd27a" />
          <stop offset="1" stopColor="#ff9f43" />
        </linearGradient>
      </defs>
      <ellipse cx="82" cy="140" rx="56" ry="7" fill="#2b2140" opacity="0.18" />
      <rect x="44" y="84" width="74" height="50" rx="24" fill={`url(#${id}-lilac)`} />
      <rect x="32" y="52" width="80" height="44" rx="20" fill={`url(#${id}-dark)`} />
      <circle cx="112" cy="34" r="24" fill={`url(#${id}-sun)`} />
      <circle cx="112" cy="34" r="8" fill="#ffffff" opacity="0.85" />
      <circle cx="44" cy="110" r="13" fill="none" stroke="#ffe066" strokeWidth="9" />
    </svg>
  );
}
