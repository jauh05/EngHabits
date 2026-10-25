import { describe, expect, it } from 'vitest';
import { mergeData } from './syncMerge';
import type { BackupData } from './db';

const empty: BackupData = { progress: [], attempts: [], mistakes: [], notes: [] };

const row = (day: number, bestCorePercent: number, completedAt: string) => ({
  day,
  completedDate: '2026-10-01',
  completedAt,
  firstCorePercent: 50,
  bestCorePercent,
  firstCorrect: 8,
  firstParts: {} as never,
  hardCorrect: 0,
  hardTotal: 0,
  attempts: 1,
  lastAttemptAt: completedAt,
});

describe('mergeData', () => {
  it('nilai terbaik dan hari pertama lulus dipertahankan dari kedua perangkat', () => {
    const local = { ...empty, progress: [row(1, 70, '2026-10-01T10:00:00.000Z')] };
    const remote = { ...empty, progress: [row(1, 85, '2026-10-02T10:00:00.000Z'), row(2, 65, '2026-10-02T11:00:00.000Z')] };
    const merged = mergeData(local, remote);
    const day1 = merged.progress.find((item) => item.day === 1);
    expect(day1?.bestCorePercent).toBe(85);
    expect(day1?.completedAt).toBe('2026-10-01T10:00:00.000Z');
    expect(merged.progress.map((item) => item.day).sort()).toEqual([1, 2]);
  });

  it('percobaan digabung berdasarkan id dan catatan yang paling baru menang', () => {
    const local = { ...empty, notes: [{ day: 1, text: 'lama', updatedAt: '2026-10-01T00:00:00.000Z' }] };
    const remote = {
      ...empty,
      notes: [{ day: 1, text: 'baru', updatedAt: '2026-10-02T00:00:00.000Z' }],
      attempts: [{ id: 'x', day: 1, n: 1, createdAt: '', answers: {}, corePercent: 0, hardCorrect: 0, hardTotal: 0 }],
    };
    const merged = mergeData(local, remote);
    expect(merged.notes[0].text).toBe('baru');
    expect(merged.attempts).toHaveLength(1);
  });
});
