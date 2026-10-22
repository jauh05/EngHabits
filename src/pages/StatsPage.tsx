import { Link } from 'react-router';
import { ArrowRight, BookX, ClipboardCheck, Sparkles, Target, Trophy, type LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { BarChart, type BarItem } from '../components/ui/BarChart';
import { Card, type CardTone } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { TOTAL_DAYS } from '../lib/progression';
import { computeStats, PART_LABELS } from '../lib/stats';
import type { Part } from '../lib/grading';
import { easeOut } from '../lib/motion';
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

function barTone(percent: number): string {
  if (percent >= 70) return 'bg-success';
  if (percent >= 50) return 'bg-streak';
  return 'bg-error';
}

/** Kartu angka dengan ikon di kotak putih, seperti kartu Lessons dan Hours di referensi Olympiads. */
function StatCard({
  tone,
  icon: Icon,
  label,
  value,
  note,
}: {
  tone: CardTone;
  icon: LucideIcon;
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <Card tone={tone} className="flex flex-col gap-2">
      <span className="inline-flex w-fit rounded-xl bg-surface p-2">
        <Icon size={22} aria-hidden="true" className="text-primary-700" />
      </span>
      <span className="text-sm font-semibold text-ink/80">{label}</span>
      <span className="text-2xl font-extrabold tabular-nums text-ink lg:text-3xl">{value}</span>
      {note && <span className="text-sm text-ink/70">{note}</span>}
    </Card>
  );
}

export function StatsPage() {
  const data = useProgressData();
  const stats = computeStats(data.progress, data.mistakes);
  const scoreByDay = new Map(data.progress.map((row) => [row.day, row.firstCorePercent]));
  const parts = Object.keys(PART_LABELS) as Part[];

  // Grafik batang: skor inti 14 hari terakhir yang sudah dikirim.
  const recent = [...data.progress].sort((a, b) => a.day - b.day).slice(-14);
  const barItems: BarItem[] = recent.map((row) => ({
    key: String(row.day),
    label: String(row.day),
    value: row.firstCorePercent,
    title: `Hari ${row.day}: ${row.firstCorePercent}%`,
    className: barTone(row.firstCorePercent),
  }));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-ink lg:text-4xl">Statistik</h1>
        <p className="text-muted">Angka dari percobaan pertama setiap hari. Percobaan ulang tidak mengubah angka ini.</p>
      </header>

      {!data.loaded ? (
        <div className="flex flex-col gap-4" aria-label="Memuat statistik">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Skeleton className="h-36 rounded-card" />
            <Skeleton className="h-36 rounded-card" />
            <Skeleton className="h-36 rounded-card" />
            <Skeleton className="h-36 rounded-card" />
          </div>
          <Skeleton className="h-56 rounded-card" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <StatCard
              tone="sun"
              icon={Trophy}
              label="Hari lulus"
              value={`${stats.masteredDays} / ${TOTAL_DAYS}`}
              note={`${stats.repairDays} perlu perbaikan`}
            />
            <StatCard tone="sky" icon={Target} label="Rata-rata skor inti" value={percentText(stats.averageCorePercent)} />
            <StatCard tone="rose" icon={Sparkles} label="Akurasi Hard Challenge" value={percentText(stats.hardPercent)} />
            <StatCard
              tone="mint"
              icon={BookX}
              label="Kesalahan aktif"
              value={String(stats.activeMistakes)}
              note={`${stats.masteredMistakes} sudah terkuasai`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold text-ink">Skor inti 14 hari terakhir</h2>
                <p className="text-sm text-muted">Hijau 70% ke atas, kuning 50 sampai 69%, merah di bawah 50%.</p>
              </div>
              {barItems.length === 0 ? (
                <p className="text-sm text-muted">Grafik muncul setelah hari pertama dikirim.</p>
              ) : (
                <BarChart items={barItems} label="Grafik skor inti 14 hari terakhir" />
              )}
            </Card>

            <Card tone="sky" className="flex flex-col gap-4">
              <h2 className="text-lg font-bold text-ink">Akurasi per bagian</h2>
              {stats.completedDays === 0 && (
                <p className="text-sm text-ink/80">Angka per bagian muncul setelah hari pertama selesai.</p>
              )}
              <ul className="flex flex-col gap-4">
                {parts.map((part) => {
                  const value = stats.partPercents[part];
                  return (
                    <li key={part} className="flex flex-col gap-1.5">
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
                        className="h-2.5 overflow-hidden rounded-full bg-surface"
                      >
                        <motion.div
                          className="h-full rounded-full bg-primary-500"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: (value ?? 0) / 100 }}
                          transition={{ duration: 0.6, ease: easeOut }}
                          style={{ width: '100%', transformOrigin: 'left' }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>

          <Card className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold text-ink">Peta skor per hari</h2>
              <p className="text-sm text-muted">Abu-abu berarti belum dikirim.</p>
            </div>
            <div className="grid grid-cols-10 gap-1.5 lg:grid-cols-[repeat(15,minmax(0,1fr))]">
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

          <Link to="/laporan" className="block rounded-card outline-none focus-visible:outline-2 focus-visible:outline-primary-500">
            <Card tone="deep" interactive className="flex items-center gap-4">
              <ClipboardCheck size={28} aria-hidden="true" className="shrink-0" />
              <span className="flex-1">
                <span className="block font-bold">Laporan kesiapan</span>
                <span className="block text-sm opacity-90">Perkiraan dari latihan, bukan skor resmi.</span>
              </span>
              <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-ink">
                <ArrowRight size={20} />
              </span>
            </Card>
          </Link>
        </>
      )}
    </div>
  );
}
