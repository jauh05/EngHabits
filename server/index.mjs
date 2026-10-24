// Menjalankan API akun. Port dan lokasi database bisa diatur lewat PORT dan DB_PATH.
// Jalankan: node server/index.mjs
import { fileURLToPath } from 'node:url';
import { createApp, openDatabase } from './app.mjs';

const defaultDb = fileURLToPath(new URL('./data/enghabits.db', import.meta.url));
const db = openDatabase(process.env.DB_PATH ?? defaultDb);
const port = Number(process.env.PORT ?? 3001);

createApp(db).listen(port, '127.0.0.1', () => {
  console.log(`API EngHabits berjalan di 127.0.0.1:${port}`);
});
