import { motion, type HTMLMotionProps } from 'motion/react';
import { spring } from '../../lib/motion';

export type CardTone = 'surface' | 'lavender' | 'sun' | 'sky' | 'rose' | 'mint' | 'peach' | 'deep' | 'lime' | 'mint-deep';

export type CardProps = HTMLMotionProps<'div'> & {
  interactive?: boolean;
  tone?: CardTone;
};

/**
 * Warna kartu. Setiap tone mengisi --edge (tepi 3D di bagian bawah) dengan warna kartu yang digelapkan sedikit,
 * jadi tepinya selalu serasi dengan isinya. Kartu putih memakai tepi default dari tokens.css.
 */
const TONES: Record<CardTone, string> = {
  surface: 'bg-surface border-transparent',
  lavender: 'bg-primary-100 border-transparent [--edge:color-mix(in_srgb,var(--primary-100),var(--shade)_18%)]',
  sun: 'bg-tint-sun border-transparent [--edge:color-mix(in_srgb,var(--tint-sun),var(--shade)_18%)]',
  sky: 'bg-tint-sky border-transparent [--edge:color-mix(in_srgb,var(--tint-sky),var(--shade)_18%)]',
  rose: 'bg-tint-rose border-transparent [--edge:color-mix(in_srgb,var(--tint-rose),var(--shade)_18%)]',
  mint: 'bg-tint-mint border-transparent [--edge:color-mix(in_srgb,var(--tint-mint),var(--shade)_18%)]',
  peach: 'bg-tint-peach border-transparent [--edge:color-mix(in_srgb,var(--tint-peach),var(--shade)_18%)]',
  /** Kartu gelap dengan teks putih, untuk satu sorotan seperti kartu gelap di referensi. */
  deep: 'bg-charcoal border-transparent text-white [--edge:color-mix(in_srgb,var(--charcoal),var(--shade)_50%)]',
  /** Kartu lime untuk sorotan. Teksnya gelap seperti tombol di atas lime. */
  lime: 'bg-lime border-transparent text-on-accent [--edge:color-mix(in_srgb,var(--lime),var(--shade)_18%)]',
  /** Kartu mint tua untuk kartu sedang. */
  'mint-deep': 'bg-mint-deep border-transparent text-on-accent [--edge:color-mix(in_srgb,var(--mint-deep),var(--shade)_18%)]',
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
