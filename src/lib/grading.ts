import { normalizeAnswer } from '../../content/normalize';
import type { Day, ProductionTask, Question } from '../../content/schema';

/** Jawaban pengguna: id soal -> id opsi (A-D) atau teks ketikan. */
export type Answers = Record<string, string>;

export type Part = 'comprehension' | 'partA' | 'partB' | 'hard';

export type ItemResult = {
  id: string;
  part: Part;
  correct: boolean;
  given: string;
  /** Jawaban benar dalam bentuk yang bisa ditampilkan. */
  expected: string;
  /** Soal pilihan ganda atau tugas terjemahan. */
  kind: 'mcq' | 'production';
  /** Tugas tulis atau lisan: dinilai sendiri lewat rubrik, tidak masuk skor dan Buku Kesalahan. */
  selfAssessed?: boolean;
};

export type Score = { correct: number; total: number };

export type DayResult = {
  items: ItemResult[];
  /** Skor per bagian. */
  parts: Record<Part, Score>;
  /** Inti: 15 soal (comprehension + partA + partB). */
  core: Score;
  /** Bonus Hard Challenge: 5 soal. */
  hard: Score;
  /** Persentase inti, 0-100. */
  corePercent: number;
  /** Tugas tulis dan lisan. Ditampilkan di evaluasi, tidak dihitung otomatis. */
  selfItems: ItemResult[];
};

export function gradeMcq(question: Question, given: string | undefined): boolean {
  return given === question.correct;
}

/** Terjemahan benar bila sama dengan salah satu jawaban yang diterima, setelah normalisasi. */
export function gradeProduction(task: ProductionTask, given: string | undefined): boolean {
  const typed = normalizeAnswer(given ?? '');
  if (!typed) return false;
  const accepted = task.acceptedAnswers?.length ? task.acceptedAnswers : [task.modelAnswer];
  return accepted.some((answer) => normalizeAnswer(answer) === typed);
}

/** Terjemahan dinilai otomatis. Tugas tulis dan lisan dinilai sendiri lewat rubrik. */
export function isAutoGraded(task: ProductionTask): boolean {
  return task.kind === 'translate_id_en';
}

function optionText(question: Question, optionId: string): string {
  return question.options?.find((option) => option.id === optionId)?.text ?? '';
}

function score(items: ItemResult[]): Score {
  return { correct: items.filter((item) => item.correct).length, total: items.length };
}

/** Nilai seluruh hari. Soal yang tidak dijawab dihitung salah. */
export function gradeDay(day: Day, answers: Answers): DayResult {
  const comprehension = day.block3.questions.map((question): ItemResult => ({
    id: question.id,
    part: 'comprehension',
    kind: 'mcq',
    correct: gradeMcq(question, answers[question.id]),
    given: answers[question.id] ?? '',
    expected: `${question.correct}. ${optionText(question, question.correct)}`,
  }));

  const partA = day.block4.partA.map((question): ItemResult => ({
    id: question.id,
    part: 'partA',
    kind: 'mcq',
    correct: gradeMcq(question, answers[question.id]),
    given: answers[question.id] ?? '',
    expected: `${question.correct}. ${optionText(question, question.correct)}`,
  }));

  const partBAll = day.block4.partB.map((task): ItemResult => {
    const auto = isAutoGraded(task);
    return {
      id: task.id,
      part: 'partB',
      kind: 'production',
      correct: auto && gradeProduction(task, answers[task.id]),
      given: answers[task.id] ?? '',
      expected: task.modelAnswer,
      selfAssessed: !auto,
    };
  });
  const partB = partBAll.filter((item) => !item.selfAssessed);
  const selfItems = partBAll.filter((item) => item.selfAssessed);

  const hard = day.block4.hardChallenge.map((question): ItemResult => ({
    id: question.id,
    part: 'hard',
    kind: 'mcq',
    correct: gradeMcq(question, answers[question.id]),
    given: answers[question.id] ?? '',
    expected: `${question.correct}. ${optionText(question, question.correct)}`,
  }));

  const core = [...comprehension, ...partA, ...partB];
  const coreScore = score(core);

  return {
    items: [...core, ...hard],
    selfItems,
    parts: {
      comprehension: score(comprehension),
      partA: score(partA),
      partB: score(partB),
      hard: score(hard),
    },
    core: coreScore,
    hard: score(hard),
    corePercent: coreScore.total === 0 ? 0 : Math.round((coreScore.correct / coreScore.total) * 100),
  };
}
