import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateDay } from './content-rules';

const base = JSON.parse(readFileSync(new URL('../content/days/day-01.json', import.meta.url), 'utf8')) as Record<string, any>;

function clone(): Record<string, any> {
  return structuredClone(base);
}

describe('validateDay', () => {
  it('day-01 contoh lolos semua aturan', () => {
    const result = validateDay(clone(), 1, []);
    expect(result.issues).toEqual([]);
  });

  it('menolak jika correct tidak ada di opsi', () => {
    const day = clone();
    day.block4.partA[0].correct = 'Z';
    const { issues } = validateDay(day, 1, []);
    expect(issues.some((issue) => issue.includes('tidak ada di opsi'))).toBe(true);
  });

  it('menolak jika semua jawaban benar sama', () => {
    const day = clone();
    for (const question of [...day.block3.questions, ...day.block4.partA, ...day.block4.hardChallenge]) {
      question.correct = question.options[0].id;
    }
    const { issues } = validateDay(day, 1, []);
    expect(issues.some((issue) => issue.includes('jawaban benar sama semua'))).toBe(true);
  });

  it('menolak placeholder seperti TODO atau titik tiga', () => {
    const day = clone();
    day.title = 'TODO isi judul';
    const { issues } = validateDay(day, 1, []);
    expect(issues.some((issue) => issue.includes('placeholder'))).toBe(true);
  });

  it('menolak soal hard tanpa examTrap', () => {
    const day = clone();
    delete day.block4.hardChallenge[0].examTrap;
    const { issues } = validateDay(day, 1, []);
    expect(issues.some((issue) => issue.includes('examTrap'))).toBe(true);
  });

  it('menolak soal medium tanpa stepByStep', () => {
    const day = clone();
    delete day.block4.partA[3].stepByStep;
    const { issues } = validateDay(day, 1, []);
    expect(issues.some((issue) => issue.includes('stepByStep'))).toBe(true);
  });

  it('menolak whyOthersWrong yang belum mencakup semua opsi salah', () => {
    const day = clone();
    day.block4.partA[0].whyOthersWrong = day.block4.partA[0].whyOthersWrong.slice(1);
    const { issues } = validateDay(day, 1, []);
    expect(issues.some((issue) => issue.includes('whyOthersWrong belum mencakup'))).toBe(true);
  });

  it('menolak kosakata yang berulang dari 10 hari sebelumnya', () => {
    const previous = [validateDay(clone(), 1, []).parsed!];
    const next = clone();
    next.day = 2;
    next.week = 1;
    next.block1.vocab[0].en = 'student';
    const { issues } = validateDay(next, 2, previous);
    expect(issues.some((issue) => issue.includes('kosakata berulang'))).toBe(true);
  });

  it('menolak teks bacaan di luar batas kata Bulan 1', () => {
    const day = clone();
    day.block3.text = 'Hello there. I am here.';
    const { issues } = validateDay(day, 1, []);
    expect(issues.some((issue) => issue.includes('teks bacaan'))).toBe(true);
  });

  it('menolak komposisi kesulitan yang jauh dari target minggu', () => {
    const day = clone();
    for (const question of day.block4.partA) question.difficulty = 'hard';
    const { issues } = validateDay(day, 1, []);
    expect(issues.some((issue) => issue.includes('komposisi minggu'))).toBe(true);
  });

  it('menolak terjemahan tanpa acceptedAnswers', () => {
    const day = clone();
    delete day.block4.partB[0].acceptedAnswers;
    const { issues } = validateDay(day, 1, []);
    expect(issues.some((issue) => issue.includes('acceptedAnswers'))).toBe(true);
  });

  it('menolak nama file yang tidak sama dengan field day', () => {
    const { issues } = validateDay(clone(), 3, []);
    expect(issues.some((issue) => issue.includes('tidak sama dengan nama file'))).toBe(true);
  });
});
