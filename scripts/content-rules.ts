import {
  daySchema,
  monthOfWeek,
  OPTION_IDS,
  WEEK_DIFFICULTY_TARGET,
  weekOfDay,
  type Day,
  type Difficulty,
  type Question,
} from '../content/schema';
import { normalizeAnswer } from '../content/normalize';

export type DayCheck = {
  day: number;
  issues: string[];
  parsed?: Day;
};

const PLACEHOLDER = /\bTODO\b|\bTBD\b|lorem|\.\.\.|\bdst\b|isi nanti/i;
const TIER_TOLERANCE = 2;
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

export function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

/** Kumpulkan semua nilai string dalam objek, untuk pemeriksaan placeholder. */
function collectStrings(value: unknown, path: string, out: Array<[string, string]>): void {
  if (typeof value === 'string') {
    out.push([path, value]);
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => collectStrings(item, `${path}[${index}]`, out));
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      collectStrings(child, path ? `${path}.${key}` : key, out);
    }
  }
  return;
}

function hasOptions(question: Question): boolean {
  return Array.isArray(question.options) && question.options.length > 0;
}

function checkQuestion(question: Question, issues: string[]): void {
  const where = `soal ${question.id}`;

  if (hasOptions(question)) {
    const options = question.options ?? [];
    const ids = options.map((option) => option.id);
    if (new Set(ids).size !== ids.length) issues.push(`${where}: id opsi duplikat`);

    const texts = options.map((option) => normalizeAnswer(option.text));
    if (new Set(texts).size !== texts.length) issues.push(`${where}: ada opsi dengan teks identik`);

    if (!ids.includes(question.correct as (typeof OPTION_IDS)[number])) {
      issues.push(`${where}: correct "${question.correct}" tidak ada di opsi`);
    }

    const wrongIds = ids.filter((id) => id !== question.correct);
    const covered = new Set((question.whyOthersWrong ?? []).map((entry) => entry.optionId));
    const missing = wrongIds.filter((id) => !covered.has(id));
    if (question.type === 'mcq' && missing.length > 0) {
      issues.push(`${where}: whyOthersWrong belum mencakup opsi ${missing.join(', ')}`);
    }
  } else {
    issues.push(`${where}: soal bertipe ${question.type} wajib punya options`);
  }

  if ((question.difficulty === 'medium' || question.difficulty === 'hard') && !question.stepByStep) {
    issues.push(`${where}: soal ${question.difficulty} wajib punya stepByStep`);
  }
  if (question.difficulty === 'hard') {
    if (!question.examTrap) issues.push(`${where}: soal hard wajib punya examTrap`);
    if (!question.ruleAndExamples) issues.push(`${where}: soal hard wajib punya ruleAndExamples (lapis 4)`);
  }
}

function checkAnswerDistribution(questions: Question[], issues: string[]): void {
  const letters = questions.map((question) => question.correct);
  if (letters.length < 5) return;
  const counts = new Map<string, number>();
  for (const letter of letters) counts.set(letter, (counts.get(letter) ?? 0) + 1);
  if (counts.size === 1) {
    issues.push('jawaban benar sama semua (A-D harus bervariasi)');
    return;
  }
  const largest = Math.max(...counts.values());
  if (largest / letters.length > 0.6) {
    issues.push(`distribusi jawaban benar tidak seimbang: satu huruf mendapat ${largest} dari ${letters.length}`);
  }
}

function checkComposition(day: Day, issues: string[]): void {
  const core: Array<Question | { difficulty: Difficulty }> = [
    ...day.block3.questions,
    ...day.block4.partA,
    ...day.block4.partB,
  ];
  const target = WEEK_DIFFICULTY_TARGET[day.week];
  if (!target || core.length !== 15) {
    issues.push(`komposisi: inti harus 15 soal (ditemukan ${core.length})`);
    return;
  }
  for (const tier of DIFFICULTIES) {
    const actual = core.filter((item) => item.difficulty === tier).length;
    if (Math.abs(actual - target[tier]) > TIER_TOLERANCE) {
      issues.push(
        `komposisi minggu ${day.week}: ${tier} ${actual}, target ${target[tier]} (toleransi ±${TIER_TOLERANCE})`,
      );
    }
  }
}

function checkSequence(ids: string[], prefix: string, count: number, label: string, issues: string[]): void {
  const expected = Array.from({ length: count }, (_, index) => `${prefix}${index + 1}`);
  if (ids.length !== count || ids.some((id, index) => id !== expected[index])) {
    issues.push(`${label}: id harus ${expected.join(', ')}`);
  }
}

/**
 * Validasi satu hari. `previous` adalah hari-hari lain yang sudah lolos parse,
 * dipakai untuk mengecek kosakata yang berulang dalam 10 hari sebelumnya.
 */
