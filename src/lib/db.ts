import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Answers, DayResult, Part } from './grading';
import { applyResult, mistakeKey, type MistakeEntry } from './srs';

export type DayProgress = {
  day: number;
  /** Tanggal selesai pertama, YYYY-MM-DD (lokal). */
  completedDate: string;
  completedAt: string;
  /** Skor inti percobaan pertama (menjadi nilai resmi untuk hari itu). */
  firstCorePercent: number;
  /** Skor inti terbaik dari semua percobaan. */
  bestCorePercent: number;
  /** Poin inti: jumlah soal benar pada percobaan pertama. */
  firstCorrect: number;
  /** Rincian per bagian dari percobaan pertama, dipakai untuk rata-rata skill. */
  firstParts: Record<Part, { correct: number; total: number }>;
  hardCorrect: number;
  hardTotal: number;
  attempts: number;
  lastAttemptAt: string;
};

export type Attempt = {
  id: string;
  day: number;
  n: number;
  createdAt: string;
  answers: Answers;
  corePercent: number;
  hardCorrect: number;
  hardTotal: number;
};

export type Settings = {
  theme: 'light' | 'dark';
  reduceMotion: boolean;
  accent: 'en-US' | 'en-GB';
  rate: number;
  /** Pengingat harian jam 06.00 saat aplikasi terbuka. */
  reminderEnabled: boolean;
  /** Tanggal pengingat terakhir ditampilkan, YYYY-MM-DD (lokal). */
  lastReminderDate: string;
  /** Nama panggilan. Hanya disimpan di perangkat ini, bukan akun. */
  name: string;
  /** Layar awal sudah dilewati, baik dengan memasukkan nama maupun dengan "Lewati". */
  onboarded: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  reduceMotion: false,
  accent: 'en-US',
  rate: 0.9,
  reminderEnabled: false,
  lastReminderDate: '',
  name: '',
  onboarded: false,
};

interface EngHabitsDB extends DBSchema {
  progress: { key: number; value: DayProgress };
  attempts: { key: string; value: Attempt; indexes: { 'by-day': number } };
  mistakes: { key: string; value: MistakeEntry; indexes: { 'by-day': number } };
  notes: { key: number; value: { day: number; text: string; updatedAt: string } };
  settings: { key: string; value: Settings };
}

const DB_NAME = 'enghabits';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<EngHabitsDB>> | undefined;

export function getDb(): Promise<IDBPDatabase<EngHabitsDB>> {
  dbPromise ??= openDB<EngHabitsDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore('progress', { keyPath: 'day' });
      const attempts = db.createObjectStore('attempts', { keyPath: 'id' });
      attempts.createIndex('by-day', 'day');
      const mistakes = db.createObjectStore('mistakes', { keyPath: 'key' });
      mistakes.createIndex('by-day', 'day');
      db.createObjectStore('notes', { keyPath: 'day' });
      db.createObjectStore('settings');
    },
  });
  return dbPromise;
}

export async function getAllProgress(): Promise<DayProgress[]> {
  return (await getDb()).getAll('progress');
}

export async function getAllMistakes(): Promise<MistakeEntry[]> {
  return (await getDb()).getAll('mistakes');
}

export async function getAttempts(day: number): Promise<Attempt[]> {
  const db = await getDb();
  const rows = await db.getAllFromIndex('attempts', 'by-day', day);
  return rows.sort((a, b) => a.n - b.n);
}

export async function getNote(day: number): Promise<string> {
  return (await (await getDb()).get('notes', day))?.text ?? '';
}

export async function saveNote(day: number, text: string): Promise<void> {
  await (await getDb()).put('notes', { day, text, updatedAt: new Date().toISOString() });
}

