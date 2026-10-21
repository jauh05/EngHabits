# DECISIONS

Catatan keputusan teknis, urut dari yang terbaru.

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
