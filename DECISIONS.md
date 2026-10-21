# DECISIONS

Catatan keputusan teknis, urut dari yang terbaru.

## 2026-10-21: Fase 0

1. **Repositori remote kosong.** `git ls-remote` ke `https://github.com/jauh05/EngHabits.git` tidak mengembalikan ref apa pun, jadi tidak perlu `git pull --rebase`. Push pertama memakai `git push -u origin main`.
2. **`design-reference/` tidak di-commit.** Isinya screenshot desain pihak ketiga (bukan hasil karya sendiri) dan repositori bisa publik. Folder ini ditaruh di `.gitignore`. Jika ingin disimpan di repositori, hapus baris itu dengan sadar.
3. **Versi stack terbaru.** Vite 8, React 19, Tailwind CSS 4 (lewat `@tailwindcss/vite`), `vite-plugin-pwa` 2, `idb` 8, `motion` 14, Vitest 5, TypeScript 7. TypeScript 7 adalah compiler native baru. Jika muncul masalah tipe atau tooling, turunkan ke TypeScript 5.x.
4. **Manifest PWA belum punya ikon.** `icons` masih kosong dan favicon berupa SVG sederhana. Ikon PNG 192 dan 512 akan dibuat di Fase 11.
5. **Tidak ada layanan AI di Fase 0.** Koreksi AI opsional (server Node) akan dibuat di Fase 11, dengan `.env.example`.
6. **Tanpa `gh` CLI.** `gh` belum terpasang di mesin ini. Push memakai kredensial git yang sudah ada, dan jika gagal karena autentikasi, pengguna diminta menjalankan `gh auth login` sendiri. Token tidak disimpan di repositori.
