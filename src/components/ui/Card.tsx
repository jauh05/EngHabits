import { motion, type HTMLMotionProps } from 'motion/react';
import { spring } from '../../lib/motion';

export type CardProps = HTMLMotionProps<'div'> & {
  interactive?: boolean;
  tone?: 'surface' | 'lavender';
};

export function Card({
  interactive = false,
  tone = 'surface',
  className = '',
  ...props
}: CardProps) {
  const bg = tone === 'lavender' ? 'bg-primary-100' : 'bg-surface';
  return (
    <motion.div
      whileHover={interactive ? { y: -3 } : undefined}
      transition={spring}
      className={`rounded-card border border-line p-5 shadow-card ${bg} ${interactive ? 'cursor-pointer' : ''} ${className}`}
      {...props}
    />
  );
}
