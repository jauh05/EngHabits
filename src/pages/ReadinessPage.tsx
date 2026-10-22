import { Link } from 'react-router';
import { AlertTriangle, Dumbbell, Home } from 'lucide-react';
import { buttonClass } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  computeStats,
  MIN_DAYS_FOR_READINESS,
  PART_LABELS,
  readinessLevel,
  READINESS_LABELS,
  weakestPart,
} from '../lib/stats';
import { useProgressData } from '../lib/useProgressData';

export function ReadinessPage() {
  const data = useProgressData();
  const stats = computeStats(data.progress, data.mistakes);
  const enough = stats.completedDays >= MIN_DAYS_FOR_READINESS;
  const weakest = weakestPart(stats.partPercents);
  const overall = stats.averageCorePercent;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <header className="flex flex-col gap-1 lg:col-span-2">
        <h1 className="text-3xl font-extrabold text-ink lg:text-4xl">Laporan kesiapan</h1>
        <p className="text-muted">Perkiraan dari latihan di aplikasi ini. Ini bukan skor resmi dari ETS atau IELTS.</p>
      </header>

      <Card tone="lavender" className="flex items-start gap-3 lg:col-span-2">
        <AlertTriangle size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-primary-700" />
        <p className="text-sm text-primary-700">
          Angka di sini memakai soal buatan sendiri dan percobaan pertama setiap hari. Gunakan sebagai arah latihan, bukan
          sebagai prediksi skor ujian.
        </p>
      </Card>

      {!enough && (
        <Card className="flex flex-col gap-2">
          <p className="font-semibold text-ink">Data belum cukup.</p>
          <p className="text-sm text-muted">
            Selesaikan minimal {MIN_DAYS_FOR_READINESS} hari dulu, lalu laporan ini menampilkan perkiraan. Sekarang ada{' '}
            {stats.completedDays} hari selesai.
          </p>
          <Link to="/" className={buttonClass('secondary', 'md', 'self-start hover:scale-[1.02]')}>
            <Home size={18} aria-hidden="true" />
            Kembali ke beranda
          </Link>
        </Card>
      )}

      {enough && overall !== undefined && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-ink">Perkiraan keseluruhan</h2>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-3xl font-extrabold tabular-nums text-ink">{overall}%</span>
            <Badge tone="lavender">{READINESS_LABELS[readinessLevel(overall)]}</Badge>
          </div>
          <p className="text-sm text-muted">Rata-rata skor inti dari {stats.completedDays} hari yang sudah selesai.</p>
        </Card>
      )}

      {enough && (
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-ink">Per bagian</h2>
          <ul className="flex flex-col gap-3">
            {(Object.keys(PART_LABELS) as Array<keyof typeof PART_LABELS>).map((part) => {
              const value = stats.partPercents[part];
              return (
                <li key={part} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-ink">{PART_LABELS[part]}</span>
                  {value === undefined ? (
                    <span className="text-sm text-muted">Belum ada</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="tabular-nums text-ink">{value}%</span>
                      <Badge tone="lavender">{READINESS_LABELS[readinessLevel(value)]}</Badge>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          {weakest && (
            <p className="text-sm text-ink">
              Fokus berikutnya: <span className="font-semibold">{PART_LABELS[weakest]}</span>. Buka Buku Kesalahan untuk
              mengulang soal yang masih lemah.
            </p>
          )}
          <Link to="/latihan" className={buttonClass('primary', 'md', 'self-start hover:scale-[1.02]')}>
            <Dumbbell size={18} aria-hidden="true" />
            Mulai latihan dari Buku Kesalahan
          </Link>
        </Card>
      )}
    </div>
  );
}
