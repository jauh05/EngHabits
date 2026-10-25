// Mesin battle real-time. Server yang menentukan soal, waktu, dan nilai, supaya kunci jawaban tidak pernah
// sampai ke klien sebelum jawaban dikunci. Keadaan ronde ada di memori; riwayat dan jawaban ditulis ke SQLite.
import { randomInt, randomUUID } from 'node:crypto';

export const COUNTDOWN_MS = 3000;
export const REVEAL_MS = 3500;
export const INVITE_TTL_MS = 10 * 60_000;
export const TOTALS = [8, 10, 15, 20];
export const LIVES = 3;

/** Mode battle: tipe soal yang boleh dipakai, filter tag opsional, dan waktu per soal (detik). */
export const MODES = {
  kilat: { types: ['mcq'], seconds: 15, label: 'Kilat' },
  terjemahan: { types: ['translate'], seconds: 40, label: 'Terjemahan' },
  tata_bahasa: { types: ['mcq'], tag: 'grammar', seconds: 20, label: 'Tata Bahasa' },
  kosakata: { types: ['mcq'], tag: 'vocab', seconds: 15, label: 'Kosakata' },
  cerita: { types: ['story'], seconds: 60, label: 'Cerita' },
  esai: { types: ['essay'], seconds: 120, label: 'Esai' },
  campuran: { types: ['mcq', 'translate', 'story', 'essay'], label: 'Campuran' },
  dengar: { types: ['listen'], seconds: 25, label: 'Dengar' },
  susun: { types: ['reorder'], seconds: 30, label: 'Susun Kalimat' },
  bertahan: { types: ['mcq', 'translate'], lives: LIVES, seconds: 20, label: 'Bertahan' },
};

const DEFAULT_SECONDS = { mcq: 15, translate: 40, story: 60, essay: 120, listen: 25, reorder: 30 };

const MAX_MODES = 3;
const ORDER = ['mcq', 'translate', 'story', 'essay', 'listen', 'reorder'];

/**
 * Aturan satu mode atau gabungan mode (dipisah '+', maksimal 3). Gabungan memakai union tipe soal,
 * dan batas tag hanya berlaku bila setiap mode pilihan ganda yang dipilih punya tag.
 */
export function specFor(modeString) {
  const ids = String(modeString ?? '').split('+').filter(Boolean);
  if (ids.length === 0 || ids.length > MAX_MODES || new Set(ids).size !== ids.length) return undefined;
  const specs = ids.map((id) => MODES[id]);
  if (specs.some((spec) => !spec)) return undefined;
  if (ids.length === 1) {
    const only = specs[0];
    return { ...only, id: ids[0], tags: only.tag ? [only.tag] : undefined };
  }
  if (ids.includes('campuran')) return undefined;
  const types = ORDER.filter((type) => specs.some((spec) => spec.types.includes(type)));
  const mcqSpecs = specs.filter((spec) => spec.types.includes('mcq'));
  const tags = mcqSpecs.length > 0 && mcqSpecs.every((spec) => spec.tag)
    ? [...new Set(mcqSpecs.map((spec) => spec.tag))]
    : undefined;
  return {
    id: ids.join('+'),
    label: specs.map((spec) => spec.label).join(' + '),
    types,
    tags,
    lives: specs.some((spec) => spec.lives) ? LIVES : null,
    seconds: undefined,
  };
}

/** Pembagian merata jenis soal untuk gabungan mode, dimulai dari pilihan ganda. */
function evenComposition(types, total) {
  const out = Object.fromEntries(types.map((type) => [type, 0]));
  for (let index = 0; index < total; index += 1) out[types[index % types.length]] += 1;
  return out;
}

/** Komposisi standar untuk mode Campuran dan Bertahan, mengikuti total soal. */
export const DEFAULT_COMPOSITION = {
  8: { mcq: 4, translate: 2, story: 1, essay: 1 },
  10: { mcq: 5, translate: 2, story: 2, essay: 1 },
  15: { mcq: 7, translate: 3, story: 3, essay: 2 },
  20: { mcq: 9, translate: 4, story: 4, essay: 3 },
};

export const ESSAY_CRITERIA = ['Isi dan ide', 'Tata bahasa', 'Kosakata dan kelancaran'];

