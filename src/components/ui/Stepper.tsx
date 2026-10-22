import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { spring } from '../../lib/motion';

export type StepperStep = { id: string; label: string };

export type StepperProps = {
  steps: StepperStep[];
  current: number;
  onSelect?: (index: number) => void;
  label?: string;
};

/**
 * Stepper blok sesi. Lingkaran selesai hijau, aktif oranye, dan yang belum putih.
 * Bar di bawahnya menunjukkan kemajuan antar blok.
 */
export function Stepper({ steps, current, onSelect, label = 'Langkah sesi' }: StepperProps) {
  const span = Math.max(steps.length - 1, 1);

  return (
    <nav aria-label={label}>
      <ol className="grid gap-1" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((step, index) => {
          const active = index === current;
          const done = index < current;
          return (
            <li key={step.id} className="relative">
              <button
                type="button"
                onClick={() => onSelect?.(index)}
                aria-current={active ? 'step' : undefined}
                className="flex w-full flex-col items-center gap-1.5 rounded-2xl px-1 py-1 text-center outline-none focus-visible:outline-2 focus-visible:outline-primary-500"
              >
                <span
                  className={`grid size-10 place-items-center rounded-full text-sm font-extrabold shadow-card transition-colors ${
                    done
                      ? 'bg-success text-on-accent'
                      : active
                        ? 'bg-btn-bg text-btn-fg'
                        : 'bg-surface text-muted'
                  }`}
                >
                  {done ? <Check size={18} strokeWidth={3} aria-hidden="true" /> : index + 1}
                </span>
                <span className={`text-xs font-bold sm:text-sm ${active ? 'text-ink' : 'text-ink/60'}`}>{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface/70" aria-hidden="true">
        <motion.div
          className="h-full origin-left rounded-full bg-success"
          initial={false}
          animate={{ scaleX: current / span }}
          transition={spring}
          style={{ width: '100%' }}
        />
      </div>
    </nav>
  );
}
