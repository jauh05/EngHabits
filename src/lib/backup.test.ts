import { describe, expect, it } from 'vitest';
import { parseBackupText } from './backup';

const valid = {
  format: 'enghabits-backup',
  version: 1,
  exportedAt: '2026-10-22T00:00:00.000Z',
  data: {
    progress: [],
    attempts: [],
    mistakes: [
      { key: '1:A1', day: 1, questionId: 'A1', box: 1, due: '2026-10-23', wrongCount: 1, mastered: false, lastWrong: '2026-10-22' },
    ],
    notes: [{ day: 1, text: 'catatan', updatedAt: '2026-10-22T00:00:00.000Z' }],
  },
};

describe('parseBackupText', () => {
  it('menerima berkas ekspor yang valid', () => {
    const data = parseBackupText(JSON.stringify(valid));
    expect(data.mistakes).toHaveLength(1);
    expect(data.notes[0].text).toBe('catatan');
  });

  it('menolak teks yang bukan JSON', () => {
    expect(() => parseBackupText('bukan json')).toThrow('bukan JSON');
  });

  it('menolak format atau versi yang tidak dikenal', () => {
    expect(() => parseBackupText(JSON.stringify({ ...valid, format: 'lain' }))).toThrow('Format cadangan');
    expect(() => parseBackupText(JSON.stringify({ ...valid, version: 2 }))).toThrow('Format cadangan');
  });

  it('menolak baris dengan kotak Leitner di luar 1-4', () => {
    const broken = structuredClone(valid);
    broken.data.mistakes[0].box = 9;
    expect(() => parseBackupText(JSON.stringify(broken))).toThrow('Format cadangan');
  });
});
