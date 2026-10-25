import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp, openDatabase } from './app.mjs';
import { levelFromMastered, normalizeAnswer } from './battle.mjs';

// Bank kecil dengan tepat satu battle campuran 8 soal untuk pool hari 1–4. Soal hari 5 ikut sebagai penjaga.
const BANK = [
  { id: 'BT001-001', day: 1, type: 'mcq', tag: 'grammar', prompt: 'Pilih kata kerja yang benar: She ___ a student.', options: [{ id: 'A', text: 'are' }, { id: 'B', text: 'is' }, { id: 'C', text: 'be' }, { id: 'D', text: 'am' }], correct: 'B', explanation: 'She memakai is.' },
  { id: 'BT002-001', day: 2, type: 'mcq', tag: 'vocab', prompt: 'Arti kata "bread" adalah...', options: [{ id: 'A', text: 'nasi' }, { id: 'B', text: 'roti' }, { id: 'C', text: 'susu' }, { id: 'D', text: 'telur' }], correct: 'B', explanation: 'Bread berarti roti.' },
  { id: 'BT003-001', day: 3, type: 'mcq', tag: 'grammar', prompt: 'Lengkapi: They ___ playing now.', options: [{ id: 'A', text: 'is' }, { id: 'B', text: 'are' }, { id: 'C', text: 'was' }, { id: 'D', text: 'be' }], correct: 'B', explanation: 'They memakai are.' },
  { id: 'BT004-001', day: 4, type: 'mcq', tag: 'vocab', prompt: 'Sinonim "happy" adalah...', options: [{ id: 'A', text: 'sad' }, { id: 'B', text: 'angry' }, { id: 'C', text: 'glad' }, { id: 'D', text: 'tired' }], correct: 'C', explanation: 'Glad berarti senang.' },
  { id: 'BT005-001', day: 5, type: 'mcq', tag: 'vocab', prompt: 'Hari kelima: pilih arti "river".', options: [{ id: 'A', text: 'sungai' }, { id: 'B', text: 'gunung' }, { id: 'C', text: 'hutan' }, { id: 'D', text: 'laut' }], correct: 'A', explanation: 'River berarti sungai.' },
  { id: 'BT001-002', day: 1, type: 'translate', prompt: 'Saya suka membaca buku.', acceptedAnswers: ['I like reading books.'], explanation: 'Gunakan like + reading.' },
  { id: 'BT003-002', day: 3, type: 'translate', prompt: 'Dia pergi ke sekolah.', acceptedAnswers: ['He goes to school.'], explanation: 'Gunakan goes.' },
  { id: 'BT002-002', day: 2, type: 'story', prompt: 'Apa yang dilakukan Dina setelah makan?', passage: 'Dina eats breakfast at seven. After that, she walks to school with her brother.', options: [{ id: 'A', text: 'Dia berjalan ke sekolah.' }, { id: 'B', text: 'Dia tidur.' }, { id: 'C', text: 'Dia menonton TV.' }, { id: 'D', text: 'Dia membaca koran.' }], correct: 'A', explanation: 'Teks menyebut walks to school.' },
  { id: 'BT004-002', day: 4, type: 'essay', prompt: 'Tulis 3 kalimat tentang rutinitas pagimu.', modelAnswer: 'I wake up at six. I brush my teeth. I eat breakfast.', rubric: [{ criterion: 'isi' }, { criterion: 'tata bahasa' }, { criterion: 'kosakata' }], explanation: 'Gunakan simple present.' },
];

let server;
let base;
let db;

const correctFor = (prompt) => BANK.find((item) => item.prompt === prompt);

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