/** Normalisasi jawaban terjemahan dan susun kalimat: tanpa aksen, huruf kecil, tanpa tanda baca. */
export function normalizeAnswer(text) {
  return String(text ?? '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Level = hari pertama yang belum lulus. Semua hari sudah lulus berarti 90. */
export function levelFromMastered(mastered) {
  const done = new Set(mastered);
  for (let day = 1; day <= 90; day += 1) {
    if (!done.has(day)) return day;
  }
  return 90;
}

export function compositionFor(mode, total, custom) {
  const spec = specFor(mode);
  if (!spec) return custom ?? {};
  if (mode === 'campuran') return custom ?? DEFAULT_COMPOSITION[total];
  if (spec && spec.id.includes('+')) return custom ?? evenComposition(spec.types, total);
  if (mode === 'bertahan') {
    const translate = Math.floor(total / 3);
    return { mcq: total - translate, translate };
  }
  return { [spec.types[0]]: total };
}

export function validateComposition(mode, total, composition) {
  const spec = specFor(mode);
  if (!spec) return 'Mode battle tidak dikenal, atau lebih dari 3 mode.';
  if (!TOTALS.includes(total)) return 'Jumlah soal harus 8, 10, 15, atau 20.';
  const entries = Object.entries(composition);
  if (entries.some(([type, count]) => !spec.types.includes(type) || !Number.isInteger(count) || count < 0)) {
    return 'Komposisi soal tidak sesuai dengan mode ini.';
  }
  const sum = entries.reduce((total, [, count]) => total + count, 0);
  if (sum !== total) return `Jumlah tipe soal harus tepat ${total}.`;
  if ((composition.essay ?? 0) > Math.floor(total / 2)) return 'Esai paling banyak setengah dari total soal.';
  return null;
}

/** Bentuk soal yang aman dikirim ke klien: tanpa kunci jawaban atau penjelasan. */
export function publicItem(item) {
  const base = { index: item.index, type: item.type, prompt: item.prompt, seconds: item.seconds };
  if (item.type === 'story') base.passage = item.passage;
  if (item.type === 'listen') base.script = item.script;
  if (item.type === 'reorder') base.words = item.words;
  if (item.type === 'essay') base.criteria = ESSAY_CRITERIA;
  if (item.options) base.options = item.options;
  return base;
}

function scoreAnswer(item, answer, elapsedMs, limitMs) {
  if (item.type === 'essay') return { correct: null, points: 0 };
  let correct;
  if (item.type === 'translate') {
    correct = item.acceptedAnswers.map(normalizeAnswer).includes(normalizeAnswer(answer));
  } else if (item.type === 'reorder') {
    correct = normalizeAnswer(answer) === normalizeAnswer(item.acceptedAnswers[0]);
  } else {
    correct = answer === item.correct;
  }
  if (!correct) return { correct: false, points: 0 };
  const bonus = Math.max(0, Math.round(5 * (1 - elapsedMs / limitMs)));
  return { correct: true, points: 10 + bonus };
}

export function createBattleService({ db, bank, notify, timeScale = 1 }) {
  const rooms = new Map();
  const inviteLog = new Map();

  const insertBattle = db.prepare(
    'INSERT INTO battles (id, creator_id, opponent_id, mode, total, pool_day, composition, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  );
  const setStatus = db.prepare('UPDATE battles SET status = ?, winner_id = ?, updated_at = ? WHERE id = ?');
  const findBattle = db.prepare('SELECT * FROM battles WHERE id = ?');
  const activeFor = db.prepare(
    "SELECT id FROM battles WHERE (creator_id = ? OR opponent_id = ?) AND status IN ('pending', 'active', 'rating') LIMIT 1",
  );
  const insertItem = db.prepare('INSERT INTO battle_items (battle_id, idx, item_id, type, payload) VALUES (?, ?, ?, ?, ?)');
  const itemsOf = db.prepare('SELECT idx, item_id, type, payload FROM battle_items WHERE battle_id = ? ORDER BY idx');
  const insertAnswer = db.prepare(
    'INSERT OR REPLACE INTO battle_answers (battle_id, idx, user_id, answer, correct, points, elapsed_ms) VALUES (?, ?, ?, ?, ?, ?, ?)',
  );
  const answersOf = db.prepare('SELECT idx, user_id, answer, correct, points, elapsed_ms FROM battle_answers WHERE battle_id = ?');
  const insertRating = db.prepare('INSERT OR REPLACE INTO battle_ratings (battle_id, idx, user_id, points) VALUES (?, ?, ?, ?)');
  const ratingsOf = db.prepare('SELECT idx, user_id, points FROM battle_ratings WHERE battle_id = ?');
  const usedByStmt = db.prepare('SELECT item_id FROM used_items WHERE user_id = ?');
  const markUsed = db.prepare('INSERT OR IGNORE INTO used_items (user_id, item_id) VALUES (?, ?)');
  const masteredOf = db.prepare('SELECT day FROM mastered_days WHERE user_id = ?');
  const userPublic = db.prepare('SELECT id, public_id, name FROM users WHERE id = ?');
  const userByPublic = db.prepare('SELECT id, public_id, name FROM users WHERE public_id = ?');
  const historyOf = db.prepare(
    'SELECT * FROM battles WHERE creator_id = ? OR opponent_id = ? ORDER BY created_at DESC LIMIT 20',
  );

  const now = () => Date.now();
  const iso = () => new Date().toISOString();

  function levelOf(userId) {
    return levelFromMastered(masteredOf.all(userId).map((row) => row.day));
  }

  function nameOf(userId) {
    const row = userPublic.get(userId);
    return row ? { id: row.id, publicId: row.public_id, name: row.name } : null;
  }

  function checkInviteLimit(userId) {
    const key = `${userId}`;
    const hits = (inviteLog.get(key) ?? []).filter((time) => now() - time < 60 * 60_000);
    if (hits.length >= 10) throw new BattleError(429, 'Terlalu banyak undangan. Coba lagi nanti.');
    hits.push(now());
    inviteLog.set(key, hits);
  }

  /** Soal yang boleh dipakai untuk satu jenis soal: di bawah batas hari dan sesuai tag. */
  function candidates(spec, type, poolDay) {
    return bank.filter(
      (item) =>
        item.type === type &&
        item.day <= poolDay &&
        (item.type !== 'mcq' || !spec.tags || spec.tags.includes(item.tag)),
    );
  }

  function usedBy(playerIds) {
    return new Set(playerIds.flatMap((id) => usedByStmt.all(id).map((row) => row.item_id)));
  }

  /** Ketersediaan soal per jenis, untuk pratinjau. Bank tidak lagi membatasi battle, hanya level hari. */
  function availability({ mode, poolDay }) {
    const spec = specFor(mode);
    return Object.fromEntries(spec.types.map((type) => [type, candidates(spec, type, poolDay).length]));
  }

  /** Mengacak urutan pilihan jawaban dan menyesuaikan kunci, supaya soal yang sama tampil berbeda. */
  function shuffleOptions(item) {
    if (!item.options) return item;
    const order = [...item.options].sort(() => randomInt(3) - 1);
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const correctIndex = order.findIndex((option) => option.id === item.correct);
    return {
      ...item,
      options: order.map((option, index) => ({ id: letters[index], text: option.text })),
      correct: letters[correctIndex],
    };
  }

  /**
   * Memilih soal. Soal yang belum pernah dipakai pemain diutamakan. Jika sudah habis, soal lama dipakai lagi
   * secara acak, sehingga battle tidak pernah berhenti karena bank. Pilihan jawaban selalu diacak.
   */
  function pickItems({ mode, composition, poolDay, playerIds }) {
    const spec = specFor(mode);
    const used = usedBy(playerIds);
    const picked = [];
    const adjusted = {};
    for (const [type, count] of Object.entries(composition)) {
      if (count === 0) continue;
      const pool = candidates(spec, type, poolDay);
      if (pool.length === 0) continue;
      const fresh = pool.filter((item) => !used.has(item.id)).sort(() => randomInt(3) - 1);
      const stale = pool.filter((item) => used.has(item.id)).sort(() => randomInt(3) - 1);
      const chosen = [...fresh, ...stale].slice(0, count);
      adjusted[type] = chosen.length;
      picked.push(...chosen);
    }
    const total = Object.values(adjusted).reduce((sum, value) => sum + value, 0);
    if (total === 0) {
      throw new BattleError(422, 'Bank soal untuk level ini belum punya soal yang bisa dipakai.');
    }
    const order = picked.map((item) => shuffleOptions(item)).sort(() => randomInt(3) - 1);
    const items = order.map((item, index) => ({
      index,
      id: item.id,
      day: item.day,
      type: item.type,
      prompt: item.prompt,
      passage: item.passage,
      script: item.script,
      options: item.options,
      words: item.type === 'reorder' ? shuffleWords(item.acceptedAnswers[0]) : undefined,
      acceptedAnswers: item.acceptedAnswers,
      correct: item.correct,
      modelAnswer: item.modelAnswer,
      rubric: item.rubric,
      explanation: item.explanation,
      seconds: spec.seconds ?? DEFAULT_SECONDS[item.type],
    }));
    return { items, composition: adjusted, total };
  }

  function shuffleWords(sentence) {
    const words = String(sentence).split(' ');
    return words.sort(() => randomInt(3) - 1);
  }

  function persistItems(battleId, items) {
    items.forEach((item, index) => {
      insertItem.run(battleId, index, item.id, item.type, JSON.stringify(item));
    });
  }

  function loadRoom(battleId) {
    if (rooms.has(battleId)) return rooms.get(battleId);
    const row = findBattle.get(battleId);
    if (!row) return null;
    const items = itemsOf.all(battleId).map((item) => ({ ...JSON.parse(item.payload), index: item.idx }));
    const room = {
      id: battleId,
      creatorId: row.creator_id,
      opponentId: row.opponent_id,
      mode: row.mode,
      total: row.total,
      status: row.status,
      items,
      round: -1,
      phase: row.status === 'active' ? 'idle' : row.status,
      lives: { [row.creator_id]: specFor(row.mode).lives ?? null, [row.opponent_id]: specFor(row.mode).lives ?? null },
      answers: new Map(),
      scores: {},
      timers: [],
      deadlineAt: null,
      lastReveal: null,
    };
    rooms.set(battleId, room);
    return room;
  }

  function playersOf(room) {
    return [room.creatorId, room.opponentId];
  }

  function snapshot(room, viewerId) {
    const currentItem = room.round >= 0 ? room.items[room.round] : null;
    const myAnswer = currentItem ? room.answers.get(room.round)?.get(viewerId) : undefined;
    const opponentId = viewerId === room.creatorId ? room.opponentId : room.creatorId;
    const opponentAnswered = currentItem ? room.answers.get(room.round)?.has(opponentId) : false;
    return {
      id: room.id,
      mode: room.mode,
      modeLabel: specFor(room.mode).label,
      status: room.status,
      phase: room.phase,
      total: room.total,
      round: room.round,
      serverNow: now(),
      deadlineAt: room.deadlineAt,
      players: playersOf(room).map((id) => nameOf(id)),
      you: viewerId,
      lives: room.lives,
      scores: room.scores,
      current: currentItem && room.phase === 'question' ? publicItem(currentItem) : null,
      answered: { you: Boolean(myAnswer), opponent: Boolean(opponentAnswered) },
      reveal: room.lastReveal,
      rating: room.phase === 'rating' ? essayRatingState(room, viewerId) : null,
      results: room.phase === 'finished' ? room.results : null,
    };
  }

  function essayRatingState(room, viewerId) {
    const essays = room.items.filter((item) => item.type === 'essay');
    const mine = essays.map((item) => ({
      index: item.index,
      answer: room.answers.get(item.index)?.get(viewerId)?.answer ?? '',
      model: item.modelAnswer,
      rated: Boolean(room.ratings?.get(`${item.index}:${viewerId}`)),
    }));
    return { criteria: ESSAY_CRITERIA, essays: mine };
  }

  function broadcast(room) {
    for (const id of playersOf(room)) notify(id, 'battle', snapshot(room, id));
  }

  function later(room, ms, fn) {
    const timer = setTimeout(fn, ms * timeScale);
    room.timers.push(timer);
  }

  function clearTimers(room) {
    for (const timer of room.timers) clearTimeout(timer);
    room.timers = [];
  }

  function startRound(room) {
    room.round += 1;
    if (room.round >= room.items.length) return startRating(room);
    room.phase = 'countdown';
    room.deadlineAt = null;
    room.lastReveal = null;
    room.answers.set(room.round, new Map());
    broadcast(room);
    later(room, COUNTDOWN_MS, () => {
      const item = room.items[room.round];
      room.phase = 'question';
      room.startedAt = now();
      room.deadlineAt = now() + item.seconds * 1000;
      broadcast(room);
      later(room, item.seconds * 1000, () => revealRound(room));
    });
  }

  function revealRound(room) {
    if (room.phase !== 'question') return;
    clearTimers(room);
    const item = room.items[room.round];
    const limitMs = item.seconds * 1000;
    const results = {};
    for (const id of playersOf(room)) {
      const entry = room.answers.get(room.round).get(id);
      if (!entry) {
        results[id] = { answered: false, correct: false, points: 0, answer: null };
        continue;
      }
      results[id] = { answered: true, correct: entry.correct, points: entry.points, answer: entry.answer };
      room.scores[id] = (room.scores[id] ?? 0) + entry.points;
    }
    if (item.type !== 'essay') {
      // Mode Bertahan: jawaban salah atau tidak menjawab mengurangi satu nyawa.
      for (const id of playersOf(room)) {
        if (room.lives[id] !== null && !results[id].correct) room.lives[id] -= 1;
      }
    }
    room.phase = 'reveal';
    room.deadlineAt = null;
    room.lastReveal = {
      round: room.round,
      type: item.type,
      correct: item.type === 'essay' ? null : item.correct ?? item.acceptedAnswers?.[0] ?? null,
      explanation: item.explanation ?? null,
      modelAnswer: item.type === 'essay' ? item.modelAnswer : null,
      limitMs,
      results,
    };
    broadcast(room);
    const eliminated = playersOf(room).some((id) => room.lives[id] !== null && room.lives[id] <= 0);
    later(room, REVEAL_MS, () => {
      if (eliminated) return finish(room);
      startRound(room);
    });
    persistRound(room);
  }

  function persistRound(room) {
    for (const [userId, entry] of room.answers.get(room.round) ?? []) {
      insertAnswer.run(room.id, room.round, userId, entry.answer, entry.correct ? 1 : 0, entry.points, entry.elapsedMs);
    }
  }

  function startRating(room) {
    const essays = room.items.filter((item) => item.type === 'essay');
    if (essays.length === 0) return finish(room);
    room.phase = 'rating';
    room.status = 'rating';
    room.ratings = new Map();
    setStatus.run('rating', null, iso(), room.id);
    broadcast(room);
  }

  function finish(room) {
    clearTimers(room);
    room.phase = 'finished';
    room.status = 'finished';
    const totals = {};
    const timeTotals = {};
    for (const id of playersOf(room)) {
      totals[id] = room.scores[id] ?? 0;
      timeTotals[id] = 0;
    }
    for (const byUser of room.answers.values()) {
      for (const [id, entry] of byUser) timeTotals[id] += entry.elapsedMs;
    }
    for (const [key, points] of room.ratings ?? []) {
      const userId = key.split(':')[1];
      totals[userId] += points;
    }
    const [a, b] = playersOf(room);
    // Total poin yang sama berarti seri.
    const winnerId = totals[a] === totals[b] ? null : totals[a] > totals[b] ? a : b;
    room.results = {
      winnerId,
      totals,
      players: playersOf(room).map((id) => nameOf(id)),
      rounds: room.items.map((item, index) => ({
        index,
        type: item.type,
        prompt: item.prompt,
        correct: item.correct ?? item.acceptedAnswers?.[0] ?? null,
        modelAnswer: item.modelAnswer ?? null,
      })),
    };
    setStatus.run('finished', winnerId, iso(), room.id);
    broadcast(room);
    rooms.delete(room.id);
  }

  const insertFriend = db.prepare('INSERT OR IGNORE INTO friends (user_id, friend_id) VALUES (?, ?)');
  const deleteFriend = db.prepare('DELETE FROM friends WHERE user_id = ? AND friend_id = ?');
  const friendsOf = db.prepare(
    'SELECT users.public_id, users.name FROM friends JOIN users ON users.id = friends.friend_id WHERE friends.user_id = ? ORDER BY users.name',
  );

  /** Validasi undangan yang dipakai bersama oleh pratinjau dan pengiriman. */
  function prepareInvite(creatorId, input) {
    const opponent = userByPublic.get(String(input.opponentPublicId ?? '').toUpperCase());
    if (!opponent) throw new BattleError(404, 'ID lawan tidak ditemukan.');
    if (opponent.id === creatorId) throw new BattleError(400, 'Kamu tidak bisa mengundang diri sendiri.');
    if (activeFor.get(creatorId, creatorId) || activeFor.get(opponent.id, opponent.id)) {
      throw new BattleError(409, 'Salah satu pemain masih punya battle yang belum selesai.');
    }
    const mode = String(input.mode ?? '');
    const total = Number(input.total);
    const custom = input.composition ? normalizeComposition(input.composition) : undefined;
    if (!specFor(mode)) throw new BattleError(400, 'Mode battle tidak dikenal, atau lebih dari 3 mode.');
    const composition = compositionFor(mode, total, custom);
    const problem = validateComposition(mode, total, composition);
    if (problem) throw new BattleError(400, problem);
    const poolDay = Math.min(levelOf(creatorId), levelOf(opponent.id));
    return { opponent, mode, total, composition, poolDay };
  }

  return {
    /** Undangan baru dari pengguna ke lawan dengan ID publik. */
    /** Pratinjau sebelum undangan dikirim: jumlah soal yang tersedia dan jenis yang kurang. */
    preview(creatorId, input) {
      const prepared = prepareInvite(creatorId, input);
      const available = availability({ mode: prepared.mode, poolDay: prepared.poolDay });
      const shortage = Object.entries(prepared.composition)
        .filter(([type, count]) => count > (available[type] ?? 0))
        .map(([type, count]) => ({ type, requested: count, available: available[type] ?? 0 }));
      const adjustedTotal = Object.entries(prepared.composition).reduce(
        (sum, [type, count]) => sum + Math.min(count, available[type] ?? 0),
        0,
      );
      return { poolDay: prepared.poolDay, requested: prepared.total, adjustedTotal, shortage, available };
    },

    /** Undangan baru dari pengguna ke lawan dengan ID publik. */
    createInvite(creatorId, input) {
      const prepared = prepareInvite(creatorId, input);
      const { opponent, mode, total, composition, poolDay } = prepared;
      checkInviteLimit(creatorId);
      const id = randomUUID();
      const stamp = iso();
      insertBattle.run(id, creatorId, opponent.id, mode, total, poolDay, JSON.stringify(composition), 'pending', stamp, stamp);
      const room = { id, creatorId, opponentId: opponent.id, mode, total, composition, poolDay, createdAt: now() };
      notify(opponent.id, 'invite', inviteView(room));
      return { battleId: id, poolDay, composition, opponent: nameOf(opponent.id) };
    },

    /** Daftar teman: ditambah sekali dengan ID, lalu bisa diundang tanpa mengetik ID lagi. */
    addFriend(userId, publicId) {
      const friend = userByPublic.get(String(publicId ?? '').toUpperCase());
      if (!friend) throw new BattleError(404, 'ID tidak ditemukan.');
      if (friend.id === userId) throw new BattleError(400, 'Kamu tidak bisa menambahkan diri sendiri.');
      db.exec('BEGIN');
      try {
        insertFriend.run(userId, friend.id);
        insertFriend.run(friend.id, userId);
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
      return { publicId: friend.public_id, name: friend.name };
    },

    listFriends(userId) {
      return friendsOf.all(userId).map((row) => ({ publicId: row.public_id, name: row.name }));
    },

    removeFriend(userId, publicId) {
      const friend = userByPublic.get(String(publicId ?? '').toUpperCase());
      if (!friend) throw new BattleError(404, 'ID tidak ditemukan.');
      deleteFriend.run(userId, friend.id);
      deleteFriend.run(friend.id, userId);
      return { removed: true };
    },

    respond(battleId, userId, accept) {
      const row = findBattle.get(battleId);
      if (!row || row.opponent_id !== userId) throw new BattleError(404, 'Undangan tidak ditemukan.');
      if (row.status !== 'pending') throw new BattleError(409, 'Undangan ini sudah tidak aktif.');
      if (now() - Date.parse(row.created_at) > INVITE_TTL_MS) {
        setStatus.run('expired', null, iso(), battleId);
        throw new BattleError(410, 'Undangan sudah kedaluwarsa.');
      }
      if (!accept) {
        setStatus.run('declined', null, iso(), battleId);
        notify(row.creator_id, 'battle', { id: battleId, status: 'declined' });
        return { status: 'declined' };
      }
      const requested = JSON.parse(row.composition);
      const { items, composition, total } = pickItems({
        mode: row.mode,
        composition: requested,
        poolDay: row.pool_day,
        playerIds: [row.creator_id, row.opponent_id],
      });
      db.prepare('UPDATE battles SET total = ?, composition = ? WHERE id = ?').run(total, JSON.stringify(composition), battleId);
      for (const item of items) {
        markUsed.run(row.creator_id, item.id);
        markUsed.run(row.opponent_id, item.id);
      }
      persistItems(battleId, items);
      setStatus.run('active', null, iso(), battleId);
      const room = loadRoom(battleId);
      room.status = 'active';
      room.phase = 'idle';
      broadcast(room);
      startRound(room);
      return { status: 'active' };
    },

    answer(battleId, userId, idx, answer) {
      const room = loadRoom(battleId);
      if (!room || !playersOf(room).includes(userId)) throw new BattleError(404, 'Battle tidak ditemukan.');
      if (room.phase !== 'question' || idx !== room.round) throw new BattleError(409, 'Soal ini sudah tidak menerima jawaban.');
      const item = room.items[room.round];
      const byUser = room.answers.get(room.round);
      if (byUser.has(userId)) throw new BattleError(409, 'Kamu sudah menjawab soal ini.');
      const elapsedMs = Math.max(0, now() - room.startedAt);
      const limitMs = item.seconds * 1000;
      const text = String(answer ?? '').slice(0, 1200);
      const scored = scoreAnswer(item, text, elapsedMs, limitMs);
      byUser.set(userId, { answer: text, ...scored, elapsedMs });
      if (playersOf(room).every((id) => byUser.has(id))) {
        revealRound(room);
      } else {
        broadcast(room);
      }
      return { received: true };
    },

    rate(battleId, userId, idx, scores) {
      const room = loadRoom(battleId);
      if (!room || !playersOf(room).includes(userId) || room.phase !== 'rating') {
        throw new BattleError(409, 'Belum waktunya menilai esai.');
      }
      const item = room.items[idx];
      if (!item || item.type !== 'essay') throw new BattleError(400, 'Soal ini bukan esai.');
      const list = Array.isArray(scores) ? scores.map(Number) : [];
      if (list.length !== ESSAY_CRITERIA.length || list.some((value) => ![0, 1, 2].includes(value))) {
        throw new BattleError(400, 'Setiap kriteria dinilai 0, 1, atau 2.');
      }
      const points = list.reduce((sum, value) => sum + value, 0) * 2;
      room.ratings.set(`${idx}:${userId}`, points);
      insertRating.run(battleId, idx, userId, points);
      const essays = room.items.filter((entry) => entry.type === 'essay');
      const done = essays.every((entry) => playersOf(room).every((id) => room.ratings.has(`${entry.index}:${id}`)));
      if (done) finish(room);
      else broadcast(room);
      return { rated: true };
    },

    stateFor(battleId, userId) {
      const row = findBattle.get(battleId);
      if (!row || (row.creator_id !== userId && row.opponent_id !== userId)) throw new BattleError(404, 'Battle tidak ditemukan.');
      if (row.status === 'finished' || row.status === 'declined' || row.status === 'expired') {
        return {
          id: battleId,
          status: row.status,
          mode: row.mode,
          modeLabel: specFor(row.mode).label,
          winnerId: row.winner_id,
          you: userId,
          answers: answersOf.all(battleId),
          ratings: ratingsOf.all(battleId),
          items: itemsOf.all(battleId).map((item) => ({ idx: item.idx, type: item.type, ...publicResult(JSON.parse(item.payload)) })),
        };
      }
      const room = loadRoom(battleId);
      return room ? snapshot(room, userId) : { id: battleId, status: row.status, you: userId };
    },

    history(userId) {
      return historyOf.all(userId, userId).map((row) => ({
        id: row.id,
        mode: row.mode,
        modeLabel: specFor(row.mode).label,
        status: row.status,
        total: row.total,
        winner: row.winner_id === userId ? 'you' : row.winner_id ? 'opponent' : null,
        opponent: nameOf(row.creator_id === userId ? row.opponent_id : row.creator_id),
        createdAt: row.created_at,
      }));
    },

    pendingInvites(userId) {
      return db
        .prepare("SELECT * FROM battles WHERE opponent_id = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 10")
        .all(userId)
        .filter((row) => now() - Date.parse(row.created_at) <= INVITE_TTL_MS)
        .map((row) => ({
          battleId: row.id,
          mode: row.mode,
          modeLabel: specFor(row.mode).label,
          total: row.total,
          from: nameOf(row.creator_id),
        }));
    },

    /** Saat service dimulai ulang, battle yang masih berjalan di memori dianggap batal. */
    cancelInterrupted() {
      db.exec("UPDATE battles SET status = 'cancelled', updated_at = '" + iso() + "' WHERE status IN ('active', 'rating')");
    },

    userPublic: nameOf,
  };

  function inviteView(room) {
    return {
      battleId: room.id,
      mode: room.mode,
      modeLabel: specFor(room.mode).label,
      total: room.total,
      from: nameOf(room.creatorId),
    };
  }
}

function publicResult(item) {
  return { prompt: item.prompt, correct: item.correct ?? item.acceptedAnswers?.[0] ?? null, modelAnswer: item.modelAnswer ?? null, explanation: item.explanation ?? null };
}

function normalizeComposition(input) {
  const out = {};
  for (const [type, count] of Object.entries(input ?? {})) out[type] = Number(count);
  return out;
}

/** Tabel untuk hari lulus, battle, dan soal yang sudah pernah dipakai per pengguna. */
export function ensureBattleSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS mastered_days (
      user_id TEXT NOT NULL REFERENCES users(id),
      day INTEGER NOT NULL,
      PRIMARY KEY (user_id, day)
    );
    CREATE TABLE IF NOT EXISTS battles (
      id TEXT PRIMARY KEY,
      creator_id TEXT NOT NULL REFERENCES users(id),
      opponent_id TEXT NOT NULL REFERENCES users(id),
      mode TEXT NOT NULL,
      total INTEGER NOT NULL,
      pool_day INTEGER NOT NULL,
      composition TEXT NOT NULL,
      status TEXT NOT NULL,
      winner_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS battle_items (
      battle_id TEXT NOT NULL REFERENCES battles(id),
      idx INTEGER NOT NULL,
      item_id TEXT NOT NULL,
      type TEXT NOT NULL,
      payload TEXT NOT NULL,
      PRIMARY KEY (battle_id, idx)
    );
    CREATE TABLE IF NOT EXISTS battle_answers (
      battle_id TEXT NOT NULL,
      idx INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      answer TEXT,
      correct INTEGER NOT NULL,
      points INTEGER NOT NULL,
      elapsed_ms INTEGER NOT NULL,
      PRIMARY KEY (battle_id, idx, user_id)
    );
    CREATE TABLE IF NOT EXISTS battle_ratings (
      battle_id TEXT NOT NULL,
      idx INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      points INTEGER NOT NULL,
      PRIMARY KEY (battle_id, idx, user_id)
    );
    CREATE TABLE IF NOT EXISTS friends (
      user_id TEXT NOT NULL REFERENCES users(id),
      friend_id TEXT NOT NULL REFERENCES users(id),
      PRIMARY KEY (user_id, friend_id)
    );
    CREATE TABLE IF NOT EXISTS used_items (
      user_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      PRIMARY KEY (user_id, item_id)
    );
  `);
}

export class BattleError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
