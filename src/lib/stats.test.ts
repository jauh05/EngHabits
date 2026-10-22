import { describe, expect, it } from 'vitest';
import type { DayProgress } from './db';
import { computeStats, readinessLevel, weakestPart } from './stats';
import type { MistakeEntry } from './srs';

function row(day: number, partial: Partial<DayProgress> = {}): DayProgress {
  return {
    day,
    completedDate: '2026-10-01',
    completedAt: '2026-10-01T06:00:00.000Z',
    firstCorePercent: 60,
    bestCorePercent: 60,
    firstCorrect: 9,
    firstParts: {
      comprehension: { correct: 2, total: 5 },
      partA: { correct: 3, total: 5 },
      partB: { correct: 4, total: 5 },
      hard: { correct: 1, total: 5 },
    },
    hardCorrect: 1,
    hardTotal: 5,
    attempts: 1,
    lastAttemptAt: '2026-10-01T06:00:00.000Z',
    ...partial,
  };
}

function mistake(key: string, mastered: boolean): MistakeEntry {
  return { key, day: 1, questionId: key, box: 1, due: '2026-10-02', wrongCount: 1, mastered, lastWrong: '2026-10-01' };
}

describe('computeStats', () => {
  it('kosong saat belum ada hari selesai', () => {
    const stats = computeStats([], []);
    expect(stats.completedDays).toBe(0);
    expect(stats.averageCorePercent).toBeUndefined();
    expect(stats.hardPercent).toBeUndefined();
    expect(stats.partPercents.partA).toBeUndefined();
  });

  it('menjumlahkan akurasi per bagian dari semua hari', () => {
    const stats = computeStats([row(1), row(2, { firstCorePercent: 80 })], [mistake('1:A1', false), mistake('2:A2', true)]);
    expect(stats.completedDays).toBe(2);
    expect(stats.averageCorePercent).toBe(70);
    expect(stats.partPercents.comprehension).toBe(40);
    expect(stats.partPercents.partB).toBe(80);
    expect(stats.hardPercent).toBe(20);
    expect(stats.activeMistakes).toBe(1);
    expect(stats.masteredMistakes).toBe(1);
  });
});

describe('readinessLevel', () => {
  it('memetakan persentase ke label', () => {
    expect(readinessLevel(40)).toBe('perlu-banyak-latihan');
    expect(readinessLevel(50)).toBe('berkembang');
    expect(readinessLevel(70)).toBe('cukup-kuat');
    expect(readinessLevel(85)).toBe('kuat');
  });
});

describe('weakestPart', () => {
  it('memilih bagian dengan akurasi terendah yang sudah dijawab', () => {
    const stats = computeStats([row(1)], []);
    expect(weakestPart(stats.partPercents)).toBe('hard');
  });

  it('undefined bila belum ada jawaban', () => {
    expect(weakestPart(computeStats([], []).partPercents)).toBeUndefined();
  });
});
