# DECISIONS

Catatan keputusan teknis, urut dari yang terbaru.

## 2026-10-21: Fase 7 (konten hari 31-37 dan bank minggu 5)

1. **Pola minggu 5.** Komposisi 3 mudah, 6 sedang, 6 sulit untuk 15 soal inti sesuai target minggu 5. Hard Challenge 5 soal sulit. Hari 31, 33, 35 membaca (teks Bulan 2, 225 sampai 385 kata). Hari 32, 34, 36 mendengarkan. Hari 37 review dengan naskah.
2. **Topik struktur kalimat.** Kurikulum memakai label "TOEFL Structure". Semua teks, naskah, dan soal ditulis sendiri dengan gaya struktur kalimat. Tidak ada soal resmi yang disalin atau dikutip.
3. **Validator menangkap tiga jenis masalah.** Tanda titik tiga di penjelasan dan hint (hari 31 sampai 37 dan bank), satu opsi yang sama setelah tanda baca dihapus (hari 31 H5), dan satu entri kesalahan yang `wrong`-nya sama dengan `right` (hari 32). Ketiganya sudah diperbaiki sebelum validasi lolos.
4. **Bank minggu 5 sudah lolos validator.** 30 soal sulit. Jawaban benar tersebar: A 8, B 6, C 8, D 8. Topik: subjek dan kata kerja, frasa depan, appositive, kesesuaian each, either, the number of, one of, dan pengecekan kesalahan.
5. **Batas kualitas tetap sama.** Validator lolos, tetapi audit kalimat per kalimat belum dilakukan. Beberapa pengecoh, misalnya pada W05-026 dan W05-030, perlu dibaca ulang saat audit mutu di Fase 12.

## 2026-10-21: Fase 6 (konten hari 22-30 dan bank minggu 4)

1. **Pola sama dengan Fase 5.** Komposisi 5 mudah, 6 sedang, 4 sulit untuk 15 soal inti. Hard Challenge 5 soal sulit dengan jebakan ujian. Hari 22, 24, 26 mendengarkan. Hari 23, 25, 27, 29 membaca. Hari 28 review. Hari 30 ujian akhir bulan 1 (skillFocus `exam`), dengan blok 3 berupa teks bacaan.
2. **Kosakata hari 30 diganti.** `result` sudah dipakai di hari 27, sehingga validator menolak pengulangan dalam 10 hari. Kata yang dipakai menjadi `score`, dan `content/curriculum.json` ikut diperbarui agar tetap konsisten.
3. **Validator menangkap tiga jenis masalah.** Tanda titik tiga di beberapa penjelasan (hari 25 sampai 29, dan hint hari 28), dua opsi yang sama setelah tanda baca dihapus (hari 25 H2, hari 26 H2 dan H5), serta satu kosakata berulang (hari 30).
4. **Bank minggu 4 sudah lolos validator.** 30 soal sulit, dengan jawaban benar tersebar: A 10, B 6, C 8, D 6. Topik: kata sifat dan keterangan, pembanding dan superlatif, pasif, konjungsi setara, konjungsi bawahan, dan conditional.
5. **Batas kualitas tetap sama.** Validator lolos, tetapi beberapa pengecoh di bank tetap bisa dibaca benar secara tata bahasa dan jawabannya hanya lebih tepat secara makna. Contohnya W04-016, W04-019, dan W04-020 yang memakai and atau but. Audit manual kalimat per kalimat tetap dijadwalkan di Fase 12.

## 2026-10-21: Fase 5 (konten hari 15-21 dan bank minggu 3)

1. **Pola sama dengan Fase 4.** Komposisi 5 mudah, 6 sedang, 4 sulit untuk 15 soal inti sesuai target minggu 3. Hard Challenge 5 soal sulit. Hari 16, 18, 20 mendengarkan. Hari 15, 17, 19 membaca. Hari 21 review.
2. **Pembedaan yang diuji.** Will versus be going to (hari 15), modal dan don't have to versus must not (hari 16), present perfect versus simple past (hari 17 dan 18), countable versus uncountable (hari 19), dan wh-questions (hari 20).
3. **Validator menangkap tiga masalah saat penulisan.** Satu placeholder titik tiga, satu teks bacaan yang kurang panjang, dan satu soal bank dengan dua jawaban yang sama-sama benar (opsi some/some diganti). Validator tidak mendeteksi ambiguitas makna, jadi pemeriksaan itu tetap manual.
4. **Batas kualitas tetap sama.** Validator dan struktur sudah diperiksa, tetapi belum ada audit grammar kalimat per kalimat.

