export const TOTAL_DAYS = 90;

/**
 * Skor inti terbaik minimal untuk membuka hari berikutnya. 60% dari 15 soal inti berarti 9 benar.
 * Gate memakai skor terbaik, jadi mengulang hari yang belum lulus bisa membukanya.
 */
export const MASTERY_THRESHOLD = 60;

/**
 * - `locked`: hari sebelumnya belum lulus.
 * - `available`: bisa dikerjakan, belum pernah dikirim.
 * - `repair`: sudah dikirim, tetapi skor inti terbaik belum mencapai ambang. Boleh diulang.
 * - `completed`: lulus. Hari berikutnya terbuka.
 * - `nocontent`: file kontennya belum ada.
 */
export type DayStatus = 'locked' | 'available' | 'repair' | 'completed' | 'nocontent';

export function isMastered(bestCorePercent: number): boolean {
  return bestCorePercent >= MASTERY_THRESHOLD;
}

/**
 * Status satu hari. Hari N+1 terkunci sampai hari N lulus (skor inti terbaik minimal ambang).
 * `completed` berisi hari yang sudah lulus. `hasContent` berisi hari yang file kontennya sudah ada.
 */
export function dayStatus(
  day: number,
  completed: ReadonlySet<number>,
  hasContent: ReadonlySet<number>,
  mastered: ReadonlySet<number>,
): DayStatus {
  if (mastered.has(day)) return 'completed';
  if (day !== 1 && !mastered.has(day - 1)) return 'locked';
  if (!hasContent.has(day)) return 'nocontent';
  if (completed.has(day)) return 'repair';
  return 'available';
}

/** Hari aktif berikutnya: hari pertama yang belum lulus. Undefined bila semua sudah lulus. */
export function currentDay(mastered: ReadonlySet<number>): number | undefined {
  for (let day = 1; day <= TOTAL_DAYS; day += 1) {
    if (!mastered.has(day)) return day;
  }
  return undefined;
}
