import type { Day, ListeningBlock, ProductionTask, Question, ReadingBlock } from '../../content/schema';

/**
 * File konten dimuat secara lazy (satu chunk per hari). Kunci jawaban tidak dirender
 * sebelum jawaban dikirim, karena tampilan memakai DayView yang sudah dibersihkan.
 */
const loaders = import.meta.glob<Day>('../../content/days/day-*.json', { import: 'default' });

function dayFromPath(path: string): number {
  return Number(path.match(/day-(\d+)\.json$/)?.[1]);
}

/** Daftar hari yang file kontennya ada, urut. */
export function contentDays(): number[] {
  return Object.keys(loaders).map(dayFromPath).sort((a, b) => a - b);
}

/** Muat hari lengkap, termasuk kunci jawaban. Hanya dipakai saat menilai dan di Buku Kesalahan. */
export async function loadDay(day: number): Promise<Day | undefined> {
  const path = Object.keys(loaders).find((key) => dayFromPath(key) === day);
  if (!path) return undefined;
  return loaders[path]();
}

export type QuestionView = Pick<Question, 'id' | 'type' | 'prompt' | 'options' | 'difficulty'>;

export type TaskView = Pick<ProductionTask, 'id' | 'difficulty' | 'kind' | 'promptId' | 'hint'>;

export type BlockView =
  | (Omit<ReadingBlock, 'questions'> & { questions: QuestionView[] })
  | (Omit<ListeningBlock, 'questions'> & { questions: QuestionView[] });

export type DayView = Omit<Day, 'block3' | 'block4'> & {
  block3: BlockView;
  block4: {
    partA: QuestionView[];
    partB: TaskView[];
    hardChallenge: QuestionView[];
  };
};

function questionView(question: Question): QuestionView {
  return {
    id: question.id,
    type: question.type,
    prompt: question.prompt,
    options: question.options,
    difficulty: question.difficulty,
  };
}

function taskView(task: ProductionTask): TaskView {
  return {
    id: task.id,
    difficulty: task.difficulty,
    kind: task.kind,
    promptId: task.promptId,
    hint: task.hint,
  };
}

/** Buang kunci, penjelasan, dan contoh jawaban dari hari sebelum jawaban dikirim. */
export function toDayView(day: Day): DayView {
  const block3 = {
    ...day.block3,
    questions: day.block3.questions.map(questionView),
  } as BlockView;

  return {
    ...day,
    block3,
    block4: {
      partA: day.block4.partA.map(questionView),
      partB: day.block4.partB.map(taskView),
      hardChallenge: day.block4.hardChallenge.map(questionView),
    },
  };
}