## 2026-10-21: Fase 4 (konten hari 8-14 dan bank minggu 2)

1. **Pola sama dengan Fase 3.** Komposisi 8 mudah, 5 sedang, 2 sulit untuk 15 soal inti. Hard Challenge 5 soal sulit dengan jebakan ujian. Hari 8, 10, 12 mendengarkan (listening), hari 9, 11, 13 membaca (reading), hari 14 review. Hari 8 sampai 13 memakai topik minggu 2 secara bertahap, dan hari 14 mengulang seluruh minggu 2.
2. **Bank minggu 2:** 30 soal sulit, dengan campuran topik minggu 2 dan soal campuran dari minggu 1 (tag `interleave-minggu-1`).
3. **Validator menangkap kesalahan ketik.** Lima kesalahan ditemukan saat validasi: tiga placeholder titik tiga, satu teks bacaan terlalu pendek (78 kata, batas minimal 90), dan satu soal bank yang memakai titik tiga. Semuanya sudah diperbaiki sebelum commit.
4. **Batas kualitas tetap sama dengan Fase 3.** Validator dan pengecekan browser memastikan struktur dan alur, tetapi belum ada audit grammar kalimat per kalimat.

## 2026-10-21: Fase 3 (konten hari 1-7 dan bank minggu 1)

1. **Standar setiap hari.** 15 soal inti (5 blok 3, 5 Bagian A, 5 Bagian B) dengan komposisi 8 mudah, 5 sedang, 2 sulit sesuai target minggu 1. Hard Challenge 5 soal, semuanya sulit, dengan 2 soal dari topik hari, 2 soal campuran dari hari sebelumnya, dan 1 jebakan ujian. Semua soal sulit punya 4 lapis penjelasan dan examTrap.
2. **Pola skill mengikuti kurikulum.** Hari 1, 3, 5 membaca (reading). Hari 2, 4, 6 mendengarkan (listening, dengan naskah 11 baris). Hari 7 review.
3. **Validator diperketat.** Ditambahkan dua pemeriksaan: (a) `evidence` wajib untuk setiap soal blok 3 dan harus muncul di teks atau naskah, (b) minimal 7 dari 10 kosakata hari harus muncul di teks atau naskah (kecuali hari review). Hari 1 dan 2 sempat gagal dan sudah diperbaiki.
4. **Bank minggu 1.** `content/bank/week-01.json` berisi 30 soal sulit dengan 4 lapis penjelasan. Validator memeriksa jumlah minimal 30 soal sulit, id, jawaban benar, whyOthersWrong, examTrap, dan distribusi jawaban benar.
5. **Tidak menyalin materi luar.** Semua teks, dialog, dan soal ditulis sendiri. Tidak ada kutipan dari ETS atau IELTS.
6. **Batas kualitas.** Saya memeriksa struktur dan aturan validator, serta satu halaman sesi di browser. Saya belum melakukan audit grammar manual setiap kalimat. Audit mutu acak dijadwalkan di Fase 12, dan persetujuanmu atas hari 1 sampai 7 tetap diperlukan.

## 2026-10-21: Fase 2 (kurikulum 90 hari)

