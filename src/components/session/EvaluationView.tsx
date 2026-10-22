import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown, Copy, RotateCcw, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import type { Day, ProductionTask, Question } from '../../../content/schema';
import type { DayProgress, Attempt } from '../../lib/db';
import type { DayResult, ItemResult, Part } from '../../lib/grading';
import { easeOut } from '../../lib/motion';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Confetti } from '../ui/Confetti';
import { CountUp } from '../ui/CountUp';
import { MASTERY_THRESHOLD } from '../../lib/progression';
import { ProgressRing } from '../ui/ProgressRing';
import { useToast } from '../ui/Toast';

export type EvaluationProps = {
  day: Day;
  result: DayResult;
  attempt: Attempt;
  progress: DayProgress;
  isFirst: boolean;
  /** Skor inti terbaik sudah mencapai ambang. Hari berikutnya hanya terbuka bila true. */
  passed: boolean;
  nextDay?: number;
  onRetake: () => void;
};

const PART_LABELS: Record<Part, string> = {
  comprehension: 'Membaca & mendengar',
  partA: 'Tata bahasa (A)',
  partB: 'Terjemahan (B)',
  hard: 'Hard Challenge (bonus)',
};

function findQuestion(day: Day, id: string): Question | undefined {
  return [...day.block3.questions, ...day.block4.partA, ...day.block4.hardChallenge].find((item) => item.id === id);
}

function findTask(day: Day, id: string): ProductionTask | undefined {
  return day.block4.partB.find((item) => item.id === id);
}

function optionLabel(question: Question, optionId: string): string {
  const option = question.options?.find((item) => item.id === optionId);
  return option ? `${option.id}. ${option.text}` : optionId;
}

function buildExplainPrompt(day: number, item: ItemResult, question?: Question, task?: ProductionTask): string {
  if (question) {
    return [
      `Tolong jelaskan soal bahasa Inggris ini dengan sederhana, dalam Bahasa Indonesia yang santai.`,
      `Hari ${day}, soal ${question.id} (${question.difficulty}).`,
      `Soal: ${question.prompt}`,
      `Opsi: ${(question.options ?? []).map((option) => `${option.id}. ${option.text}`).join(' | ')}`,
      `Jawaban saya: ${item.given ? optionLabel(question, item.given) : 'tidak dijawab'}`,
      `Jawaban benar: ${optionLabel(question, question.correct)}`,
      `Penjelasan dari aplikasi: ${question.explanationId}`,
      `Saya masih bingung. Jelaskan langkah berpikirnya dan beri dua contoh kalimat lain.`,
    ].join('\n');
  }
  if (task) {
    return [
      `Tolong koreksi terjemahan bahasa Inggris saya dan jelaskan dalam Bahasa Indonesia yang santai.`,
      `Hari ${day}, tugas ${task.id} (${task.difficulty}).`,
      `Kalimat asli: ${task.promptId}`,
      `Jawaban saya: ${item.given || 'tidak dijawab'}`,
      `Jawaban contoh: ${task.modelAnswer}`,
      `Saya masih bingung. Jelaskan perbedaannya dan beri satu contoh lain.`,
    ].join('\n');
  }
  return '';
}

