import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Day } from '../content/schema';
import { validateDay, type DayCheck } from './content-rules';

export const DAYS_DIR = fileURLToPath(new URL('../content/days/', import.meta.url));

/** Baca dan validasi semua file content/days/day-XX.json, berurutan dari hari 1. */
export function loadAllDays(dir: string = DAYS_DIR): DayCheck[] {
  const files = readdirSync(dir)
    .filter((name) => /^day-\d{2}\.json$/.test(name))
    .sort();

  const parsedSoFar: Day[] = [];
  const results: DayCheck[] = [];

  for (const file of files) {
    const day = Number(file.slice(4, 6));
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    } catch (error) {
      results.push({ day, issues: [`JSON tidak valid: ${(error as Error).message}`] });
      continue;
    }
    const check = validateDay(raw, day, parsedSoFar);
    if (check.parsed) parsedSoFar.push(check.parsed);
    results.push(check);
  }

  return results;
}
