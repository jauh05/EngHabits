# PROGRESS

Terakhir diperbarui: 2026-10-21

## Fase

| Fase | Status |
|---|---|
| 0. Persiapan (proyek, git, dependensi, struktur) | Selesai (`50cacad`) |
| 0b. Desain UI/UX (`DESIGN_SPEC.md`, tokens, komponen, `/design`) | Selesai (`ff0468e`), disetujui |
| 1. Fondasi aplikasi, skema, validator, IndexedDB, routing, sesi, evaluasi | Selesai (lihat commit Fase 1) |
| 2. Kurikulum rinci 90 hari (`content/curriculum.json`) | Selesai, menunggu persetujuan ringkasan per minggu |
| 3. Konten hari 1-7 dan bank Hard minggu 1 | Selesai, menunggu persetujuan kualitas |
| 4. Konten hari 8-14 dan bank Hard minggu 2 | Selesai (disetujui) |
| 5. Konten hari 15-21 dan bank Hard minggu 3 | Selesai, menunggu persetujuan kualitas |
| 6. Konten hari 22-30 dan bank Hard minggu 4 | Selesai (disetujui) |
| 7. Konten hari 31-37 dan bank Hard minggu 5 | Selesai, menunggu persetujuan kualitas |
| 8-10. Konten hari 38-90 | Belum mulai |
| 11. Fitur lanjutan (sesi perbaikan, latihan bebas, laporan kesiapan, statistik, ekspor/impor, koreksi AI, pengingat, PWA offline penuh) | Belum mulai |
| 11b. Deploy GitHub Pages | Belum mulai |
| 12. QA akhir | Belum mulai |

## Yang sudah jalan (Fase 1)

- Skema konten zod (`content/schema.ts`) dan validator (`npm run validate:content`) dengan 15+ aturan dari bagian 6 prompt.
- Status konten (`npm run content:status`) menulis `CONTENT_STATUS.md`.
- Tes Vitest: 34 tes untuk grading, SRS, progresi, dan validator (`npm test`).
- Routing: Beranda, Peta 90 hari, Buku Kesalahan, Profil (pengaturan), Statistik (belum), sesi `/hari/:n`.
- Sesi 4 blok dengan stepper, timer panduan, kosakata 10 item + flashcard, materi 2A/2B dengan catatan, blok 3 membaca atau mendengarkan, blok 4 dengan Bagian A, B, dan Hard Challenge.
- Kunci tidak dirender sebelum kirim. Penilaian lokal, evaluasi mendalam 4 lapis, tombol salin "Aku masih bingung".
- Penguncian progresi: hari N+1 terbuka setelah hari N dikirim.
- Buku Kesalahan dengan jadwal Leitner (+1, +3, +7, +14 hari).
- Progres, percobaan, dan Buku Kesalahan disimpan di IndexedDB. Reset tersedia di Profil.

## Konten

- Hari konten yang lolos validator: **37 dari 90** (hari 1 sampai 37).
- Bank Hard minggu 1 sampai 5: 30 soal per minggu.
- Hari 1 awalnya dibuat untuk menguji sistem, lalu dipakai sebagai acuan standar Fase 3.

## Keputusan penting

Lihat [DECISIONS.md](DECISIONS.md).

## Sesi berikutnya

- Menunggu persetujuan kualitas hari 31 sampai 37 dan bank minggu 5. Setelah disetujui: Fase 8 (minggu 6, hari 38 sampai 44).
- Audit mutu penuh tetap dijadwalkan di Fase 12.
