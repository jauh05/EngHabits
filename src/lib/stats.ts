import type { DayProgress } from './db';
import type { Part } from './grading';
import type { MistakeEntry } from './srs';

/** Jumlah hari selesai minimum sebelum laporan kesiapan menampilkan perkiraan. */
export const MIN_DAYS_FOR_READINESS = 7;

export const PART_LABELS: Record<Part, string> = {
  comprehension: 'Membaca dan mendengarkan',
  partA: 'Kosakata dan tata bahasa',
  partB: 'Terjemahan',
  hard: 'Hard Challenge',
};

export type PartPercents = Record<Part, number | undefined>;

export type Stats = {
  completedDays: number;
  /** Rata-rata skor inti percobaan pertama, 0-100. Undefined bila belum ada hari selesai. */
  averageCorePercent: number | undefined;
  /** Akurasi per bagian dari percobaan pertama, 0-100. Undefined bila bagian itu belum dijawab. */
  partPercents: PartPercents;
  /** Akurasi Hard Challenge dari percobaan pertama, 0-100. */
  hardPercent: number | undefined;
  activeMistakes: number;
  masteredMistakes: number;
};

function percent(correct: number, total: number): number | undefined {
  if (total === 0) return undefined;
  return Math.round((correct / total) * 100);
}

export function computeStats(progress: DayProgress[], mistakes: MistakeEntry[]): Stats {
  const sums: Record<Part, { correct: number; total: number }> = {
    comprehension: { correct: 0, total: 0 },
    partA: { correct: 0, total: 0 },
    partB: { correct: 0, total: 0 },
    hard: { correct: 0, total: 0 },
  };
  let hardCorrect = 0;
  let hardTotal = 0;
  let coreSum = 0;

  for (const row of progress) {
    coreSum += row.firstCorePercent;
    for (const part of Object.keys(sums) as Part[]) {
      sums[part].correct += row.firstParts[part].correct;
      sums[part].total += row.firstParts[part].total;
    }
    hardCorrect += row.hardCorrect;
    hardTotal += row.hardTotal;
  }

  const partPercents = {} as PartPercents;
  for (const part of Object.keys(sums) as Part[]) {
    partPercents[part] = percent(sums[part].correct, sums[part].total);
  }

  return {
    completedDays: progress.length,
    averageCorePercent: progress.length === 0 ? undefined : Math.round(coreSum / progress.length),
    partPercents,
    hardPercent: percent(hardCorrect, hardTotal),
    activeMistakes: mistakes.filter((entry) => !entry.mastered).length,
    masteredMistakes: mistakes.filter((entry) => entry.mastered).length,
  };
}

export type ReadinessLevel = 'perlu-banyak-latihan' | 'berkembang' | 'cukup-kuat' | 'kuat';

export function readinessLevel(value: number): ReadinessLevel {
  if (value >= 85) return 'kuat';
  if (value >= 70) return 'cukup-kuat';
  if (value >= 50) return 'berkembang';
  return 'perlu-banyak-latihan';
}

export const READINESS_LABELS: Record<ReadinessLevel, string> = {
  'perlu-banyak-latihan': 'Perlu banyak latihan',
  berkembang: 'Berkembang',
  'cukup-kuat': 'Cukup kuat',
  kuat: 'Kuat',
};

/** Bagian terlemah yang sudah punya jawaban. Undefined bila belum ada data. */
export function weakestPart(percents: PartPercents): Part | undefined {
  const measured = (Object.keys(percents) as Part[]).filter((part) => percents[part] !== undefined);
  if (measured.length === 0) return undefined;
  return measured.reduce((weakest, part) => (percents[part]! < percents[weakest]! ? part : weakest));
}
