import { describe, expect, it } from 'vitest';
import day1 from '../../content/days/day-01.json';
import day68 from '../../content/days/day-68.json';
import type { Day, ProductionTask, Question } from '../../content/schema';
import { normalizeAnswer } from '../../content/normalize';
import { gradeDay, gradeMcq, gradeProduction } from './grading';

const day = day1 as unknown as Day;

function answersFromDay(): Record<string, string> {
  const answers: Record<string, string> = {};
  for (const question of [...day.block3.questions, ...day.block4.partA, ...day.block4.hardChallenge]) {
    answers[question.id] = question.correct;
  }
  for (const task of day.block4.partB) {
    answers[task.id] = task.modelAnswer;
  }
  return answers;
}

describe('normalizeAnswer', () => {
  it('menyamakan huruf besar, tanda baca, apostrof, dan spasi', () => {
    expect(normalizeAnswer("  I'm   a Teacher!  ")).toBe('im a teacher');
    expect(normalizeAnswer('We aren’t hungry.')).toBe('we arent hungry');
  });
});

describe('gradeMcq', () => {
  const question = day.block4.partA[0] as Question;

  it('benar hanya bila id opsi sama dengan correct', () => {
    expect(gradeMcq(question, question.correct)).toBe(true);
    expect(gradeMcq(question, 'A')).toBe(question.correct === 'A');
  });

  it('soal tanpa jawaban dihitung salah', () => {
    expect(gradeMcq(question, undefined)).toBe(false);
  });
});

describe('gradeProduction', () => {
  const task = day.block4.partB[2] as ProductionTask;

  it('menerima semua variasi yang diterima, termasuk kontraksi', () => {
    expect(gradeProduction(task, 'We are not hungry.')).toBe(true);
    expect(gradeProduction(task, "we're not hungry")).toBe(true);
    expect(gradeProduction(task, 'We aren\'t hungry')).toBe(true);
  });

  it('menolak jawaban yang salah urutan atau kosong', () => {
    expect(gradeProduction(task, 'We not are hungry.')).toBe(false);
    expect(gradeProduction(task, '   ')).toBe(false);
    expect(gradeProduction(task, undefined)).toBe(false);
  });
});

describe('tugas tulis dan lisan', () => {
  // Hari 68 punya satu tugas ielts_task1_outline (B5). Tugas itu tidak boleh masuk skor otomatis.
  const writingDay = day68 as unknown as Day;

  it('tidak masuk skor inti, tetapi tetap ditampilkan di selfItems', () => {
    const result = gradeDay(writingDay, answersFromDay());
    const selfIds = result.selfItems.map((item) => item.id);
    expect(selfIds).toEqual(['B5']);
    expect(result.selfItems[0].selfAssessed).toBe(true);
    expect(result.selfItems[0].correct).toBe(false);
    expect(result.items.some((item) => item.id === 'B5')).toBe(false);
    expect(result.core.total).toBe(14);
    expect(result.parts.partB.total).toBe(4);
  });

  it('tidak dihitung salah di Buku Kesalahan, karena tidak ada di items', () => {
    const result = gradeDay(writingDay, {});
    expect(result.items.filter((item) => !item.correct && item.part === 'partB')).toHaveLength(4);
  });
});

describe('gradeDay', () => {
  it('jawaban model menghasilkan skor sempurna pada inti dan bonus', () => {
    const result = gradeDay(day, answersFromDay());
    expect(result.core).toEqual({ correct: 15, total: 15 });
    expect(result.hard).toEqual({ correct: 5, total: 5 });
    expect(result.corePercent).toBe(100);
  });

  it('soal yang tidak dijawab dihitung salah dan persentase dihitung dari 15', () => {
    const answers = answersFromDay();
    delete answers.R1;
    delete answers.B1;
    const result = gradeDay(day, answers);
    expect(result.core).toEqual({ correct: 13, total: 15 });
    expect(result.corePercent).toBe(87);
    expect(result.items.find((item) => item.id === 'R1')?.correct).toBe(false);
  });

  it('bagian dipisah dengan benar', () => {
    const result = gradeDay(day, {});
    expect(result.parts.comprehension.total).toBe(5);
    expect(result.parts.partA.total).toBe(5);
    expect(result.parts.partB.total).toBe(5);
    expect(result.parts.hard.total).toBe(5);
    expect(result.corePercent).toBe(0);
  });
});
