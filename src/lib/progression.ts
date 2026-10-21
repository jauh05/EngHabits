export const TOTAL_DAYS = 90;

export type DayStatus = 'locked' | 'available' | 'completed' | 'nocontent';

/**
 * Status satu hari. Hari N+1 terkunci sampai hari N selesai dikirim dan dievaluasi.
 * `hasContent` berisi hari yang file kontennya sudah ada.
 */
export function dayStatus(day: number, completed: ReadonlySet<number>, hasContent: ReadonlySet<number>): DayStatus {
  if (completed.has(day)) return 'completed';
  if (day !== 1 && !completed.has(day - 1)) return 'locked';
  if (!hasContent.has(day)) return 'nocontent';
  return 'available';
}

/** Hari aktif berikutnya: hari pertama yang belum selesai. Undefined bila semua sudah selesai. */
export function currentDay(completed: ReadonlySet<number>): number | undefined {
  for (let day = 1; day <= TOTAL_DAYS; day += 1) {
    if (!completed.has(day)) return day;
  }
  return undefined;
}
