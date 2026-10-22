import { motion } from 'motion/react';
import { ArrowRight, BookX, CalendarCheck, Clock, Flame, Layers, Play, Trophy, type LucideIcon } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Badge } from '../components/ui/Badge';
import { BarChart, type BarItem } from '../components/ui/BarChart';
import { Blob } from '../components/ui/Blob';
import { Card, type CardTone } from '../components/ui/Card';
import { CountUp } from '../components/ui/CountUp';
import { MonthCalendar } from '../components/ui/MonthCalendar';
import { StackIllustration } from '../components/ui/Illustration';
import { ProgressRing } from '../components/ui/ProgressRing';
import { computeStreak, localISO } from '../lib/dates';
import { loadDay } from '../lib/content';
import type { Part } from '../lib/grading';
import { easeOut } from '../lib/motion';
import { currentDay, dayStatus, MASTERY_THRESHOLD, TOTAL_DAYS } from '../lib/progression';
import { isDue } from '../lib/srs';
import { useSettings } from '../lib/settings';
import { useProgressData } from '../lib/useProgressData';

const BLOCK_PLAN = [
  { label: 'Kosakata & pelafalan', minutes: 25 },
  { label: 'Materi & video', minutes: 35 },
  { label: 'Membaca atau mendengarkan', minutes: 30 },
  { label: 'Soal & Hard Challenge', minutes: 30 },
];

/** Warna kartu rencana: peach, biru, pink, lalu mint. */
const PLAN_TONES: CardTone[] = ['peach', 'sky', 'rose', 'mint'];

const PART_LABELS: Record<Part, string> = {
  comprehension: 'Membaca & mendengar',
  partA: 'Tata bahasa',
  partB: 'Terjemahan',
  hard: 'Hard Challenge (bonus)',
};

function Reveal({ index, children }: { index: number; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: easeOut, delay: index * 0.06 }}
    >
      {children}
    </motion.div>
  );
}

/** Kartu angka kecil dengan ikon di kotak berwarna, seperti Diagnosis, Tests, dan Drugs di referensi. */
function MiniStat({
  icon: Icon,
  tint,
  label,
  children,
}: {
  icon: LucideIcon;
  tint: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <span className={`grid size-10 place-items-center rounded-2xl ${tint}`}>
        <Icon size={20} aria-hidden="true" className="text-ink" />
      </span>
      <span className="text-2xl font-extrabold tabular-nums text-ink">{children}</span>
      <span className="text-xs font-semibold text-muted">{label}</span>
    </Card>
  );
}

function formatToday(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
}

