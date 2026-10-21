# DESIGN SPEC: EngHabits

Status: **Draf, menunggu persetujuan.** Dibuat 2026-10-21 (Fase 0b).
Token warna ada di `src/styles/tokens.css`. Komponen dasar ada di `src/components/ui/`. Katalog bisa dilihat di `http://localhost:5173/design` saat `npm run dev`.

---

## 1. Ringkasan arah

- **Lavender modern.** Terang sebagai default, gelap ungu tua (bukan hitam pekat).
- **Bentuk ramah.** Kartu besar membulat (24px), tombol pil, navigasi bawah berbentuk pil gelap.
- **Animasi bermakna.** Setiap gerakan menjelaskan sesuatu: hasil, progres, atau perpindahan. Dikurangi bila pengguna memintanya.
- **Fungsi menang atas dekorasi.** Kunci jawaban tetap tersembunyi, dan tidak ada animasi yang menghalangi input.

## 2. Referensi dan pemetaan

Ada 8 gambar referensi yang diunggah dan sudah disalin ke `design-reference/` (nama file `1.webp` sampai `8.png`, mengikuti urutan unggah). Folder ini tidak di-commit (lihat `DECISIONS.md`).

| Referensi (isi) | Yang diambil | Dipakai di |
|---|---|---|
| Banner "Daily challenge" ungu, chip hari Sen-Min, kartu rencana, nav bawah pil | Banner tantangan, strip hari, kartu rencana, bentuk nav | Beranda |
| "A series of Olympiads" + "Progress" (grafik batang, kartu angka besar) | Kartu angka besar dengan ikon, grafik batang mingguan | Statistik, Beranda |
| Kuis "Quivio" (kartu banner, leaderboard, kartu upgrade) | Kartu banner tinggi dengan ilustrasi di kanan | Banner Beranda, kartu Hard Challenge |
| Komunitas (daftar kartu dengan cincin progres kecil, chip kategori) | Daftar kartu dengan cincin progres kecil | Peta 90 hari |
| Kursus "Design Thinking" (kartu materi, pemutar audio dengan waktu) | Pemutar audio dengan waktu, daftar materi | Sesi blok 3 (listening) |
| Dora (pilihan kartu dengan centang, pembayaran) | Kartu pilihan dengan tanda centang | Pengaturan (voice, aksen, kecepatan) |
| Dashboard Animal Crossing (sidebar kiri, kartu, grafik) | Layout dua kolom dengan sidebar | Layout desktop (≥1024px) |
| Medboard (kalender, sidebar, panel kanan) | Kalender, panel kanan | Peta 90 hari (layar lebar) |

Yang **tidak** diambil: palet warna pastel bercampur dari referensi, ilustrasi 3D, dan maskot milik referensi. Warna dan ilustrasi memakai aturan di bagian 3 dan 5.

## 3. Palet (design tokens)

| Token | Terang | Gelap | Pemakaian |
|---|---|---|---|
| `bg` | `#FAF7FF` | `#1B1530` | Latar halaman |
| `surface` | `#FFFFFF` | `#251D40` | Kartu, input |
| `primary-100` | `#EBE1FF` | `#3A2F5C` | Latar lembut, chip, indikator stepper |
| `primary-300` | `#C4A8FF` | `#7C66B8` | Garis dekoratif, ilustrasi |
| `primary-500` | `#8B6BE6` | `#A98BFF` | Progres, fokus, ikon besar (non-teks) |
| `primary-700` | `#5C3FA6` | `#CDBBFF` | Teks aksen, tombol utama (terang) |
| `ink` | `#2B2140` | `#F3EFFF` | Teks utama |
| `muted` | `#6B5F80` | `#B9AED6` | Teks sekunder, hint |
| `line` | `#E6DCF7` | `#3D3262` | Garis tepi kartu dan input |
| `track` | `#EBE1FF` | `#3A2F5C` | Jalur progres |
| `success` | `#4CC9A0` | `#5FD9B0` | Jawaban benar (latar, ikon) |
| `error` | `#FF7A93` | `#FF8FA3` | Jawaban salah (latar lembut, bukan merah keras) |
| `streak` | `#FFB84D` | `#FFC46B` | Streak, api, lencana medium |
| `on-accent` | `#2B2140` | `#1B1530` | Teks di atas success, error, streak |
| `btn-bg` / `btn-fg` | `#5C3FA6` / `#FFFFFF` | `#A98BFF` / `#1B1530` | Tombol utama |

