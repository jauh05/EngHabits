# DESIGN SPEC: EngHabits

Status: **Draf, menunggu persetujuan.** Dibuat 2026-10-21 (Fase 0b).
Token warna ada di `src/styles/tokens.css`. Komponen dasar ada di `src/components/ui/`. Katalog bisa dilihat di `http://localhost:5173/design` saat `npm run dev`.

---

## 1. Ringkasan arah

- **Hijau segar.** Latar lime, kartu putih dengan tepi 3D, dan gelap hijau sangat tua (bukan hitam pekat).
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

Yang **tidak** diambil: ilustrasi 3D dan maskot milik referensi. Ilustrasi memakai SVG buatan sendiri (bagian 5).

**Revisi 2026-10-22 (atas permintaan pengguna): kartu mengikuti referensi.** Kartu bisa memakai warna pastel (`sun`, `sky`, `rose`, `mint`) seperti kartu di referensi. Teks di atasnya tetap `ink`. Kartu rencana hari ini memakai empat warna itu. Kartu statistik memakai ikon di kotak putih. Pilihan pengaturan memakai kartu dengan tanda centang. Animasi di bagian 8 juga dilengkapi: transisi pindah halaman, denyut streak, getar jawaban salah, pop jawaban benar, skeleton, blob latar, dan grafik batang yang tumbuh.

## 3. Palet (design tokens)

**Rombak terbaru 2026-10-22 (atas permintaan pemilik proyek, mengikuti gambar 28 dan 29).** Palet hijau: latar lime `#9CD548` di semua layar, kartu putih dengan tepi 3D, tombol hijau tua `#1F7A3A` dengan teks putih, dan banner hijau tua. Frame desktop tetap putih di atas latar lime. Sumber kebenaran adalah `src/styles/tokens.css`, dan tabel di bawah sama dengan file itu.

| Token | Terang | Gelap | Pemakaian |
|---|---|---|---|
| `bg` | `#9CD548` | `#0E1F15` | Latar halaman (lime) |
| `surface` | `#FFFFFF` | `#16301F` | Kartu, input, frame desktop |
| `primary-100` | `#E4F7CF` | `#1D3D28` | Latar lembut, chip, tombol sekunder, indikator stepper |
| `primary-300` | `#B8E882` | `#3B7A4A` | Garis dekoratif, tepi tombol sekunder |
| `primary-500` | `#5BBF3E` | `#7ED957` | Progres, fokus, ikon besar (non-teks) |
| `primary-700` | `#1F7A3A` | `#B7F29A` | Teks aksen di atas putih atau `primary-100` (bukan di atas lime) |
| `ink` | `#12331D` | `#E8F7E6` | Teks utama |
| `muted` | `#2F4A36` | `#A9C7B0` | Teks sekunder, hint |
| `line` | `#CDE7D2` | `#24472F` | Garis tepi input |
| `track` | `#D9F0D0` | `#1F3D2A` | Jalur progres |
| `success` | `#237A38` | `#5BD28A` | Jawaban benar, status lulus (teks putih di atasnya) |
| `error` | `#E5484D` | `#FF8A8A` | Jawaban salah, perlu perbaikan |
| `streak` | `#F5B82E` | `#FFC857` | Bintang, streak, status kuning |
| `on-accent` | `#12331D` | `#0E1F15` | Teks di atas success, lime, streak, dan mint tua |
| `btn-bg` / `btn-fg` | `#1F7A3A` / `#FFFFFF` | `#7ED957` / `#0E1F15` | Tombol utama |
| `banner` | `#1F7A3A` | `#2A6B3C` | Banner hijau tua (hero, kartu promo, avatar), teks putih |
| `lime` | `#D6F57F` | `#7ED957` | Node aktif, kartu sorotan (teks `on-accent`) |
| `mint-deep` | `#BDE8D0` | `#7FCFA0` | Kartu mint tua (teks `on-accent`), header sesi |
| `forest` | `#2F6B3F` | `#3F8A55` | Batang grafik skor inti |
| `charcoal` | `#173D25` | `#0A170F` | Kartu gelap (tone `deep`), teks putih |
| `tint-sun` | `#FFF3C4` | `#3D3A1A` | Kartu kuning |
| `tint-sky` | `#D6F0EE` | `#17363A` | Kartu biru muda |
| `tint-rose` | `#FFE1D6` | `#3D2228` | Kartu merah muda (Hard Challenge, rencana 3) |
| `tint-mint` | `#D7F3DF` | `#1C4530` | Kartu mint (kesalahan, hari yang ada sesinya) |
| `tint-peach` | `#FFE6CC` | `#3E3020` | Kartu peach (cadangan, peringatan ringan) |
| `tint-pale` | `#EEF9DF` | `#213C1C` | Kartu pucat (label soal) |
| `edge` | `#B9DCC0` | `#0A170F` | Tepi 3D kartu putih. Tiap tone mengisi tepinya sendiri |
| `shade` | `#12331D` | `#000000` | Warna untuk menggelapkan tepi 3D |