export function DashboardPage() {
  const data = useProgressData();
  const { settings } = useSettings();
  const today = localISO();
  const next = currentDay(data.mastered);
  const nextStatus = next ? dayStatus(next, data.completed, data.content, data.mastered) : undefined;
  const [nextTitle, setNextTitle] = useState<string>();

  useEffect(() => {
    let active = true;
    if (!next || (nextStatus !== 'available' && nextStatus !== 'repair')) {
      setNextTitle(undefined);
      return;
    }
    loadDay(next).then((day) => {
      if (active) setNextTitle(day?.title);
    });
    return () => {
      active = false;
    };
  }, [next, nextStatus]);

  const name = settings.name.trim();
  const initial = (name || 'E').charAt(0).toUpperCase();
  const streak = computeStreak(data.completedDates, today);
  const points = data.progress.reduce((sum, item) => sum + item.firstCorrect, 0);
  const dueEntries = data.mistakes
    .filter((entry) => isDue(entry, today))
    .sort((a, b) => a.due.localeCompare(b.due) || a.day - b.day);

  const parts = (Object.keys(PART_LABELS) as Part[]).map((part) => {
    const correct = data.progress.reduce((sum, item) => sum + item.firstParts[part].correct, 0);
    const total = data.progress.reduce((sum, item) => sum + item.firstParts[part].total, 0);
    return { part, percent: total === 0 ? 0 : Math.round((correct / total) * 100), total };
  });

  // Grafik batang: skor inti 7 hari terakhir yang sudah dikirim.
  const recent: BarItem[] = [...data.progress]
    .sort((a, b) => a.day - b.day)
    .slice(-7)
    .map((row) => ({
      key: String(row.day),
      label: String(row.day),
      value: row.firstCorePercent,
      title: `Hari ${row.day}: ${row.firstCorePercent}%`,
      className: row.firstCorePercent >= 70 ? 'bg-primary-500' : row.firstCorePercent >= 50 ? 'bg-primary-300' : 'bg-error',
    }));

  const completedRatio = data.mastered.size / TOTAL_DAYS;
  const greeting = name ? `Halo, ${name}!` : 'Halo, kamu!';

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start lg:gap-6">
      <div className="flex flex-col gap-6">
        <Reveal index={0}>
          <header className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold capitalize text-muted">{formatToday(new Date())}</p>
              <h1 className="truncate text-3xl font-extrabold text-ink">{greeting}</h1>
            </div>
            <span
              aria-hidden="true"
              className="grid size-12 shrink-0 place-items-center rounded-full bg-banner text-lg font-extrabold text-ink shadow-card"
            >
              {initial}
            </span>
          </header>
        </Reveal>

        <Reveal index={1}>
          <section className="relative overflow-hidden rounded-card bg-banner p-6 text-ink shadow-card">
            <Blob className="-right-10 -top-10 size-40 bg-white/40" />
            <Blob className="-bottom-12 right-12 size-24 bg-white/25" />
            <StackIllustration className="pointer-events-none absolute -right-2 top-3 w-32 sm:w-40" />
            <div className="relative pr-24 sm:pr-32">
              <p className="text-sm font-semibold opacity-90">Tantangan hari ini</p>
              <h2 className="mt-1 text-2xl font-extrabold">{next ? `Hari ke-${next}` : 'Semua 90 hari selesai!'}</h2>
              <p className="mt-2 text-sm opacity-90">
                {next
                  ? nextTitle ?? 'Selesaikan sesi hari ini sebelum 09.00 untuk menjaga ritme belajarmu.'
                  : 'Kamu sudah menyelesaikan seluruh kurikulum. Ulangi bagian yang masih lemah lewat Buku Kesalahan.'}
              </p>
            </div>
            {next && nextStatus === 'available' && (
              <Link
                to={`/hari/${next}`}
                className="relative mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-surface px-5 font-semibold whitespace-nowrap text-primary-700 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface"
              >
                <Play size={18} aria-hidden="true" />
                Mulai Sesi Hari Ini
              </Link>
            )}
            {next && nextStatus === 'repair' && (
              <div className="relative mt-5 flex flex-col gap-3">
                <p className="text-sm font-semibold opacity-90">
                  Skor inti terbaik belum {MASTERY_THRESHOLD}%. Ulangi sesi ini untuk membuka hari berikutnya.
                </p>
                <Link
                  to={`/hari/${next}`}
                  className="inline-flex min-h-11 w-fit items-center gap-2 whitespace-nowrap rounded-full bg-surface px-5 font-semibold text-primary-700 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface"
                >
                  <Play size={18} aria-hidden="true" />
                  Ulangi Hari ke-{next}
                </Link>
              </div>
            )}
            {next && nextStatus === 'nocontent' && (
              <p className="relative mt-4 text-sm font-semibold">Konten Hari ke-{next} belum tersedia. Kembali lagi nanti.</p>
            )}
          </section>
        </Reveal>

        <Reveal index={2}>
          <section aria-label="Ringkasan" className="grid grid-cols-3 gap-3">
            <MiniStat icon={Trophy} tint="bg-tint-sun" label="Hari lulus">
              <CountUp value={data.mastered.size} />
            </MiniStat>
            <MiniStat icon={Flame} tint="bg-tint-peach" label="berturut-turut">
              <motion.span
                className="inline-block"
                animate={streak > 0 ? { scale: [1, 1.08, 1] } : undefined}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <CountUp value={streak} />
              </motion.span>
            </MiniStat>
            <MiniStat icon={Layers} tint="bg-tint-sky" label="poin inti">
              <CountUp value={points} />
            </MiniStat>
          </section>
        </Reveal>

        <Reveal index={3}>
          <Card className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-ink">Kalender</h2>
            <MonthCalendar sessionDates={data.completedDates} today={today} />
          </Card>
        </Reveal>

        <Reveal index={4}>
          <section aria-labelledby="plan-title" className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 id="plan-title" className="text-lg font-bold text-ink">
                Rencana hari ini
              </h2>
              <Badge tone="lavender">120 menit</Badge>
            </div>
            <ol className="grid grid-cols-2 gap-3">
              {BLOCK_PLAN.map((block, index) => (
                <li key={block.label}>
                  <Card interactive tone={PLAN_TONES[index]} className="flex h-full flex-col gap-3">
                    <span className="grid size-8 place-items-center rounded-full bg-surface text-sm font-bold text-ink">
                      {index + 1}
                    </span>
                    <span className="text-sm font-bold leading-snug text-ink">{block.label}</span>
                    <span className="mt-auto flex items-center gap-1 text-xs font-semibold text-ink/80">
                      <Clock size={14} aria-hidden="true" />
                      {block.minutes} menit
                    </span>
                  </Card>
                </li>
              ))}
            </ol>
          </section>
        </Reveal>

        <Reveal index={5}>
          <Card className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold text-ink">Skor inti 7 hari terakhir</h2>
              <p className="text-sm text-muted">Dari percobaan pertama setiap hari.</p>
            </div>
            {recent.length === 0 ? (
              <p className="text-sm text-muted">Grafik muncul setelah hari pertama dikirim.</p>
            ) : (
              <BarChart items={recent} label="Grafik skor inti 7 hari terakhir" />
            )}
          </Card>
        </Reveal>

        <Reveal index={6}>
          <Card className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-ink">Rata-rata per skill</h2>
            <p className="text-sm text-muted">Dari percobaan pertama setiap hari yang sudah selesai.</p>
            <ul className="flex flex-col gap-4">
              {parts.map((item) => (
                <li key={item.part} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-sm font-semibold text-ink">
                    <span>{PART_LABELS[item.part]}</span>
                    <span className="tabular-nums">{item.total === 0 ? '-' : `${item.percent}%`}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-track" aria-hidden="true">
                    <motion.div
                      className="h-full origin-left rounded-full bg-primary-500"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: item.percent / 100 }}
                      transition={{ duration: 0.6, ease: easeOut }}
                      style={{ width: '100%' }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </Reveal>

        <Reveal index={7}>
          <Link to="/kesalahan" className="block rounded-card outline-none focus-visible:outline-2 focus-visible:outline-primary-500">
            <Card tone="deep" interactive className="flex items-center gap-4">
              <BookX size={28} aria-hidden="true" className="shrink-0" />
              <span className="flex-1">
                <span className="block font-bold">Buku Kesalahan</span>
                <span className="block text-sm opacity-90">
                  {dueEntries.length === 0
                    ? 'Tidak ada soal yang jatuh tempo hari ini.'
                    : `${dueEntries.length} soal jatuh tempo hari ini.`}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-surface text-ink"
              >
                <ArrowRight size={20} />
              </span>
            </Card>
          </Link>
        </Reveal>
      </div>

      <aside className="flex flex-col gap-6">
        <Reveal index={2}>
          <Card className="flex flex-col items-center gap-4 text-center">
            <ProgressRing value={completedRatio} size={132} stroke={12}>
              <span className="flex flex-col items-center">
                <span className="text-2xl font-extrabold text-ink">
                  <CountUp value={data.mastered.size} />
                </span>
                <span className="text-xs font-semibold text-muted">dari {TOTAL_DAYS} hari</span>
              </span>
            </ProgressRing>
            <div>
              <h2 className="text-lg font-bold text-ink">Progres 90 hari</h2>
              <p className="text-sm text-muted">
                {data.mastered.size === 0
                  ? 'Mulai dari hari pertama. Setiap hari yang lulus menambah satu langkah.'
                  : `${data.mastered.size} hari lulus. Terus lanjutkan!`}
              </p>
            </div>
          </Card>
        </Reveal>

        <Reveal index={3}>
          <Card tone="lavender" className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <CalendarCheck size={20} aria-hidden="true" className="text-primary-700" />
              <h2 className="text-lg font-bold text-ink">Jatuh tempo</h2>
            </div>
            {dueEntries.length === 0 ? (
              <p className="text-sm text-ink/80">Tidak ada soal yang perlu diulang hari ini.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {dueEntries.slice(0, 3).map((entry) => (
                  <li key={entry.key} className="flex items-center justify-between gap-2 rounded-2xl bg-surface px-3 py-2">
                    <span className="text-sm font-semibold text-ink">
                      Hari {entry.day} · {entry.questionId}
                    </span>
                    <Badge tone="hard">Jatuh tempo</Badge>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/latihan" className="font-semibold text-primary-700 underline underline-offset-4">
              Mulai latihan perbaikan
            </Link>
          </Card>
        </Reveal>
      </aside>
    </div>
  );
}