**Kontras yang sudah dihitung (rasio WCAG):**

| Pasangan | Rasio | Lolos |
|---|---|---|
| Teks `ink` di `bg` (terang) | 14.2:1 | AA |
| Teks `ink` di `bg` (gelap) | 15.6:1 | AA |
| Putih di `primary-700` (tombol utama terang) | 7.7:1 | AA |
| `#1B1530` di `primary-500` gelap (tombol utama gelap) | 6.5:1 | AA |
| `primary-700` di `primary-100` | 6.2:1 | AA |
| `muted` di `surface` (terang) | 5.9:1 | AA |
| `muted` di `surface` (gelap) | 7.6:1 | AA |
| `on-accent` di `success` / `error` / `streak` (terang) | 7.3 / 6.1 / 8.8:1 | AA |
| `on-accent` di `success` / `error` / `streak` (gelap) | 10.1 / 8.1 / 11.2:1 | AA |
| `primary-500` (terang) di `bg`, untuk fokus dan ikon | 3.7:1 | non-teks ≥3:1 |

**Aturan:** `primary-500`, `success`, `error`, dan `streak` **tidak** dipakai sebagai warna teks di atas latar putih. Kontrasnya hanya 2.1 sampai 3.9:1. Warna itu dipakai untuk latar, ikon, dan progres, dan teks di atasnya memakai `on-accent`. Tombol utama memakai `primary-700` (bukan `primary-500`) untuk alasan yang sama.

## 4. Tipografi

- **Font:** Plus Jakarta Sans (variable), di-hosting sendiri lewat `@fontsource-variable/plus-jakarta-sans` supaya tetap jalan offline di PWA.
- **Skala:**

| Peran | Ukuran / line-height | Bobot |
|---|---|---|
| Judul halaman (display) | 30-32 / 38-40 px | 800 |
| Judul seksi (h2) | 20 / 28 px | 700 |
| Judul kartu (h3) | 18 / 26 px | 700 |
| Body | 16 / 24 px | 400-500 |
| Teks kecil | 14 / 20 px | 500 |
| Caption, chip | 12 / 16 px | 600 |

- **Input minimal 16px.** Ini mencegah zoom otomatis di iOS Safari.
- **Angka skor dan jumlah** memakai `tabular-nums` supaya tidak bergeser saat dihitung naik.

## 5. Spacing, bentuk, bayangan, ikon, ilustrasi

- **Skala spacing:** kelipatan 4px. Pakai 4, 8, 12, 16, 20, 24, 32, 40, 48.
- **Gutter layar:** 16px di HP, 24px di tablet ke atas.
- **Radius:** kartu 24px (`rounded-card`), input dan kartu kecil 16px, tombol dan chip pil (999px), wadah ikon 12px.
- **Bayangan:** `shadow-card`. Terang: bayangan ungu lembut. Gelap: bayangan hitam halus.
- **Target sentuh:** minimal 44px (`min-h-11`). Tombol aksi utama 56px.
- **Ikon:** `lucide-react`, stroke 2, ukuran 20px (kecil) dan 24px (standar). Dipilih karena ringan dan konsisten. Sudah terpasang.
- **Ilustrasi:** SVG buatan sendiri dengan gradien ungu lembut. Tidak meniru ilustrasi 3D dari referensi. Maskot opsional dibuat di Fase 11.

## 6. Navigasi

- **HP (di bawah 1024px):** navigasi bawah berbentuk pil gelap dengan 4 item: **Beranda, Peta, Statistik, Profil**. Item aktif ditandai lingkaran yang meluncur (`layoutId`). Di mode terang pil memakai `ink`, di mode gelap memakai `surface`.
- **Saat mengerjakan sesi atau soal:** navigasi bawah disembunyikan. Yang tampil hanya Stepper dan tombol kembali. Ini supaya fokus tidak terpecah. *(Keputusan, bisa diubah.)*
- **Desktop (1024px ke atas):** sidebar kiri 240px dengan item yang sama, ditambah **Kesalahan** dan **Pengaturan**. Konten maksimal 1120px.
- **Beranda:** header sapaan ("Halo, {nama}" dan tanggal), tombol cari dan notifikasi berbentuk lingkaran.

