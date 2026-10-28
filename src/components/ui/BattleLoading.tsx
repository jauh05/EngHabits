import { useEffect, useState } from 'react';

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** Persen berhenti di sini selagi menunggu server. Sisanya terisi saat halaman siap. */
const WAIT_CAP = 90;

/** Persen yang naik cepat di awal lalu melambat, dan tidak pernah melewati WAIT_CAP. */
function useWaitingPercent(): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setValue((current) => current + (WAIT_CAP - current) * 0.06);
    }, 80);
    return () => window.clearInterval(timer);
  }, []);
  return Math.floor(value);
}

/** Layar tunggu dengan persen bulat yang berjalan. Dipakai saat battle dibuka atau undangan dikirim. */
export function BattleLoading({ label }: { label: string }) {
  const percent = useWaitingPercent();
  return (
    <div role="status" aria-live="polite" className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
      <div className="relative size-40">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
          <circle cx="60" cy="60" r={RADIUS} fill="none" strokeWidth="12" className="stroke-track" />
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            strokeWidth="12"
            strokeLinecap="round"
            className="stroke-primary-500"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - percent / 100)}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-3xl font-extrabold tabular-nums text-ink">
          {percent}%
        </span>
      </div>
      <p className="font-bold text-ink">{label}</p>
    </div>
  );
}