1. **Generator sekali pakai, hasil di-commit.** `content/curriculum.json` dibuat dari data yang ditulis langsung (judul, kosakata, ringkasan, kata kunci YouTube per hari). Generator tidak disimpan di repositori. Hasil JSON-nya yang menjadi sumber kebenaran, dan bisa diedit langsung.
2. **Pola skillFocus:** hari ganjil reading, hari genap listening. Hari review: 7, 14, 21, 28, 37, 44, 51, 58, 67, 74, 81. Hari exam: 30, 59, 60, 88, 89, 90. Hari 28-30 mengikuti ujian akhir bulan 1 (28 grammar, 29 reading, 30 ujian).
3. **Kosakata unik.** Dari 900 slot, 730 kosakata di hari reading dan listening semuanya unik. Hari review dan exam boleh mengulang kata dari minggu itu, sesuai tujuannya. `scripts/validate-curriculum.ts` (`npm run validate:curriculum`) memeriksa ini, plus urutan hari, minggu, bulan, dan kesesuaian dengan file konten yang sudah ada (kosakata Hari 1 cocok).
4. **Field `topic`** berisi label minggu (misalnya "IELTS Writing Task 1"). Judul hari lebih spesifik. Review diberi awalan "Review: ".

## 2026-10-21: Fase 1 (fondasi aplikasi)

1. **Skema dengan zod.** `content/schema.ts` berisi zod schema, tipe TypeScript (`z.infer`), dan konstanta kurikulum (rentang minggu, target kesulitan). Validator memakai schema ini ditambah aturan tambahan. Tidak ada file JSON Schema terpisah karena zod sudah menjadi sumber tunggal.
2. **Hari 1 adalah contoh sementara.** `content/days/day-01.json` ditulis untuk menguji sistem dan lolos validator. Kualitasnya belum diaudit. Fase 3 menulis ulang Hari 1 sebagai standar rujukan.
3. **Aturan validator yang saya pilih** (bisa diubah di `scripts/content-rules.ts`):
   - Jawaban benar tidak boleh sama semua, dan satu huruf tidak boleh lebih dari 60% dari soal pilihan ganda.
   - Teks bacaan: Bulan 1 90-165 kata, Bulan 2 225-385, Bulan 3 minimal 360 (toleransi ±10%).
   - Komposisi 15 soal inti dibandingkan dengan target minggu, toleransi ±2 per tingkat.
   - Kosakata tidak boleh berulang dari 10 hari sebelumnya (kecuali hari review).
   - Kata seperti TODO, TBD, lorem, titik tiga, dan dst dianggap placeholder.
4. **Kunci tidak tampil sebelum kirim, tetapi bukan rahasia.** Tampilan memakai `DayView` yang sudah dibersihkan dari kunci, penjelasan, dan contoh jawaban. Namun data hari lengkap tetap ada di chunk JS yang dimuat lazy, jadi siapa pun bisa membacanya lewat devtools. Ini penghalang untuk pengguna biasa, bukan keamanan. Aplikasi ini tidak punya server, jadi kunci tidak bisa benar-benar disembunyikan.
5. **Penilaian lokal hanya untuk pilihan ganda dan terjemahan.** Terjemahan dicocokkan dengan `acceptedAnswers` setelah normalisasi (huruf kecil, tanpa apostrof dan tanda baca). Tugas IELTS (Bulan 2-3) belum dinilai. Jawaban tulisnya akan dikoreksi lewat koreksi AI atau tombol salin di Fase 11.
6. **Skor resmi hari = percobaan pertama.** Skor inti dihitung dari 15 soal (blok 3, Bagian A, Bagian B). Hard Challenge adalah bonus terpisah. Percobaan ulang tidak mengubah skor pertama.
7. **Penguncian hanya di Fase 1.** Hari N+1 terbuka setelah hari N dikirim. Mastery gate dan Sesi Perbaikan otomatis dibuat di Fase 11.
8. **Layout sesi tanpa navigasi bawah.** Rute `/hari/:n` berada di luar `AppShell`, sehingga navigasi bawah tidak tampil saat mengerjakan sesi.
9. **Router: react-router 7** dengan `basename` dari `import.meta.env.BASE_URL`, supaya nanti bisa dipasang di GitHub Pages (`/EngHabits/`).
10. **Pengaturan di IndexedDB.** Tema, kurangi animasi, aksen, dan kecepatan TTS disimpan di sana. Kurangi animasi menyalakan `MotionConfig reducedMotion="always"` dan atribut `data-reduce-motion`.
11. **Timer panduan.** Timer tidak mengunci apa pun. Cincin berubah warna di lima menit terakhir.
12. **Belum dibuat (Fase 11):** perekam suara (MediaRecorder), halaman Statistik (saat ini hanya placeholder), ekspor dan impor, koreksi AI, pengingat jam 06.00, dan ikon PWA.
13. **Ukuran bundel ±580 KB (±180 KB gzip).** Peringatan dari Vite muncul. Pemisahan chunk dan pengecilan dijadwalkan di Fase 12.
14. **Lima pertanyaan di DESIGN_SPEC** dijawab dengan rekomendasi default karena persetujuan diberikan tanpa jawaban terpisah: kartu rencana satu keluarga ungu, ilustrasi SVG gradien sederhana, maskot di Fase 11, Plus Jakarta Sans dan lucide-react, navigasi bawah empat item dengan Kesalahan di Beranda.