## 7. Daftar layar dan komponen

| Layar | Rute (rencana) | Komponen utama | Catatan |
|---|---|---|---|
| Beranda | `/` | Banner tantangan, strip hari minggu, kartu rencana hari ini, ProgressRing 90 hari, CountUp streak dan skor | Tombol besar "Mulai Sesi Hari Ini" |
| Peta 90 hari | `/peta` | Kartu per minggu (12), Badge status | Hari terkunci punya gembok yang bergoyang saat disentuh |
| Sesi harian | `/hari/:n` | Stepper 4 blok, timer cincin, FlipCard, pemutar audio, soal | Kunci jawaban tidak dimuat ke DOM sebelum submit |
| Hasil dan evaluasi | `/hari/:n/hasil` | CountUp skor, ProgressRing per bagian, akordeon penjelasan 4 lapis, Confetti | Confetti muncul saat sesi selesai, bisa dilewati |
| Buku kesalahan | `/kesalahan` | Card, Badge, tombol ulangi | Antrean spaced repetition |
| Statistik | `/statistik` | Grafik batang harian, akurasi per topik, kosakata dikuasai | Pakai pola kartu angka besar |
| Referensi, Laporan kesiapan, Latihan bebas | `/referensi`, `/laporan`, `/latihan` | Card, Badge, Input | Laporan jujur, dengan label "perkiraan" |
| Pengaturan | `/pengaturan` | Kartu pilihan (voice, kecepatan), toggle tema, toggle "Kurangi animasi" | Toggle mengatur `data-reduce-motion` dan `MotionConfig` |
| Katalog komponen | `/design` | Semua komponen di bawah | Dev saja, tidak ikut build |

**Komponen dasar yang sudah dibuat (Fase 0b):** Button, Card, Badge, Input, Modal, Toast (`ToastProvider` + `useToast`), Stepper, ProgressRing, FlipCard, Confetti, CountUp.

**Komponen yang akan dibuat di Fase 1:** Skeleton (loading), SpeakButton (🔊 dengan gelombang saat audio diputar), TimerRing (cincin timer blok), ExplainAccordion (penjelasan 4 lapis), ShadowingLine (baris naskah yang menyala).

## 8. Animasi per layar

Semua animasi memakai `motion/react` kecuali yang disebut CSS. Durasi 150-500ms, kecuali perayaan dan cincin progres.

| Layar / elemen | Pemicu | Animasi | Durasi | Easing |
|---|---|---|---|---|
| Pindah halaman | Navigasi | Fade + geser 12px | 250ms | easeOut |
| Navigasi bawah | Ketuk item | Lingkaran aktif meluncur (`layoutId`) | spring | spring 420/32 |
| Banner tantangan | Masuk halaman | Fade + naik 16px | 400ms | easeOut |
| Chip hari minggu | Masuk halaman | Stagger 40ms antar chip | 300ms | easeOut |
| Cincin 90 hari | Masuk halaman dan saat nilai berubah | `pathLength` 0 ke nilai | 1.35s | easeOut |
| Angka (CountUp) | Nilai berubah | Naik dari 0 ke nilai | 1s | easeOut |
| Ikon api streak | Streak lebih dari 0 | Denyut `scale` 1 → 1.08 → 1, berulang | 1.6s | easeInOut |
| Kartu rencana | Hover / tap | Angkat 3px | spring | spring |
| Tombol | Hover / tap | Scale 1.02 / 0.97 | spring | spring |
| Stepper | Pindah blok | Indikator meluncur, bar `scaleX` | spring | spring |
| Timer blok | Tiap detik | Cincin berkurang (`pathLength`), warna berubah ke `error` di 5 menit terakhir | 1s linear, warna 300ms | linear |
| Flashcard | Ketuk kartu | `rotateY` 0 ke 180 | 450ms | easeOut |
| Tombol 🔊 | Audio diputar | 4 batang gelombang naik turun | 0.8s, stagger | easeInOut |
| Pilihan soal | Dipilih | Pop: scale 1 → 1.03 → 1 | spring | bounce 520/18 |
| Jawaban benar | Submit | Pop + cincin kilau `success` | 500ms | bounce |
| Jawaban salah | Submit | Getar horizontal ±6px, 3 kali. Warna `error` lembut | 350ms | easeOut |
| Penjelasan 4 lapis | Buka lapis | Tinggi otomatis + fade | 300ms | easeOut |
| Baris shadowing | Baris aktif berganti | Latar `primary-100` meluncur (`layoutId`). Indikator rekam berdenyut | spring; 1.2s berulang | spring; easeInOut |
| Perayaan selesai sesi | Sesi selesai | Confetti 48 potong (1.8-3s), skor CountUp, lencana bounce | 1.8-3s | easeIn / bounce |
| Toast | Dipanggil | Naik + fade. Hilang otomatis setelah 3.5s | spring | spring |
| Modal | Dibuka | Backdrop fade, panel naik 40px | 250ms + spring | spring |
| Skeleton | Loading | Kilau bergerak (`translateX`) | 1.4s berulang | linear |
| Gembok terkunci | Hover / tap | Goyang ±4° | 400ms | easeInOut |
| Latar blob | Beranda dan perayaan | Gradien bergerak pelan (`transform`) | 20s berulang | linear. Mati saat reduce |