export function validateDay(raw: unknown, fileDay: number, previous: Day[]): DayCheck {
  const issues: string[] = [];
  const parsedResult = daySchema.safeParse(raw);
  if (!parsedResult.success) {
    for (const issue of parsedResult.error.issues) {
      issues.push(`${issue.path.join('.') || '(root)'}: ${issue.message}`);
    }
    return { day: fileDay, issues };
  }
  const day = parsedResult.data;

  if (day.day !== fileDay) issues.push(`field day (${day.day}) tidak sama dengan nama file (${fileDay})`);
  if (weekOfDay(day.day) !== day.week) {
    issues.push(`week ${day.week} tidak sesuai untuk hari ${day.day} (seharusnya ${weekOfDay(day.day)})`);
  }
  if (monthOfWeek(day.week) !== day.month) {
    issues.push(`month ${day.month} tidak sesuai untuk minggu ${day.week}`);
  }

  // Kosakata
  const vocab = day.block1.vocab;
  if (vocab.length !== 10) issues.push(`vocab harus tepat 10 (ditemukan ${vocab.length})`);
  vocab.forEach((item, index) => {
    if (item.no !== index + 1) issues.push(`vocab nomor ${item.no} seharusnya ${index + 1}`);
  });
  if (day.skillFocus !== 'review') {
    const recent = new Set(
      previous
        .filter((other) => other.day < day.day && other.day >= day.day - 10 && other.skillFocus !== 'review')
        .flatMap((other) => other.block1.vocab.map((item) => normalizeAnswer(item.en))),
    );
    const repeated = vocab.map((item) => item.en).filter((en) => recent.has(normalizeAnswer(en)));
    if (repeated.length > 0) {
      issues.push(`kosakata berulang dalam 10 hari terakhir: ${repeated.join(', ')}`);
    }
  }

  // Materi
  const { lesson } = day.block2;
  if (lesson.examples.positive.length < 5) issues.push('contoh positif minimal 5');
  if (lesson.examples.negative.length < 5) issues.push('contoh negatif minimal 5');
  if (lesson.examples.question.length < 5) issues.push('contoh tanya minimal 5');
  if (lesson.commonMistakes.length < 5) issues.push('commonMistakes minimal 5');

  // Blok 3
  const block3 = day.block3;
  if (day.skillFocus === 'reading' && block3.type !== 'reading') {
    issues.push('hari reading harus punya block3 bertipe reading');
  }
  if (day.skillFocus === 'listening' && block3.type !== 'listening') {
    issues.push('hari listening harus punya block3 bertipe listening (dengan script)');
  }
  if (block3.questions.length !== 5) issues.push(`block3 harus tepat 5 soal (ditemukan ${block3.questions.length})`);
  checkSequence(
    block3.questions.map((q) => q.id),
    block3.type === 'reading' ? 'R' : 'L',
    5,
    'block3',
    issues,
  );

  if (block3.type === 'reading') {
    const words = wordCount(block3.text);
    const ranges: Record<number, [number, number]> = {
      1: [90, 165],
      2: [225, 385],
      3: [360, Number.POSITIVE_INFINITY],
    };
    const [min, max] = ranges[day.month];
    if (words < min || words > max) {
      issues.push(`teks bacaan ${words} kata, di luar batas bulan ${day.month} (${min}-${max === Number.POSITIVE_INFINITY ? 'tanpa batas atas' : max})`);
    }
  }

  // Blok 4
  const { partA, partB, hardChallenge } = day.block4;
  if (partA.length !== 5) issues.push(`partA harus tepat 5 (ditemukan ${partA.length})`);
  if (partB.length !== 5) issues.push(`partB harus tepat 5 (ditemukan ${partB.length})`);
  if (hardChallenge.length !== 5) issues.push(`hardChallenge harus tepat 5 (ditemukan ${hardChallenge.length})`);
  checkSequence(partA.map((q) => q.id), 'A', 5, 'partA', issues);
  checkSequence(partB.map((task) => task.id), 'B', 5, 'partB', issues);
  checkSequence(hardChallenge.map((q) => q.id), 'H', 5, 'hardChallenge', issues);
  hardChallenge.forEach((q) => {
    if (q.difficulty !== 'hard') issues.push(`hardChallenge ${q.id} harus difficulty hard`);
  });

  for (const task of partB) {
    if (task.kind === 'translate_id_en' && (!task.acceptedAnswers || task.acceptedAnswers.length === 0)) {
      issues.push(`tugas ${task.id}: acceptedAnswers wajib untuk terjemahan`);
    }
    if (day.month === 3 && (!task.rubric || task.rubric.length === 0)) {
      issues.push(`tugas ${task.id}: rubric wajib untuk Bulan 3`);
    }
  }

  // Pemeriksaan per soal
  const allQuestions: Question[] = [
    ...block3.questions,
    ...partA,
    ...hardChallenge,
  ];
  for (const question of [...block3.questions, ...partA, ...hardChallenge]) checkQuestion(question, issues);

  const ids = [...block3.questions, ...partA, ...hardChallenge].map((q) => q.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length > 0) issues.push(`id soal duplikat: ${[...new Set(duplicates)].join(', ')}`);

  checkAnswerDistribution(allQuestions, issues);
  checkComposition(day, issues);

  // Placeholder
  const strings: Array<[string, string]> = [];
  collectStrings(raw, '', strings);
  for (const [path, value] of strings) {
    if (PLACEHOLDER.test(value)) issues.push(`placeholder terdeteksi di ${path}: "${value.slice(0, 60)}"`);
  }

  return { day: fileDay, issues, parsed: day };
}
