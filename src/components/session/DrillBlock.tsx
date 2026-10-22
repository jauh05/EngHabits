import { Flame, Send } from 'lucide-react';
import type { ReactNode } from 'react';
import type { DayView } from '../../lib/content';
import type { Answers } from '../../lib/grading';
import { Button } from '../ui/Button';
import { QuestionCard, TaskInput } from './QuestionList';

type Props = {
  block: DayView['block4'];
  answers: Answers;
  onAnswer: (id: string, value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
};

function SectionHeading({ children }: { children: ReactNode }) {
  return <h3 className="text-lg font-bold text-ink">{children}</h3>;
}

/** Blok 4: Bagian A (pilihan ganda), Bagian B (terjemahan), dan Hard Challenge sebagai bonus. */
export function DrillBlock({ block, answers, onAnswer, onSubmit, submitting }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm font-bold uppercase tracking-wide text-primary-700">4 · Soal & Hard Challenge (30 menit)</p>

      <section aria-labelledby="part-a" className="flex flex-col gap-4">
        <div id="part-a">
          <SectionHeading>Bagian A · Tata bahasa</SectionHeading>
          <p className="text-sm text-muted">Pilih satu jawaban untuk setiap soal.</p>
        </div>
        {block.partA.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            selected={answers[question.id]}
            onSelect={(optionId) => onAnswer(question.id, optionId)}
          />
        ))}
      </section>

      <section aria-labelledby="part-b" className="flex flex-col gap-4">
        <div id="part-b">
          <SectionHeading>Bagian B · Produksi</SectionHeading>
          <p className="text-sm text-muted">
            Terjemahan dinilai otomatis, ejaan dan tanda baca tidak dihitung. Tugas tulis dan lisan dinilai sendiri lewat rubrik di halaman hasil.
          </p>
        </div>
        {block.partB.map((task, index) => (
          <TaskInput
            key={task.id}
            task={task}
            index={index}
            value={answers[task.id]}
            onChange={(text) => onAnswer(task.id, text)}
          />
        ))}
      </section>

      <section aria-labelledby="hard-challenge" className="flex flex-col gap-4 rounded-card border border-primary-300 bg-primary-100/50 p-4">
        <div id="hard-challenge" className="flex items-center gap-2">
          <Flame size={20} aria-hidden="true" className="fill-streak text-primary-700" />
          <SectionHeading>Hard Challenge (bonus)</SectionHeading>
        </div>
        <p className="text-sm text-ink">
          Lima soal tingkat sulit. Boleh dilewati, tetapi mengerjakannya memberi lencana bila semuanya benar.
        </p>
        {block.hardChallenge.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            selected={answers[question.id]}
            onSelect={(optionId) => onAnswer(question.id, optionId)}
          />
        ))}
      </section>

      <div className="sticky bottom-4 z-10 flex justify-center">
        <Button size="lg" onClick={onSubmit} disabled={submitting} className="shadow-card">
          <Send size={18} aria-hidden="true" />
          Kirim Jawaban
        </Button>
      </div>
    </div>
  );
}
