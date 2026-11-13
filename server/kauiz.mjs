/**
 * Tautan akun EngHabits ke akun Kauiz. Satu akun EngHabits hanya punya satu tautan, dan satu akun Kauiz
 * hanya bisa ditautkan ke satu akun EngHabits. Cara masuk ke Kauiz belum diputuskan, jadi `linkKauiz`
 * hanya boleh dipanggil setelah identitas Kauiz benar-benar diverifikasi.
 */

export class KauizError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function ensureKauizSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS kauiz_links (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      kauiz_id TEXT NOT NULL UNIQUE,
      linked_at TEXT NOT NULL
    );
  `);
}

export function kauizConnected(db, userId) {
  return Boolean(db.prepare('SELECT 1 FROM kauiz_links WHERE user_id = ?').get(userId));
}

export function linkKauiz(db, userId, kauizId, now = new Date().toISOString()) {
  const id = String(kauizId ?? '').trim();
  if (!id) throw new KauizError(400, 'ID akun Kauiz tidak valid.');
  const own = db.prepare('SELECT kauiz_id FROM kauiz_links WHERE user_id = ?').get(userId);
  if (own && own.kauiz_id !== id) {
    throw new KauizError(409, 'Akun ini sudah terhubung ke Kauiz lain. Putuskan dulu sebelum menghubungkan yang baru.');
  }
  if (own) return;
  const taken = db.prepare('SELECT user_id FROM kauiz_links WHERE kauiz_id = ?').get(id);
  if (taken) throw new KauizError(409, 'Akun Kauiz ini sudah terhubung ke akun EngHabits lain.');
  db.prepare('INSERT INTO kauiz_links (user_id, kauiz_id, linked_at) VALUES (?, ?, ?)').run(userId, id, now);
}

export function unlinkKauiz(db, userId) {
  db.prepare('DELETE FROM kauiz_links WHERE user_id = ?').run(userId);
}
