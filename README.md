# EngHabits

> Bangun kebiasaan Inggris, 2 jam setiap pagi, 90 hari.

EngHabits adalah aplikasi web belajar Bahasa Inggris (CEFR A1 sampai B2, dengan latihan bergaya TOEFL ITP dan IELTS Academic). Seluruh materi 90 hari disimpan di dalam repositori sebagai file konten, bukan di-hardcode di komponen.

Status: **Fase 0 (persiapan)** selesai. Tampilan saat ini masih placeholder.

## Stack

- Vite, React, TypeScript, Tailwind CSS (v4)
- PWA lewat `vite-plugin-pwa` (bisa di-install ke HP)
- Penyimpanan progres: IndexedDB (`idb`), dengan rencana Export/Import JSON
- Animasi: `motion`
- Test: Vitest

## Menjalankan

Prasyarat: Node.js 20 atau lebih baru.

```bash
npm install
npm run dev          # server pengembangan
npm run typecheck    # cek tipe TypeScript
npm test             # Vitest
npm run build        # build produksi (PWA)
npm run preview      # cek hasil build secara lokal
```

## Memasang di HP

Setelah fitur PWA selesai (Fase 11), buka alamat aplikasi di browser HP lalu pilih "Tambahkan ke layar utama" (Android/Chrome) atau "Add to Home Screen" (iOS/Safari).

## Struktur

```
content/      materi 90 hari (days/), bank soal (bank/), referensi (reference/)
scripts/      validator dan status konten
src/          kode aplikasi (pages, components, lib, styles)
public/       aset statis
design-reference/  screenshot referensi desain (lokal, tidak di-commit)
```

## Catatan jujur

- Suara (TTS) memakai `speechSynthesis` bawaan browser. Itu bukan penutur asli, dan kualitasnya bergantung pada voice yang terpasang di perangkat.
- Estimasi skor TOEFL ITP dan Band IELTS hanyalah perkiraan. Itu bukan skor resmi dari ETS atau IELTS.
- Semua materi dan soal dibuat sendiri. Ini bukan produk resmi ETS atau IELTS.
