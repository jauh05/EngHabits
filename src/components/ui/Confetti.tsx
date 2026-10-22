import { motion, useReducedMotion } from 'motion/react';
import { useMemo } from 'react';

const COLORS = ['#7366DB', '#B6AEF2', '#E9E5FB', '#4D41B5', '#3DBE8B', '#F59A5C'];

export type ConfettiProps = {
  count?: number;
};

/**
 * Confetti ungu, lavender, hijau, dan oranye untuk layar perayaan. Sekali main lalu diam.
 * Tidak tampil sama sekali bila pengguna meminta animasi dikurangi.
 */
export function Confetti({ count = 48 }: ConfettiProps) {
  const reduce = useReducedMotion();

  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, id) => ({
        id,
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 1.8 + Math.random() * 1.2,
        rotate: Math.random() * 720 - 360,
        width: 6 + Math.random() * 6,
        height: 10 + Math.random() * 8,
        color: COLORS[id % COLORS.length],
      })),
    [count],
  );

  if (reduce) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {pieces.map((piece) => (
        <motion.span
          key={piece.id}
          className="absolute top-0 block rounded-sm"
          style={{
            left: `${piece.left}%`,
            width: piece.width,
            height: piece.height,
            backgroundColor: piece.color,
          }}
          initial={{ y: -40, opacity: 1, rotate: 0 }}
          animate={{ y: '110vh', rotate: piece.rotate, opacity: [1, 1, 0] }}
          transition={{ duration: piece.duration, delay: piece.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}
