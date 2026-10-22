import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ChevronRight, ChevronLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import type { Day } from '../../content/schema';
import { DrillBlock } from '../components/session/DrillBlock';
import { EvaluationView } from '../components/session/EvaluationView';
import { LessonBlock } from '../components/session/LessonBlock';
import { PracticeBlock } from '../components/session/PracticeBlock';
import { VocabBlock } from '../components/session/VocabBlock';
import { answeredCount } from '../components/session/QuestionList';
import { BlockTimer } from '../components/session/BlockTimer';
import { Blob } from '../components/ui/Blob';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Stepper } from '../components/ui/Stepper';
import { useToast } from '../components/ui/Toast';
import { loadDay, toDayView, type DayView, contentDays } from '../lib/content';
import { localISO } from '../lib/dates';
import { recordAttempt, type Attempt, type DayProgress } from '../lib/db';
import { gradeDay, type Answers, type DayResult } from '../lib/grading';
import { dayStatus, isMastered, MASTERY_THRESHOLD } from '../lib/progression';
import { easeOut } from '../lib/motion';
import { useProgressData } from '../lib/useProgressData';

const BLOCKS = [
  { id: 'vocab', label: 'Kosakata' },
  { id: 'lesson', label: 'Materi' },
  { id: 'practice', label: 'Latihan' },
  { id: 'drill', label: 'Soal' },
];

const BLOCK_MINUTES = [25, 35, 30, 30];

type Evaluation = {
  day: Day;
  result: DayResult;
  attempt: Attempt;
  progress: DayProgress;
  isFirst: boolean;
};

export function DayPage() {
  const { n } = useParams();
  const day = Number(n);
  // Komponen dikunci per hari, jadi state sesi selalu bersih saat pindah hari.
  return <DaySession key={day} day={day} />;
}

