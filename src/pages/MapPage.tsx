import { motion, useAnimate } from 'motion/react';
import { Check, Lock } from 'lucide-react';
import { useNavigate } from 'react-router';
import { WEEK_RANGES, monthOfWeek } from '../../content/schema';
import { ProgressRing } from '../components/ui/ProgressRing';
import { useToast } from '../components/ui/Toast';
import { contentDays } from '../lib/content';
import { dayStatus, MASTERY_THRESHOLD, type DayStatus } from '../lib/progression';
import { useProgressData } from '../lib/useProgressData';
import { easeOut } from '../lib/motion';

const STATUS_CLASS: Record<DayStatus, string> = {
  completed: 'bg-success text-on-accent border-success',
  available: 'bg-surface text-primary-700 border-primary-500 shadow-card',
  repair: 'bg-surface text-ink border-streak shadow-card',
  locked: 'bg-surface text-muted border-line',
  nocontent: 'bg-surface text-muted border-dashed border-line',
};

function DayChip({ day, status, onPick }: { day: number; status: DayStatus; onPick: () => void }) {
  const [scope, animate] = useAnimate();

  const handleTap = () => {
    if (status === 'locked') {
      void animate(scope.current, { rotate: [0, -8, 8, -5, 5, 0] }, { duration: 0.4, ease: easeOut });
    }
    onPick();
  };

  const label = {
    completed: 'lulus',
    available: 'tersedia',
    repair: 'perlu perbaikan',
    locked: 'terkunci',
    nocontent: 'belum tersedia',
  }[status];

  return (
    <button
      ref={scope}
      type="button"
      onClick={handleTap}
      aria-label={`Hari ${day}, ${label}`}
      className={`flex min-h-11 flex-col items-center justify-center rounded-2xl border text-sm font-bold outline-none transition-colors focus-visible:outline-2 focus-visible:outline-primary-500 ${STATUS_CLASS[status]}`}
    >
      {status === 'completed' ? (
        <Check size={18} strokeWidth={2.5} aria-hidden="true" />
      ) : status === 'locked' ? (
        <Lock size={16} aria-hidden="true" />
      ) : (
        <span>{day}</span>
      )}
      <span className="sr-only">{label}</span>
    </button>
  );
}

export function MapPage() {
  const navigate = useNavigate();
  const { show } = useToast();
  const data = useProgressData();
  const content = new Set(contentDays());

  /** Jumlah hari yang lulus dalam rentang minggu, untuk cincin progres per minggu. */
  const masteredIn = (from: number, to: number): number => {
    let count = 0;
    for (let day = from; day <= to; day += 1) if (data.mastered.has(day)) count += 1;
    return count;
  };

  const handlePick = (day: number, status: DayStatus) => {
    if (status === 'available' || status === 'completed' || status === 'repair') {
      navigate(`/hari/${day}`);
    } else if (status === 'locked') {
      show(`Capai skor inti ${MASTERY_THRESHOLD}% di Hari ke-${day - 1} dulu.`);
    } else {
      show(`Konten Hari ke-${day} belum tersedia.`);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-extrabold text-ink">Peta 90 hari</h1>
        <p className="text-muted">
          Hari berikutnya terbuka setelah skor inti hari ini minimal {MASTERY_THRESHOLD}%. Hari yang belum lulus bisa diulang.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
      {WEEK_RANGES.map(([week, from, to], weekIndex) => (
        <motion.section
          key={week}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: easeOut, delay: weekIndex * 0.05 }}
          aria-labelledby={`week-${week}`}
          className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-card"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <h2 id={`week-${week}`} className="text-lg font-bold text-ink">
                Minggu {week}
              </h2>
              <span className="text-sm text-muted">
                Bulan {monthOfWeek(week)} · Hari {from}-{to}
              </span>
            </div>
            <ProgressRing
              value={masteredIn(from, to) / (to - from + 1)}
              size={52}
              stroke={6}
              ariaLabel={`Minggu ${week}: ${masteredIn(from, to)} dari ${to - from + 1} hari lulus`}
            >
              <span className="text-xs font-bold tabular-nums text-ink">
                {masteredIn(from, to)}/{to - from + 1}
              </span>
            </ProgressRing>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {Array.from({ length: to - from + 1 }, (_, index) => from + index).map((day) => {
              const status = dayStatus(day, data.completed, content, data.mastered);
              return <DayChip key={day} day={day} status={status} onPick={() => handlePick(day, status)} />;
            })}
          </div>
        </motion.section>
      ))}
      </div>
    </div>
  );
}
