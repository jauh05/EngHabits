# DECISIONS

Catatan keputusan teknis, urut dari yang terbaru.

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
