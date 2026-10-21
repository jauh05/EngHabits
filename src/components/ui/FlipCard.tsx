import { motion } from 'motion/react';
import { useState, type ReactNode } from 'react';
import { durations, easeOut } from '../../lib/motion';

export type FlipCardProps = {
  front: ReactNode;
  back: ReactNode;
  className?: string;
};

/** Kartu flip 3D untuk flashcard kosakata. Ketuk atau tekan Enter untuk membalik. */
export function FlipCard({ front, back, className = '' }: FlipCardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className={`[perspective:1000px] ${className}`}>
      <button
        type="button"
        onClick={() => setFlipped((value) => !value)}
        className="relative block h-56 w-full cursor-pointer rounded-card text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
      >
        <motion.span
          className="relative block size-full [transform-style:preserve-3d]"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: durations.slow, ease: easeOut }}
        >
          <span className="absolute inset-0 grid place-items-center rounded-card border border-line bg-surface p-6 text-center shadow-card [backface-visibility:hidden]">
            {front}
          </span>
          <span className="absolute inset-0 grid place-items-center rounded-card bg-primary-100 p-6 text-center shadow-card [backface-visibility:hidden] [transform:rotateY(180deg)]">
            {back}
          </span>
        </motion.span>
      </button>
    </div>
  );
}