**Aturan animasi:**
- Hanya `transform` dan `opacity` yang dianimasikan, supaya tetap 60fps di HP menengah.
- **Tidak ada animasi yang menghalangi input.** Tombol "Lewati" selalu tersedia di layar perayaan.
- **Kurangi animasi:** `MotionConfig reducedMotion="user"` sudah aktif di `src/main.tsx`. Ditambah fallback CSS di `index.css` dan toggle manual `data-reduce-motion="true"` (akan dibuat di Pengaturan, Fase 1). Saat aktif: confetti dan latar blob dimatikan, transisi jadi fade sederhana.
- **Kurangi animasi dan confetti:** `Confetti` tidak merender apa pun bila `useReducedMotion()` bernilai true.

## 9. Aksesibilitas

- **Kontras:** lihat tabel di bagian 3. Semua teks lolos AA.
- **Target sentuh:** minimal 44px. Tombol nav dan chip hari juga memenuhi ini.
- **Fokus keyboard:** outline 2px `primary-500` dengan offset 2px. Terlihat di terang dan gelap.
- **ARIA:**
  - Stepper memakai `aria-current="step"` dan `nav` dengan label.
  - ProgressRing memakai `role="img"` dengan label persentase.
  - Modal memakai `role="dialog"`, `aria-modal`, dan `aria-labelledby`. Tutup dengan Escape, fokus kembali ke pemicu.
  - Toast memakai `role="status"` dan `aria-live="polite"`.
  - Tombol audio (Fase 1) wajib memakai `aria-label`.
- **Tidak mengandalkan warna saja:** lencana memakai teks (Easy, Medium, Hard). Jawaban benar dan salah juga memakai ikon dan teks.

## 10. Keputusan teknis yang sudah diambil

- Katalog `/design` hanya dimuat di mode dev (`import.meta.env.DEV`). Verifikasi: string "Katalog komponen" tidak ada di `dist/`.
- Tanpa router pada Fase 0b. Rute `/design` dicek manual di `main.tsx`. Router resmi dipasang di Fase 1.
- Tema disimpan lewat `data-theme` di `<html>`. Default terang.
- Tombol utama memakai `primary-700` (terang) dan `primary-500` (gelap) supaya lolos kontras.

## 11. Pertanyaan untukmu

1. **Warna kartu rencana:** tetap satu keluarga ungu (disarankan), atau boleh pastel kuning, pink, dan biru seperti referensi?
2. **Ilustrasi banner:** SVG gradien buatan sendiri (disarankan), atau placeholder dulu sampai kamu punya aset?
3. **Maskot:** dibuat di Fase 11 (disarankan), atau dilewati?
4. **Font dan ikon:** Plus Jakarta Sans dan lucide-react. Setuju?
5. **Navigasi bawah:** 4 item (Beranda, Peta, Statistik, Profil) dengan "Kesalahan" di Beranda (disarankan), atau 5 item?
