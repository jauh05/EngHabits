import { motion, useReducedMotion } from 'motion/react';

/**
 * Latar blob yang bergerak pelan (20 detik per putaran, lewat transform saja).
 * Dimatikan saat pengguna meminta pengurangan animasi.
 */
export function Blob({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      aria-hidden="true"
      className={`pointer-events-none absolute rounded-full opacity-60 blur-2xl ${className}`}
      animate={reduce ? undefined : { x: [0, 14, -8, 0], y: [0, -10, 6, 0] }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
    />
  );
}
