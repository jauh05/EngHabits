import { motion } from 'motion/react';
import { BookX, Clock, Flame, Layers, Play } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { CountUp } from '../components/ui/CountUp';
import { ProgressRing } from '../components/ui/ProgressRing';
import { addDays, computeStreak, localISO } from '../lib/dates';
import { loadDay } from '../lib/content';
import { currentDay, dayStatus, MASTERY_THRESHOLD, TOTAL_DAYS } from '../lib/progression';
import { isDue } from '../lib/srs';
import { useProgressData } from '../lib/useProgressData';
import { easeOut } from '../lib/motion';
import type { Part } from '../lib/grading';

const BLOCK_PLAN = [
  { label: 'Kosakata & pelafalan', minutes: 25 },
  { label: 'Materi & video', minutes: 35 },
  { label: 'Membaca atau mendengarkan', minutes: 30 },
  { label: 'Soal & Hard Challenge', minutes: 30 },
];

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

function formatToday(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
}

export function DashboardPage() {
  const data = useProgressData();
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

  const streak = computeStreak(data.completedDates, today);
  const points = data.progress.reduce((sum, item) => sum + item.firstCorrect, 0);
  const dueCount = data.mistakes.filter((entry) => isDue(entry, today)).length;

  const parts = (Object.keys(PART_LABELS) as Part[]).map((part) => {
    const correct = data.progress.reduce((sum, item) => sum + item.firstParts[part].correct, 0);
    const total = data.progress.reduce((sum, item) => sum + item.firstParts[part].total, 0);
    return { part, percent: total === 0 ? 0 : Math.round((correct / total) * 100), total };
  });

  const days = Array.from({ length: 7 }, (_, index) => addDays(today, index - 6));
  const completedRatio = data.mastered.size / TOTAL_DAYS;

  return (
    <div className="flex flex-col gap-6">
      <Reveal index={0}>
        <header>
          <p className="text-sm font-semibold capitalize text-muted">{formatToday(new Date())}</p>
          <h1 className="text-3xl font-extrabold text-ink">Halo, kamu!</h1>
        </header>
      </Reveal>

      <Reveal index={1}>
        <section className="relative overflow-hidden rounded-card bg-btn-bg p-6 text-btn-fg shadow-card">
          <span aria-hidden="true" className="absolute -right-10 -top-10 size-40 rounded-full bg-primary-300/40" />
          <span aria-hidden="true" className="absolute -bottom-12 right-12 size-24 rounded-full bg-primary-100/30" />
          <p className="relative text-sm font-semibold opacity-90">Tantangan hari ini</p>
          <h2 className="relative mt-1 text-2xl font-extrabold">
            {next ? `Hari ke-${next}` : 'Semua 90 hari selesai!'}
          </h2>
          <p className="relative mt-2 text-sm opacity-90">
            {next
              ? nextTitle ?? 'Selesaikan sesi hari ini sebelum 09.00 untuk menjaga ritme belajarmu.'
              : 'Kamu sudah menyelesaikan seluruh kurikulum. Ulangi bagian yang masih lemah lewat Buku Kesalahan.'}
          </p>
          {next && nextStatus === 'available' && (
            <Link
              to={`/hari/${next}`}
              className="relative mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-surface px-5 font-semibold text-primary-700 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface"
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
                className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-surface px-5 font-semibold text-primary-700 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface"
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
        <section aria-label="Minggu ini" className="grid grid-cols-7 gap-2">
          {days.map((iso) => {
            const done = data.completedDates.has(iso);
            const date = new Date(`${iso}T00:00:00`);
            return (
              <div
                key={iso}
                className={`flex flex-col items-center gap-1 rounded-2xl border py-2 text-center ${
                  iso === today ? 'border-btn-bg bg-btn-bg text-btn-fg' : 'border-line bg-surface text-ink'
                }`}
              >
                <span className="text-[11px] font-semibold capitalize opacity-80">
                  {new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(date).slice(0, 3)}
                </span>
                <span className="text-sm font-bold">{date.getDate()}</span>
                <span
                  aria-label={done ? 'Ada sesi selesai' : 'Belum ada sesi'}
                  className={`size-1.5 rounded-full ${done ? 'bg-success' : 'bg-transparent'}`}
                />
              </div>
            );
          })}
        </section>
      </Reveal>

      <Reveal index={3}>
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">Rencana hari ini</h2>
            <Badge tone="lavender">120 menit</Badge>
          </div>
          <ol className="mt-4 flex flex-col gap-3">
            {BLOCK_PLAN.map((block, index) => (
              <li key={block.label} className="flex items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                  {index + 1}
                </span>
                <span className="flex-1 text-sm font-semibold text-ink">{block.label}</span>
                <span className="flex items-center gap-1 text-sm text-muted">
                  <Clock size={14} aria-hidden="true" />
                  {block.minutes} menit
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </Reveal>

      <Reveal index={4}>
        <div className="grid grid-cols-2 gap-4">
          <Card className="flex flex-col gap-2">
            <Flame
              size={28}
              aria-hidden="true"
              className={`fill-streak text-primary-700 ${streak > 0 ? 'animate-pulse' : ''}`}
            />
            <p className="text-3xl font-extrabold text-ink">
              <CountUp value={streak} />
            </p>
            <p className="text-sm text-muted">hari berturut-turut</p>
          </Card>
          <Card className="flex flex-col gap-2">
            <Layers size={28} aria-hidden="true" className="text-primary-500" />
            <p className="text-3xl font-extrabold text-ink">
              <CountUp value={points} />
            </p>
            <p className="text-sm text-muted">poin inti terkumpul</p>
          </Card>
        </div>
      </Reveal>

      <Reveal index={5}>
        <Card className="flex items-center gap-5">
          <ProgressRing value={completedRatio} size={112} stroke={11}>
            <span className="text-xl font-extrabold text-ink">
              <CountUp value={data.mastered.size} />
            </span>
            <span className="text-xs font-semibold text-muted">/ {TOTAL_DAYS}</span>
          </ProgressRing>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-ink">Progres 90 hari</h2>
            <p className="text-sm text-muted">
              {data.mastered.size === 0
                ? 'Mulai dari hari pertama. Setiap hari yang lulus menambah satu langkah.'
                : `${data.mastered.size} hari lulus. Terus lanjutkan!`}
            </p>
          </div>
        </Card>
      </Reveal>

      <Reveal index={6}>
        <Card>
          <h2 className="text-lg font-bold text-ink">Rata-rata per skill</h2>
          <p className="text-sm text-muted">Dari percobaan pertama setiap hari yang sudah selesai.</p>
          <ul className="mt-4 flex flex-col gap-4">
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
        <Link
          to="/kesalahan"
          className="flex min-h-11 items-center gap-3 rounded-card border border-line bg-surface p-5 shadow-card outline-none focus-visible:outline-2 focus-visible:outline-primary-500"
        >
          <BookX size={24} aria-hidden="true" className="text-primary-700" />
          <span className="flex-1">
            <span className="block font-bold text-ink">Buku Kesalahan</span>
            <span className="block text-sm text-muted">
              {dueCount === 0 ? 'Tidak ada soal yang jatuh tempo hari ini.' : `${dueCount} soal jatuh tempo hari ini.`}
            </span>
          </span>
        </Link>
      </Reveal>

    </div>
  );
}
