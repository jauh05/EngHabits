import type { BattleMode, Composition, QuestionType } from './battle';

/** Komposisi standar untuk mode Campuran, mengikuti total soal. Sama dengan aturan di server/battle.mjs. */
export const DEFAULT_COMPOSITION: Record<8 | 10 | 15 | 20, Composition> = {
  8: { mcq: 4, translate: 2, story: 1, essay: 1 },
  10: { mcq: 5, translate: 2, story: 2, essay: 1 },
  15: { mcq: 7, translate: 3, story: 3, essay: 2 },
  20: { mcq: 9, translate: 4, story: 4, essay: 3 },
};

/** Jenis soal yang bisa diatur sendiri pada mode Campuran. */
export const MIX_TYPES: QuestionType[] = ['mcq', 'translate', 'story', 'essay'];

/** Jenis soal per mode. Sama dengan MODES di server/battle.mjs. */
export const MODE_TYPES: Record<BattleMode, QuestionType[]> = {
  kilat: ['mcq'],
  terjemahan: ['translate'],
  tata_bahasa: ['mcq'],
  kosakata: ['mcq'],
  cerita: ['story'],
  esai: ['essay'],
  campuran: MIX_TYPES,
  dengar: ['listen'],
  susun: ['reorder'],
  bertahan: ['mcq', 'translate'],
};

const TYPE_ORDER: QuestionType[] = ['mcq', 'translate', 'story', 'essay', 'listen', 'reorder'];

/** Gabungan jenis soal dari beberapa mode, urut sesuai TYPE_ORDER. */
export function typesFor(modes: BattleMode[]): QuestionType[] {
  const set = new Set(modes.flatMap((mode) => MODE_TYPES[mode]));
  return TYPE_ORDER.filter((type) => set.has(type));
}

/** Komposisi awal: Campuran memakai standar, gabungan mode dibagi merata. */
export function defaultCompositionFor(modes: BattleMode[], total: 8 | 10 | 15 | 20): Composition {
  if (modes.length === 1 && modes[0] === 'campuran') return { ...DEFAULT_COMPOSITION[total] };
  const types = typesFor(modes);
  const out: Composition = Object.fromEntries(types.map((type) => [type, 0]));
  for (let index = 0; index < total; index += 1) out[types[index % types.length]] = (out[types[index % types.length]] ?? 0) + 1;
  return out;
}

/** Perlu atur komposisi sendiri bila memilih Campuran atau lebih dari satu mode. */
export function needsComposition(modes: BattleMode[]): boolean {
  return modes.length > 1 || modes[0] === 'campuran';
}
