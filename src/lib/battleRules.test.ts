import { describe, expect, it } from 'vitest';
import { BATTLE_MODES } from './battle';
import { defaultCompositionFor, needsComposition, typesFor } from './battleRules';

describe('mode battle', () => {
  it('mode esai, dengar, dan campuran sudah dihapus dari pilihan', () => {
    const ids = BATTLE_MODES.map((mode) => mode.id);
    expect(ids).not.toContain('esai');
    expect(ids).not.toContain('dengar');
    expect(ids).not.toContain('campuran');
    expect(ids).toEqual(expect.arrayContaining(['kilat', 'terjemahan', 'tata_bahasa', 'kosakata', 'cerita', 'susun', 'bertahan']));
  });

  it('jenis soal gabungan hanya berisi jenis yang masih ada', () => {
    expect(typesFor(['kilat', 'terjemahan', 'susun'])).toEqual(['mcq', 'translate', 'reorder']);
  });

  it('komposisi awal dibagi merata dan tepat sama dengan total', () => {
    const composition = defaultCompositionFor(['kilat', 'cerita'], 8);
    expect(Object.values(composition).reduce((sum, value) => sum + (value ?? 0), 0)).toBe(8);
    expect(composition).toEqual({ mcq: 4, story: 4 });
  });

  it('satu mode tidak perlu atur komposisi, gabungan perlu', () => {
    expect(needsComposition(['kilat'])).toBe(false);
    expect(needsComposition(['kilat', 'cerita'])).toBe(true);
  });
});
