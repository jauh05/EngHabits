import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { monthOfWeek, type BankQuestion } from '../../content/schema';
import { Button, buttonClass } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { loadBank } from '../lib/bank';

/**
 * Latihan Hard satu minggu: soal dijawab satu per satu, lalu jawaban dan penjelasannya langsung muncul.
 * Sesi ini tidak mengubah skor harian atau Buku Kesalahan.
 */
export function BankSessionPage() {
  const { week: weekParam } = useParams();
  const week = Number(weekParam);
  const [questions, setQuestions] = useState<BankQuestion[]>();
  const [missing, setMissing] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string>();
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let active = true;
    setQuestions(undefined);
    setMissing(false);
    loadBank(week).then((list) => {
      if (!active) return;
      if (list) setQuestions(list);
      else setMissing(true);
    });
    return () => {
      active = false;
    };
  }, [week]);

  const restart = () => {
    setIndex(0);
    setSelected(undefined);
    setChecked(false);
    setCorrectCount(0);
    setFinished(false);
  };

  if (missing) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-ink">Minggu ini belum tersedia.</p>
        <Link to="/latihan" className={buttonClass('secondary', 'md', 'w-fit hover:scale-[1.02]')}>
          <ArrowLeft size={18} aria-hidden="true" />
          Latihan
        </Link>
      </div>
    );
  }

  if (!questions) return <p className="text-muted">Memuat soal…</p>;

  const total = questions.length;
  const question = questions[index];
  const right = selected === question.correct;
  const correctText = question.options.find((option) => option.id === question.correct)?.text ?? '';
  const reasons = question.whyOthersWrong.filter((entry) => entry.optionId !== question.correct);

  const check = () => {
    if (!selected) return;
    setChecked(true);
    if (right) setCorrectCount((count) => count + 1);
  };

  const next = () => {
    if (index + 1 >= total) {
      setFinished(true);
      return;
    }
    setIndex((value) => value + 1);
    setSelected(undefined);
    setChecked(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <Link to="/latihan" className={buttonClass('secondary', 'md', 'w-fit hover:scale-[1.02]')}>
          <ArrowLeft size={18} aria-hidden="true" />
          Latihan
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold text-ink">Latihan Hard · Minggu {week}</h1>
          <p className="text-muted">
            Bulan {monthOfWeek(week)} · {total} soal sulit. Periksa setiap jawaban untuk melihat penjelasannya.
          </p>
        </div>
      </header>

      {finished ? (
        <Card className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-ink">Sesi selesai</h2>
          <p className="text-ink">
            Benar {correctCount} dari {total} soal.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={restart}>
              <RotateCcw size={18} aria-hidden="true" />
              Ulangi minggu ini
            </Button>
            <Link to="/latihan" className={buttonClass('secondary', 'md', 'hover:scale-[1.02]')}>
              Kembali ke Latihan
            </Link>
          </div>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm font-semibold text-ink">
              <span>
                Soal {index + 1} dari {total}
              </span>
              <span className="tabular-nums">Benar {correctCount}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-track">
              <div
                className="h-full rounded-full bg-primary-500 transition-[width] duration-300"
                style={{ width: `${((index + (checked ? 1 : 0)) / total) * 100}%` }}
              />
            </div>
          </div>

          <Card className="flex flex-col gap-4">
            <span className="w-fit rounded-full bg-tint-pale px-3 py-1 text-xs font-bold capitalize text-ink">
              {question.topicTag.replace(/-/g, ' ')}
            </span>
            <p className="text-lg font-semibold leading-relaxed text-ink">{question.prompt}</p>

            <div role="radiogroup" aria-label="Pilihan jawaban" className="flex flex-col gap-2">
              {question.options.map((option) => {
                const isSelected = selected === option.id;
                const isAnswer = checked && option.id === question.correct;
                const isWrongPick = checked && isSelected && !isAnswer;
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
                        : isWrongPick
                          ? 'border-error bg-error/15 text-ink'
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
              <div role="status" className="flex flex-col gap-4 rounded-2xl bg-bg p-4">
                <p className="flex items-center gap-2 font-semibold text-ink">
                  {right ? (
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
                  Jawaban benar: <span className="font-semibold">{question.correct}. {correctText}</span>
                </p>
                <p className="text-sm text-ink">{question.explanationId}</p>

                <section className="flex flex-col gap-1">
                  <h3 className="text-sm font-bold text-ink">Langkah demi langkah</h3>
                  <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm text-ink">
                    {question.stepByStep.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </section>

                {reasons.length > 0 && (
                  <section className="flex flex-col gap-1">
                    <h3 className="text-sm font-bold text-ink">Kenapa pilihan lain salah</h3>
                    <ul className="flex flex-col gap-1 text-sm text-ink">
                      {reasons.map((entry) => (
                        <li key={entry.optionId}>
                          <span className="font-semibold">{entry.optionId}.</span> {entry.reasonId}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <section className="flex flex-col gap-1">
                  <h3 className="text-sm font-bold text-ink">Aturan</h3>
                  <p className="text-sm text-ink">{question.ruleAndExamples.rule}</p>
                  <ul className="flex flex-col gap-1 text-sm text-ink">
                    {question.ruleAndExamples.examples.map((example) => (
                      <li key={example.en}>
                        <span className="font-semibold">{example.en}</span>
                        <span className="block text-muted">{example.id}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <p className="text-sm text-muted">Jebakan ujian: {question.examTrap}</p>
              </div>
            )}

            <div className="flex justify-end">
              {!checked ? (
                <Button disabled={!selected} onClick={check}>
                  Periksa
                </Button>
              ) : (
                <Button onClick={next}>
                  {index + 1 < total ? 'Soal berikutnya' : 'Lihat hasil'}
                  <ArrowRight size={18} aria-hidden="true" />
                </Button>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
