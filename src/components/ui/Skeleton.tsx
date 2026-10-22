import { motion } from 'motion/react';

/** Placeholder loading dengan kilau yang bergerak (1.4 detik per putaran). */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`relative overflow-hidden rounded-2xl bg-track ${className}`}>
      <motion.span
        className="absolute inset-y-0 w-1/2 bg-linear-to-r from-transparent via-surface/70 to-transparent"
        animate={{ x: ['-100%', '250%'] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}
