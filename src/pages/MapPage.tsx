import { motion } from 'motion/react';
import { Check, Gift, Lock, PackageOpen, RotateCcw, Star } from 'lucide-react';
import { useNavigate } from 'react-router';
import { WEEK_RANGES, monthOfWeek } from '../../content/schema';
import { ProgressRing } from '../components/ui/ProgressRing';
import { useToast } from '../components/ui/Toast';
import { useSettings } from '../lib/settings';
import { contentDays } from '../lib/content';
import { dayStatus, type DayStatus, MASTERY_THRESHOLD } from '../lib/progression';
import { useProgressData, type ProgressData } from '../lib/useProgressData';
import { easeOut } from '../lib/motion';

/** Kotak hari di kisi minggu. */
const GRID_STATUS: Record<DayStatus, string> = {
  completed: 'bg-success text-on-accent border-transparent',
  available: 'bg-banner text-ink border-transparent shadow-card',
  repair: 'bg-tint-peach text-ink border-transparent',
  locked: 'bg-surface text-muted border-transparent',
  nocontent: 'bg-surface text-muted border-dashed border-line',
};

/** Warna kartu minggu di kisi, bergilir. */
const WEEK_BG = ['bg-tint-sun', 'bg-tint-sky', 'bg-tint-rose', 'bg-tint-mint'];

/** Posisi horizontal node dalam persen, berselang kiri dan kanan seperti jalur di gambar 1. */
const X_PATTERN = [50, 30, 18, 30, 50, 70, 82, 70];
const NODE_GAP = 104;
const HEADER_HEIGHT = 88;
const NODE_SIZE = 64;

type RoadItem =
  | { kind: 'header'; key: string; y: number; week: number; from: number; to: number; mastered: number; total: number }
  | { kind: 'node'; key: string; y: number; x: number; day: number; status: DayStatus; stars: number }
  | { kind: 'chest'; key: string; y: number; x: number; week: number; open: boolean };

/** Bintang dari skor inti terbaik: 60% berarti satu bintang, 75% dua, 90% tiga. */
function starsFor(best: number | undefined, status: DayStatus): number {
  if (status !== 'completed' || best === undefined) return 0;
  if (best >= 90) return 3;
  if (best >= 75) return 2;
  return 1;
}

/** Susun roadmap: header tiap minggu, node tiap hari, dan peti di akhir minggu. */
function buildRoadmap(data: ProgressData, content: Set<number>): { items: RoadItem[]; height: number } {
  const items: RoadItem[] = [];
  let y = 0;
  let nodeIndex = 0;
  for (const [week, from, to] of WEEK_RANGES) {
    let mastered = 0;
    for (let day = from; day <= to; day += 1) if (data.mastered.has(day)) mastered += 1;
    items.push({ kind: 'header', key: `h-${week}`, y, week, from, to, mastered, total: to - from + 1 });
    y += HEADER_HEIGHT;

    for (let day = from; day <= to; day += 1) {
      const x = X_PATTERN[nodeIndex % X_PATTERN.length];
      nodeIndex += 1;
      const status = dayStatus(day, data.completed, content, data.mastered);
      const best = data.progress.find((row) => row.day === day)?.bestCorePercent;
      items.push({
        kind: 'node',
        key: `d-${day}`,
        y: y + NODE_GAP / 2,
        x,
        day,
        status,
        stars: starsFor(best, status),
      });
      y += NODE_GAP;
    }

    items.push({
      kind: 'chest',
      key: `c-${week}`,
      y: y + NODE_GAP / 2,
      x: 50,
      week,
      open: mastered === to - from + 1,
    });
    y += NODE_GAP;
  }
  return { items, height: y + 24 };
}

function Stars({ count }: { count: number }) {
  return (
    <span className="flex gap-0.5" aria-hidden="true">
      {[1, 2, 3].map((star) => (
        <Star key={star} size={12} className={star <= count ? 'fill-streak text-streak' : 'text-muted/40'} />
      ))}
    </span>
  );
}

