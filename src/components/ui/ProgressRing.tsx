import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { durations, easeOut } from '../../lib/motion';

export type ProgressRingProps = {
  /** Nilai 0 sampai 1. */
  value: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
  ariaLabel?: string;
  /** warning: indikator berubah warna (misalnya 5 menit terakhir). */
  tone?: 'default' | 'warning';
};

/** Cincin progres yang terisi animatif. Untuk progres 90 hari dan progres sesi. */
export function ProgressRing({ value, size = 120, stroke = 10, children, ariaLabel, tone = 'default' }: ProgressRingProps) {
  const clamped = Math.min(1, Math.max(0, value));
  const radius = (size - stroke) / 2;
  const center = size / 2;

  return (
    <div
      role="img"
      aria-label={ariaLabel ?? `${Math.round(clamped * 100)}%`}
      className="relative inline-grid place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={center} cy={center} r={radius} fill="none" strokeWidth={stroke} className="stroke-track" />
        {/* Nilai 0 tidak digambar: ujung bulat akan tampak sebagai titik. */}
        {clamped > 0 && (
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            className={tone === 'warning' ? 'stroke-error' : 'stroke-primary-500'}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: clamped }}
            transition={{ duration: durations.slow * 3, ease: easeOut }}
          />
        )}
      </svg>
      {children && <div className="absolute inset-0 grid place-items-center text-center">{children}</div>}
    </div>
  );
}
