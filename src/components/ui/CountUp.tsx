import { animate } from 'motion';
import { useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';

export type CountUpProps = {
  value: number;
  duration?: number;
  decimals?: number;
  locale?: string;
  className?: string;
};

/** Angka yang naik dari 0 ke nilainya (skor, streak, jumlah hari). */
export function CountUp({ value, duration = 1, decimals = 0, locale = 'id-ID', className = '' }: CountUpProps) {
  const reduce = useReducedMotion();
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const controls = animate(0, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (latest) => setAnimated(latest),
    });
    return () => controls.stop();
  }, [value, duration, reduce]);

  const shown = reduce ? value : animated;
  const text = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(shown);

  return <span className={`tabular-nums ${className}`}>{text}</span>;
}
