import type { BankQuestion } from '../../content/schema';

/** File bank Hard dimuat lazy, satu chunk per minggu, seperti file hari. */
const loaders = import.meta.glob<BankQuestion[]>('../../content/bank/week-*.json', { import: 'default' });

function weekFromPath(path: string): number {
  return Number(path.match(/week-(\d+)\.json$/)?.[1]);
}

/** Daftar minggu yang file banknya ada, urut. */
export function bankWeeks(): number[] {
  return Object.keys(loaders).map(weekFromPath).sort((a, b) => a - b);
}

/** Muat soal satu minggu, termasuk kunci jawaban dan penjelasan, karena latihan ini memeriksa jawaban langsung. */
export async function loadBank(week: number): Promise<BankQuestion[] | undefined> {
  const path = Object.keys(loaders).find((key) => weekFromPath(key) === week);
  if (!path) return undefined;
  return loaders[path]();
}