function Layer({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-line">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 w-full items-center justify-between gap-2 px-4 text-left text-sm font-semibold text-ink outline-none focus-visible:outline-2 focus-visible:outline-primary-500"
      >
        {title}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25, ease: easeOut }}>
          <ChevronDown size={18} aria-hidden="true" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: easeOut }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 px-4 pb-4 text-sm text-ink">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ItemReview({
  day,
  item,
  number,
  question,
  task,
}: {
  day: number;
  item: ItemResult;
  number: number;
  question?: Question;
  task?: ProductionTask;
}) {
  const { show } = useToast();
  const prompt = question?.prompt ?? task?.promptId ?? '';
  const givenText = question ? (item.given ? optionLabel(question, item.given) : 'Tidak dijawab') : item.given || 'Tidak dijawab';

  const copy = async () => {
    const text = buildExplainPrompt(day, item, question, task);
    try {
      await navigator.clipboard.writeText(text);
      show('Prompt disalin. Tempel di Claude untuk penjelasan lanjut.', 'success');
    } catch {
      show('Browser tidak mengizinkan salin otomatis. Coba lagi.', 'error');
    }
  };

  return (
    <li>
      <Card className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-muted">
              {number}. {item.id} · {PART_LABELS[item.part]}
            </span>
            <p className="font-semibold leading-relaxed text-ink">{prompt}</p>
          </div>
          <span
            className={`grid size-8 shrink-0 place-items-center rounded-full ${
              item.correct ? 'bg-success text-on-accent' : 'bg-error text-on-accent'
            }`}
          >
            {item.correct ? <Check size={18} strokeWidth={2.5} aria-label="Benar" /> : <X size={18} strokeWidth={2.5} aria-label="Salah" />}
          </span>
        </div>

        <div className="grid gap-1 text-sm">
          <p className="text-muted">
            Jawabanmu: <span className="font-semibold text-ink">{givenText}</span>
          </p>
          {!item.correct && (
            <p className="text-muted">
              Jawaban benar: <span className="font-semibold text-ink">{question ? optionLabel(question, question.correct) : item.expected}</span>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Layer title="1 · Jawaban & alasan singkat">
            {question ? (
              <p>{question.explanationId}</p>
            ) : (
              <>
                <p>Contoh jawaban: <span className="font-semibold">{task?.modelAnswer}</span></p>
                {task?.commonErrors?.map((error) => (
                  <p key={error.pattern} className="text-muted">
                    {error.feedbackId}
                  </p>
                ))}
              </>
            )}
            {question?.evidence && <p className="text-muted">Bukti dari teks: “{question.evidence}”</p>}
          </Layer>

          {question?.stepByStep && (
            <Layer title="2 · Logika langkah demi langkah">
              <ol className="flex list-decimal flex-col gap-1 pl-5">
                {question.stepByStep.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </Layer>
          )}

          {question?.whyOthersWrong && (
            <Layer title="3 · Kenapa pilihan lain salah">
              <ul className="flex flex-col gap-2">
                {question.whyOthersWrong.map((entry) => (
                  <li key={entry.optionId}>
                    <span className="font-semibold">{optionLabel(question, entry.optionId)}</span>
                    <span className="block text-muted">{entry.reasonId}</span>
                  </li>
                ))}
              </ul>
            </Layer>
          )}

          {question && (question.ruleAndExamples || question.examTrap) && (
            <Layer title="4 · Aturan, contoh, dan jebakan ujian">
              {question.ruleAndExamples && (
                <>
                  <p className="font-semibold">{question.ruleAndExamples.rule}</p>
                  <ul className="flex flex-col gap-1">
                    {question.ruleAndExamples.examples.map((example) => (
                      <li key={example.en}>
                        <span className="block font-semibold">{example.en}</span>
                        <span className="block text-muted">{example.id}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {question.examTrap && (
                <p className="rounded-xl bg-primary-100 p-3 text-primary-700">
                  <span className="font-bold">Jebakan ujian: </span>
                  {question.examTrap}
                </p>
              )}
            </Layer>
          )}
        </div>

        <Button variant="ghost" size="md" onClick={copy} className="self-start">
          <Copy size={16} aria-hidden="true" />
          Aku masih bingung
        </Button>
      </Card>
    </li>
  );
}

export function EvaluationView({ day, result, attempt, progress, isFirst, passed, nextDay, onRetake }: EvaluationProps) {
  const [celebrate, setCelebrate] = useState(true);
  const percent = result.corePercent;
  const message =
    percent >= 80
      ? 'Kerja bagus! Pola ini mulai melekat.'
      : percent >= 70
        ? 'Sudah cukup baik. Tinjau bagian yang salah sebelum lanjut.'
        : 'Tidak apa-apa. Baca penjelasannya pelan-pelan, lalu coba lagi.';

  const wrong = result.items.filter((item) => !item.correct);
  const reviewFirst = wrong.slice(0, 3);
  const hardBadge = result.hard.total > 0 && result.hard.correct === result.hard.total;

  const parts = (Object.keys(PART_LABELS) as Part[]).map((part) => ({
    part,
    ...result.parts[part],
  }));

  let number = 0;
  const reviewItems = result.items.map((item) => {
    number += 1;
    const question = findQuestion(day, item.id);
    const task = item.kind === 'production' ? findTask(day, item.id) : undefined;
    return { item, number, question, task };
  });

  return (
    <div className="relative flex flex-col gap-6">
      {celebrate && <Confetti />}

      <header className="flex flex-col gap-1">
        <p className="text-sm font-bold text-primary-700">Hari {day.day} · Evaluasi</p>
        <h1 className="text-3xl font-extrabold text-ink">{day.title}</h1>
      </header>

      <Card className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <ProgressRing value={percent / 100} size={128} stroke={12}>
          <span className="flex flex-col items-center">
            <span className="text-3xl font-extrabold text-ink">
              <CountUp value={percent} />%
            </span>
            <span className="text-xs font-semibold text-muted">skor inti</span>
          </span>
        </ProgressRing>
        <div className="flex flex-col gap-2">
          <p className="text-lg font-bold text-ink">{message}</p>
          <p className="text-sm text-muted">
            Benar {result.core.correct} dari {result.core.total} soal inti.
            {isFirst
              ? ' Ini percobaan pertamamu, jadi skor ini yang dicatat untuk hari ini.'
              : ` Skor pertama hari ini tetap ${progress.firstCorePercent}%. Percobaan ulang tidak mengubahnya.`}
          </p>
          {!passed && (
            <p className="text-sm font-semibold text-ink">
              Skor inti terbaik belum {MASTERY_THRESHOLD}%. Ulangi hari ini untuk membuka hari berikutnya.
            </p>
          )}
          {hardBadge && <Badge tone="streak">Lencana Hard Challenge</Badge>}
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-ink">Skor per bagian</h2>
        <ul className="flex flex-col gap-3">
          {parts.map((item) => {
            const percentPart = item.total === 0 ? 0 : Math.round((item.correct / item.total) * 100);
            return (
              <li key={item.part} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-sm font-semibold text-ink">
                  <span>{PART_LABELS[item.part]}</span>
                  <span className="tabular-nums">
                    {item.correct}/{item.total}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-track" aria-hidden="true">
                  <motion.div
                    className="h-full origin-left rounded-full bg-primary-500"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: percentPart / 100 }}
                    transition={{ duration: 0.6, ease: easeOut }}
                    style={{ width: '100%' }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      {wrong.length > 0 && (
        <Card tone="lavender" className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-ink">Tinjau dulu</h2>
          <p className="text-sm text-ink">Tiga soal yang salah pertama hari ini:</p>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-ink">
            {reviewFirst.map((item) => (
              <li key={item.id}>
                {item.id} · {PART_LABELS[item.part]}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <section aria-labelledby="review-title" className="flex flex-col gap-3">
        <h2 id="review-title" className="text-lg font-bold text-ink">
          Evaluasi mendalam
        </h2>
        <p className="text-sm text-muted">
          Buka setiap lapisan penjelasan satu per satu. Soal yang salah sudah masuk Buku Kesalahan.
        </p>
        <ul className="flex flex-col gap-3">
          {reviewItems.map((row) => (
            <ItemReview
              key={row.item.id}
              day={day.day}
              item={row.item}
              number={row.number}
              question={row.question}
              task={row.task}
            />
          ))}
        </ul>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        {passed && nextDay ? (
          <Link
            to={`/hari/${nextDay}`}
            className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-full bg-btn-bg px-6 text-lg font-semibold text-btn-fg shadow-card outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          >
            Lanjut Hari ke-{nextDay}
          </Link>
        ) : (
          <p className="flex-1 text-center text-sm font-semibold text-muted">
            {!passed
              ? `Hari berikutnya terbuka setelah skor inti minimal ${MASTERY_THRESHOLD}%.`
              : 'Hari berikutnya belum tersedia.'}
          </p>
        )}
        <Button variant="secondary" size="md" onClick={onRetake}>
          <RotateCcw size={18} aria-hidden="true" />
          Ulangi hari ini
        </Button>
      </div>
      <Link to="/" className="self-center text-sm font-semibold text-primary-700 underline underline-offset-4">
        Kembali ke beranda
      </Link>

      {celebrate && (
        <Button variant="ghost" size="md" onClick={() => setCelebrate(false)} className="self-center">
          Lewati perayaan
        </Button>
      )}
      <span className="sr-only">Percobaan ke-{attempt.n}</span>
    </div>
  );
}
