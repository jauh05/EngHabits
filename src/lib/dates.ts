/** Tanggal lokal dalam format YYYY-MM-DD. */
export function localISO(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Tambah n hari ke tanggal YYYY-MM-DD (n boleh negatif). Aman dari zona waktu. */
export function addDays(iso: string, n: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + n)).toISOString().slice(0, 10);
}

/** Jumlah hari berurutan yang selesai, dihitung mundur dari hari ini. Hari ini boleh belum selesai. */
export function computeStreak(completedDates: ReadonlySet<string>, today: string): number {
  let cursor = completedDates.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (completedDates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
