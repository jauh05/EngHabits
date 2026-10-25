// Sinkron progres belajar antar perangkat. Server menyimpan salinan gabungan dari semua perangkat.
// Aturan penggabungan harus sama dengan src/lib/syncMerge.ts supaya perangkat dan server selalu sepakat.
export const MASTERY_THRESHOLD = 60;
const KINDS = ['progress', 'attempts', 'mistakes', 'notes'];

export function ensureSyncSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_items (
      user_id TEXT NOT NULL REFERENCES users(id),
      kind TEXT NOT NULL,
      key TEXT NOT NULL,
      data TEXT NOT NULL,
      PRIMARY KEY (user_id, kind, key)
    );
  `);
}

const keyOf = {
  progress: (row) => String(row.day),
  attempts: (row) => String(row.id),
  mistakes: (row) => String(row.key),
  notes: (row) => String(row.day),
};

/** Dua salinan progres harian digabung: hari pertama lulus menjadi acuan, nilai terbaik diambil. */
function mergeProgress(a, b) {
  const first = a.completedAt <= b.completedAt ? a : b;
  return {
    ...first,
    bestCorePercent: Math.max(a.bestCorePercent, b.bestCorePercent),
    attempts: Math.max(a.attempts, b.attempts),
    lastAttemptAt: a.lastAttemptAt >= b.lastAttemptAt ? a.lastAttemptAt : b.lastAttemptAt,
  };
}

/** Percobaan tidak pernah berubah, jadi cukup disimpan satu kali berdasarkan id. */
function mergeMistake(a, b) {
  if (a.lastWrong !== b.lastWrong) return a.lastWrong > b.lastWrong ? a : b;
  return a.wrongCount >= b.wrongCount ? a : b;
}

export function mergeRow(kind, existing, incoming) {
  if (!existing) return incoming;
  if (kind === 'progress') return mergeProgress(existing, incoming);
  if (kind === 'attempts') return existing;
  if (kind === 'mistakes') return mergeMistake(existing, incoming);
  return existing.updatedAt >= incoming.updatedAt ? existing : incoming;
}

function readAll(db, userId) {
  const rows = db.prepare('SELECT kind, data FROM sync_items WHERE user_id = ?').all(userId);
  const out = { progress: [], attempts: [], mistakes: [], notes: [] };
  for (const row of rows) out[row.kind].push(JSON.parse(row.data));
  return out;
}

/** Menggabungkan data dari perangkat ke data server, menyimpannya, lalu mengembalikan hasilnya. */
export function syncUser(db, userId, incoming) {
  const write = db.prepare(
    'INSERT INTO sync_items (user_id, kind, key, data) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, kind, key) DO UPDATE SET data = excluded.data',
  );
  const find = db.prepare('SELECT data FROM sync_items WHERE user_id = ? AND kind = ? AND key = ?');
  db.exec('BEGIN');
  try {
    for (const kind of KINDS) {
      for (const row of incoming[kind] ?? []) {
        const key = keyOf[kind](row);
        const current = find.get(userId, kind, key);
        const merged = mergeRow(kind, current ? JSON.parse(current.data) : undefined, row);
        write.run(userId, kind, key, JSON.stringify(merged));
      }
    }
    refreshMastered(db, userId);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return readAll(db, userId);
}

export function readSync(db, userId) {
  return readAll(db, userId);
}

/** Hari lulus untuk level battle dihitung ulang dari progres yang sudah digabung. */
function refreshMastered(db, userId) {
  db.prepare('DELETE FROM mastered_days WHERE user_id = ?').run(userId);
  const rows = db.prepare("SELECT data FROM sync_items WHERE user_id = ? AND kind = 'progress'").all(userId);
  const insert = db.prepare('INSERT OR IGNORE INTO mastered_days (user_id, day) VALUES (?, ?)');
  for (const row of rows) {
    const progress = JSON.parse(row.data);
    if (progress.bestCorePercent >= MASTERY_THRESHOLD) insert.run(userId, progress.day);
  }
}