## 2026-10-21: Fase 0b (desain UI/UX)

1. **Tombol utama memakai `primary-700` (terang) dan `primary-500` (gelap).** Putih di `primary-500` hanya 3.9:1, jadi gagal AA. Warna `primary-500`, `success`, `error`, dan `streak` tidak dipakai sebagai teks di atas latar terang. Teks di atasnya memakai token `on-accent`. Rasio lengkap ada di `DESIGN_SPEC.md` bagian 3.
2. **Katalog `/design` hanya dimuat di mode dev.** `main.tsx` memakai `import()` dinamis di dalam `import.meta.env.DEV`. Diverifikasi: string "Katalog komponen" tidak ada di `dist/`.
3. **Belum ada router.** Rute `/design` dicek manual dengan `window.location.pathname`. Router resmi dipasang di Fase 1.
4. **Tema lewat `data-theme` di `<html>`, default terang.** Mode gelap ditandai `:root[data-theme='dark']`. Tidak mengikuti `prefers-color-scheme`, karena aturan proyek menjadikan terang sebagai default.
5. **Animasi memakai `motion/react`.** `MotionConfig reducedMotion="user"` dipasang di `main.tsx`. Fallback CSS ada di `index.css`, dan atribut `data-reduce-motion` disiapkan untuk toggle Pengaturan di Fase 1.
6. **Ikon `lucide-react`, font `@fontsource-variable/plus-jakarta-sans`.** Font di-hosting sendiri supaya offline di PWA.
7. **Navigasi bawah disembunyikan saat mengerjakan soal atau sesi.** Ini keputusan desain yang bisa diubah (`DESIGN_SPEC.md` bagian 6).
8. **Perbaikan `Modal`:** `onClose` disimpan di ref supaya listener Escape tidak dipasang ulang setiap render. Tanpa ini, fokus kembali ke elemen yang salah saat modal ditutup.

## 2026-10-21: Fase 0

1. **Repositori remote kosong.** `git ls-remote` ke `https://github.com/jauh05/EngHabits.git` tidak mengembalikan ref apa pun, jadi tidak perlu `git pull --rebase`. Push pertama memakai `git push -u origin main`.
2. **`design-reference/` tidak di-commit.** Isinya screenshot desain pihak ketiga (bukan hasil karya sendiri) dan repositori bisa publik. Folder ini ditaruh di `.gitignore`. Jika ingin disimpan di repositori, hapus baris itu dengan sadar.
3. **Versi stack terbaru.** Vite 8, React 19, Tailwind CSS 4 (lewat `@tailwindcss/vite`), `vite-plugin-pwa` 2, `idb` 8, `motion` 14, Vitest 5, TypeScript 7. TypeScript 7 adalah compiler native baru. Jika muncul masalah tipe atau tooling, turunkan ke TypeScript 5.x.
4. **Manifest PWA belum punya ikon.** `icons` masih kosong dan favicon berupa SVG sederhana. Ikon PNG 192 dan 512 akan dibuat di Fase 11.
5. **Tidak ada layanan AI di Fase 0.** Koreksi AI opsional (server Node) akan dibuat di Fase 11, dengan `.env.example`.
6. **Tanpa `gh` CLI.** `gh` belum terpasang di mesin ini. Push memakai kredensial git yang sudah ada, dan jika gagal karena autentikasi, pengguna diminta menjalankan `gh auth login` sendiri. Token tidak disimpan di repositori.
