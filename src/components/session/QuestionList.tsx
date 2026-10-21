import { motion } from 'motion/react';
import type { Answers } from '../../lib/grading';
import type { QuestionView, TaskView } from '../../lib/content';
import { bounce } from '../../lib/motion';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

type Props = {
  question: QuestionView;
  index: number;
  selected: string | undefined;
  onSelect: (optionId: string) => void;
};

/** Satu soal pilihan ganda. Kunci dan penjelasan tidak dimuat di sini. */
export function QuestionCard({ question, index, selected, onSelect }: Props) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-muted">{question.id}</span>
        <Badge tone={question.difficulty} />
      </div>
      <p className="text-base font-semibold leading-relaxed text-ink">
        {index + 1}. {question.prompt}
      </p>
      <div role="radiogroup" aria-label={question.prompt} className="flex flex-col gap-2">
        {(question.options ?? []).map((option) => {
          const isSelected = selected === option.id;
          return (
            <motion.button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(option.id)}
              animate={{ scale: isSelected ? 1.02 : 1 }}
              whileTap={{ scale: 0.97 }}
              transition={bounce}
              className={`flex min-h-11 items-center gap-3 rounded-2xl border px-4 py-3 text-left text-base outline-none focus-visible:outline-2 focus-visible:outline-primary-500 ${
                isSelected
                  ? 'border-primary-500 bg-primary-100 font-semibold text-primary-700'
                  : 'border-line bg-surface text-ink hover:border-primary-300'
              }`}
            >
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full border text-sm font-bold ${
                  isSelected ? 'border-primary-700 bg-primary-700 text-btn-fg' : 'border-line text-muted'
                }`}
                aria-hidden="true"
              >
                {option.id}
              </span>
              {option.text}
            </motion.button>
          );
        })}
      </div>
    </Card>
  );
}

export function TaskInput({
  task,
  index,
  value,
  onChange,
}: {
  task: TaskView;
  index: number;
  value: string | undefined;
  onChange: (text: string) => void;
}) {
  const fieldId = `task-${task.id}`;
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-muted">{task.id}</span>
        <Badge tone={task.difficulty} />
      </div>
      <label htmlFor={fieldId} className="text-base font-semibold leading-relaxed text-ink">
        {index + 1}. Terjemahkan ke bahasa Inggris:
        <span className="mt-1 block text-lg text-primary-700">{task.promptId}</span>
      </label>
      {task.hint && <p className="text-sm text-muted">Petunjuk: {task.hint}</p>}
      <textarea
        id={fieldId}
        rows={2}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Tulis jawabanmu di sini"
        className="w-full resize-none rounded-2xl border border-line bg-surface p-3 text-base text-ink outline-none placeholder:text-muted focus:border-primary-500 focus:shadow-[0_0_0_4px_var(--primary-100)]"
      />
    </Card>
  );
}

export function answeredCount(ids: string[], answers: Answers): number {
  return ids.filter((id) => (answers[id] ?? '').trim() !== '').length;
}
