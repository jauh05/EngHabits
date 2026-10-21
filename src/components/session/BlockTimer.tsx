import { useEffect, useState } from 'react';
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
    <div className="flex items-center gap-4 rounded-card border border-line bg-surface p-3 shadow-card">
      <ProgressRing value={remaining / total} size={56} stroke={6} tone={lastFive ? 'warning' : 'default'}>
        <span className="text-xs font-bold tabular-nums text-ink">{minutesLeft}m</span>
      </ProgressRing>
      <div className="flex flex-1 flex-col">
        <p className="text-sm font-bold tabular-nums text-ink">
          {String(minutesLeft).padStart(2, '0')}:{secondsLeft}
        </p>
        <p className="text-xs text-muted">
          {remaining === 0 ? 'Waktu panduan habis. Lanjutkan saja.' : lastFive ? 'Lima menit terakhir' : 'Waktu panduan blok ini'}
        </p>
      </div>
      <Button variant="ghost" size="md" onClick={() => setExtraMinutes((value) => value + 5)}>
        +5 menit
      </Button>
    </div>
  );
}
