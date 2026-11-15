import type { BattleMode, Composition, QuestionType } from './battle';

/** Jenis soal per mode. Sama dengan MODES di server/battle.mjs. */
export const MODE_TYPES: Record<BattleMode, QuestionType[]> = {
  kilat: ['mcq'],
  terjemahan: ['translate'],
  tata_bahasa: ['mcq'],
  kosakata: ['mcq'],
  cerita: ['story'],
  susun: ['reorder'],
  bertahan: ['mcq', 'translate'],
};

const TYPE_ORDER: QuestionType[] = ['mcq', 'translate', 'story', 'reorder'];

/** Gabungan jenis soal dari beberapa mode, urut sesuai TYPE_ORDER. */
export function typesFor(modes: BattleMode[]): QuestionType[] {
  const set = new Set(modes.flatMap((mode) => MODE_TYPES[mode]));
  return TYPE_ORDER.filter((type) => set.has(type));
}

/** Komposisi awal: jumlah soal dibagi merata ke jenis soal dari semua mode yang dipilih. */
export function defaultCompositionFor(modes: BattleMode[], total: 8 | 10 | 15 | 20): Composition {
  const types = typesFor(modes);
  const out: Composition = Object.fromEntries(types.map((type) => [type, 0]));
  for (let index = 0; index < total; index += 1) out[types[index % types.length]] = (out[types[index % types.length]] ?? 0) + 1;
  return out;
}

/** Perlu atur komposisi sendiri bila memilih lebih dari satu mode. */
export function needsComposition(modes: BattleMode[]): boolean {
  return modes.length > 1;
}