export async function getSettings(): Promise<Settings> {
  const stored = await (await getDb()).get('settings', 'app');
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function saveSettings(next: Settings): Promise<void> {
  await (await getDb()).put('settings', next, 'app');
}

/**
 * Simpan satu percobaan: catat attempt, perbarui progres harian, dan perbarui Buku Kesalahan.
 * Semuanya dalam satu transaksi supaya tidak ada data setengah tersimpan.
 */
export async function recordAttempt(
  day: number,
  answers: Answers,
  result: DayResult,
  today: string,
): Promise<{ attempt: Attempt; progress: DayProgress; isFirst: boolean }> {
  const db = await getDb();
  const tx = db.transaction(['attempts', 'progress', 'mistakes'], 'readwrite');
  const now = new Date().toISOString();

  const previousAttempts = await tx.objectStore('attempts').index('by-day').getAll(day);
  const n = previousAttempts.length + 1;
  const attempt: Attempt = {
    id: `${day}-${n}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    day,
    n,
    createdAt: now,
    answers,
    corePercent: result.corePercent,
    hardCorrect: result.hard.correct,
    hardTotal: result.hard.total,
  };
  await tx.objectStore('attempts').put(attempt);

  const existing = await tx.objectStore('progress').get(day);
  const isFirst = !existing;
  const progress: DayProgress = {
    day,
    completedDate: existing?.completedDate ?? today,
    completedAt: existing?.completedAt ?? now,
    firstCorePercent: existing?.firstCorePercent ?? result.corePercent,
    bestCorePercent: Math.max(existing?.bestCorePercent ?? 0, result.corePercent),
    firstCorrect: existing?.firstCorrect ?? result.core.correct,
    firstParts: existing?.firstParts ?? {
      comprehension: { ...result.parts.comprehension },
      partA: { ...result.parts.partA },
      partB: { ...result.parts.partB },
      hard: { ...result.parts.hard },
    },
    hardCorrect: existing?.hardCorrect ?? result.hard.correct,
    hardTotal: existing?.hardTotal ?? result.hard.total,
    attempts: n,
    lastAttemptAt: now,
  };
  await tx.objectStore('progress').put(progress);

  const mistakesStore = tx.objectStore('mistakes');
  for (const item of result.items) {
    const key = mistakeKey(day, item.id);
    const entry = await mistakesStore.get(key);
    const updated = applyResult(entry, day, item.id, item.correct, today);
    if (updated) await mistakesStore.put(updated);
  }

  await tx.done;
  return { attempt, progress, isFirst };
}

/** Simpan satu entri Buku Kesalahan, dipakai oleh sesi latihan perbaikan. */
export async function updateMistake(entry: MistakeEntry): Promise<void> {
  await (await getDb()).put('mistakes', entry);
}

/** Semua data belajar untuk diekspor. Pengaturan tampilan tidak ikut. */
export async function readAllData(): Promise<BackupData> {
  const db = await getDb();
  const [progress, attempts, mistakes, notes] = await Promise.all([
    db.getAll('progress'),
    db.getAll('attempts'),
    db.getAll('mistakes'),
    db.getAll('notes'),
  ]);
  return { progress, attempts, mistakes, notes };
}

/** Ganti seluruh data belajar dengan isi cadangan, dalam satu transaksi. */
export async function replaceAllData(data: BackupData): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['progress', 'attempts', 'mistakes', 'notes'], 'readwrite');
  await Promise.all([
    tx.objectStore('progress').clear(),
    tx.objectStore('attempts').clear(),
    tx.objectStore('mistakes').clear(),
    tx.objectStore('notes').clear(),
  ]);
  for (const row of data.progress) await tx.objectStore('progress').put(row);
  for (const row of data.attempts) await tx.objectStore('attempts').put(row);
  for (const row of data.mistakes) await tx.objectStore('mistakes').put(row);
  for (const row of data.notes) await tx.objectStore('notes').put(row);
  await tx.done;
}

export type BackupData = {
  progress: DayProgress[];
  attempts: Attempt[];
  mistakes: MistakeEntry[];
  notes: Array<{ day: number; text: string; updatedAt: string }>;
};

/** Hapus semua progres dan data belajar. Pengaturan tetap disimpan. */
export async function resetProgress(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['progress', 'attempts', 'mistakes', 'notes'], 'readwrite');
  await Promise.all([
    tx.objectStore('progress').clear(),
    tx.objectStore('attempts').clear(),
    tx.objectStore('mistakes').clear(),
    tx.objectStore('notes').clear(),
  ]);
  await tx.done;
}
