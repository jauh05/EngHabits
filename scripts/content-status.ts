import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { WEEK_RANGES } from '../content/schema';
import { loadAllDays } from './load-days';

const OUTPUT = fileURLToPath(new URL('../CONTENT_STATUS.md', import.meta.url));

const results = new Map(loadAllDays().map((result) => [result.day, result]));

function weekFor(day: number): number {
  return WEEK_RANGES.find(([, from, to]) => day >= from && day <= to)?.[0] ?? 0;
}

const lines: string[] = [];
let ok = 0;
let failed = 0;
let missing = 0;

lines.push('# CONTENT STATUS', '');
lines.push('Dibuat oleh `npm run content:status`. Jangan diedit manual.', '');
lines.push('| Hari | Minggu | Status |', '| --- | --- | --- |');

for (let day = 1; day <= 90; day += 1) {
  const result = results.get(day);
  let status: string;
  if (!result) {
    status = 'Belum ada';
    missing += 1;
  } else if (result.issues.length === 0) {
    status = 'Lolos validator';
    ok += 1;
  } else {
    status = `Gagal (${result.issues.length} error)`;
    failed += 1;
  }
  lines.push(`| ${day} | ${weekFor(day)} | ${status} |`);
}

lines.push('', `Ringkasan: ${ok} lolos, ${failed} gagal, ${missing} belum ada, dari 90 hari.`, '');

writeFileSync(OUTPUT, lines.join('\n'));
console.log(`CONTENT_STATUS.md ditulis: ${ok} lolos, ${failed} gagal, ${missing} belum ada.`);
