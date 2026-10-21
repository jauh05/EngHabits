import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadAllDays, DAYS_DIR } from './load-days';
import { validateBank } from './content-rules';

const results = loadAllDays();

if (results.length === 0) {
  console.error('Tidak ada file di content/days/. Jalankan lagi setelah konten dibuat.');
  process.exit(1);
}

const okRanges: Array<[number, number]> = [];
let failed = 0;

for (const result of results) {
  if (result.issues.length === 0) {
    const last = okRanges[okRanges.length - 1];
    if (last && last[1] === result.day - 1) last[1] = result.day;
    else okRanges.push([result.day, result.day]);
    continue;
  }
  failed += 1;
  console.log(`Hari ${result.day}: GAGAL (${result.issues.length} error)`);
  for (const issue of result.issues) console.log(`  - ${issue}`);
}

for (const [from, to] of okRanges) {
  console.log(from === to ? `Hari ${from} OK` : `Hari ${from}-${to} OK`);
}

// Bank soal per minggu: content/bank/week-XX.json
const BANK_DIR = join(DAYS_DIR, '..', 'bank');
let bankFailed = 0;
if (existsSync(BANK_DIR)) {
  const files = readdirSync(BANK_DIR).filter((name) => /^week-\d{2}\.json$/.test(name)).sort();
  for (const file of files) {
    const week = Number(file.slice(5, 7));
    const issues = validateBank(JSON.parse(readFileSync(join(BANK_DIR, file), 'utf8')), week);
    if (issues.length === 0) {
      console.log(`Bank minggu ${week} OK`);
      continue;
    }
    bankFailed += 1;
    console.log(`Bank minggu ${week}: GAGAL (${issues.length} error)`);
    for (const issue of issues) console.log(`  - ${issue}`);
  }
}

const total = results.length;
console.log(`\nRingkasan: ${total - failed} hari lolos, ${failed} hari gagal, dari ${total} file.`);
process.exit(failed > 0 || bankFailed > 0 ? 1 : 0);
