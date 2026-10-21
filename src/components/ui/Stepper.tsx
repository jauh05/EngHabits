import { motion } from 'motion/react';
import { useId } from 'react';
import { Check } from 'lucide-react';
import { spring } from '../../lib/motion';

export type StepperStep = { id: string; label: string };

export type StepperProps = {
  steps: StepperStep[];
  current: number;
  onSelect?: (index: number) => void;
  label?: string;
};

/** Stepper blok sesi. Indikator aktif meluncur antar langkah lewat layoutId. */
export function Stepper({ steps, current, onSelect, label = 'Langkah sesi' }: StepperProps) {
  const uid = useId();
  const span = Math.max(steps.length - 1, 1);

  return (
    <nav aria-label={label}>
      <ol className="grid gap-1" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((step, index) => {
          const active = index === current;
          const done = index < current;
          return (
            <li key={step.id} className="relative">
              {active && (
                <motion.span
                  layoutId={`${uid}-indicator`}
                  transition={spring}
                  className="absolute inset-0 rounded-2xl bg-primary-100"
                />
              )}
              <button
                type="button"
                onClick={() => onSelect?.(index)}
                aria-current={active ? 'step' : undefined}
                className="relative flex w-full flex-col items-center gap-1 rounded-2xl px-1 py-2 text-center outline-none focus-visible:outline-2 focus-visible:outline-primary-500"
              >
                <span
                  className={`grid size-8 place-items-center rounded-full text-sm font-bold ${
                    done
                      ? 'bg-success text-on-accent'
                      : active
                        ? 'bg-btn-bg text-btn-fg'
                        : 'bg-surface text-muted border border-line'
                  }`}
                >
                  {done ? <Check size={16} strokeWidth={2.5} aria-hidden="true" /> : index + 1}
                </span>
                <span className={`text-xs font-semibold sm:text-sm ${active ? 'text-primary-700' : 'text-muted'}`}>
                  {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-track" aria-hidden="true">
        <motion.div
          className="h-full origin-left rounded-full bg-primary-500"
          initial={false}
          animate={{ scaleX: current / span }}
          transition={spring}
          style={{ width: '100%' }}
        />
      </div>
    </nav>
  );
}
