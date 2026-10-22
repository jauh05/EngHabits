# PROGRESS

Terakhir diperbarui: 2026-10-22

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
| 7. Konten hari 31-37 dan bank Hard minggu 5 | Selesai (disetujui) |
| 8. Konten hari 38-44 dan bank Hard minggu 6 | Selesai (disetujui) |
| 9. Konten hari 45-51 dan bank Hard minggu 7 | Selesai (disetujui) |
| 10. Konten hari 52-60 dan bank Hard minggu 8 | Selesai (disetujui) |
| 10b. Konten hari 61-90 dan bank Hard minggu 9-12 | Selesai (disetujui) |
| 11. Fitur lanjutan (statistik, laporan kesiapan, latihan perbaikan, ekspor/impor, pengingat, ikon PWA) | Sebagian selesai, menunggu keputusan: mastery gate, perekam suara, koreksi AI |
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

## Yang sudah jalan (Fase 11, sebagian)

- Statistik (`/statistik`) dan laporan kesiapan perkiraan (`/laporan`, minimal 7 hari selesai).
- Latihan perbaikan dari Buku Kesalahan yang jatuh tempo (`/latihan`).
- Ekspor dan impor JSON di Profil, dengan pratinjau sebelum data diganti.
- Pengingat jam 06.00 saat aplikasi terbuka, dan ikon PWA 192 dan 512.

## Konten

- Hari konten yang lolos validator: **90 dari 90** (hari 1 sampai 90).
- Bank Hard minggu 1 sampai 12: 30 soal per minggu.
- Hari 1 awalnya dibuat untuk menguji sistem, lalu dipakai sebagai acuan standar Fase 3.

## Keputusan penting

Lihat [DECISIONS.md](DECISIONS.md).

## Sesi berikutnya

- Keputusan untuk melanjutkan Fase 11: ambang mastery gate dan perilaku sesi perbaikan otomatis, apakah perekam suara dibuat, dan penyedia serta kunci API untuk koreksi AI.
- Audit mutu penuh tetap dijadwalkan di Fase 12, termasuk pemisahan chunk bundel yang besar.
- Audit mutu penuh tetap dijadwalkan di Fase 12.
