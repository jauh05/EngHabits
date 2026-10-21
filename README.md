# EngHabits

> Bangun kebiasaan Inggris, 2 jam setiap pagi, 90 hari.

EngHabits adalah aplikasi web belajar Bahasa Inggris (CEFR A1 sampai B2, dengan latihan bergaya TOEFL ITP dan IELTS Academic). Seluruh materi 90 hari disimpan di dalam repositori sebagai file konten, bukan di-hardcode di komponen.

Status: **Fase 1 (fondasi aplikasi)** selesai. Hari 1 saat ini masih contoh sementara. Progres lengkap ada di [PROGRESS.md](PROGRESS.md).

## Stack

- Vite, React, TypeScript, Tailwind CSS (v4)
- Routing: react-router. Animasi: motion. Validasi konten: zod.
- Penyimpanan progres: IndexedDB (idb). Ekspor dan impor JSON dijadwalkan di Fase 11.
- PWA lewat vite-plugin-pwa
- Test: Vitest

## Menjalankan

Prasyarat: Node.js 20 atau lebih baru.

```bash
npm install
npm run dev              # server pengembangan (http://localhost:5173)
npm run typecheck        # cek tipe TypeScript
npm test                 # Vitest (grading, SRS, progresi, validator)
npm run validate:content # validasi semua file content/days/
npm run validate:curriculum # validasi content/curriculum.json
npm run content:status   # tulis CONTENT_STATUS.md
npm run build            # build produksi (PWA)
npm run preview          # cek hasil build secara lokal
```

Katalog komponen tersedia di `http://localhost:5173/design` saat mode dev.

## Memasang di HP

Setelah fitur PWA selesai (Fase 11), buka alamat aplikasi di browser HP lalu pilih "Tambahkan ke layar utama" (Android/Chrome) atau "Add to Home Screen" (iOS/Safari).

## Struktur

```
content/          skema (schema.ts), materi 90 hari (days/), bank soal (bank/), referensi (reference/)
scripts/          validator konten dan status konten
src/              kode aplikasi (pages, components, lib, styles)
public/           aset statis
DESIGN_SPEC.md    spesifikasi desain
design-reference/ screenshot referensi desain (lokal, tidak di-commit)
```

## Catatan jujur

- Suara (TTS) memakai `speechSynthesis` bawaan browser. Itu bukan penutur asli, dan kualitasnya bergantung pada voice yang terpasang di perangkat.
- Kunci jawaban tidak tampil di layar sebelum kamu mengirim jawaban, tetapi berada di bundel JavaScript. Ini penghalang untuk pengguna, bukan keamanan.
- Estimasi skor TOEFL ITP dan Band IELTS hanyalah perkiraan. Itu bukan skor resmi dari ETS atau IELTS.
- Semua materi dan soal dibuat sendiri. Ini bukan produk resmi ETS atau IELTS.
