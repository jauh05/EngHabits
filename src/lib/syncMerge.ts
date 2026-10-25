import type { BackupData } from './db';
import type { DayProgress } from './db';
import type { MistakeEntry } from './srs';

/**
 * Aturan penggabungan progres. Harus sama dengan server/sync.mjs supaya perangkat dan server selalu sepakat.
 * Hari pertama yang lulus menjadi acuan, nilai terbaik diambil, percobaan tidak pernah berubah,
 * Buku Kesalahan memakai entri yang terakhir salah, dan catatan memakai yang paling baru.
 */
type Note = BackupData['notes'][number];

function mergeProgress(a: DayProgress, b: DayProgress): DayProgress {
  const first = a.completedAt <= b.completedAt ? a : b;
  return {
    ...first,
    bestCorePercent: Math.max(a.bestCorePercent, b.bestCorePercent),
    attempts: Math.max(a.attempts, b.attempts),
    lastAttemptAt: a.lastAttemptAt >= b.lastAttemptAt ? a.lastAttemptAt : b.lastAttemptAt,
  };
}

function mergeMistake(a: MistakeEntry, b: MistakeEntry): MistakeEntry {
  if (a.lastWrong !== b.lastWrong) return a.lastWrong > b.lastWrong ? a : b;
  return a.wrongCount >= b.wrongCount ? a : b;
}

function mergeNote(a: Note, b: Note): Note {
  return a.updatedAt >= b.updatedAt ? a : b;
}

/** Menggabungkan dua kumpulan data berdasarkan kunci masing-masing baris. */
function mergeList<T>(local: T[], remote: T[], keyOf: (row: T) => string, merge: (a: T, b: T) => T): T[] {
  const map = new Map<string, T>();
  for (const row of local) map.set(keyOf(row), row);
  for (const row of remote) {
    const key = keyOf(row);
    const current = map.get(key);
    map.set(key, current ? merge(current, row) : row);
  }
  return [...map.values()];
}

export function mergeData(local: BackupData, remote: BackupData): BackupData {
  return {
    progress: mergeList(local.progress, remote.progress, (row) => String(row.day), mergeProgress),
    attempts: mergeList(local.attempts, remote.attempts, (row) => row.id, (a) => a),
    mistakes: mergeList(local.mistakes, remote.mistakes, (row) => row.key, mergeMistake),
    notes: mergeList(local.notes, remote.notes, (row) => String(row.day), mergeNote),
  };
}
