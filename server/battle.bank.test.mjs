// Tes dengan bank battle asli di content/battle. Memastikan bank bisa dimuat dan satu battle campuran
// di level hari 4 bisa dimainkan sampai selesai.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp, loadBattleBank, openDatabase } from './app.mjs';

const BANK = loadBattleBank();
const byPrompt = new Map(BANK.map((item) => [item.prompt, item]));

let server;
let base;

beforeAll(async () => {
  server = createApp(openDatabase(':memory:'), { timeScale: 0.02 });
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
  const text = await response.text();
  return { status: response.status, data: text ? JSON.parse(text) : null };
}

async function registerUser(name, email) {
  const { data } = await call('POST', '/api/register', null, { name, email, password: 'Uji12345' });
  return { token: data.token, publicId: data.account.publicId };
}

function answerFor(item, right) {
  if (item.type === 'mcq' || item.type === 'story' || item.type === 'listen') {
    if (right) return item.correct;
    return item.options.find((option) => option.id !== item.correct).id;
  }
  if (item.type === 'translate') return right ? item.acceptedAnswers[0] : 'tidak tahu';
  if (item.type === 'reorder') return right ? item.acceptedAnswers[0] : 'salah urutan';
  return 'jawaban esai';
}

describe('bank battle asli', () => {
  it('memuat 900 soal dengan id unik', () => {
    expect(BANK).toHaveLength(900);
    expect(new Set(BANK.map((item) => item.id)).size).toBe(900);
  });

  it('battle campuran 8 soal di level hari 4 selesai dimainkan', async () => {
    const a = await registerUser('Nina', 'nina.bank@contoh.id');
    const b = await registerUser('Omar', 'omar.bank@contoh.id');
    await call('PUT', '/api/progress/mastered', a.token, { days: [1, 2, 3] });
    await call('PUT', '/api/progress/mastered', b.token, { days: [1, 2, 3] });

    const invite = await call('POST', '/api/battles', a.token, { opponentPublicId: b.publicId, mode: 'campuran', total: 8 });
    expect(invite.status).toBe(201);
    expect(invite.data.poolDay).toBe(4);
    const accepted = await call('POST', `/api/battles/${invite.data.battleId}/respond`, b.token, { accept: true });
    expect(accepted.status).toBe(200);

    let state;
    let meId;
    for (let step = 0; step < 400; step += 1) {
      state = (await call('GET', `/api/battles/${invite.data.battleId}`, a.token)).data;
      if (state.status === 'finished') break;
      meId ??= state.you;
      if (state.phase === 'question' && state.current) {
        const item = byPrompt.get(state.current.prompt);
        expect(item).toBeDefined();
        await call('POST', `/api/battles/${state.id}/answer`, a.token, { idx: state.current.index, answer: answerFor(item, true) });
        await call('POST', `/api/battles/${state.id}/answer`, b.token, { idx: state.current.index, answer: answerFor(item, false) });
      }
      if (state.phase === 'rating' && state.rating) {
        for (const essay of state.rating.essays.filter((entry) => !entry.rated)) {
          await call('POST', `/api/battles/${state.id}/rate`, a.token, { idx: essay.index, scores: [2, 2, 2] });
          await call('POST', `/api/battles/${state.id}/rate`, b.token, { idx: essay.index, scores: [0, 0, 0] });
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    expect(state.status).toBe('finished');
    // Pemain A selalu benar dan B selalu salah, jadi A harus menang.
    expect(state.winnerId).toBe(meId);
    expect(state.answers.length).toBeGreaterThan(0);
  }, 60_000);
});