function DaySession({ day }: { day: number }) {
  const data = useProgressData();
  const { show } = useToast();
  const [view, setView] = useState<DayView>();
  const [missing, setMissing] = useState(false);
  const [block, setBlock] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [evaluation, setEvaluation] = useState<Evaluation>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    loadDay(day).then((loaded) => {
      if (!active) return;
      if (loaded) setView(toDayView(loaded));
      else setMissing(true);
    });
    return () => {
      active = false;
    };
  }, [day]);

  if (!data.loaded || (!view && !missing)) {
    return <p className="py-16 text-center text-muted">Memuat sesi...</p>;
  }

  const status = dayStatus(day, data.completed, data.content, data.mastered);
  const contentReady = contentDays().includes(day);
  const previousDone = day === 1 || data.mastered.has(day - 1);

  if (!contentReady || missing || !view) {
    return (
      <Message title={`Hari ke-${day} belum tersedia`} body="Konten hari ini belum dibuat. Kembali lagi nanti." />
    );
  }

  if (!previousDone && status === 'locked') {
    return (
      <Message
        title="Hari ini masih terkunci"
        body={`Capai skor inti minimal ${MASTERY_THRESHOLD}% di Hari ke-${day - 1} dulu. Setelah itu hari ini terbuka.`}
      />
    );
  }

  const partAIds = view.block4.partA.map((question) => question.id);
  const partBIds = view.block4.partB.map((task) => task.id);
  const hardIds = view.block4.hardChallenge.map((question) => question.id);
  const block3Ids = view.block3.questions.map((question) => question.id);
  const allIds = [...block3Ids, ...partAIds, ...partBIds, ...hardIds];
  const unanswered = allIds.length - answeredCount(allIds, answers);

  const doSubmit = async () => {
    setSubmitting(true);
    setConfirmOpen(false);
    try {
      const full = await loadDay(day);
      if (!full) throw new Error('missing');
      const result = gradeDay(full, answers);
      const saved = await recordAttempt(day, answers, result, localISO());
      setEvaluation({ day: full, result, attempt: saved.attempt, progress: saved.progress, isFirst: saved.isFirst });
      await data.refresh();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      show('Jawaban gagal disimpan. Coba kirim lagi.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (unanswered > 0) setConfirmOpen(true);
    else void doSubmit();
  };

  if (evaluation) {
    const nextDay = day + 1;
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-4 pb-10 pt-5 sm:max-w-2xl lg:max-w-4xl">
        <EvaluationView
          day={evaluation.day}
          result={evaluation.result}
          attempt={evaluation.attempt}
          progress={evaluation.progress}
          isFirst={evaluation.isFirst}
          passed={isMastered(evaluation.progress.bestCorePercent)}
          nextDay={contentDays().includes(nextDay) ? nextDay : undefined}
          onRetake={() => {
            setEvaluation(undefined);
            setAnswers({});
            setBlock(0);
          }}
        />
      </div>
    );
  }

  const completedBefore = data.completed.has(day);
  const previousScore = data.progress.find((item) => item.day === day);
  const setAnswer = (id: string, value: string) => setAnswers((current) => ({ ...current, [id]: value }));

  const content = [
    <VocabBlock key="vocab" block={view.block1} />,
    <LessonBlock key="lesson" day={day} block={view.block2} />,
    <PracticeBlock
      key="practice"
      block={view.block3}
      answers={answers}
      onAnswer={(id, optionId) => setAnswer(id, optionId)}
    />,
    <DrillBlock
      key="drill"
      block={view.block4}
      answers={answers}
      onAnswer={setAnswer}
      onSubmit={handleSubmit}
      submitting={submitting}
    />,
  ][block];

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-4 pb-10 pt-5 sm:max-w-2xl lg:max-w-4xl">
      {/* Kartu sesi: pola gambar 3 dan 5. Latar lilac dengan bola peach, bar soal terjawab, dan langkah berwarna. */}
      <header className="relative flex flex-col gap-4 overflow-clip rounded-card bg-tint-lilac p-5 shadow-card">
        <Blob className="-right-12 -top-12 size-44 bg-tint-peach/80" />
        <Blob className="-bottom-12 -left-10 size-36 bg-tint-sky/80" />
        <div className="relative flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-1 rounded-full bg-surface px-4 text-sm font-bold text-ink shadow-card outline-none focus-visible:outline-2 focus-visible:outline-primary-500"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Beranda
          </Link>
          <span className="rounded-full bg-surface px-3 py-1.5 text-xs font-bold text-ink shadow-card">
            {view.skillFocus === 'reading' ? 'Membaca' : 'Mendengarkan'}
          </span>
        </div>
        <div className="relative">
          <p className="text-sm font-bold text-primary-700">
            Hari {day} · Minggu {view.week}
          </p>
          <h1 className="text-2xl font-extrabold leading-tight text-ink sm:text-3xl">{view.title}</h1>
        </div>
        <div className="relative flex flex-col gap-2">
          <div className="flex justify-between text-sm font-bold text-ink">
            <span>Soal terjawab</span>
            <span className="tabular-nums">
              {allIds.length - unanswered}/{allIds.length}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-surface" role="progressbar" aria-label="Soal terjawab" aria-valuemin={0} aria-valuemax={allIds.length} aria-valuenow={allIds.length - unanswered}>
            <motion.div
              className="h-full origin-left rounded-full bg-primary-500"
              initial={false}
              animate={{ scaleX: allIds.length === 0 ? 0 : (allIds.length - unanswered) / allIds.length }}
              transition={{ duration: 0.4, ease: easeOut }}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div className="relative">
          <Stepper steps={BLOCKS} current={block} onSelect={setBlock} label="Blok sesi harian" />
        </div>
      </header>

      {completedBefore && previousScore && (
        <Card tone="lavender" className="flex items-center gap-3 text-sm text-ink">
          {isMastered(previousScore.bestCorePercent)
            ? `Hari ini sudah lulus dengan skor inti terbaik ${previousScore.bestCorePercent}%. Mengulang tidak mengubah skor pertama, yaitu ${previousScore.firstCorePercent}%.`
            : `Skor pertama hari ini ${previousScore.firstCorePercent}%, terbaik ${previousScore.bestCorePercent}%. Capai ${MASTERY_THRESHOLD}% untuk membuka hari berikutnya.`}
        </Card>
      )}

      <BlockTimer key={block} minutes={BLOCK_MINUTES[block]} />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={block}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.3, ease: easeOut }}
        >
          {content}
        </motion.div>
      </AnimatePresence>

      {block < BLOCKS.length - 1 && (
        <div className="flex items-center justify-between gap-3">
          <Button variant="secondary" disabled={block === 0} onClick={() => setBlock((value) => value - 1)}>
            <ChevronLeft size={18} aria-hidden="true" />
            Sebelumnya
          </Button>
          <Button onClick={() => setBlock((value) => value + 1)}>
            Berikutnya
            <ChevronRight size={18} aria-hidden="true" />
          </Button>
        </div>
      )}

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Kirim sekarang?">
        <p className="mb-5 text-muted">
          Masih ada {unanswered} soal yang belum dijawab. Soal kosong dihitung salah. Kamu tetap bisa membaca penjelasannya.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
            Kembali mengerjakan
          </Button>
          <Button onClick={() => void doSubmit()}>Kirim saja</Button>
        </div>
      </Modal>
    </div>
  );
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-extrabold text-ink">{title}</h1>
      <p className="text-muted">{body}</p>
      <Link to="/" className="inline-flex min-h-11 items-center rounded-full bg-btn-bg px-6 font-semibold text-btn-fg">
        Ke beranda
      </Link>
    </div>
  );
}
