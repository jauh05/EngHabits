// Memeriksa bank soal battle di content/battle/.
// Aturan: setiap soal lolos schema, setiap hari punya komposisi tetap, dan tidak ada soal yang sama dengan
// materi hari 1–90 atau bank Hard. Jalankan: npx tsx scripts/validate-battle.ts
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { battleItemSchema, type BattleItem } from '../content/schema';
import { normalizeAnswer } from '../content/normalize';

const CONTENT = fileURLToPath(new URL('../content/', import.meta.url));
const BATTLE_DIR = join(CONTENT, 'battle');
const DAYS_DIR = join(CONTENT, 'days');
const BANK_DIR = join(CONTENT, 'bank');

/** Komposisi per hari. Pilihan ganda dibagi dua untuk tata bahasa dan kosakata. */

const errors: string[] = [];
const fail = (message: string) => errors.push(message);

function readJsonFiles(dir: string): Array<{ name: string; data: unknown }> {
  return readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => ({ name, data: JSON.parse(readFileSync(join(dir, name), 'utf8')) }));
}

/** Kunci pembanding: teks soal, atau teks soal ditambah opsi untuk pilihan ganda. */
function keyOf(prompt: string, options?: Array<{ text: string }>): string {
  const body = options ? `${prompt} ${options.map((option) => option.text).join(' ')}` : prompt;
  return normalizeAnswer(body);
}

// Kumpulkan semua soal dari materi hari dan bank Hard.
const existing = new Map<string, string>();
for (const { name, data } of readJsonFiles(DAYS_DIR)) {
  const day = data as Record<string, any>;
  const blocks = [day.block3?.questions ?? [], day.block4?.partA ?? [], day.block4?.hardChallenge ?? []];
  for (const list of blocks) {
    for (const question of list) existing.set(keyOf(question.prompt, question.options), `${name} ${question.id}`);
  }
  for (const task of day.block4?.partB ?? []) existing.set(keyOf(task.promptId), `${name} ${task.id}`);
}
for (const { name, data } of readJsonFiles(BANK_DIR)) {
  for (const question of data as Array<Record<string, any>>) {
    existing.set(keyOf(question.prompt, question.options), `${name} ${question.id}`);
  }
}

// Periksa setiap soal battle.
const items: BattleItem[] = [];
const seenIds = new Set<string>();
const seenKeys = new Map<string, string>();
for (const { name, data } of readJsonFiles(BATTLE_DIR)) {
  if (!Array.isArray(data)) {
    fail(`${name}: harus berupa daftar soal`);
    continue;
  }
  for (const raw of data) {
    const parsed = battleItemSchema.safeParse(raw);
    if (!parsed.success) {
      const id = (raw as { id?: string }).id ?? '(tanpa id)';
      fail(`${name} ${id}: ${parsed.error.issues.map((issue) => issue.message).join('; ')}`);
      continue;
    }
    const item = parsed.data;
    if (seenIds.has(item.id)) fail(`${item.id}: id ganda`);
    seenIds.add(item.id);
    const key = keyOf(item.prompt, item.options);
    const clash = existing.get(key) ?? seenKeys.get(key);
    if (clash) fail(`${item.id}: teks soal sama dengan ${clash}`);
    seenKeys.set(key, item.id);
    if (/todo|tbd|lorem|isi nanti|\.\.\./i.test(JSON.stringify(item))) fail(`${item.id}: ada teks placeholder`);
    items.push(item);
  }
}

// Periksa komposisi per hari. Setiap hari minimal punya jumlah minimum per jenis; kelebihan diperbolehkan.
const MIN_PER_DAY = { mcq: 4, grammar: 2, vocab: 2, translate: 2, story: 1, listen: 1, reorder: 1 };
for (let day = 1; day <= 90; day += 1) {
  const today = items.filter((item) => item.day === day);
  if (today.length === 0) continue;
  if (today.length < 9) fail(`hari ${day}: hanya ${today.length} soal, minimal 9`);
  const count = (predicate: (item: BattleItem) => boolean) => today.filter(predicate).length;
  const mcq = count((item) => item.type === 'mcq');
  if (mcq < MIN_PER_DAY.mcq) fail(`hari ${day}: pilihan ganda ${mcq}, minimal ${MIN_PER_DAY.mcq}`);
  const grammar = count((item) => item.type === 'mcq' && item.tag === 'grammar');
  const vocab = count((item) => item.type === 'mcq' && item.tag === 'vocab');
  if (grammar < MIN_PER_DAY.grammar) fail(`hari ${day}: tata bahasa ${grammar}, minimal ${MIN_PER_DAY.grammar}`);
  if (vocab < MIN_PER_DAY.vocab) fail(`hari ${day}: kosakata ${vocab}, minimal ${MIN_PER_DAY.vocab}`);
  for (const type of ['translate', 'story', 'listen', 'reorder'] as const) {
    const total = count((item) => item.type === type);
    if (total < MIN_PER_DAY[type]) fail(`hari ${day}: ${type} ${total}, minimal ${MIN_PER_DAY[type]}`);
  }
  const essays = count((item) => item.type === 'essay');
  if (essays > 1) fail(`hari ${day}: esai ${essays}, paling banyak 1`);
}

if (errors.length > 0) {
  console.error(`Bank battle belum lolos (${errors.length} masalah):`);
  for (const message of errors) console.error(`- ${message}`);
  process.exit(1);
}
console.log(`Bank battle lolos: ${items.length} soal untuk ${new Set(items.map((item) => item.day)).size} hari.`);
