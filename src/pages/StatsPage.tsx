import { Link } from 'react-router';
import { ClipboardCheck } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { TOTAL_DAYS } from '../lib/progression';
import { computeStats, PART_LABELS } from '../lib/stats';
import type { Part } from '../lib/grading';
import { useProgressData } from '../lib/useProgressData';

function percentText(value: number | undefined): string {
  return value === undefined ? 'Belum ada' : `${value}%`;
}

function tileTone(percent: number | undefined): string {
  if (percent === undefined) return 'border-line bg-surface text-muted';
  if (percent >= 70) return 'border-success bg-success text-on-accent';
  if (percent >= 50) return 'border-streak bg-streak text-on-accent';
  return 'border-error bg-error text-on-accent';
}

export function StatsPage() {
  const data = useProgressData();
  const stats = computeStats(data.progress, data.mistakes);
  const scoreByDay = new Map(data.progress.map((row) => [row.day, row.firstCorePercent]));
  const parts = Object.keys(PART_LABELS) as Part[];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-ink">Statistik</h1>
        <p className="text-muted">Angka dari percobaan pertama setiap hari. Percobaan ulang tidak mengubah angka ini.</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Card className="flex flex-col gap-1">
          <span className="text-sm text-muted">Hari lulus</span>
          <span className="text-2xl font-extrabold tabular-nums text-ink">
            {stats.masteredDays} <span className="text-base font-semibold text-muted">/ {TOTAL_DAYS}</span>
          </span>
          <span className="text-sm text-muted">{stats.repairDays} perlu perbaikan</span>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="text-sm text-muted">Rata-rata skor inti</span>
          <span className="text-2xl font-extrabold tabular-nums text-ink">{percentText(stats.averageCorePercent)}</span>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="text-sm text-muted">Akurasi Hard Challenge</span>
          <span className="text-2xl font-extrabold tabular-nums text-ink">{percentText(stats.hardPercent)}</span>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="text-sm text-muted">Kesalahan aktif</span>
          <span className="text-2xl font-extrabold tabular-nums text-ink">{stats.activeMistakes}</span>
          <span className="text-sm text-muted">{stats.masteredMistakes} sudah terkuasai</span>
        </Card>
      </div>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-ink">Akurasi per bagian</h2>
        {stats.completedDays === 0 && <p className="text-sm text-muted">Angka per bagian muncul setelah hari pertama selesai.</p>}
        <ul className="flex flex-col gap-3">
          {parts.map((part) => {
            const value = stats.partPercents[part];
            return (
              <li key={part} className="flex flex-col gap-1">
                <span className="flex justify-between text-sm font-semibold text-ink">
                  <span>{PART_LABELS[part]}</span>
                  <span className="tabular-nums">{percentText(value)}</span>
                </span>
                <div
                  role="progressbar"
                  aria-label={PART_LABELS[part]}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={value ?? 0}
                  className="h-3 overflow-hidden rounded-full bg-bg"
                >
                  <div className="h-full rounded-full bg-primary-500" style={{ width: `${value ?? 0}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold text-ink">Skor inti per hari</h2>
          <p className="text-sm text-muted">Hijau 70% ke atas, kuning 50 sampai 69%, merah di bawah 50%. Abu-abu berarti belum selesai.</p>
        </div>
        <div className="grid grid-cols-10 gap-1.5">
          {Array.from({ length: TOTAL_DAYS }, (_, index) => {
            const day = index + 1;
            const percent = scoreByDay.get(day);
            return (
              <Link
                key={day}
                to={`/hari/${day}`}
                title={`Hari ${day}: ${percentText(percent)}`}
                className={`flex aspect-square items-center justify-center rounded-lg border text-xs font-semibold tabular-nums outline-none focus-visible:outline-2 focus-visible:outline-primary-500 ${tileTone(percent)}`}
              >
                {day}
              </Link>
            );
          })}
        </div>
      </Card>

      <Link
        to="/laporan"
        className="flex min-h-11 items-center gap-3 rounded-2xl border border-line bg-surface px-4 font-semibold text-primary-700 shadow-card"
      >
        <ClipboardCheck size={20} aria-hidden="true" />
        Lihat laporan kesiapan (perkiraan)
      </Link>
    </div>
  );
}
