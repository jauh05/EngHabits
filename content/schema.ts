import { z } from 'zod';

/* ------------------------------------------------------------------ */
/* Konstanta                                                           */
/* ------------------------------------------------------------------ */

export const POS = ['Noun', 'Verb', 'Adj', 'Adv', 'Prep', 'Conj', 'Other'] as const;
export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export const SKILL_FOCUS = ['reading', 'listening', 'review', 'exam'] as const;
export const QUESTION_TYPES = ['mcq', 'true_false', 'true_false_not_given', 'yes_no_not_given'] as const;
export const OPTION_IDS = ['A', 'B', 'C', 'D'] as const;
export const PRODUCTION_KINDS = [
  'translate_id_en',
  'ielts_task1_outline',
  'ielts_task2_outline',
  'ielts_task2_paragraph',
  'ielts_speaking_p1',
  'ielts_speaking_p2',
  'ielts_speaking_p3',
] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];
export type SkillFocus = (typeof SKILL_FOCUS)[number];
export type OptionId = (typeof OPTION_IDS)[number];

/** Rentang hari per minggu kurikulum (inklusif). Sumber: bagian 7 prompt induk. */
export const WEEK_RANGES: ReadonlyArray<readonly [week: number, from: number, to: number]> = [
  [1, 1, 7],
  [2, 8, 14],
  [3, 15, 21],
  [4, 22, 30],
  [5, 31, 37],
  [6, 38, 44],
  [7, 45, 51],
  [8, 52, 60],
  [9, 61, 67],
  [10, 68, 74],
  [11, 75, 81],
  [12, 82, 90],
];

/** Target komposisi 15 soal inti per minggu (bagian 3.3). Toleransi ±2 per tingkat. */
export const WEEK_DIFFICULTY_TARGET: Record<number, Record<Difficulty, number>> = {
  1: { easy: 8, medium: 5, hard: 2 },
  2: { easy: 8, medium: 5, hard: 2 },
  3: { easy: 5, medium: 6, hard: 4 },
  4: { easy: 5, medium: 6, hard: 4 },
  5: { easy: 3, medium: 6, hard: 6 },
  6: { easy: 3, medium: 6, hard: 6 },
  7: { easy: 3, medium: 6, hard: 6 },
  8: { easy: 3, medium: 6, hard: 6 },
  9: { easy: 2, medium: 5, hard: 8 },
  10: { easy: 2, medium: 5, hard: 8 },
  11: { easy: 2, medium: 5, hard: 8 },
  12: { easy: 2, medium: 5, hard: 8 },
};

export function weekOfDay(day: number): number | undefined {
  return WEEK_RANGES.find(([, from, to]) => day >= from && day <= to)?.[0];
}

export function monthOfWeek(week: number): 1 | 2 | 3 {
  if (week <= 4) return 1;
  if (week <= 8) return 2;
  return 3;
}

/* ------------------------------------------------------------------ */
/* Skema                                                               */
/* ------------------------------------------------------------------ */

const text = z.string().trim().min(1);

export const vocabItemSchema = z.object({
  no: z.number().int().min(1),
  en: text,
  pronunciationId: text,
  pos: z.enum(POS),
  meaningId: text,
  example: text,
  exampleId: text,
});

export const optionSchema = z.object({
  id: z.enum(OPTION_IDS),
  text,
});

export const questionSchema = z.object({
  id: z.string().regex(/^(R|L|A|H)\d+$/, 'id soal harus R#, L#, A#, atau H#'),
  type: z.enum(QUESTION_TYPES),
  prompt: text,
  options: z.array(optionSchema).min(2).optional(),
  difficulty: z.enum(DIFFICULTIES),
  correct: text,
  explanationId: text,
  stepByStep: z.array(text).min(1).optional(),
  whyOthersWrong: z
    .array(z.object({ optionId: z.enum(OPTION_IDS), reasonId: text }))
    .optional(),
  ruleAndExamples: z
    .object({
      rule: text,
      examples: z.array(z.object({ en: text, id: text })).min(2),
    })
    .optional(),
  examTrap: text.optional(),
  evidence: text.optional(),
});

export const productionTaskSchema = z.object({
  id: z.string().regex(/^B\d+$/, 'id tugas harus B#'),
  difficulty: z.enum(DIFFICULTIES),
  kind: z.enum(PRODUCTION_KINDS),
  /** Teks prompt yang ditampilkan (Bahasa Indonesia untuk tugas terjemahan). */
  promptId: text,
  hint: text.optional(),
  acceptedAnswers: z.array(text).optional(),
  modelAnswer: text,
  rubric: z.array(z.object({ criterion: text, whatGoodLooksLike: text })).optional(),
  commonErrors: z.array(z.object({ pattern: text, feedbackId: text })).optional(),
});

const pair = z.object({ en: text, id: text });

export const readingBlockSchema = z.object({
  type: z.literal('reading'),
  title: text,
  text,
  glossary: z.array(pair).min(1),
  questions: z.array(questionSchema),
});

export const listeningBlockSchema = z.object({
  type: z.literal('listening'),
  youtube: z.object({
    keywords: z.array(text).min(1),
    channels: z.array(text).min(1),
    watchFor: z.array(text).min(1),
  }),
  script: z.object({
    title: text,
    lines: z.array(z.object({ speaker: text, text })).min(1),
  }),
  shadowingTips: z.array(text).min(1),
  questions: z.array(questionSchema),
});

export const daySchema = z.object({
  day: z.number().int().min(1).max(90),
  week: z.number().int().min(1).max(12),
  month: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  title: text,
  topic: text,
  skillFocus: z.enum(SKILL_FOCUS),
  objectives: z.array(text).min(2).max(4),
  block1: z.object({
    vocab: z.array(vocabItemSchema),
    tip: text,
  }),
  block2: z.object({
    youtube: z.object({
      keywords: z.array(text).min(1),
      channels: z.array(text).min(1),
      videoDescription: text,
      watchFor: z.array(text).min(1),
    }),
    lesson: z.object({
      intro: text,
      sections: z.array(z.object({ heading: text, bodyMd: text })).min(1),
      formulas: z.array(z.object({ label: text, pattern: text })).min(1),
      examples: z.object({
        positive: z.array(pair),
        negative: z.array(pair),
        question: z.array(pair),
      }),
      commonMistakes: z.array(z.object({ wrong: text, right: text, whyId: text })),
    }),
  }),
  block3: z.discriminatedUnion('type', [readingBlockSchema, listeningBlockSchema]),
  block4: z.object({
    partA: z.array(questionSchema),
    partB: z.array(productionTaskSchema),
    hardChallenge: z.array(questionSchema),
  }),
});

export type VocabItem = z.infer<typeof vocabItemSchema>;
export type Option = z.infer<typeof optionSchema>;
export type Question = z.infer<typeof questionSchema>;
export type ProductionTask = z.infer<typeof productionTaskSchema>;
export type ReadingBlock = z.infer<typeof readingBlockSchema>;
export type ListeningBlock = z.infer<typeof listeningBlockSchema>;
export type Day = z.infer<typeof daySchema>;
