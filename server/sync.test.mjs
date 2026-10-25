import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp, openDatabase } from './app.mjs';
import { mergeRow } from './sync.mjs';

let server;
let base;
let db;

beforeAll(async () => {
  db = openDatabase(':memory:');
  server = createApp(db);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

async function call(method, path, token, body) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, data: await response.json() };
}

const progress = (day, bestCorePercent, completedAt = '2026-10-01T10:00:00.000Z') => ({
  day,
  completedDate: '2026-10-01',
  completedAt,
  firstCorePercent: 50,
  bestCorePercent,
  firstCorrect: 8,
  firstParts: {},
  hardCorrect: 0,
  hardTotal: 0,
  attempts: 1,
  lastAttemptAt: completedAt,
});

const empty = { progress: [], attempts: [], mistakes: [], notes: [] };

describe('sinkron progres', () => {
  it('data dari dua perangkat digabung dan hari lulus ikut dihitung', async () => {
    const { data } = await call('POST', '/api/register', null, { name: 'Sinkron', email: 'sinkron@contoh.id', password: 'Uji12345' });
    const token = data.token;

    // Perangkat A: hari 1 lulus dengan nilai 70, percobaan A1, dan catatan lama.
    await call('PUT', '/api/sync', token, {
      ...empty,
      progress: [progress(1, 70)],
      attempts: [{ id: 'a1', day: 1, n: 1, createdAt: '2026-10-01T10:00:00.000Z', answers: {}, corePercent: 70, hardCorrect: 0, hardTotal: 0 }],
      notes: [{ day: 1, text: 'catatan lama', updatedAt: '2026-10-01T10:00:00.000Z' }],
    });

    // Perangkat B: hari 1 diulang dengan nilai 85, hari 2 lulus, dan catatan yang lebih baru.
    const merged = await call('PUT', '/api/sync', token, {
      ...empty,
      progress: [progress(1, 85, '2026-10-02T10:00:00.000Z'), progress(2, 65, '2026-10-02T11:00:00.000Z')],
      attempts: [{ id: 'b1', day: 1, n: 2, createdAt: '2026-10-02T10:00:00.000Z', answers: {}, corePercent: 85, hardCorrect: 0, hardTotal: 0 }],
      notes: [{ day: 1, text: 'catatan baru', updatedAt: '2026-10-02T10:00:00.000Z' }],
    });

    expect(merged.status).toBe(200);
    const day1 = merged.data.progress.find((row) => row.day === 1);
    expect(day1.bestCorePercent).toBe(85);
    expect(day1.completedAt).toBe('2026-10-01T10:00:00.000Z');
    expect(merged.data.attempts.map((row) => row.id).sort()).toEqual(['a1', 'b1']);
    expect(merged.data.notes[0].text).toBe('catatan baru');

    const mastered = db
      .prepare('SELECT day FROM mastered_days WHERE user_id = (SELECT id FROM users WHERE email = ?) ORDER BY day')
      .all('sinkron@contoh.id')
      .map((row) => row.day);
    expect(mastered).toEqual([1, 2]);
  });

  it('tanpa token, data sinkron tidak bisa dibaca', async () => {
    const response = await call('GET', '/api/sync', null);
    expect(response.status).toBe(401);
  });

  it('aturan gabungan untuk satu baris', () => {
    expect(mergeRow('attempts', { id: 'x' }, { id: 'x', corePercent: 1 })).toEqual({ id: 'x' });
    expect(mergeRow('mistakes', { lastWrong: '2026-10-01', wrongCount: 3 }, { lastWrong: '2026-10-02', wrongCount: 1 }).lastWrong).toBe('2026-10-02');
  });
});
