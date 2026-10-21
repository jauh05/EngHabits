# PROGRESS

Terakhir diperbarui: 2026-10-21

## Fase

| Fase | Status |
|---|---|
| 0. Persiapan (proyek, git, dependensi, struktur) | Selesai (`50cacad`) |
| 0b. Desain UI/UX (`DESIGN_SPEC.md`, tokens, komponen, `/design`) | Selesai (`ff0468e`), disetujui |
| 1. Fondasi aplikasi, skema, validator, IndexedDB, routing, sesi, evaluasi | Selesai (lihat commit Fase 1) |
| 2. Kurikulum rinci 90 hari (`content/curriculum.json`) | Belum mulai |
| 3-10. Konten hari 1-90 (Hari 1 saat ini hanya contoh sementara) | Belum mulai |
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

- Hari konten yang lolos validator: **1 dari 90** (`content/days/day-01.json`, contoh sementara).
- Hari 1 ditulis untuk menguji sistem. Kualitasnya belum diaudit. Fase 3 akan menulis ulang Hari 1 sebagai standar rujukan.

## Keputusan penting

Lihat [DECISIONS.md](DECISIONS.md).

## Sesi berikutnya

- Fase 2: `content/curriculum.json` (rincian 90 hari) untuk disetujui sebelum menulis konten.
- Catatan sebelum Fase 3: audit Hari 1 (grammar, kunci, terjemahan) dan periksa ulang rasio komposisi.