/** Mode roadmap: jalur melengkung dengan node hari, seperti gambar 1. */
function Roadmap({ data, content }: { data: ProgressData; content: Set<number> }) {
  const navigate = useNavigate();
  const { show } = useToast();
  const { items, height } = buildRoadmap(data, content);
  const nodes = items.filter((item) => item.kind === 'node' || item.kind === 'chest') as Array<
    Extract<RoadItem, { kind: 'node' | 'chest' }>
  >;
  const nextIndex = nodes.findIndex((item) => item.kind === 'node' && item.status !== 'completed');
  const completedUpTo = nextIndex === -1 ? nodes.length : nextIndex;

  // Jalur: lingkung setiap node dengan kurva vertikal. Koordinat x dalam persen, y dalam piksel.
  const pathFor = (points: Array<{ x: number; y: number }>): string =>
    points
      .map((point, index) => {
        if (index === 0) return `M ${point.x} ${point.y}`;
        const prev = points[index - 1];
        const mid = (prev.y + point.y) / 2;
        return `C ${prev.x} ${mid}, ${point.x} ${mid}, ${point.x} ${point.y}`;
      })
      .join(' ');
  const points = nodes.map((node) => ({ x: node.x, y: node.y }));
  const fullPath = pathFor(points);
  const donePath = pathFor(points.slice(0, Math.max(1, completedUpTo + 1)));

  const openNode = (item: Extract<RoadItem, { kind: 'node' }>) => {
    if (item.status === 'available' || item.status === 'completed' || item.status === 'repair') {
      navigate(`/hari/${item.day}`);
    } else if (item.status === 'locked') {
      show(`Capai skor inti ${MASTERY_THRESHOLD}% di Hari ke-${item.day - 1} dulu.`);
    } else {
      show(`Konten Hari ke-${item.day} belum tersedia.`);
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-sm" style={{ height }}>
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d={fullPath}
          fill="none"
          vectorEffect="non-scaling-stroke"
          className="stroke-primary-300"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray="2 14"
        />
        <motion.path
          d={donePath}
          fill="none"
          vectorEffect="non-scaling-stroke"
          className="stroke-success"
          strokeWidth={10}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, ease: easeOut }}
        />
      </svg>

      {items.map((item) => {
        if (item.kind === 'header') {
          return (
            <div
              key={item.key}
              className="absolute inset-x-0 flex flex-col items-center gap-1 text-center"
              style={{ top: item.y, height: HEADER_HEIGHT - 12 }}
            >
              <span className="rounded-full bg-surface px-4 py-1.5 text-xs font-bold text-primary-700 shadow-card">
                Minggu {item.week} · Bulan {monthOfWeek(item.week)}
              </span>
              <span className="text-xs font-semibold text-muted">
                {item.mastered}/{item.total} hari lulus · hari {item.from}-{item.to}
              </span>
            </div>
          );
        }

        if (item.kind === 'chest') {
          const Icon = item.open ? PackageOpen : Gift;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() =>
                show(item.open ? `Minggu ${item.week} selesai. Peti terbuka.` : `Lulus semua hari minggu ${item.week} untuk membuka peti.`)
              }
              aria-label={`Peti minggu ${item.week}${item.open ? ', terbuka' : ', terkunci'}`}
              className={`absolute grid -translate-x-1/2 place-items-center rounded-2xl border-b-4 shadow-card outline-none focus-visible:outline-2 focus-visible:outline-primary-500 ${
                item.open ? 'border-streak bg-tint-sun text-ink' : 'border-line bg-surface text-muted'
              }`}
              style={{ left: `${item.x}%`, top: item.y - 26, width: 52, height: 52 }}
            >
              <Icon size={22} aria-hidden="true" />
            </button>
          );
        }

        const isNext = nodes.indexOf(item) === nextIndex;
        // Posisi sudah diatur oleh pembungkusnya. Tombol hanya perlu ukuran.
        const style = { width: NODE_SIZE, height: NODE_SIZE };
        const tone =
          item.status === 'completed'
            ? 'bg-success text-on-accent border-success'
            : item.status === 'available' || item.status === 'repair'
              ? item.status === 'repair'
                ? 'bg-tint-peach text-ink border-streak'
                : 'bg-banner text-ink border-primary-500'
              : item.status === 'locked'
                ? 'bg-surface text-muted border-line'
                : 'bg-surface text-muted border-dashed border-line';

        return (
          <div
            key={item.key}
            className="absolute -translate-x-1/2"
            style={{ left: `${item.x}%`, top: item.y - NODE_SIZE / 2, width: NODE_SIZE, height: NODE_SIZE }}
          >
            {isNext && (
              <motion.span
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-primary-500/30"
                animate={{ scale: [1, 1.35], opacity: [0.6, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
              />
            )}
            <button
              type="button"
              onClick={() => openNode(item)}
              aria-label={`Hari ${item.day}, ${
                item.status === 'completed' ? 'lulus' : item.status === 'repair' ? 'perlu perbaikan' : item.status === 'locked' ? 'terkunci' : item.status === 'available' ? 'tersedia' : 'belum tersedia'
              }`}
              className={`relative grid place-items-center rounded-full border-b-4 text-lg font-extrabold shadow-card outline-none transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-primary-500 ${tone}`}
              style={style}
            >
              {item.status === 'completed' ? (
                <Check size={26} strokeWidth={3} aria-hidden="true" />
              ) : item.status === 'repair' ? (
                <RotateCcw size={22} aria-hidden="true" />
              ) : item.status === 'locked' ? (
                <Lock size={20} aria-hidden="true" />
              ) : (
                <span className="tabular-nums">{item.day}</span>
              )}
            </button>
            {item.status === 'completed' && (
              <span className="absolute left-1/2 mt-1 -translate-x-1/2 whitespace-nowrap" style={{ top: NODE_SIZE }}>
                <Stars count={item.stars} />
              </span>
            )}
            {isNext && (
              <span
                className="absolute bottom-full left-1/2 mb-3 -translate-x-1/2 whitespace-nowrap rounded-2xl bg-surface px-4 py-2 text-sm font-extrabold text-primary-700 shadow-card"
                aria-hidden="true"
              >
                {item.status === 'repair' ? 'Ulangi' : 'Mulai'}
                <span className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 bg-surface" />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Mode kisi: kartu per minggu dengan kotak hari, seperti versi sebelumnya. */
function Grid({ data, content }: { data: ProgressData; content: Set<number> }) {
  const navigate = useNavigate();
  const { show } = useToast();
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
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {WEEK_RANGES.map(([week, from, to], weekIndex) => (
        <section
          key={week}
          aria-labelledby={`week-${week}`}
          className={`flex flex-col gap-3 rounded-card p-5 shadow-card ${WEEK_BG[weekIndex % WEEK_BG.length]}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <h2 id={`week-${week}`} className="text-lg font-bold text-ink">
                Minggu {week}
              </h2>
              <span className="text-sm text-ink/80">
                Bulan {monthOfWeek(week)} · Hari {from}-{to}
              </span>
            </div>
            <span className="rounded-full bg-surface p-1 shadow-card">
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
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {Array.from({ length: to - from + 1 }, (_, index) => from + index).map((day) => {
              const status = dayStatus(day, data.completed, content, data.mastered);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handlePick(day, status)}
                  aria-label={`Hari ${day}, ${status === 'completed' ? 'lulus' : status === 'repair' ? 'perlu perbaikan' : status === 'locked' ? 'terkunci' : status === 'available' ? 'tersedia' : 'belum tersedia'}`}
                  className={`flex min-h-11 items-center justify-center rounded-2xl border text-sm font-bold outline-none focus-visible:outline-2 focus-visible:outline-primary-500 ${GRID_STATUS[status]}`}
                >
                  {status === 'completed' ? (
                    <Check size={18} strokeWidth={2.5} aria-hidden="true" />
                  ) : status === 'locked' ? (
                    <Lock size={16} aria-hidden="true" />
                  ) : (
                    <span>{day}</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export function MapPage() {
  const data = useProgressData();
  const { settings, update } = useSettings();
  const content = new Set(contentDays());
  const view = settings.mapView;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-extrabold text-ink lg:text-4xl">Peta 90 hari</h1>
            <p className="max-w-xl text-muted">
              Hari berikutnya terbuka setelah skor inti hari ini minimal {MASTERY_THRESHOLD}%. Hari yang belum lulus bisa diulang.
            </p>
          </div>
          <div role="group" aria-label="Tampilan peta" className="flex rounded-full bg-primary-100 p-1">
            {(
              [
                { value: 'roadmap', label: 'Roadmap' },
                { value: 'grid', label: 'Kisi' },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={view === option.value}
                onClick={() => update({ mapView: option.value })}
                className={`min-h-10 rounded-full px-4 text-sm font-semibold outline-none focus-visible:outline-2 focus-visible:outline-primary-500 ${
                  view === option.value ? 'bg-surface text-primary-700 shadow-card' : 'text-primary-700/70'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {view === 'roadmap' ? <Roadmap data={data} content={content} /> : <Grid data={data} content={content} />}
    </div>
  );
}
