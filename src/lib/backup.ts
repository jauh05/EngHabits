import { z } from 'zod';
import { readAllData, replaceAllData, type BackupData } from './db';

const FORMAT = 'enghabits-backup';
const VERSION = 1;

const partScore = z.object({ correct: z.number().int().min(0), total: z.number().int().min(0) });

const progressRow = z.object({
  day: z.number().int().min(1).max(90),
  completedDate: z.string(),
  completedAt: z.string(),
  firstCorePercent: z.number(),
  bestCorePercent: z.number(),
  firstCorrect: z.number().int(),
  firstParts: z.object({ comprehension: partScore, partA: partScore, partB: partScore, hard: partScore }),
  hardCorrect: z.number().int(),
  hardTotal: z.number().int(),
  attempts: z.number().int(),
  lastAttemptAt: z.string(),
});

const attemptRow = z.object({
  id: z.string(),
  day: z.number().int(),
  n: z.number().int(),
  createdAt: z.string(),
  answers: z.record(z.string(), z.string()),
  corePercent: z.number(),
  hardCorrect: z.number().int(),
  hardTotal: z.number().int(),
});

const mistakeRow = z.object({
  key: z.string(),
  day: z.number().int(),
  questionId: z.string(),
  box: z.number().int().min(1).max(4),
  due: z.string(),
  wrongCount: z.number().int(),
  mastered: z.boolean(),
  lastWrong: z.string(),
});

const noteRow = z.object({ day: z.number().int(), text: z.string(), updatedAt: z.string() });

const backupSchema = z.object({
  format: z.literal(FORMAT),
  version: z.literal(VERSION),
  exportedAt: z.string(),
  data: z.object({
    progress: z.array(progressRow),
    attempts: z.array(attemptRow),
    mistakes: z.array(mistakeRow),
    notes: z.array(noteRow),
  }),
});

/** Isi berkas cadangan JSON dari data belajar yang tersimpan. */
export async function buildBackupText(): Promise<string> {
  const data = await readAllData();
  return JSON.stringify({ format: FORMAT, version: VERSION, exportedAt: new Date().toISOString(), data }, null, 2);
}

/** Baca dan periksa berkas cadangan. Melempar Error berbahasa Indonesia bila tidak valid. */
export function parseBackupText(text: string): BackupData {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('Berkas bukan JSON yang valid.');
  }
  const parsed = backupSchema.safeParse(json);
  if (!parsed.success) throw new Error('Format cadangan tidak dikenali. Pastikan berkas berasal dari ekspor EngHabits.');
  return parsed.data.data;
}

/** Terapkan cadangan yang sudah lolos pemeriksaan. Menggantikan seluruh data belajar. */
export async function applyBackup(data: BackupData): Promise<void> {
  await replaceAllData(data);
}
