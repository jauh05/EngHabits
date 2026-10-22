import { describe, expect, it } from 'vitest';
import { addDays, computeStreak } from './dates';
import { applyResult, isDue, MAX_BOX } from './srs';
import { currentDay, dayStatus, isMastered, MASTERY_THRESHOLD } from './progression';

describe('dayStatus', () => {
  const content = new Set([1, 2, 3]);
  const none = new Set<number>();

  it('hari 1 selalu tersedia bila kontennya ada', () => {
    expect(dayStatus(1, none, content, none)).toBe('available');
  });

  it('hari N+1 terkunci sampai hari N lulus, bukan hanya dikirim', () => {
    expect(dayStatus(2, none, content, none)).toBe('locked');
    expect(dayStatus(2, new Set([1]), content, none)).toBe('locked');
    expect(dayStatus(2, new Set([1]), content, new Set([1]))).toBe('available');
  });

  it('hari yang sudah dikirim tetapi belum lulus berstatus repair', () => {
    expect(dayStatus(1, new Set([1]), content, none)).toBe('repair');
  });

  it('hari yang sudah lulus tetap completed', () => {
    expect(dayStatus(1, new Set([1]), content, new Set([1]))).toBe('completed');
  });

  it('hari tanpa konten ditandai nocontent, bukan terkunci', () => {
    expect(dayStatus(4, new Set([1, 2, 3]), content, new Set([1, 2, 3]))).toBe('nocontent');
  });
});

describe('isMastered', () => {
  it('ambang 60% skor inti, 9 dari 15 soal', () => {
    expect(MASTERY_THRESHOLD).toBe(60);
    expect(isMastered(59)).toBe(false);
    expect(isMastered(60)).toBe(true);
  });
});

describe('currentDay', () => {
  it('mengembalikan hari pertama yang belum lulus', () => {
    expect(currentDay(new Set())).toBe(1);
    expect(currentDay(new Set([1, 2]))).toBe(3);
  });

  it('undefined setelah hari 90 selesai', () => {
    expect(currentDay(new Set(Array.from({ length: 90 }, (_, i) => i + 1)))).toBeUndefined();
  });
});

describe('computeStreak', () => {
  const today = '2026-10-21';

  it('menghitung dari hari ini bila hari ini sudah selesai', () => {
    expect(computeStreak(new Set(['2026-10-19', '2026-10-20', '2026-10-21']), today)).toBe(3);
  });

  it('streak tetap hidup bila hari ini belum selesai tapi kemarin ya', () => {
    expect(computeStreak(new Set(['2026-10-19', '2026-10-20']), today)).toBe(2);
  });

  it('putus bila ada hari yang terlewat', () => {
    expect(computeStreak(new Set(['2026-10-18', '2026-10-20']), today)).toBe(1);
  });
});

describe('addDays', () => {
  it('melewati batas bulan dan tahun', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('Buku Kesalahan (SRS)', () => {
  const today = '2026-10-21';

  it('jawaban salah masuk kotak 1 dan jatuh tempo besok', () => {
    const entry = applyResult(undefined, 1, 'R4', false, today);
    expect(entry).toMatchObject({ key: '1:R4', box: 1, due: '2026-10-22', wrongCount: 1, mastered: false });
  });

  it('benar naik kotak dengan jadwal +3, +7, +14, lalu terkuasai', () => {
    let entry = applyResult(undefined, 1, 'R4', false, today);
    entry = applyResult(entry, 1, 'R4', true, today);
    expect(entry).toMatchObject({ box: 2, due: '2026-10-24' });
    entry = applyResult(entry, 1, 'R4', true, today);
    expect(entry).toMatchObject({ box: 3, due: '2026-10-28' });
    entry = applyResult(entry, 1, 'R4', true, today);
    expect(entry).toMatchObject({ box: MAX_BOX, due: '2026-11-04' });
    entry = applyResult(entry, 1, 'R4', true, today);
    expect(entry).toMatchObject({ mastered: true });
  });

  it('jawaban benar untuk soal yang tidak ada di buku tidak membuat entri', () => {
    expect(applyResult(undefined, 1, 'R1', true, today)).toBeUndefined();
  });

  it('isDue hanya true bila jatuh tempo dan belum terkuasai', () => {
    const entry = applyResult(undefined, 1, 'R4', false, today)!;
    expect(isDue(entry, '2026-10-21')).toBe(false);
    expect(isDue(entry, '2026-10-22')).toBe(true);
    expect(isDue({ ...entry, mastered: true }, '2026-12-01')).toBe(false);
  });
});
