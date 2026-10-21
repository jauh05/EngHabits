import { addDays } from './dates';

/** Leitner sederhana: kotak 1 sampai 4. Jadwal ulang: +1, +3, +7, +14 hari. */
export const MAX_BOX = 4;
export const BOX_INTERVAL_DAYS = [1, 3, 7, 14] as const;

export type MistakeEntry = {
  /** `${day}:${questionId}` */
  key: string;
  day: number;
  questionId: string;
  box: number;
  /** Tanggal jatuh tempo, YYYY-MM-DD. */
  due: string;
  wrongCount: number;
  mastered: boolean;
  lastWrong: string;
};

export function mistakeKey(day: number, questionId: string): string {
  return `${day}:${questionId}`;
}

/**
 * Terapkan satu hasil jawaban ke entri Buku Kesalahan.
 * Salah: masuk kotak 1 dan jatuh tempo besok. Benar: naik satu kotak.
 * Benar di kotak 4 berarti terkuasai. Jawaban benar untuk soal yang tidak ada di buku tidak menambah apa pun.
 */
export function applyResult(
  entry: MistakeEntry | undefined,
  day: number,
  questionId: string,
  correct: boolean,
  today: string,
): MistakeEntry | undefined {
  if (!correct) {
    return {
      key: mistakeKey(day, questionId),
      day,
      questionId,
      box: 1,
      due: addDays(today, BOX_INTERVAL_DAYS[0]),
      wrongCount: (entry?.wrongCount ?? 0) + 1,
      mastered: false,
      lastWrong: today,
    };
  }
  if (!entry || entry.mastered) return entry;

  const nextBox = entry.box + 1;
  if (nextBox > MAX_BOX) {
    return { ...entry, box: MAX_BOX, mastered: true, due: today };
  }
  return {
    ...entry,
    box: nextBox,
    due: addDays(today, BOX_INTERVAL_DAYS[nextBox - 1]),
  };
}

export function isDue(entry: MistakeEntry, today: string): boolean {
  return !entry.mastered && entry.due <= today;
}
