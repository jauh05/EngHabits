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
  /** Kelas warna titik status di atas batang, misalnya dari scoreDot. Kosong berarti tanpa titik. */
  dotClassName?: string;
};

/** Warna titik status skor inti: hijau 70 ke atas, kuning 50 sampai 69, merah di bawah 50. */
export function scoreDot(percent: number): string {
  if (percent >= 70) return 'bg-success';
  if (percent >= 50) return 'bg-streak';
  return 'bg-error';
}

/**
 * Grafik batang vertikal dengan sudut atas membulat. Semua batang berwarna coklat.
 * Status skor tampil sebagai titik kecil di atas batang. Batang tumbuh dari bawah dengan jeda 40ms antar batang.
 * Tingginya memakai persen, jadi nilai 0 tetap terlihat sebagai batang tipis.
 */
export function BarChart({ items, label }: { items: BarItem[]; label: string }) {
  return (
    <figure aria-label={label} className="flex flex-col gap-2">
      <div role="list" className="flex h-40 items-end gap-1.5">
        {items.map((item, index) => {
          const height = `${Math.max(4, Math.min(100, item.value))}%`;
          return (
            <div key={item.key} role="listitem" title={item.title} className="relative flex h-full flex-1 flex-col justify-end">
              <motion.div
                className="w-full rounded-t-xl bg-forest"
                style={{ height, transformOrigin: 'bottom' }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.5, ease: easeOut, delay: index * 0.04 }}
              />
              {item.dotClassName && (
                <motion.span
                  aria-hidden="true"
                  className={`absolute left-1/2 size-2.5 -translate-x-1/2 rounded-full ${item.dotClassName}`}
                  style={{ bottom: `calc(${height} + 6px)` }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.04 }}
                />
              )}
            </div>
          );
        })}
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
