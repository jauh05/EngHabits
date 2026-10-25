import type { Composition, QuestionType } from './battle';

/** Komposisi standar untuk mode Campuran, mengikuti total soal. Sama dengan aturan di server/battle.mjs. */
export const DEFAULT_COMPOSITION: Record<8 | 10 | 15 | 20, Composition> = {
  8: { mcq: 4, translate: 2, story: 1, essay: 1 },
  10: { mcq: 5, translate: 2, story: 2, essay: 1 },
  15: { mcq: 7, translate: 3, story: 3, essay: 2 },
  20: { mcq: 9, translate: 4, story: 4, essay: 3 },
};

/** Jenis soal yang bisa diatur sendiri pada mode Campuran. */
export const MIX_TYPES: QuestionType[] = ['mcq', 'translate', 'story', 'essay'];
