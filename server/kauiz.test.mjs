import { beforeEach, describe, expect, it } from 'vitest';
import { openDatabase } from './app.mjs';
import { KauizError, kauizConnected, linkKauiz, unlinkKauiz } from './kauiz.mjs';

let db;

function addUser(id) {
  db.prepare('INSERT INTO users (id, email, name, salt, hash, created_at, public_id) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    id,
    `${id}@test.localhost`,
    id,
    'salt',
    'hash',
    new Date().toISOString(),
    `EH-${id.toUpperCase().padEnd(6, 'X').slice(0, 6)}`,
  );
}

beforeEach(() => {
  db = openDatabase(':memory:');
  addUser('ani');
  addUser('budi');
});

describe('tautan Kauiz', () => {
  it('belum terhubung sampai ditautkan', () => {
    expect(kauizConnected(db, 'ani')).toBe(false);
    linkKauiz(db, 'ani', 'kz-1');
    expect(kauizConnected(db, 'ani')).toBe(true);
  });

  it('menautkan ulang ID yang sama tidak error', () => {
    linkKauiz(db, 'ani', 'kz-1');
    expect(() => linkKauiz(db, 'ani', 'kz-1')).not.toThrow();
  });

  it('satu akun Kauiz tidak bisa dipakai dua akun EngHabits', () => {
    linkKauiz(db, 'ani', 'kz-1');
    expect(() => linkKauiz(db, 'budi', 'kz-1')).toThrow(KauizError);
    expect(kauizConnected(db, 'budi')).toBe(false);
  });

  it('satu akun EngHabits tidak punya dua tautan sekaligus', () => {
    linkKauiz(db, 'ani', 'kz-1');
    expect(() => linkKauiz(db, 'ani', 'kz-2')).toThrow(KauizError);
  });

  it('bisa diputus lalu ditautkan lagi', () => {
    linkKauiz(db, 'ani', 'kz-1');
    unlinkKauiz(db, 'ani');
    expect(kauizConnected(db, 'ani')).toBe(false);
    linkKauiz(db, 'ani', 'kz-2');
    expect(kauizConnected(db, 'ani')).toBe(true);
  });

  it('ID kosong ditolak', () => {
    expect(() => linkKauiz(db, 'ani', '  ')).toThrow(KauizError);
  });
});
