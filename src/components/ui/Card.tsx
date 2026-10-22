import { motion, type HTMLMotionProps } from 'motion/react';
import { spring } from '../../lib/motion';

export type CardTone = 'surface' | 'lavender' | 'sun' | 'sky' | 'rose' | 'mint' | 'peach' | 'deep';

export type CardProps = HTMLMotionProps<'div'> & {
  interactive?: boolean;
  tone?: CardTone;
};

/** Kartu pastel seperti referensi. Warna kartu bertint memakai border transparan supaya tidak terlihat kotak. */
const TONES: Record<CardTone, string> = {
  surface: 'bg-surface border-line',
  lavender: 'bg-primary-100 border-transparent',
  sun: 'bg-tint-sun border-transparent',
  sky: 'bg-tint-sky border-transparent',
  rose: 'bg-tint-rose border-transparent',
  mint: 'bg-tint-mint border-transparent',
  peach: 'bg-tint-peach border-transparent',
  /** Kartu ungu tua dengan teks putih, untuk satu sorotan seperti kartu gelap di referensi. */
  deep: 'bg-primary-700 border-transparent text-white',
};

export function Card({
  interactive = false,
  tone = 'surface',
  className = '',
  ...props
}: CardProps) {
  return (
    <motion.div
      whileHover={interactive ? { y: -3 } : undefined}
      transition={spring}
      className={`rounded-card border p-5 shadow-card ${TONES[tone]} ${interactive ? 'cursor-pointer' : ''} ${className}`}
      {...props}
    />
  );
}