beforeAll(async () => {
  db = openDatabase(':memory:');
  server = createApp(db, { bank: BANK, timeScale: 0.01 });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

describe('ID publik dan sinkron hari lulus', () => {
  it('setiap akun baru punya ID unik dengan format EH-XXXXXX', async () => {
    const a = await registerUser('Ayu', 'ayu@contoh.id');
    const b = await registerUser('Budi', 'budi@contoh.id');
    expect(a.publicId).not.toBe(b.publicId);
    expect(a.publicId).toMatch(/^EH-[A-HJ-NP-Z2-9]{6}$/);
  });

  it('ID bisa dicari, tetapi email tidak ikut terbuka', async () => {
    const a = await registerUser('Cici', 'cici@contoh.id');
    const { status, data } = await call('GET', `/api/users/${a.publicId}`, (await registerUser('Dedi', 'dedi@contoh.id')).token);
    expect(status).toBe(200);
    expect(data).toEqual({ publicId: a.publicId, name: 'Cici' });
  });

  it('ID hanya bisa diganti sekali', async () => {
    const user = await registerUser('Eka', 'eka@contoh.id');
    const first = await call('POST', '/api/me/public-id/regenerate', user.token);
    expect(first.status).toBe(200);
    expect(first.data.account.publicId).not.toBe(user.publicId);
    const second = await call('POST', '/api/me/public-id/regenerate', user.token);
    expect(second.status).toBe(409);
  });

  it('hari lulus disimpan dan level dihitung dari hari pertama yang belum lulus', async () => {
    const user = await registerUser('Fani', 'fani@contoh.id');
    const { data } = await call('PUT', '/api/progress/mastered', user.token, { days: [1, 2, 3, 3, 99, 'x'] });
    expect(data).toEqual({ level: 4, count: 3 });
    expect(levelFromMastered([])).toBe(1);
    expect(levelFromMastered(Array.from({ length: 90 }, (_, index) => index + 1))).toBe(90);
  });
});

describe('migrasi database lama', () => {
  it('kolom ID ditambahkan dan akun lama diberi ID acak', () => {
    const dir = mkdtempSync(join(tmpdir(), 'enghabits-'));
    const path = join(dir, 'lama.db');
    const old = new DatabaseSync(path);
    old.exec(`CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, salt TEXT NOT NULL, hash TEXT NOT NULL, created_at TEXT NOT NULL);
      INSERT INTO users VALUES ('u1', 'lama@contoh.id', 'Lama', 's', 'h', '2026-10-01T00:00:00.000Z');`);
    old.close();

    const migrated = openDatabase(path);
    const row = migrated.prepare('SELECT public_id, public_id_changed FROM users WHERE id = ?').get('u1');
    expect(row.public_id).toMatch(/^EH-[A-HJ-NP-Z2-9]{6}$/);
    expect(row.public_id_changed).toBe(0);
    migrated.close();
  });
});

describe('battle real-time', () => {
  it('level dibatasi lawan yang paling rendah, lalu soal dinilai di server', async () => {
    const a = await registerUser('Gilang', 'gilang@contoh.id');
    const b = await registerUser('Hana', 'hana@contoh.id');
    await call('PUT', '/api/progress/mastered', a.token, { days: [1, 2, 3] });
    await call('PUT', '/api/progress/mastered', b.token, { days: [1, 2, 3, 4, 5] });

    const invite = await call('POST', '/api/battles', a.token, {
      opponentPublicId: b.publicId,
      mode: 'campuran',
      total: 8,
    });
    expect(invite.status).toBe(201);
    expect(invite.data.poolDay).toBe(4);

    const respond = await call('POST', `/api/battles/${invite.data.battleId}/respond`, b.token, { accept: true });
    expect(respond.status).toBe(200);

    const picked = db
      .prepare('SELECT payload FROM battle_items WHERE battle_id = ?')
      .all(invite.data.battleId)
      .map((row) => JSON.parse(row.payload));
    expect(picked).toHaveLength(8);
    expect(picked.every((item) => item.day <= 4)).toBe(true);

    const finished = await playToEnd(invite.data.battleId, a.token, b.token);
    expect(finished.status).toBe('finished');
    expect(finished.winnerId).not.toBeNull();
  });

  it('soal yang sudah dipakai tidak bisa dipakai lagi, dan bank yang habis ditolak', async () => {
    const a = await registerUser('Ivan', 'ivan@contoh.id');
    const b = await registerUser('Jasmin', 'jasmin@contoh.id');
    await call('PUT', '/api/progress/mastered', a.token, { days: [1, 2, 3] });
    await call('PUT', '/api/progress/mastered', b.token, { days: [1, 2, 3] });

    const first = await call('POST', '/api/battles', a.token, { opponentPublicId: b.publicId, mode: 'campuran', total: 8 });
    await call('POST', `/api/battles/${first.data.battleId}/respond`, b.token, { accept: true });
    await playToEnd(first.data.battleId, a.token, b.token);

    const second = await call('POST', '/api/battles', a.token, { opponentPublicId: b.publicId, mode: 'campuran', total: 8 });
    const response = await call('POST', `/api/battles/${second.data.battleId}/respond`, b.token, { accept: true });
    expect(response.status).toBe(422);
    expect(response.data.error).toMatch(/Bank soal belum cukup/);
  });

  it('komposisi harus tepat sama dengan total soal', async () => {
    const a = await registerUser('Kiki', 'kiki@contoh.id');
    const b = await registerUser('Lulu', 'lulu@contoh.id');
    const bad = await call('POST', '/api/battles', a.token, {
      opponentPublicId: b.publicId,
      mode: 'campuran',
      total: 8,
      composition: { mcq: 3, translate: 2 },
    });
    expect(bad.status).toBe(400);
  });

  it('pemain tidak bisa mengundang dirinya sendiri', async () => {
    const a = await registerUser('Mira', 'mira@contoh.id');
    const response = await call('POST', '/api/battles', a.token, { opponentPublicId: a.publicId, mode: 'kilat', total: 8 });
    expect(response.status).toBe(400);
  });
});

/** Memainkan battle sampai selesai. Pemain A selalu benar, pemain B selalu salah. */
async function playToEnd(battleId, tokenA, tokenB) {
  for (let step = 0; step < 200; step += 1) {
    const state = (await call('GET', `/api/battles/${battleId}`, tokenA)).data;
    if (state.status === 'finished') return state;
    if (state.phase === 'question' && state.current) {
      const item = correctFor(state.current.prompt);
      const answerA = answerFor(item, true);
      const answerB = answerFor(item, false);
      await call('POST', `/api/battles/${battleId}/answer`, tokenA, { idx: state.current.index, answer: answerA });
      await call('POST', `/api/battles/${battleId}/answer`, tokenB, { idx: state.current.index, answer: answerB });
    }
    if (state.phase === 'rating' && state.rating) {
      for (const essay of state.rating.essays.filter((entry) => !entry.rated)) {
        await call('POST', `/api/battles/${battleId}/rate`, tokenA, { idx: essay.index, scores: [2, 2, 2] });
        await call('POST', `/api/battles/${battleId}/rate`, tokenB, { idx: essay.index, scores: [0, 0, 0] });
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 15));
  }
  throw new Error('battle tidak selesai');
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

describe('normalisasi jawaban', () => {
  it('huruf besar, tanda baca, dan aksen tidak mengubah jawaban yang benar', () => {
    expect(normalizeAnswer('  I LIKE READING, books! ')).toBe('i like reading books');
    expect(normalizeAnswer('café')).toBe('cafe');
  });
});
