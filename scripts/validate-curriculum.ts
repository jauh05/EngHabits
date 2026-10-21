import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { monthOfWeek, weekOfDay } from '../content/schema';
import { normalizeAnswer } from '../content/normalize';

type CurriculumDay = {
  day: number;
  week: number;
  month: number;
  title: string;
  topic: string;
  skillFocus: 'reading' | 'listening' | 'review' | 'exam';
  vocab: string[];
  summary: string;
  youtubeKeywords: string[];
};

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const CURRICULUM = join(ROOT, 'content', 'curriculum.json');
const DAYS_DIR = join(ROOT, 'content', 'days');
const PLACEHOLDER = /\bTODO\b|\bTBD\b|lorem|\.\.\.|\bdst\b|isi nanti/i;

const issues: string[] = [];
const curriculum = JSON.parse(readFileSync(CURRICULUM, 'utf8')) as { days: CurriculumDay[]; weeks: unknown[] };

if (curriculum.days.length !== 90) issues.push(`harus 90 hari (ditemukan ${curriculum.days.length})`);
if (curriculum.weeks.length !== 12) issues.push(`harus 12 minggu (ditemukan ${curriculum.weeks.length})`);

const seenVocab = new Map<string, number>();

curriculum.days.forEach((row, index) => {
  const where = `hari ${row.day}`;
  if (row.day !== index + 1) issues.push(`${where}: nomor hari tidak berurutan`);
  if (weekOfDay(row.day) !== row.week) issues.push(`${where}: minggu ${row.week} tidak sesuai rentang`);
  if (monthOfWeek(row.week) !== row.month) issues.push(`${where}: bulan ${row.month} tidak sesuai minggu`);

  const isReviewOrExam = row.skillFocus === 'review' || row.skillFocus === 'exam';
  if (!isReviewOrExam) {
    const expected = row.day % 2 === 1 ? 'reading' : 'listening';
    if (row.skillFocus !== expected) issues.push(`${where}: skillFocus ${row.skillFocus}, pola seharusnya ${expected}`);
  }

  if (row.vocab.length !== 10) issues.push(`${where}: kosakata harus 10 (ditemukan ${row.vocab.length})`);
  const local = new Set(row.vocab.map(normalizeAnswer));
  if (local.size !== row.vocab.length) issues.push(`${where}: kosakata duplikat di dalam satu hari`);

  if (!isReviewOrExam) {
    for (const word of row.vocab) {
      const key = normalizeAnswer(word);
      const previous = seenVocab.get(key);
      if (previous !== undefined) issues.push(`${where}: kosakata "${word}" sudah dipakai di hari ${previous}`);
      else seenVocab.set(key, row.day);
    }
  }

  if (!row.title.trim()) issues.push(`${where}: judul kosong`);
  if (!row.summary.trim()) issues.push(`${where}: ringkasan kosong`);
  if (row.youtubeKeywords.length < 2) issues.push(`${where}: kata kunci YouTube minimal 2`);
  const text = [row.title, row.topic, row.summary, ...row.vocab, ...row.youtubeKeywords].join(' ');
  if (PLACEHOLDER.test(text)) issues.push(`${where}: placeholder terdeteksi`);
});

// Hari yang sudah punya file konten harus memakai kosakata yang sama dengan kurikulum.
const curriculumByDay = new Map(curriculum.days.map((row) => [row.day, row]));
const dayFiles = existsSync(DAYS_DIR) ? readdirSync(DAYS_DIR).filter((name) => /^day-\d{2}\.json$/.test(name)) : [];
for (const file of dayFiles) {
  const day = Number(file.slice(4, 6));
  const row = curriculumByDay.get(day);
  if (!row) continue;
  const content = JSON.parse(readFileSync(join(DAYS_DIR, file), 'utf8')) as { block1: { vocab: Array<{ en: string }> } };
  const fromFile = new Set(content.block1.vocab.map((item) => normalizeAnswer(item.en)));
  const fromCurriculum = new Set(row.vocab.map(normalizeAnswer));
  const same = fromFile.size === fromCurriculum.size && [...fromFile].every((word) => fromCurriculum.has(word));
  if (!same) issues.push(`hari ${day}: kosakata di file konten tidak sama dengan kurikulum`);
}

if (issues.length === 0) {
  console.log(`curriculum.json OK: 90 hari, ${seenVocab.size} kosakata unik (di luar review dan exam).`);
  process.exit(0);
}

console.log(`curriculum.json GAGAL (${issues.length} masalah):`);
for (const issue of issues) console.log(`  - ${issue}`);
process.exit(1);
