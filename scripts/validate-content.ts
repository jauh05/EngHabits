import { loadAllDays } from './load-days';

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

const total = results.length;
console.log(`\nRingkasan: ${total - failed} lolos, ${failed} gagal, dari ${total} file.`);

process.exit(failed > 0 ? 1 : 0);
