import { motion } from 'motion/react';
import { easeOut } from '../../lib/motion';

export type BarItem = {
  key: string;
  /** Label di bawah batang, misalnya nomor hari. */
  label: string;
  /** Nilai 0 sampai 100. */
  value: number;
  /** Teks saat disentuh atau dibaca pembaca layar. */
  title: string;
  className?: string;
};

/**
 * Grafik batang vertikal dengan sudut atas membulat. Batang tumbuh dari bawah dengan jeda 40ms antar batang.
 * Tingginya memakai persen, jadi nilai 0 tetap terlihat sebagai batang tipis.
 */
export function BarChart({ items, label }: { items: BarItem[]; label: string }) {
  return (
    <figure aria-label={label} className="flex flex-col gap-2">
      <div role="list" className="flex h-40 items-end gap-1.5">
        {items.map((item, index) => (
          <div key={item.key} role="listitem" title={item.title} className="flex h-full flex-1 flex-col justify-end">
            <motion.div
              className={`w-full rounded-t-xl ${item.className ?? 'bg-primary-500'}`}
              style={{ height: `${Math.max(4, Math.min(100, item.value))}%`, transformOrigin: 'bottom' }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.5, ease: easeOut, delay: index * 0.04 }}
            />
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="flex gap-1.5 text-center text-[11px] font-semibold tabular-nums text-muted">
        {items.map((item) => (
          <span key={item.key} className="flex-1">
            {item.label}
          </span>
        ))}
      </div>
    </figure>
  );
}
