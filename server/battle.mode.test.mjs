import { describe, expect, it } from 'vitest';
import { modeLabelOf } from './battle.mjs';

describe('modeLabelOf', () => {
  it('memberi nama untuk mode yang masih ada', () => {
    expect(modeLabelOf('kilat')).toBe('Kilat');
  });

  it('battle lama dengan mode yang sudah dihapus tidak membuat server gagal', () => {
    expect(modeLabelOf('esai')).toBe('Mode lama');
    expect(modeLabelOf('campuran')).toBe('Mode lama');
    expect(modeLabelOf(undefined)).toBe('Mode lama');
  });
});
