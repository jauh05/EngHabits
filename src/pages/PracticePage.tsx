import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { CheckCircle2, XCircle } from 'lucide-react';
import { easeOut } from '../lib/motion';
import type { Day, Question } from '../../content/schema';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { loadDay } from '../lib/content';
import { updateMistake } from '../lib/db';
import { localISO } from '../lib/dates';
import { applyResult, isDue, type MistakeEntry } from '../lib/srs';
import { useProgressData } from '../lib/useProgressData';

type Item = { entry: MistakeEntry; question: Question };

/** Cari soal pilihan ganda berdasarkan id di dalam satu hari. Terjemahan tidak ikut di sesi ini. */
function findQuestion(day: Day, questionId: string): Question | undefined {
  return [...day.block3.questions, ...day.block4.partA, ...day.block4.hardChallenge].find(
    (item) => item.id === questionId,
  );
}

function optionText(question: Question, optionId: string): string {
  return question.options?.find((option) => option.id === optionId)?.text ?? '';
}

export function PracticePage() {
  const data = useProgressData();
  const [queue, setQueue] = useState<Item[]>();
  const [skipped, setSkipped] = useState(0);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string>();
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [saveFailed, setSaveFailed] = useState(false);

  // Antrean dikunci saat sesi dimulai, supaya soal yang baru dijawab tidak hilang dari layar.
  useEffect(() => {
    if (!data.loaded || queue) return;
    let active = true;
    const today = localISO();
    const due = data.mistakes.filter((entry) => isDue(entry, today)).sort((a, b) => a.due.localeCompare(b.due) || a.day - b.day);
    const days = [...new Set(due.map((entry) => entry.day))];
    Promise.all(days.map((day) => loadDay(day).then((loaded) => [day, loaded] as const))).then((loaded) => {
      if (!active) return;
      const byDay = new Map(loaded);
      const items: Item[] = [];
      let missing = 0;
      for (const entry of due) {
        const dayData = byDay.get(entry.day);
        const question = dayData ? findQuestion(dayData, entry.questionId) : undefined;
        if (question) {
          items.push({ entry, question });
        } else {
          missing += 1;
        }
      }
      setSkipped(missing);
      setQueue(items);
    });
    return () => {
      active = false;
    };
  }, [data.loaded, data.mistakes, queue]);

  const item = queue?.[index];
  const finished = queue !== undefined && index >= queue.length;
  const answeredRight = item !== undefined && selected === item.question.correct;

  const check = async () => {
    if (!item || !selected) return;
    const isCorrect = selected === item.question.correct;
    setChecked(true);
    if (isCorrect) setCorrectCount((count) => count + 1);
    const updated = applyResult(item.entry, item.entry.day, item.entry.questionId, isCorrect, localISO());
    if (updated) {
      try {
        await updateMistake(updated);
        setSaveFailed(false);
        await data.refresh();
      } catch {
        setSaveFailed(true);
      }
    }
  };

  const next = () => {
    setIndex((value) => value + 1);
    setSelected(undefined);
    setChecked(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-ink">Latihan perbaikan</h1>
        <p className="text-muted">Soal dari Buku Kesalahan yang sudah jatuh tempo hari ini. Setiap jawaban mengatur jadwal ulangnya.</p>
      </header>

      {queue === undefined && <p className="text-muted">Memuat soal…</p>}

      {queue !== undefined && queue.length === 0 && (
        <Card className="flex flex-col gap-3 py-8 text-center">
          <CheckCircle2 size={32} aria-hidden="true" className="mx-auto text-success" />
          <p className="font-semibold text-ink">Tidak ada soal jatuh tempo hari ini.</p>
          <p className="text-sm text-muted">Kembali besok, atau kerjakan hari berikutnya di peta.</p>
          <Link to="/kesalahan" className="font-semibold text-primary-700 underline">
            Lihat Buku Kesalahan
          </Link>
        </Card>
      )}

      {finished && queue && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-ink">Sesi selesai</h2>
          <p className="text-ink">
            Benar {correctCount} dari {queue.length} soal.
          </p>
          <Link to="/kesalahan" className="font-semibold text-primary-700 underline">
            Kembali ke Buku Kesalahan
          </Link>
        </Card>
      )}

      {item && !finished && (
        <Card className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="lavender">
              Hari {item.entry.day} · {item.entry.questionId}
            </Badge>
            <span className="text-sm text-muted">
              Soal {index + 1} dari {queue?.length}
            </span>
          </div>
          <p className="font-semibold text-ink">{item.question.prompt}</p>

          <div role="radiogroup" aria-label="Pilihan jawaban" className="flex flex-col gap-2">
            {(item.question.options ?? []).map((option) => {
              const isSelected = selected === option.id;
              const isAnswer = checked && option.id === item.question.correct;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={checked}
                  onClick={() => setSelected(option.id)}
                  className={`flex min-h-11 items-center gap-3 rounded-2xl border px-4 text-left text-sm font-semibold outline-none focus-visible:outline-2 focus-visible:outline-primary-500 disabled:cursor-default ${
                    isAnswer
                      ? 'border-success bg-success/15 text-ink'
                      : isSelected
                        ? 'border-primary-500 bg-primary-100 text-primary-700'
                        : 'border-line bg-surface text-ink'
                  }`}
                >
                  <span className="tabular-nums">{option.id}.</span>
                  <span>{option.text}</span>
                </button>
              );
            })}
          </div>

          {checked && (
            // Jawaban benar: pop kecil. Jawaban salah: getar horizontal ±6px tiga kali (350ms), sesuai DESIGN_SPEC.
            <motion.div
              initial={answeredRight ? { scale: 0.96 } : { x: 0 }}
              animate={answeredRight ? { scale: [0.96, 1.03, 1] } : { x: [0, -6, 6, -6, 6, 0] }}
              transition={{ duration: answeredRight ? 0.5 : 0.35, ease: easeOut }}
              className="flex flex-col gap-2 rounded-2xl bg-bg p-4"
              role="status"
            >
              <p className="flex items-center gap-2 font-semibold text-ink">
                {selected === item.question.correct ? (
                  <>
                    <CheckCircle2 size={18} aria-hidden="true" className="text-success" /> Benar
                  </>
                ) : (
                  <>
                    <XCircle size={18} aria-hidden="true" className="text-error" /> Belum tepat
                  </>
                )}
              </p>
              <p className="text-sm text-ink">
                Jawaban benar: <span className="font-semibold">{item.question.correct}. {optionText(item.question, item.question.correct)}</span>
              </p>
              {item.question.explanationId && <p className="text-sm text-muted">{item.question.explanationId}</p>}
              {saveFailed && <p className="text-sm text-error">Jadwal ulang gagal disimpan. Coba lagi nanti.</p>}
            </motion.div>
          )}

          <div className="flex justify-end">
            {!checked ? (
              <Button disabled={!selected} onClick={check}>
                Periksa
              </Button>
            ) : (
              <Button onClick={next}>{index + 1 < (queue?.length ?? 0) ? 'Soal berikutnya' : 'Selesai'}</Button>
            )}
          </div>
        </Card>
      )}

      {queue !== undefined && skipped > 0 && (
        <p className="text-sm text-muted">
          {skipped} soal terjemahan atau soal yang kontennya tidak tersedia tidak ikut sesi ini. Buka harinya untuk mengerjakannya.
        </p>
      )}
    </div>
  );
}
