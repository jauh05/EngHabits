import type { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'lavender' | 'easy' | 'medium' | 'hard' | 'streak';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-surface text-ink border border-line',
  lavender: 'bg-primary-100 text-primary-700',
  easy: 'bg-success text-on-accent',
  medium: 'bg-streak text-on-accent',
  hard: 'bg-error text-on-accent',
  streak: 'bg-streak text-on-accent',
};

const labels: Partial<Record<BadgeTone, string>> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

/** Lencana. Warna selalu disertai teks, jadi tidak hanya bergantung pada warna. */
export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children?: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${tones[tone]}`}
    >
      {children ?? labels[tone]}
    </span>
  );
}
