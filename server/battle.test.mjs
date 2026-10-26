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

let registerCount = 0;
async function registerUser(name, email) {
  // Setiap pendaftaran memakai alamat berbeda, supaya batas pendaftaran per alamat tidak menghalangi tes.
  registerCount += 1;
  const response = await fetch(`${base}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': `10.0.${Math.floor(registerCount / 250)}.${registerCount % 250}` },
    body: JSON.stringify({ name, email, password: 'Uji12345' }),
  });
  const data = await response.json();
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

  it('soal yang sudah dipakai diganti soal lain, dan jika habis dipakai lagi tanpa batas', async () => {
    const a = await registerUser('Ivan', 'ivan@contoh.id');
    const b = await registerUser('Jasmin', 'jasmin@contoh.id');
    await call('PUT', '/api/progress/mastered', a.token, { days: [1, 2, 3] });
    await call('PUT', '/api/progress/mastered', b.token, { days: [1, 2, 3] });

    const first = await call('POST', '/api/battles', a.token, { opponentPublicId: b.publicId, mode: 'campuran', total: 8 });
    await call('POST', `/api/battles/${first.data.battleId}/respond`, b.token, { accept: true });
    await playToEnd(first.data.battleId, a.token, b.token);

    const second = await call('POST', '/api/battles', a.token, { opponentPublicId: b.publicId, mode: 'campuran', total: 8 });
    const response = await call('POST', `/api/battles/${second.data.battleId}/respond`, b.token, { accept: true });
    expect(response.status).toBe(200);
    const row = db.prepare('SELECT total FROM battles WHERE id = ?').get(second.data.battleId);
    expect(row.total).toBe(8);
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

describe('gabungan mode', () => {
  it('menerima hingga 3 mode dan menolak lebih dari 3', async () => {
    const a = await registerUser('Rama', 'rama.mode@contoh.id');
    const b = await registerUser('Sari', 'sari.mode@contoh.id');
    const ok = await call('POST', '/api/battles', a.token, {
      opponentPublicId: b.publicId,
      mode: 'kilat+esai',
      total: 8,
      composition: { mcq: 4, essay: 4 },
    });
    expect(ok.status).toBe(201);
    const c = await registerUser('Wawan', 'wawan.mode@contoh.id');
    const x = await registerUser('Xena', 'xena.mode@contoh.id');
    const tooMany = await call('POST', '/api/battles', c.token, {
      opponentPublicId: x.publicId,
      mode: 'kilat+esai+cerita+dengar',
      total: 8,
      composition: { mcq: 8 },
    });
    expect(tooMany.status).toBe(400);
  });

  it('komposisi gabungan hanya boleh memakai jenis soal dari mode yang dipilih', async () => {
    const a = await registerUser('Tika', 'tika.mode@contoh.id');
    const b = await registerUser('Umar', 'umar.mode@contoh.id');
    const bad = await call('POST', '/api/battles', a.token, {
      opponentPublicId: b.publicId,
      mode: 'kilat+esai',
      total: 8,
      composition: { mcq: 4, story: 4 },
    });
    expect(bad.status).toBe(400);
  });
});

describe('kekurangan bank dan teman', () => {
  it('pratinjau menurunkan jumlah ke soal yang tersedia dan menyebut jenis yang kurang', async () => {
    const a = await registerUser('Yoga', 'yoga.pre@contoh.id');
    const b = await registerUser('Zara', 'zara.pre@contoh.id');
    await call('PUT', '/api/progress/mastered', a.token, { days: [1, 2, 3] });
    await call('PUT', '/api/progress/mastered', b.token, { days: [1, 2, 3] });
    const preview = await call('POST', '/api/battles/preview', a.token, {
      opponentPublicId: b.publicId,
      mode: 'campuran',
      total: 10,
      composition: { mcq: 5, translate: 2, story: 2, essay: 1 },
    });
    expect(preview.status).toBe(200);
    expect(preview.data.adjustedTotal).toBe(8);
    expect(preview.data.shortage.map((item) => item.type).sort()).toEqual(['mcq', 'story']);
  });

  it('teman ditambah sekali dengan ID dan bisa dilihat serta dihapus', async () => {
    const a = await registerUser('Ulfa', 'ulfa.friend@contoh.id');
    const b = await registerUser('Vino', 'vino.friend@contoh.id');
    const add = await call('POST', '/api/friends', a.token, { publicId: b.publicId });
    expect(add.status).toBe(200);
    const list = await call('GET', '/api/friends', a.token);
    expect(list.data.friends.map((item) => item.publicId)).toContain(b.publicId);
    const back = await call('GET', '/api/friends', b.token);
    expect(back.data.friends.map((item) => item.publicId)).toContain(a.publicId);
    await call('DELETE', `/api/friends/${b.publicId}`, a.token);
    const after = await call('GET', '/api/friends', a.token);
    expect(after.data.friends).toHaveLength(0);
  });
});

describe('battle tidak menggantung', () => {
  it('mode esai bisa dibuat, dan battle selesai walau penilaian tidak dikerjakan', async () => {
    const a = await registerUser('Wina', 'wina.stuck@contoh.id');
    const b = await registerUser('Xavi', 'xavi.stuck@contoh.id');
    await call('PUT', '/api/progress/mastered', a.token, { days: [1, 2, 3] });
    await call('PUT', '/api/progress/mastered', b.token, { days: [1, 2, 3] });
    const invite = await call('POST', '/api/battles', a.token, { opponentPublicId: b.publicId, mode: 'esai', total: 8 });
    expect(invite.status).toBe(201);
    await call('POST', `/api/battles/${invite.data.battleId}/respond`, b.token, { accept: true });

    let state;
    for (let step = 0; step < 300; step += 1) {
      state = (await call('GET', `/api/battles/${invite.data.battleId}`, a.token)).data;
      if (state.status === 'finished') break;
      if (state.phase === 'question' && state.current) {
        await call('POST', `/api/battles/${state.id}/answer`, a.token, { idx: state.current.index, answer: 'tulisan' });
        await call('POST', `/api/battles/${state.id}/answer`, b.token, { idx: state.current.index, answer: 'tulisan' });
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    expect(state.status).toBe('finished');
  }, 30_000);
});

describe('kehadiran teman', () => {
  it('teman tampil online setelah mengirim ping, dan offline sebelumnya', async () => {
    const a = await registerUser('Yuda', 'yuda.presence@contoh.id');
    const b = await registerUser('Zelda', 'zelda.presence@contoh.id');
    await call('POST', '/api/friends', a.token, { publicId: b.publicId });
    const before = await call('GET', '/api/friends', a.token);
    expect(before.data.friends[0].online).toBe(false);
    expect(before.data.friends[0].id).toBeUndefined();
    await call('POST', '/api/presence', b.token);
    const after = await call('GET', '/api/friends', a.token);
    expect(after.data.friends[0].online).toBe(true);
  });
});
