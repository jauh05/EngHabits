import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { BookX, CheckCircle2 } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { loadDay } from '../lib/content';
import { localISO } from '../lib/dates';
import type { Day } from '../../content/schema';
import { isDue, type MistakeEntry } from '../lib/srs';
import { useProgressData } from '../lib/useProgressData';

type Detail = { prompt: string; correct: string };

/** Ambil teks soal dan jawaban benar dari hari lengkap. */
function detailFor(day: Day, questionId: string): Detail | undefined {
  const question = [...day.block3.questions, ...day.block4.partA, ...day.block4.hardChallenge].find(
    (item) => item.id === questionId,
  );
  if (question) {
    const option = question.options?.find((item) => item.id === question.correct);
    return { prompt: question.prompt, correct: `${question.correct}. ${option?.text ?? ''}` };
  }
  const task = day.block4.partB.find((item) => item.id === questionId);
  if (task) return { prompt: task.promptId, correct: task.modelAnswer };
  return undefined;
}

export function MistakesPage() {
  const data = useProgressData();
  const [details, setDetails] = useState<Record<string, Detail>>({});
  const today = localISO();

  useEffect(() => {
    let active = true;
    const days = [...new Set(data.mistakes.map((entry) => entry.day))];
    Promise.all(days.map((day) => loadDay(day).then((loaded) => [day, loaded] as const))).then((loaded) => {
      if (!active) return;
      const next: Record<string, Detail> = {};
      for (const [day, dayData] of loaded) {
        if (!dayData) continue;
        for (const entry of data.mistakes.filter((item) => item.day === day)) {
          const detail = detailFor(dayData, entry.questionId);
          if (detail) next[entry.key] = detail;
        }
      }
      setDetails(next);
    });
    return () => {
      active = false;
    };
  }, [data.mistakes]);

  const entries = [...data.mistakes].sort((a: MistakeEntry, b: MistakeEntry) => a.due.localeCompare(b.due));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-extrabold text-ink">Buku Kesalahan</h1>
        <p className="text-muted">Soal yang salah masuk ke sini dan diulang sesuai jadwal (1, 3, 7, lalu 14 hari).</p>
        <Link to="/latihan" className="mt-2 inline-flex min-h-11 w-fit items-center rounded-full bg-primary-100 px-5 font-semibold text-primary-700">
          Mulai latihan perbaikan
        </Link>
      </header>

      {entries.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <BookX size={32} aria-hidden="true" className="text-muted" />
          <p className="font-semibold text-ink">Belum ada kesalahan tercatat.</p>
          <p className="text-sm text-muted">Soal yang kamu jawab salah setelah mengirim jawaban akan muncul di sini.</p>
        </Card>
      )}

      <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {entries.map((entry) => {
          const detail = details[entry.key];
          const due = isDue(entry, today);
          return (
            <li key={entry.key}>
              <Card className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="lavender">Hari {entry.day} · {entry.questionId}</Badge>
                  {entry.mastered ? (
                    <Badge tone="easy">Terkuasai</Badge>
                  ) : due ? (
                    <Badge tone="hard">Jatuh tempo</Badge>
                  ) : (
                    <Badge tone="neutral">Ulang {entry.due}</Badge>
                  )}
                  {entry.mastered && <CheckCircle2 size={18} aria-hidden="true" className="text-success" />}
                </div>
                <p className="font-semibold text-ink">{detail?.prompt ?? 'Soal tidak tersedia di konten saat ini.'}</p>
                {detail && (
                  <p className="text-sm text-muted">
                    Jawaban benar: <span className="font-semibold text-ink">{detail.correct}</span>
                  </p>
                )}
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