**Catatan nama:** `orange`, `periwinkle`, `brown`, dan `tint-lilac` sudah diganti menjadi `lime`, `mint-deep`, `forest`, dan `tint-pale`. Nama lama tidak dipakai lagi.

**Kontras yang sudah dihitung (rasio WCAG):**

| Pasangan | Rasio | Lolos |
|---|---|---|
| Teks `ink` di `bg` lime (terang) | 7,93:1 | AA |
| Teks `ink` di `surface` (terang) | 13,84:1 | AA |
| Teks `muted` di `bg` lime | 5,58:1 | AA |
| Teks `muted` di `surface` | 9,75:1 | AA |
| `primary-700` di `surface` | 5,38:1 | AA |
| `primary-700` di `primary-100` | 4,74:1 | AA |
| Putih di `btn-bg` dan `banner` (terang) | 5,38:1 | AA |
| Putih di `success` | 5,37:1 | AA |
| Putih di `forest` | 6,37:1 | AA |
| Teks `ink` di `lime` / `mint-deep` | 11,36 / 10,29:1 | AA |
| Teks `ink` di `streak` | 7,76:1 | AA |
| Teks `ink` di `bg` (gelap) | 15,40:1 | AA |
| Teks `muted` di `surface` (gelap) | 7,78:1 | AA |
| `on-accent` di `btn-bg` (gelap) | 9,75:1 | AA |
| Putih di `banner` (gelap) | 6,43:1 | AA |
| `on-accent` di `mint-deep` (gelap) | 9,25:1 | AA |

**Aturan:** `success`, `error`, dan `streak` dipakai sebagai latar, ikon, dan progres, bukan teks di atas putih. Teks di atasnya memakai `on-accent`, kecuali `success` yang memakai putih. `primary-700` hanya dipakai di atas putih atau `primary-100`, karena di atas lime kontrasnya 3,08:1. Tombol utama memakai `btn-bg` hijau tua, bukan lime, karena tombol lime hilang di atas latar lime. Di atas banner hijau tua, tombol memakai lime (lihat hero Beranda).

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
- **Bayangan:** `shadow-card` berisi sorotan putih di atas, tepi 3D 6px di bawah dengan warna `--edge` per tone, dan bayangan lembut. Tombol primer dan sekunder juga 3D dan turun saat ditekan. Ghost tetap datar.
- **Target sentuh:** minimal 44px (`min-h-11`). Tombol aksi utama 56px.
- **Ikon:** `lucide-react`, stroke 2, ukuran 20px (kecil) dan 24px (standar). Dipilih karena ringan dan konsisten. Sudah terpasang.
- **Ilustrasi:** SVG buatan sendiri dengan gradien hijau lembut. Latar visual (`BackgroundArt`) berisi blob lime, jalur putus, dan daun, dan dipakai di AppShell serta AuthFrame. Tidak meniru ilustrasi dari referensi.

## 6. Navigasi

- **HP (di bawah 1024px):** navigasi bawah berbentuk pil putih dengan 4 item: **Beranda, Peta, Statistik, Profil**. Item aktif ditandai lingkaran yang meluncur (`layoutId`). Pil putih (`surface`) dengan indikator aktif `primary-100`. Ikon tidak aktif memakai `muted`. Arah ini dipilih agar warna dominan tetap ungu muda dan putih.
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
