import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { ProgressRing } from '../ui/ProgressRing';

/** Timer panduan per blok. Bukan kunci: boleh diperpanjang atau dilewati. */
export function BlockTimer({ minutes }: { minutes: number }) {
  const [extraMinutes, setExtraMinutes] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);

  const total = (minutes + extraMinutes) * 60;
  const remaining = Math.max(0, total - elapsed);
  const minutesLeft = Math.floor(remaining / 60);
  const secondsLeft = String(remaining % 60).padStart(2, '0');
  const lastFive = remaining > 0 && remaining <= 300;

  return (
    <div className="flex items-center gap-4 rounded-card bg-surface p-4 shadow-card">
      <ProgressRing value={remaining / total} size={72} stroke={8} tone={lastFive ? 'warning' : 'default'}>
        <span className="text-xs font-extrabold tabular-nums text-ink">{minutesLeft}m</span>
      </ProgressRing>
      <div className="flex flex-1 flex-col">
        <p className="text-2xl font-extrabold tabular-nums text-ink">
          {String(minutesLeft).padStart(2, '0')}:{secondsLeft}
        </p>
        <p className="text-xs font-semibold text-muted">
          {remaining === 0 ? 'Waktu panduan habis. Lanjutkan saja.' : lastFive ? 'Lima menit terakhir' : 'Waktu panduan blok ini'}
        </p>
      </div>
      <Button variant="secondary" size="md" onClick={() => setExtraMinutes((value) => value + 5)}>
        <Plus size={16} aria-hidden="true" />
        5 menit
      </Button>
    </div>
  );
}
