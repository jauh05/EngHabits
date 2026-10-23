import { describe, expect, it } from 'vitest';
import { bankWeeks, loadBank } from './bank';

const ALL_WEEKS = Array.from({ length: 12 }, (_, index) => index + 1);

describe('bank Hard', () => {
  it('memuat 12 minggu', () => {
    expect(bankWeeks()).toEqual(ALL_WEEKS);
  });

  it('setiap minggu punya 30 soal sulit untuk minggu itu', async () => {
    for (const week of ALL_WEEKS) {
      const questions = await loadBank(week);
      expect(questions).toHaveLength(30);
      expect(questions?.every((question) => question.week === week && question.difficulty === 'hard')).toBe(true);
    }
  });

  it('kunci jawaban selalu salah satu opsi, dan id soal tidak ganda', async () => {
    const questions = (await loadBank(1)) ?? [];
    for (const question of questions) {
      expect(question.options.map((option) => option.id)).toContain(question.correct);
    }
    const ids = questions.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('minggu di luar 1 sampai 12 tidak tersedia', async () => {
    expect(await loadBank(0)).toBeUndefined();
    expect(await loadBank(13)).toBeUndefined();
  });
});
