# DECISIONS

Catatan keputusan teknis, urut dari yang terbaru.

## 2026-10-25: Battle real-time dengan ID publik

1. **ID publik** `EH-XXXXXX` (tanpa 0, O, 1, I) untuk setiap akun. Akun lama mendapat ID saat migrasi, dan ID hanya bisa diganti sekali dari Profil.
2. **Sinkron hanya hari lulus.** Klien mengirim daftar hari lulus ke `PUT /api/progress/mastered`. Level = hari pertama yang belum lulus. Batas soal battle = level terendah dari kedua pemain.
3. **Mesin real-time di server** (`server/battle.mjs`). Undangan, hitung mundur, soal dengan batas waktu, reveal, esai yang dinilai sendiri lewat rubrik 3 kriteria, dan mode Bertahan dengan tiga nyawa. Aliran perubahan memakai SSE, dibaca klien dengan `fetch` karena `EventSource` tidak bisa mengirim header Bearer.
4. **Kunci jawaban tidak pernah dikirim sebelum dikunci.** Bank battle di `content/battle/` hanya dibaca server. Battle tidak memakai materi hari 1–90 atau bank Hard, dan soal yang sudah dipakai salah satu pemain tidak dipakai lagi.
5. **Komposisi.** Mode Campuran dan Bertahan mengikuti total soal. Mode lain memakai satu jenis soal. Esai paling banyak setengah dari total.
6. **Volume bank: 10 soal per hari** (sekitar 900 soal), dengan komposisi per hari: 4 pilihan ganda (2 tata bahasa, 2 kosakata), 2 terjemahan, 1 cerita, 1 esai, 1 dengar, dan 1 susun kalimat. Validasi di `scripts/validate-battle.ts`.
7. **Deploy.** `deploy/nginx/battle-events.conf` wajib ditempel agar SSE tidak tertahan. Setelah `content/battle/` berubah, service API harus di-restart.
8. **Batasan yang diketahui.** Battle yang sedang berjalan hilang jika service dimulai ulang. Kunci jawaban ikut terkirim saat mode Dengar karena naskah dibacakan dari klien. Lawan yang tidak online tidak bisa menerima undangan.

## 2026-10-24: Logo lama tampil dari cache, dan penanda versi untuk logo

1. **File logo di server sudah logo baru.** Ukuran dan checksum `logo.png` di `https://enghabits.jauharfauzi.my.id` sama dengan `public/logo.png` di repo. Tampilan lama berasal dari cache browser atau dari service worker aplikasi yang sudah terpasang.
2. **Penanda versi.** `Logo` memakai `logo.png?v=2`, dan favicon di `index.html` memakai `favicon.png?v=2`. Dengan begitu, URL baru tidak cocok dengan salinan lama di cache service worker.

## 2026-10-24: Logo dari gambar 4, maskot tetap di halaman masuk dan daftar

1. **Logo baru dari gambar 4 (sisi kiri).** `public/logo.png`, ikon PWA, dan `favicon.png` dibuat ulang dari gambar 4 dengan latar putih dibuat transparan.
2. **Hanya logo yang diganti.** Logo merek tetap dipakai di sidebar dan layar sambutan lewat komponen `Logo`. Gambar maskot (`BlobCluster`) dikembalikan di halaman masuk dan daftar, seperti sebelum perubahan logo.

## 2026-10-24: Logo kucing dipakai di semua halaman

1. **Satu komponen `Logo`** (`src/components/ui/Logo.tsx`) untuk `public/logo.png`. Dipakai di sidebar desktop, layar sambutan, halaman masuk, dan halaman daftar. Sebelumnya halaman masuk dan daftar memakai maskot `BlobCluster`.
2. **Halaman masuk dan daftar.** Logo ditaruh di lingkaran putih di atas banner hijau, supaya garis luar gelapnya tetap terlihat. Halaman masuk tetap menampilkan tulisan "EngHabits" di bawah logo.
3. **`BlobCluster` tidak lagi dipakai** di halaman mana pun. Berkasnya belum dihapus, supaya perubahan ini tetap kecil.

## 2026-10-24: Logo kucing baru dan suara di HP

1. **Logo baru dari gambar kucing sisi kiri.** `public/logo.png` dipotong dari sisi kiri gambar, dan latar putihnya dibuat transparan lewat flood fill dari tepi. Ikon PWA dan `favicon.png` dibuat ulang dari logo yang sama.
2. **Suara di HP.** Pemutaran memakai Web Speech API. Ada tiga perbaikan di `src/lib/tts.ts`:
   - Utterance disimpan dalam variabel, supaya tidak dibuang peramban sebelum selesai.
   - `resume()` dipanggil sebelum berbicara, karena Chrome di Android kadang tetap pause setelah `cancel()`.
   - Daftar voice dipantau dengan `voiceschanged`. Status "Suara bahasa Inggris" di Profil ikut diperbarui, jadi tidak tertinggal di "belum ada suara".
3. **Belum diuji dengan suara sungguhan.** Lingkungan pengujian tidak bisa memutar audio, jadi perbaikan ini perlu dicek di HP. Kalau masih diam, periksa mode senyap dan volume media, dan di iPhone pastikan voice Inggris sudah diunduh di Pengaturan > Aksesibilitas > Konten yang Diucapkan.

## 2026-10-24: Batas percobaan, header keamanan, dan tombol pasang aplikasi

1. **Batas percobaan di API.** Gagal masuk dibatasi 5 kali per email dan 20 kali per alamat dalam 15 menit. Pendaftaran dibatasi 20 kali per alamat dalam satu jam. Balasannya 429 dengan header `Retry-After`. Penghitung disimpan di memori, jadi hilang saat service dimulai ulang.
2. **Alamat asli diambil dari `CF-Connecting-IP`.** API hanya mendengarkan di `127.0.0.1`, jadi header itu hanya bisa datang dari nginx atau Cloudflare.
3. **Header keamanan di `deploy/nginx/security-headers.conf`.** Di server, file ini disalin ke `/etc/nginx/snippets/`. Karena nginx tidak mewarisi `add_header` ke blok `location` yang punya `add_header` sendiri, file ini harus di-`include` di blok server dan di `location /assets/` serta blok regex sw.js. HSTS tanpa `includeSubDomains`, supaya subdomain lain tidak terpengaruh.
4. **Content-Security-Policy belum diuji dengan header asli di server.** Aplikasi memakai script dan style dari origin sendiri, tetapi kalau ada halaman yang rusak setelah dipasang, hapus baris CSP dari file itu.
5. **Tombol "Pasang aplikasi" di halaman masuk.** `src/lib/install.ts` menyimpan sinyal `beforeinstallprompt` sejak aplikasi dimuat. Browser Chromium membuka dialog pasang langsung. iPhone (Safari) dan browser lain menampilkan petunjuk manual. Tombol hilang kalau aplikasi sudah terpasang.
6. **Verifikasi.** Tes API 6 lolos, termasuk batas percobaan. Tes pemasangan 3 lolos. Total 67 tes, typecheck dan build lolos. Di browser, tombol tampil dan petunjuk muncul di desktop.

## 2026-10-24: Akun disimpan di server (API dan SQLite)

1. **Akun di server.** `server/app.mjs` menyediakan `/api/register`, `/api/login`, `/api/logout`, dan `/api/me`. Basis datanya SQLite lewat `node:sqlite`, jadi butuh Node 22.13 atau lebih baru dan tidak menambah dependensi.
2. **Kata sandi di-hash dengan scrypt.** Token sesi acak 32 byte, dan di database hanya hash SHA-256-nya yang disimpan. Sesi berlaku 180 hari.
3. **Klien hanya menyimpan email, nama, dan token.** `src/lib/auth.ts` memanggil `/api/*`. Akun lama dari versi lokal tidak ikut pindah, jadi perlu daftar ulang sekali.
4. **Rute API.** Saat pengembangan, Vite meneruskan `/api` ke `127.0.0.1:3001`. Di server, nginx meneruskan `/api/` ke port yang sama, dan Cloudflare tetap mengarah ke nginx.
5. **Progres belajar tetap lokal per perangkat.** Sinkronisasi progres belum dibuat dan akan menjadi langkah berikutnya.
6. **Favicon tab memakai logo owl** (`public/favicon.png`).
7. **Verifikasi.** Lima tes API dan empat tes klien lolos, total 63 tes. Di browser: daftar, lalu hapus IndexedDB untuk meniru perangkat baru, lalu masuk dengan akun yang sama dan berhasil. Baris akun juga terlihat di database.

## 2026-10-24: Keluar dari beranda, sambutan seperti beranda, dan logo baru

1. **Keluar ada di kartu Akun di beranda.** Tombol membuka modal konfirmasi (`Modal`) dulu. Keluar hanya mematikan `signedIn`. Akun tetap ada di perangkat, jadi bisa masuk lagi dengan email dan kata sandi yang sama. Tombol di Profil tidak diubah.
2. **Layar sambutan memakai latar beranda.** `BackgroundArt` hijau dengan kartu bayangan di tengah, menggantikan bingkai `AuthFrame` yang putih.
3. **Logo baru dari gambar owl.** `public/logo.png` dipotong dari gambar mockup dan latar dinding dibuat transparan lewat flood fill dari tepi. Ikon PWA `public/icons/icon-192.png` dan `icon-512.png` memakai latar hijau muda `#E4F7CF`, dengan owl di 78% area supaya aman untuk ikon maskable. Logo dipakai di sidebar desktop dan layar sambutan. `scripts/make-icons.mjs` masih menghasilkan ikon huruf E, jadi jangan dijalankan lagi tanpa memperbarui skrip.
4. **Login dari perangkat lain tidak bisa, dan ini bukan bug login.** Akun disimpan di IndexedDB, dan IndexedDB terpisah untuk setiap perangkat dan setiap origin. Akun dari laptop tidak ada di Mac atau HP, dan `localhost` tidak berbagi data dengan domain produksi. Perbaikan permanen butuh akun di server.
5. **Verifikasi.** Typecheck, 57 tes, dan build lolos. Di browser: daftar, keluar lewat modal, lalu masuk lagi dan sampai ke sambutan. Sambutan di 375px tidak punya scroll horizontal.

## 2026-10-23: Latihan Hard per minggu di halaman Latihan

1. **Bank Hard tersambung ke halaman Latihan.** `/latihan` menampilkan 12 kartu minggu, dan tiap kartu membuka `/latihan/bank/:week` dengan 30 soal sulit. Soal diperiksa satu per satu. Setelah "Periksa", muncul jawaban benar, penjelasan, langkah demi langkah, alasan tiap pilihan yang salah, aturan dengan contoh, dan jebakan ujian.
2. **Sesi bank tidak menyimpan progres.** Skor harian dan Buku Kesalahan tidak berubah. "Ulangi minggu ini" memulai dari soal pertama.
3. **Pemuat per minggu lewat `src/lib/bank.ts`.** Memakai `import.meta.glob` seperti file hari, sehingga tiap minggu menjadi chunk sendiri dan tidak masuk bundle utama. Kunci jawaban ikut terkirim ke browser karena latihan ini memeriksa jawaban langsung.
4. **Verifikasi.** Typecheck lolos, 57 tes lolos (53 lama dan 4 baru di `bank.test.ts`), dan build lolos. Di browser: `/latihan` menampilkan 12 kartu. `/latihan/bank/1` menampilkan jawaban benar dan penjelasan setelah jawaban salah. Tiga puluh soal berurutan sampai "Sesi selesai" dengan skor yang cocok dengan hitungan manual (8 dari 30). `/latihan/bank/13` menampilkan "Minggu ini belum tersedia".

## 2026-10-22: Bayangan kartu auth lembut, tanpa tepi hijau

1. **Kartu auth tidak lagi memakai `shadow-card`.** Bayangan `shadow-card` punya tepi 3D hijau 6px di bawah, yang di latar putih terlihat sebagai garis hijau di bagian bawah. Sekarang kartu memakai bayangan lembut `0 14px 34px -14px` dengan warna hijau gelap transparan.
2. **Verifikasi.** Di browser, HP 375px: bagian bawah kartu bersih saat digulir sampai akhir. Desktop 1280px: kartu 390×768 di tengah dengan bayangan lembut.

## 2026-10-22: Latar layar masuk, daftar, dan mulai putih

1. **Latar luar kartu auth dibuat putih** (`bg-surface`, bukan `bg-bg`). Berlaku untuk `/mulai`, `/masuk`, `/daftar`, dan `/sambutan`, karena keempatnya memakai `AuthFrame`. Latar lime di halaman lain tidak berubah.
2. **Verifikasi.** Di browser, latar kedua layar bernilai `rgb(255, 255, 255)` di HP 375px dan desktop 1280px. Tidak ada halaman yang melebar.

## 2026-10-22: Kartu auth selalu melengkung dan di tengah

1. **Kartu di semua lebar.** `AuthFrame` memakai kartu bersudut 40px dengan lebar maksimal 390px di semua ukuran layar, dengan jarak 12px dari tepi di HP. Sebelumnya kartu baru melengkung di layar besar (`lg:`), sehingga di layar yang lebih sempit atau saat diperbesar tampil putih penuh dan sudutnya tajam.
2. **Penyesuaian desktop berpindah ke `sm:`** (640px ke atas): tinggi kartu tetap, bagian bawah bisa digulir, jarak form dirapatkan, dan ilustrasi karakter 176px.
3. **Verifikasi.** Typecheck, 53 tes, dan build lolos. Di browser: 375px kartu berjarak 12px dari tepi dan sudut 40px. 768px kartu 390px di tengah dengan tinggi 844px dan sheet tidak terpotong. Lebar sekitar 655px kartu 390×768 di tengah. Tidak ada halaman yang melebar.

## 2026-10-22: Gaya kartu login mengikuti contoh gambar 30

1. **Bagian atas berwarna hijau tua** (`bg-banner`) dengan tiga lingkaran lembut (`Blob`) di sudut, bukan gradasi lime. Judul "EngHabits" dan tombol "Lewati" dibuat putih agar terbaca di atas warna itu.
2. **Isian formulir pill.** `Input` memakai `rounded-full`, `bg-field` (token baru, `#F1F6EE` terang dan `#1D3D28` gelap), tanpa garis tepi, tinggi 56px. Fokus memakai bayangan cincin `primary-300`.
3. **Garis dan sudut dibuat tumpul.** Daun dekoratif yang runcing diganti elips. Garis putus di latar memakai ketebalan 5 dan ujung bulat. Garis pemisah "atau" dibuat 3px dengan ujung bulat. Tujuannya menghilangkan titik dan garis yang tajam saat layar diperbesar.
4. **Tampilan desktop** tetap kartu setinggi layar. Di 1280×800, kartu Masuk dan Mulai sama-sama 768px tanpa bagian yang terpotong.
5. **Verifikasi.** Typecheck, 53 tes, dan build lolos. Di browser: `/mulai` dan `/masuk` dicek di HP 375×812 dan desktop 1280×800. Tombol "Lewati" berwarna putih dan tidak ada halaman yang melebar. Sambutan belum dibuka karena browser belum masuk.

## 2026-10-22: Layar masuk dan daftar seperti layar HP

1. **Ilustrasi karakter diperkecil.** `BlobCluster` di Masuk, Daftar, dan Sambutan memakai `w-48` di HP dan `lg:w-44` di desktop. Sebelumnya `sm:w-80` ikut aktif di desktop dan membuat bagian atas setinggi 392px.
2. **Form dirapatkan.** Jarak antar isian `gap-3`, dan di desktop `lg:gap-2.5`. Footer "Belum punya akun?" dan "Sudah punya akun?" sekarang satu baris dengan tombol sekunder kecil.
3. **Tombol Google dan Apple jadi dua lingkaran logo.** Tombol berlabel panjang diganti lingkaran 56px dengan logo, dengan keterangan "segera hadir" di bawahnya. Tetap nonaktif dan memakai `aria-label`.
4. **Desktop tanpa scroll di dalam kartu.** Kartu setinggi `min(844px, 100dvh - 2rem)`. Di 1280×800, kartu Masuk dan Daftar setinggi 768px dan bagian bawah sheet tidak lagi terpotong. Bagian atas memakai tinggi konten di desktop, bukan tinggi minimum.
5. **HP.** Di 375×667, tidak ada halaman yang melebar. Tombol Google dan Apple terlihat, dan halaman hanya digulir normal di bagian bawah.
6. **Verifikasi.** Typecheck, 53 tes, dan build lolos. Di browser: Masuk dan Daftar dicek di desktop dan HP. Sambutan belum bisa dibuka karena browser belum masuk.

## 2026-10-22: Layar /mulai seperti HP dengan ilustrasi 3D

1. **Ilustrasi 3D.** `SlideScene` menggambar tiga adegan SVG sendiri: matahari terbit di atas alas bertingkat, tumpukan buku dengan tanda centang, dan grafik batang silinder dengan panah dan koin. Memakai sorotan radial, sisi gelap, bayangan blur, dan warna token. Melayang pelan, dimatikan dengan "Kurangi animasi". Kotak ikon `ArtTile` dihapus karena tidak dipakai lagi.
2. **Tinggi seperti HP.** Bagian atas memakai `min-h-[38dvh]` dan `sm:min-h-[42dvh]`, bukan tinggi tetap, supaya ilustrasi karakter di Masuk dan Daftar tidak terpotong. Tombol "Masuk" di HP 667px tetap terlihat.
3. **Desktop seperti ponsel.** Kartu 390px dengan tinggi `min(844px, 100dvh - 3rem)`, sudut 44px, dan bagian bawah bisa digulir di dalamnya. Pada 1280×800, kartu setinggi 752px dan halaman tidak punya scroll sendiri.
4. **Judul tidak patah.** Kata berstrip seperti "terburu-buru" dibungkus `whitespace-nowrap` lewat `keepHyphenated`.
5. **Dekorasi.** `BackgroundArt` punya varian `auth` tanpa lingkaran di pojok kanan atas dan tanpa daun di kanan, sehingga "Lewati" tidak tertutup. "Lewati" sekarang berada di atas dekorasi (`z-10`).
6. **Verifikasi.** Typecheck, 53 tes, dan build lolos. Di browser: 375×667 dan 1280×800 sudah dicek untuk ketiga slide. Tidak ada scroll horizontal, tombol "Masuk" terlihat, dan "Lewati" bisa diklik. Mode gelap tidak punya teks yang kontrasnya kurang. Halaman Masuk di desktop sudah dicek. Sambutan dan Daftar belum dibuka satu per satu.

## 2026-10-22: Tinjauan isi tugas IELTS dan cek hari 75-89

1. **Perbaikan isi.** Hari 69: prompt diberi angka per museum, supaya jawaban model tidak menyebut "lebih dari dua kali lipat" tanpa data. Hari 70, 71, dan 72: jawaban model disamakan dengan prompt, tanpa detail yang tidak ada di prompt. Hari 82: contoh jawaban tidak menyebut lokasi tertentu. Hari 87: "my parents' generation", sesuai pertanyaan.
2. **Cek di browser.** Hari 75, 82, 84, 86, dan 89 dibuka. Label instruksi, jumlah baris kotak jawaban, dan jumlah lencana "Dinilai sendiri" sudah sesuai jenis tugas. Hari 89 punya dua tugas tulis dan lisan.
3. **Yang masih perlu tinjauan manusia.** Jawaban model dan rubrik ditulis dan dicek oleh saya, belum oleh pemilik proyek atau pengajar. Sebelum dipakai pembelajar, perlu persetujuan kualitas seperti hari lain.
4. **Validator.** Lolos untuk 90 hari setelah perbaikan, dan 53 tes lulus.

## 2026-10-22: Tugas writing dan speaking di hari IELTS

1. **20 tugas baru di 19 hari.** Hari 68-73 memakai `ielts_task1_outline`, hari 75-80 memakai `ielts_task2_paragraph`, hari 82-87 memakai `ielts_speaking_p1`, `p2`, atau `p3` sesuai topiknya, dan hari 89 memakai `ielts_task2_paragraph` (B4) dan `ielts_speaking_p2` (B5). Hari 74 dan 81 (review) tidak diubah.
2. **Penggantian, bukan penambahan.** Setiap hari tetap punya 5 tugas di bagian B, karena validator mewajibkan 15 soal inti. Tugas terjemahan yang diganti adalah B5, dan B4 di hari 89. Tingkat kesulitannya sama dengan tugas yang diganti, jadi komposisi per hari tetap lolos.
3. **Tugas tulis dan lisan dinilai sendiri.** `isAutoGraded` hanya menganggap terjemahan sebagai nilai otomatis. Tugas lain masuk `selfItems` di `DayResult`, tidak masuk skor inti dan tidak masuk `items`, jadi tidak ikut Buku Kesalahan. Di halaman hasil, tugas ini memakai lencana "Dinilai sendiri", contoh jawaban, dan rubrik.
4. **Akibat untuk skor.** Hari dengan tugas tulis atau lisan punya 14 soal inti, bukan 15. Persentase skor dihitung dari 14 pada hari itu.
5. **Input sesuai jenis tugas.** Label instruksi dan tinggi kotak jawaban berbeda per jenis: outline 6 baris, paragraf 8 baris, speaking 4 sampai 6 baris.
6. **Verifikasi.** Validator 90 hari lolos. Typecheck lolos, 53 tes lolos (dua tes baru untuk tugas dinilai sendiri), dan build lolos. Di browser, hari 68 sudah dicek: label, lencana, dan kotak jawaban tampil benar. Halaman hasil dengan tugas dinilai sendiri juga sudah dicek. Data uji sudah dihapus.
7. **Yang belum.** Isi tugas ini belum melewati persetujuan kualitas. Jawaban model dan rubrik perlu dibaca ulang sebelum dipakai untuk pembelajar.

## 2026-10-22: Layar masuk selalu selebar HP, dengan logo Google dan Apple

1. **Layar mulai, masuk, daftar, dan sambutan selalu selebar HP.** `AuthFrame` sekarang satu kolom dengan lebar maksimal `max-w-md`, di tengah, juga di desktop. Di layar lebar, kartu itu diberi sudut membulat dan bayangan seperti ponsel di atas latar lime. Sebelumnya desktop memakai dua kolom.
2. **Logo resmi Google dan Apple.** Logo Google berwarna empat warna dan logo Apple putih dibuat sebagai SVG di `SocialButtons.tsx`, menggantikan huruf "G" dan "A". Tombol Apple memakai latar charcoal. Kedua tombol masih nonaktif dengan keterangan "segera hadir", karena butuh layanan identitas.
3. **Verifikasi.** Typecheck, 51 tes, dan build lolos. Di browser, lebar kartu login di desktop 448px dan posisinya di tengah. Di HP, logo Google dan Apple tampil dengan benar. Logo di desktop dicek lewat ukuran geometrinya, karena zoom browser terlalu kecil untuk menilai bentuknya.

## 2026-10-22: Tautan bergaris bawah jadi tombol

1. **Tautan aksi jadi tombol sekunder atau primer.** "Kembali ke beranda" di sesi evaluasi dan di Laporan kesiapan (sekunder, ikon Home). Tautan "Masuk" dan "Daftar" di halaman Mulai, Masuk, dan Daftar: teks "Sudah punya akun?" atau "Belum punya akun?" di baris sendiri, lalu tombol sekunder selebar penuh.
2. **Yang tetap bergaris bawah.** Kata kosakata di blok latihan (`PracticeBlock`) memakai garis titik-titik. Itu kata di dalam paragraf bacaan, bukan tombol aksi. Kalau semuanya dijadikan tombol, paragraf bacaannya tidak terbaca. Kalau diminta, bisa diubah ke gaya lain.
3. **Verifikasi.** Typecheck, 51 tes, dan build lolos. Di browser, halaman Masuk sudah dicek di HP. Sesi evaluasi dan Laporan kesiapan belum bisa dilihat di browser, karena keduanya hanya muncul setelah ada data.

## 2026-10-22: Roadmap tanpa panel hijau, dan latihan perbaikan jadi tombol

1. **Panel hijau tua roadmap dihapus.** Roadmap langsung di atas latar lime. Node aktif jadi hijau tua (`btn-bg`), karena lime akan menyatu dengan latar. Teks progres memakai `ink`, bintang kosong memakai `ink/30`, dan jalur memakai pita putih 40% dengan garis putus putih. Blob dekoratif dihapus, karena terpotong menjadi kotak samar.
2. **Tautan "Mulai latihan perbaikan" jadi tombol.** Di Beranda (panel Jatuh tempo) dan di Laporan kesiapan ("Mulai latihan dari Buku Kesalahan"). Keduanya memakai `buttonClass` dan ikon Dumbbell, seperti tombol di Buku Kesalahan.
3. **Verifikasi.** Typecheck, 51 tes, dan build lolos. Di browser (HP): roadmap dengan data uji untuk lulus, perbaikan, aktif, dan terkunci sudah dicek. Data uji sudah dihapus dan mode kembali ke kisi. Beranda juga sudah dicek. Laporan kesiapan belum dilihat, karena kartu tautannya hanya muncul setelah ada data. Desktop belum dicek.

## 2026-10-22: Tautan Buku Kesalahan jadi tombol 3D

1. **Kelas tombol bisa dipakai tautan.** `buttonClass` di `Button.tsx` berisi kelas dasar tombol, dan `Button` memakainya. `Link` tidak bisa dibungkus `Button`, jadi tautan memakai `buttonClass` langsung.
2. **Tiga tautan jadi tombol primer dengan ikon.** "Lihat Buku Kesalahan" di Latihan (ikon buku), "Kembali ke Buku Kesalahan" di kartu sesi selesai (ikon panah), dan "Mulai latihan perbaikan" di Buku Kesalahan (ikon latihan).
3. **Kartu "Sesi selesai" hanya muncul jika ada soal.** Sebelumnya muncul "Benar 0 dari 0 soal" saat antrean kosong.
4. **Verifikasi.** Typecheck, 51 tes, dan build lolos. Di browser (HP), Latihan dalam keadaan kosong dan Buku Kesalahan sudah dicek. Kartu sesi selesai dengan soal, dan tampilan desktop, belum dicek.

## 2026-10-22: Palet hijau, kartu 3D, dan latar lime

1. **Palet diganti dari ungu ke hijau.** Latar lime `#9CD548` di semua layar (gambar 28), kartu putih, tombol dan banner hijau tua `#1F7A3A` dengan teks putih. Keputusan dari pemilik proyek. Latar lime dipilih penuh, bukan mint.
2. **Nama token diganti.** `orange` menjadi `lime`, `periwinkle` menjadi `mint-deep`, `brown` menjadi `forest`, dan `tint-lilac` menjadi `tint-pale`. Kelas Tailwind ikut berganti di seluruh `src`.
3. **Kartu 3D.** `--shadow-card` memakai sorotan putih, tepi 6px dengan warna `--edge`, dan bayangan lembut. `Card` mengisi `--edge` per tone. Tombol primer dan sekunder juga 3D dan tepinya hilang saat ditekan.
   Catatan teknis: `--edge` tidak boleh dipakai di `:root` lewat `var()`, karena nilainya akan dikunci di sana dan tidak mengikuti kartu. Karena itu bayangan ditulis di `@theme`, sehingga dihitung di tiap elemen.
4. **Latar visual.** Komponen `BackgroundArt` (blob, jalur putus, daun, percikan) dipasang di AppShell dan AuthFrame. Frame desktop tetap putih di atas latar lime.
5. **Tombol di atas banner.** Tombol hero Beranda memakai lime, karena tombol hijau tua hilang di atas banner hijau tua.
6. **Kontras teks.** `primary-700` tidak dipakai di atas lime (3,08:1). Muted gelap dipakai di latar lime. Mint tua mode gelap dibuat terang, karena teks gelap di atasnya sebelumnya hanya 2,15:1.
7. **Ikon dan manifest.** `favicon.svg`, `theme-color`, `background_color`, dan ikon PWA (dibuat ulang dari `scripts/make-icons.mjs`) diganti ke hijau.
8. **Verifikasi.** Typecheck, 51 tes, dan build lolos. Pemeriksa kontras di browser, yang membaca warna teks dan latar tiap elemen, lolos di Beranda, Statistik, Profil, Masuk, Materi (`/hari/1`), Peta kisi, dan Kesalahan. Di Beranda (HP), tombol hero dan kartu sudah dicek. Desktop 1280px dicek hanya di Beranda. Di mode gelap, tiga tanda merah di `/design` ternyata artefak transisi warna. Setelah transisi selesai, nilainya benar.
9. **Yang belum dicek.** Halaman Latihan, dan mode gelap di Beranda, Peta, dan Materi (mode gelap baru dicek di `/design`). Roadmap sudah dicek dengan data uji setelah perubahan ke hijau. Maskot dengan warna pink masih ada.

## 2026-10-22: Roadmap jadi panel ungu dengan jalur pita

1. **Panel ungu membulat** (`bg-banner`, radius 32px) membungkus roadmap, dengan dua blob dekoratif. Jalurnya berupa pita putih transparan 64px dengan garis putus di tengah. Bagian yang sudah dilalui digaris hijau.
2. **Node lebih besar** (72px) dengan tepi berwarna yang diambil dari palet: hijau untuk lulus, oranye untuk hari aktif, kuning muda dengan tepi oranye untuk perbaikan, dan lilac dengan tepi `primary-300` untuk terkunci.
3. **Pill minggu dan teks progres** sekarang berada di atas panel dengan warna putih atau putih transparan. Bintang kosong juga putih transparan.
4. **Arah tetap dari atas ke bawah.** Gambar acuan mulai dari bawah. Ini belum diubah, dan bisa dibalik kalau diminta.
5. **Verifikasi.** Typecheck lolos, 51 tes lolos, dan build lolos. Di browser, bagian atas panel sudah dicek dengan data uji untuk hari lulus, perbaikan, aktif, dan terkunci. Data uji sudah dihapus dan mode peta dikembalikan ke kisi. Desktop dan mode gelap belum dicek.

## 2026-10-22: Node roadmap 3D dengan warna satu keluarga

1. **Node dibuat 3D.** Sorotan radial di kiri atas, tepi gelap 6px di bawah, dan bayangan lembut. Warnanya dihitung dari token lewat `color-mix`, jadi ikut mode gelap.
2. **Warna dibuat satu keluarga.** Ungu (`banner`) untuk hari aktif, hijau (`success`) untuk lulus, oranye (`streak`) untuk perbaikan, dan lilac (`primary-100`) untuk yang terkunci. Sebelumnya setiap minggu punya warna pastel sendiri, sehingga roadmap terlihat tidak serasi.
3. **Peti dan pill minggu ikut.** Peti memakai efek 3D yang sama: lilac saat terkunci, hijau saat terbuka. Pill minggu sekarang putih, tidak lagi pastel per minggu. Warna minggu tetap dipakai di kisi.
4. **Hari tanpa konten** tetap kotak putih bergaris putus, tanpa efek 3D.
5. **Verifikasi.** Typecheck lolos, 51 tes lolos, dan build lolos. Di browser, roadmap dicek dengan data uji untuk hari lulus, perbaikan, aktif, dan terkunci, lalu data uji dihapus dan mode peta dikembalikan ke kisi. Mode gelap belum dicek.

## 2026-10-22: Palet baru diterapkan ke Profil, Peta, dan Materi

1. **Profil.** Kotak ikon di tiap kartu sekarang punya warna sendiri lewat `SECTION_TINT`. Tampilan oranye, Suara periwinkle, Pengingat mint, Cadangan coklat dengan ikon putih, dan Data belajar rose.
2. **Peta.** Kartu minggu di kisi bergilir sun, sky, oranye, rose, periwinkle, dan mint. Node dan peti tidak berubah.
3. **Materi.** Header sesi berwarna periwinkle, dengan blob oranye dan sun. Label "Hari ... Minggu ..." memakai teks gelap, karena `primary-700` di atas periwinkle hanya 3,79:1. Kartu kosakata bergilir sun, oranye, sky, periwinkle, rose, dan mint, menggantikan peach dan lavender.
4. **Verifikasi.** Typecheck lolos, 51 tes lolos, dan build lolos. Di browser, Profil, Peta mode roadmap, dan Materi hari 1 sudah dicek. Kisi di Peta dan mode gelap belum dicek.

## 2026-10-22: Batang grafik coklat, status jadi titik di atas batang

1. **Semua batang grafik skor inti berwarna coklat `#A95B23`** di Statistik dan Beranda.
2. **Status skor pindah ke titik kecil di atas batang.** Hijau untuk 70 ke atas (`success`), kuning untuk 50 sampai 69 (`streak`), dan merah di bawah 50 (`error`). Aturannya ada di satu tempat, yaitu `scoreDot` di `BarChart.tsx`.
3. **Beranda disamakan dengan Statistik.** Sebelumnya Beranda memakai ungu dan merah untuk status yang sama. Sekarang keduanya memakai aturan yang sama.
4. **Teks legenda Statistik** sekarang menyebut titik di atas batang.
5. **Verifikasi.** Typecheck lolos, 51 tes lolos, dan build lolos. Di browser dengan 14 hari data uji (sudah dihapus lagi): semua batang `rgb(169, 91, 35)`, titik hijau untuk 70 ke atas, oranye untuk 50 sampai 69, dan merah di bawah 50. Titik berada 6px di atas batang.

## 2026-10-22: Tambah coklat, oranye penuh, dan periwinkle dari gambar 26

1. **Tiga token baru di `tokens.css`.** `--brown` `#A95B23` untuk bar grafik, `--orange` `#FFA265` untuk kartu oranye penuh, dan `--periwinkle` `#AAB2F3` untuk kartu sedang. Ketiganya juga terdaftar di `@theme inline` sebagai `brown`, `orange`, dan `periwinkle`.
2. **Teks di atasnya.** Coklat memakai teks putih (4,99:1). Oranye dan periwinkle memakai `on-accent`, yaitu gelap di kedua mode (7,94:1 dan 7,76:1).
3. **Mode gelap memakai nilai yang sama.** Ketiganya tidak diredeklarasi di blok gelap, jadi tetap sama. Kontras tetap lolos.
4. **Tone kartu baru.** `Card` punya tone `orange` dan `periwinkle`. Coklat tidak dijadikan tone kartu, karena teksnya harus putih.
5. **Belum dipakai di layar utama.** Ketiganya sudah ada di katalog `/design`. Bar grafik di Statistik dan Beranda belum memakai coklat, dan belum ada kartu oranye atau periwinkle di layar utama. Latar poster yang coklat dan bergradasi tetap tidak dipakai.
6. **Verifikasi.** Typecheck lolos, 51 tes lolos, dan build lolos. Di katalog `/design` (mode terang), kartu oranye terukur `rgb(255, 162, 101)` dan periwinkle `rgb(170, 178, 243)`, keduanya dengan teks `rgb(35, 34, 44)`. Swatch coklat terukur `rgb(169, 91, 35)`.

## 2026-10-22: Latar halaman dibuat putih

1. **Latar halaman terang diubah dari krem `#FFF5EC` ke putih `#FFFFFF`.** Permintaan langsung dari pemilik proyek. Kartu putih (`surface`) sekarang sama warnanya dengan latar, sehingga kartu dibedakan lewat garis tepi `line` dan bayangan `shadow-card`. Di sidebar desktop, menu dan item aktifnya sama-sama putih, jadi item aktif hanya dibedakan lewat bayangan dan warna teks ungu.
2. **Ikut diubah.** Warna splash PWA (`background_color` di `vite.config.ts`) dari `#FAF7FF` ke `#FFFFFF`.
3. **Yang belum diubah.** `theme_color` PWA masih `#8B6BE6` (ungu lama). Mode gelap tidak berubah.
4. **Verifikasi.** Typecheck lolos, 51 tes lolos, dan build lolos. Di browser (mode terang), latar Beranda terukur `rgb(255, 255, 255)` di HP dan desktop, dan tidak ada geser horizontal di HP.

## 2026-10-22: Teks muted digelapkan agar lolos AA di latar dan kartu pastel

1. **Warna teks `muted` terang diubah dari `#77727F` ke `#66626D`.** Di latar krem kontrasnya naik dari 4,34:1 ke 5,53:1. Sebelumnya teks ini juga gagal di kartu pastel, bukan hanya di latar, dengan nilai terendah 3,59:1 di kartu peach. Sekarang nilai terendahnya 4,57:1, dan semua latar terang lolos AA untuk teks kecil.
2. **Yang tidak berubah.** Warna `muted` mode gelap tetap (`#B5AFC4`).
3. **Verifikasi.** Typecheck lolos, 51 tes lolos, dan build lolos. Di browser (mode terang), `--muted` terbaca `#66626d` dan teks muted di Beranda terukur `rgb(102, 98, 109)`.

## 2026-10-22: Banner diturunkan sedikit agar teks putih lolos AA

1. **Warna banner terang diubah dari `#7E72E6` ke `#7165D8`.** Kontras teks putih naik dari 3,86:1 ke 4,61:1, sehingga lolos AA untuk teks kecil. Warnanya tetap ungu, hanya sedikit lebih dalam. Nilai ini dipilih sebagai perubahan terkecil yang lolos dengan sedikit margin.
2. **Efek samping.** `#7165D8` sekarang hampir sama dengan `primary-500` (`#7366DB`), yang dipakai untuk progres dan fokus. Keduanya dibedakan lewat peran, bukan warna, tetapi jika di layar terlihat menyatu, `primary-500` perlu digeser sedikit.
3. **Yang belum diubah.** Teks `muted` di latar krem masih 4,34:1 dan belum lolos AA. Mode gelap tidak berubah.
4. **Verifikasi.** Typecheck lolos, 51 tes lolos, dan build lolos. Di browser (mode terang), warna banner di Beranda terukur `rgb(113, 101, 216)` dan kontras putih 4,61:1.

## 2026-10-22: Palet dari dalam ponsel gambar 25, teks putih di banner, dan kartu charcoal

1. **Palet mengikuti bagian dalam ponsel, bukan latar poster.** Latar krem `#FFF5EC`, banner ungu `#7E72E6`, tombol oranye `#F59A5C` dengan teks gelap, dan charcoal `#2A2934` untuk kartu gelap. Latar poster di belakang ponsel (gambar 25) tidak diambil.
2. **Teks di atas banner dibuat putih** (`text-white`) di Beranda, peta, profil, kalender, dan sidebar. Teks gelap di atas ungu yang baru tidak terbaca.
3. **Tone `deep` sekarang berwarna.** Sebelumnya memakai `bg-charcoal`, tetapi token itu belum terdaftar di `@theme`, sehingga kartu tanpa warna. Sekarang `--charcoal` ada di `:root` dan mode gelap, dan `--color-charcoal` didaftarkan di `@theme inline`. Di browser, kartu Buku Kesalahan di Beranda sudah berwarna `#2A2934` dengan teks putih.
4. **Confetti** memakai warna palet baru (ungu, lavender, hijau, oranye), supaya tidak tertinggal dari palet lama.
5. **Dua kontras belum memenuhi AA, dan belum diubah.** Teks putih di banner terang hanya 3,86:1, sehingga hanya lolos untuk teks besar. Teks `muted` di latar krem hanya 4,34:1. Nilainya sengaja mengikuti ponsel, jadi pemilik proyek perlu memutuskan apakah banner atau teks abu-abu digelapkan sedikit. Angkanya ada di DESIGN_SPEC.md bagian 3.
6. **Verifikasi.** Typecheck lolos, 51 tes lolos, dan build lolos. Di browser (mode terang): Beranda HP dan desktop, profil, peta, masuk, dan sesi hari 1 desktop sudah dicek. Mode gelap belum dicek di browser.

## 2026-10-22: Palet Olympiads, login ala moimoi, sambutan ala Readly, dan sesi yang lebih hidup

1. **Palet diganti total mengikuti gambar 6 (Olympiads).** Latar krem peach, ungu aksen, oranye untuk tombol utama dengan teks gelap, charcoal untuk teks, dan kartu pastel (sun, sky, rose, mint, peach, lilac). Tidak ada perubahan nama token, jadi komponen tidak perlu diubah.
2. **Login mengikuti gambar 1 (moimoi).** Bagian atas berisi wordmark, karakter bulat berwarna (`BlobCluster`, dibuat sendiri dengan SVG), dan balon "Hello~". Bagian bawah berisi judul, email, kata sandi, tombol oranye, dan tombol Google dan Apple yang masih nonaktif.
3. **Sambutan mengikuti gambar 2 (Readly).** Karakter besar di atas, judul dua baris dengan nama tebal, dan tombol oranye.
4. **Halaman sesi mengikuti gambar 3, 4, dan 5, dan contoh kosakata di paste.** Header berupa kartu lilac dengan bola peach, bar soal terjawab, dan langkah berwarna (selesai hijau, aktif oranye). Timer berbentuk kartu dengan cincin besar. Kosakata berupa kartu berwarna berselang, tidak lagi tabel. Soal berupa pilihan pil dengan huruf dalam lingkaran.
5. **Bug kecil.** Header sesi sempat bergeser saat fokus berpindah ke langkah, karena `overflow-hidden` masih bisa digeser. Diganti `overflow-clip`.
6. **Verifikasi.** Typecheck dan 51 tes lolos. Di browser (HP): login, sambutan, sesi blok kosakata dan blok latihan, serta Beranda dengan palet baru sudah dicek. Desktop dan mode gelap belum dicek ulang.

## 2026-10-22: Warna Peta dan Profil disesuaikan, dan dua bug alur akun diverifikasi

1. **Profil tidak lagi bertabrakan.** Semua kartu bagian berlatar putih. Warna pastel hanya dipakai di kotak ikon kecil (sun untuk tampilan, sky untuk suara, mint untuk pengingat, peach untuk cadangan, rose untuk data belajar). Kartu akun memakai avatar ungu sebagai sorotan. Pilihan yang aktif tetap ungu.
2. **Peta roadmap tidak hanya ungu.** Node yang belum terbuka dan peti mengikuti warna minggunya, sama dengan kartu di kisi (sun, sky, rose, mint). Node aktif tetap ungu, yang lulus hijau, dan yang perlu perbaikan peach. Pill minggu juga berwarna.
3. **Dua bug alur akun sudah diverifikasi di browser.** Masuk dengan akun yang ada berakhir di `/sambutan`, dan daftar dari awal (setelah data browser dihapus) juga berakhir di `/sambutan`. Lebar Beranda di HP sama dengan viewport (375px), tidak ada geser horizontal. Satu-satunya elemen yang melewati batas adalah blob dekoratif yang terpotong oleh `overflow-hidden`.

## 2026-10-22: Akun lokal, rombak palet, roadmap, dan navbar desktop

1. **Akun hanya lokal.** Daftar dan masuk memakai email dan kata sandi di perangkat ini. Kata sandi di-hash dengan PBKDF2-SHA256 (100.000 iterasi, salt 16 byte acak) lewat Web Crypto. Hasilnya disimpan di `Settings.account`. Ini bukan autentikasi sungguhan. Tidak ada server, tidak ada sinkronisasi, dan tidak ada reset kata sandi. Pemilik proyek perlu memutuskan layanan identitas (misalnya Supabase atau Firebase) sebelum akun bisa dipakai di banyak perangkat.
2. **Google dan Apple nonaktif.** Tombolnya tampil dengan keterangan "segera hadir" karena butuh layanan identitas dan kunci dari pemilik proyek.
3. **Alur.** `/mulai` (tiga slide) lalu `/daftar`. Setelah masuk atau daftar, pengguna ke `/sambutan`. `AuthGate` di `App.tsx` mengalihkan pengguna yang belum masuk ke `/masuk` atau `/mulai`. Navigasi ke sambutan membawa `state.welcome`, supaya gerbang tidak berbenturan dengan pembaruan status masuk. Halaman publik tidak dialihkan saat sudah masuk.
4. **Palet dirombak** mengikuti gambar 6 (ungu cerah, biru muda, mint, teks hampir hitam). Tombol utama `#6A4FE0`. Nama token tidak berubah, jadi komponen tidak perlu diubah.
5. **Navbar desktop** mengikuti gambar 7: frame putih membulat, logo, menu dalam kotak lavender, kartu promo "Hari berikutnya", dan profil dengan dua angka kecil di bawah. Mobile tetap memakai navigasi bawah.
6. **Beranda.** Banner "Sesi hari ini" dengan tombol ungu. Kartu "Target hari ini" (gambar 3) berisi tiga target dengan bar kemajuan. Rencana hari ini berbentuk kartu putih dengan tombol panah yang memulai sesi (gambar 2).
7. **Peta mode roadmap** (gambar 1). Node hari dengan jalur melengkung, bintang untuk hari yang lulus (1 bintang di 60%, 2 di 75%, 3 di 90%), gelembung "Mulai" di hari aktif, dan peti di akhir minggu yang terbuka saat semua hari minggu itu lulus. Mode kisi tetap ada. Pilihannya disimpan di `Settings.mapView`.
8. **Grid dua kolom.** Semua grid `lg:grid-cols-2` sekarang diberi `grid-cols-1` untuk HP. Tanpa itu kolom melebar sesuai isi dan keluar dari layar.
9. **Verifikasi.** Typecheck lolos. Tes bertambah dari 46 menjadi 51 (tes validasi dan akun). Di browser: slide mulai, daftar, salah dan benar saat masuk, keluar, sambutan, Beranda HP dan desktop, roadmap, dan mode kisi. Peti dan bintang belum diuji dengan data yang lulus.

## 2026-10-22: Peta 90 hari gaya kartu referensi

1. **Kartu minggu berwarna pastel bergilir** (`WEEK_BG`: sun, sky, rose, mint), padding 20px, radius kartu. Cincin progres di dalam lingkaran putih kecil.
2. **Kotak hari.** Lulus memakai `success`, tersedia memakai `banner` dengan tepi tidak terlihat, perlu perbaikan memakai `tint-peach`, terkunci memakai putih dengan teks muted. Hari tanpa konten tetap bertepi putus-putus.
3. **Desktop.** Minggu tampil dua kolom (`lg:grid-cols-2`), sama seperti sebelumnya.
4. **Verifikasi.** Typecheck lolos. Di browser, desktop dan HP sudah dicek. Di desktop, screenshot sempat tampak sempit, padahal DOM menunjukkan lebar 864px dan dua kolom, jadi layout dinilai dari DOM.

## 2026-10-22: Layout desktop mengikuti referensi (sidebar ungu, grid dua kolom)

1. **Sidebar ungu terang** (`bg-banner`, pojok kanan membulat) seperti MedBoard. Item aktif berupa pil putih. Kontainer konten melebar ke `lg:max-w-6xl`.
2. **Beranda desktop.** Banner selebar konten utama. Tiga kartu mini di bawahnya. Kalender dan rencana dua kolom, grafik dan rata-rata per skill dua kolom. Panel kanan berisi profil dengan cincin progres, skor inti terakhir (kartu biru), dan jatuh tempo (kartu kuning). Grafik punya pilihan 7 atau 14 hari.
3. **Statistik desktop.** Empat kartu angka dalam satu baris. Grafik dan akurasi per bagian dua kolom. Peta skor 15 kolom. Laporan kesiapan ditampilkan sebagai kartu ungu tua dengan tombol panah.
4. **Halaman lain di desktop.** Peta menampilkan minggu dalam dua kolom. Profil dan laporan kesiapan dua kolom, dengan kartu bertint (suara biru, pengingat mint, cadangan peach, data merah muda). Daftar Buku Kesalahan dua kolom.
5. **Verifikasi.** Typecheck dan 46 tes lolos. Di browser (1280px): Beranda dan Statistik sudah dicek. Halaman lain di desktop belum dilihat satu per satu.

## 2026-10-22: Layar awal, dashboard gaya MedBoard, dan kartu gaya Olympiads

1. **Layar awal `/masuk` bukan login.** Aplikasi tidak punya akun, jadi tidak ada kata sandi. Layar ini hanya meminta nama panggilan (opsional) yang disimpan di IndexedDB perangkat ini. Teks di layar menyebutkan itu. Pengguna yang belum melewati layar awal diarahkan ke `/masuk` oleh `OnboardingGate` di `App.tsx`. "Lewati" juga menandai onboarding selesai.
2. **Field baru di `Settings`.** `name` dan `onboarded`. Keduanya tidak ikut ekspor cadangan, karena cadangan hanya berisi data belajar.
3. **Dashboard mengikuti MedBoard.** Sapaan memakai nama panggilan, dengan avatar berisi inisial. Di bawahnya ada banner ungu terang, tiga kartu mini (hari lulus, streak, poin), kalender bulan berjalan, rencana, grafik skor 7 hari, dan rata-rata per bagian. Di layar lebar (1024px ke atas) ada panel kanan berisi cincin progres 90 hari dan soal yang jatuh tempo.
4. **Kartu mengikuti Olympiads.** Sudut kartu naik ke 28px (`--radius-card`). Ada warna peach (`tint-peach`). Kartu `deep` (ungu tua dengan teks putih) hanya dipakai untuk Buku Kesalahan, dengan tombol panah putih, sebagai satu sorotan.
5. **Verifikasi.** Typecheck dan 46 tes lolos. Di browser (HP): alur layar awal dengan nama dan redirect ke beranda, lalu sapaan dan kalender tampil dengan benar. Layar desktop belum dicek karena pratinjau di bawah 1024px. Panel kanan belum dilihat langsung.

## 2026-10-22: Tampilan mengikuti referensi awal (kartu pastel dan animasi)

1. **Keputusan atas pertanyaan di DESIGN_SPEC bagian 11.** Permintaan pengguna mengubah pilihan pertama: kartu memakai warna pastel seperti referensi (sun, sky, rose, mint), bukan satu keluarga ungu. Token baru ada di `src/styles/tokens.css` untuk mode terang dan gelap. Kartu kecil tetap memakai `surface` dengan tepi `line`.
2. **Komponen baru.** `StackIllustration` (ilustrasi SVG untuk banner), `Blob` (latar bergerak 20 detik, mati saat reduce motion), `Skeleton` (kilau 1,4 detik), dan `BarChart` (batang tumbuh bertahap 40ms). Card punya varian warna baru.
3. **Animasi yang sebelumnya belum ada.** Pindah halaman (fade dan geser 12px, 250ms, dikunci per rute). Denyut streak memakai skala, bukan `animate-pulse` dari Tailwind. Chip hari bertahap 40ms. Jawaban salah bergetar ±6px tiga kali (350ms). Jawaban benar pop (500ms). Pemutar audio pada blok mendengarkan bergerak per baris.
4. **Cincin progres dengan nilai nol** tidak digambar lagi, karena ujung bulat akan tampak sebagai titik.
5. **Verifikasi.** Typecheck dan 46 tes lolos. Build lolos. Di browser (375px dan desktop, terang dan gelap): Beranda, Statistik, Profil, Peta, dan blok latihan mendengarkan sudah dicek. Animasi getar dan pop belum dilihat langsung di browser, hanya lewat kode.

## 2026-10-22: Mastery gate 60% skor inti

1. **Ambang 60%.** Disimpan sebagai konstanta `MASTERY_THRESHOLD` di `src/lib/progression.ts`. Dari 15 soal inti, 60% berarti 9 benar. Hanya soal inti yang dihitung, sama dengan skor inti hari.
2. **Gate memakai skor terbaik, bukan skor pertama.** Hari N+1 terbuka bila `bestCorePercent` hari N minimal 60. Skor pertama tetap menjadi nilai resmi untuk statistik dan tampilan, tetapi mengulang hari yang gagal bisa membuka hari berikutnya. Tanpa aturan ini, hari yang sudah gagal sekali tidak pernah bisa membuka hari berikutnya.
3. **Status `repair`.** Hari yang sudah dikirim tetapi belum mencapai ambang berstatus `repair`. Peta menampilkannya dengan label "perlu perbaikan" dan tetap bisa dibuka. Beranda menampilkan tombol "Ulangi Hari ke-N".
4. **Sesi perbaikan.** Soal yang salah sudah masuk Buku Kesalahan dengan jatuh tempo besok, jadi Latihan perbaikan memuat soal itu secara otomatis. Itulah sesi perbaikan otomatis. Gate tetap dibuka dengan mengulang hari itu, karena latihan Buku Kesalahan tidak menghitung skor inti.
5. **Tombol Lanjut hanya setelah lulus.** Di hasil evaluasi, tombol "Lanjut Hari ke-N" muncul bila skor terbaik sudah mencapai ambang. Bila belum, tampil pesan bahwa hari berikutnya terbuka setelah 60%.
6. **Data lama.** Hari yang sudah dikirim sebelum perubahan ini dinilai dengan skor terbaik yang tersimpan. Hari yang masih di bawah 60% sekarang berstatus `repair`.
7. **Verifikasi.** Vitest 46 tes lolos, termasuk tes ambang, status `repair`, dan kunci hari berikutnya. `tsc --noEmit` dan `npm run build` lolos. Di browser, hari 1 dengan skor 40% membuat hari 2 terkunci dan Beranda menawarkan "Ulangi Hari ke-1". Setelah skor terbaik 60%, hari 2 terbuka.

## 2026-10-22: Fase 11 (fitur lanjutan, sebagian)

Persetujuan hari 61 sampai 90 dicatat sebagai selesai. Fase 11 dikerjakan dalam dua bagian. Bagian pertama dibuat sekarang, bagian kedua menunggu keputusan.

1. **Statistik dan laporan kesiapan.** `/statistik` menampilkan hari selesai, rata-rata skor inti, akurasi per bagian, akurasi Hard Challenge, jumlah kesalahan aktif dan terkuasai, serta peta 90 hari yang berwarna menurut skor. Semua angka memakai percobaan pertama, sama dengan nilai resmi hari itu. `/laporan` baru menampilkan perkiraan setelah minimal 7 hari selesai. Label "perkiraan" dan penyangkalan bahwa ini bukan skor ETS atau IELTS tampil di halaman. Logika ada di `src/lib/stats.ts` dengan tes.
2. **Latihan perbaikan.** `/latihan` mengambil entri Buku Kesalahan yang jatuh tempo hari ini, lalu menjalankan soal pilihan ganda. Antrean dikunci saat sesi mulai, supaya soal yang baru dijawab tidak hilang dari layar. Jawaban memakai `applyResult` yang sama dengan Buku Kesalahan, jadi jadwal Leitner konsisten. Terjemahan tidak ikut sesi ini dan dihitung sebagai dilewati. Buku Kesalahan punya tautan ke halaman ini.
3. **Ekspor dan impor JSON.** Ekspor di Profil menulis `enghabits-backup` versi 1 dengan progres, percobaan, Buku Kesalahan, dan catatan. Pengaturan tampilan tidak ikut. Impor memeriksa berkas dengan zod, menampilkan pratinjau jumlah data, lalu mengganti semua data dalam satu transaksi. Berkas yang tidak valid ditolak sebelum menyentuh data lama.
4. **Pengingat jam 06.00.** Pengaturan `reminderEnabled` dan `lastReminderDate` ditambahkan ke `Settings`. Izin notifikasi diminta saat pengingat dinyalakan. Notifikasi dikirim lewat service worker jika tersedia, karena Chrome Android tidak mengizinkan `new Notification`. Pengingat hanya berjalan saat aplikasi terbuka atau berjalan di latar belakang. Tidak ada server push, jadi kalau aplikasi tidak pernah dibuka setelah jam 06.00, pengingat tidak muncul.
5. **Ikon PWA.** `scripts/make-icons.mjs` membuat `public/icons/icon-192.png` dan `icon-512.png` tanpa dependensi tambahan. Latarnya ungu merek dengan huruf E putih di tengah, sehingga aman untuk ikon maskable. Manifest dan `apple-touch-icon` memakainya. Placeholder `ComingSoonPage` dihapus.
6. **Belum dikerjakan, perlu keputusan.** (a) Mastery gate dan sesi perbaikan otomatis. Ambang lulus belum ditentukan, dan itu mengubah cara hari berikutnya terbuka. (b) Perekam suara dengan MediaRecorder. Belum dibuat. (c) Koreksi AI. Butuh pilihan penyedia dan kunci API, dan belum ada server. Tombol salin untuk jawaban tulis juga belum dibuat, karena menunggu keputusan (c).
7. **Verifikasi.** `tsc --noEmit` bersih. Vitest 43 tes lolos, termasuk 9 tes baru untuk statistik dan validasi cadangan. `npm run build` lolos dan manifest memuat tiga ikon. Di browser (dev server) sudah diuji: statistik dengan data contoh, laporan, latihan (jawab benar, jawab salah, dan ringkasan), ekspor (isi berkas dicek), serta impor (pratinjau, konfirmasi, dan data benar-benar diganti). Izin notifikasi belum diuji di browser.
8. **Peringatan build.** Vite memberi peringatan bahwa chunk `index` lebih dari 500 kB. Belum ditangani. Pemisahan kode dicatat untuk Fase 12.

## 2026-10-22: Fase 10b (konten hari 61-90 dan bank minggu 9-12)

1. **Pola minggu 9 sampai 12.** Setiap hari lolos validator dengan 15 soal inti (blok 3, Bagian A, dan Bagian B) dalam rentang kesulitan: mudah 2 sampai 4, sedang 3 sampai 7, sulit 6 sampai 10. Target minggu 9 sampai 12 adalah 2 mudah, 5 sedang, 8 sulit, dengan toleransi 2. Hard Challenge 5 soal sulit dengan jebakan ujian.
2. **Hari simulasi dan rencana.** Hari 88 dan 89 bertipe `exam` dengan blok 3 berupa bacaan (topik simulasi dan kriteria penilaian). Hari 90 adalah rencana aksi akhir. Semua teks ditulis sendiri. Hari simulasi tidak disalin dari soal resmi dan tidak mengklaim sebagai soal resmi ETS, IELTS, atau TOEFL.
3. **Topik bank minggu 9 sampai 12.** Minggu 9: TFNG, yes-no-not-given, judul paragraf, celah batas kata, ejaan dan angka, koreksi. Minggu 10: proses, pie dan tabel, grafik garis, bar chart, peta, gambaran umum. Minggu 11: esai opini, problem-solusi, adv-disadv, tesis, paragraf, esai diskusi. Minggu 12: simulasi listening, simulasi reading, simulasi writing, speaking, kriteria, rencana.
4. **Kosakata hari 63 diganti.** Kata `section` sudah dipakai di hari 59, dan `paragraph` sudah dipakai di hari 29, sehingga validator kurikulum menolak keduanya. Kosakata hari 63 sekarang `draft`, dengan satu kalimat berisi `draft` di naskah. `content/curriculum.json` ikut diperbarui.
5. **Validator menangkap masalah berikut.** Tanda titik tiga pada formula hari 84 (diganti dengan X dan Y). Hari 85 memiliki 10 dari 15 kunci huruf A (H1 dan H3 diurutkan ulang). Hari 86 L4 belum punya `evidence`. Di bank minggu 12, contoh `ruleAndExamples` sempat berisi teks Inggris di kolom `id`; sudah diganti dengan terjemahan Indonesia. Validator tidak menangkap yang terakhir, jadi pengecekan itu dilakukan manual.
6. **Distribusi jawaban bank.** Minggu 9: A 8, B 7, C 8, D 7. Minggu 10: A 8, B 7, C 8, D 7. Minggu 11: A 8, B 7, C 8, D 7. Minggu 12: A 8, B 8, C 7, D 7. Tidak ada huruf yang melebihi 60 persen.
7. **Batas kualitas tetap sama.** Validator, tes, dan pemeriksaan tipe lolos, tetapi audit kalimat per kalimat belum dilakukan. Pengecoh dengan `whether`, `whenever`, dan `as soon as` dan opsi yang hanya berbeda pada bentuk kata perlu dibaca ulang saat audit mutu di Fase 12.

## 2026-10-21: Fase 10 (konten hari 52-60 dan bank minggu 8)

1. **Pola minggu 8.** Komposisi 3 mudah, 6 sedang, 6 sulit untuk 15 soal inti, sesuai target minggu 8. Hari 52, 54, 56 mendengarkan. Hari 53, 55, 57 membaca (teks Bulan 2, 225 sampai 385 kata). Hari 58 review dengan naskah. Hari 59 dan 60 adalah simulasi. Hari 59 memakai naskah dan pola structure. Hari 60 memakai teks bacaan.
2. **Hari simulasi bukan soal resmi.** Hari 59 dan 60 ditulis sendiri sebagai latihan, dengan kalimat tegas bahwa itu bukan soal resmi. Kurikulum memberi label TOEFL ITP, tetapi isi, pilihan, dan teks tidak disalin dari sumber resmi. Estimasi skor di hari 60 digambarkan sebagai perkiraan dari latihan.
3. **Topik minggu 8.** Dialog pendek dan tanggapan, sinonim dan parafrasa, idiom dasar, ekspresi negatif, percakapan kampus, dan pidato akademik. Kosakata setiap hari cocok dengan kurikulum (dicek otomatis).
4. **Validator menangkap empat masalah.** Nilai `pos` berbentuk `Noun/Verb` tidak diizinkan (diganti dengan satu kelas kata). Tanda titik tiga di hari 55 dan 59 (diganti). Hari 56 H3 memiliki dua opsi yang sama setelah normalisasi: `library's` dan `librarys` (opsi diganti dengan `library`). Di bank, semua soal lolos tanpa perbaikan.
5. **Bank minggu 8 sudah lolos validator.** 30 soal sulit. Jawaban benar tersebar: A 8, B 7, C 8, D 7. Topik: dialog-tanggapan, sinonim-parafrasa, idiom, ekspresi-negatif, percakapan-kampus, dan akademik.
6. **Batas kualitas tetap sama.** Validator lolos, tetapi audit kalimat per kalimat belum dilakukan. Pengecoh dengan `whether`, `whenever`, dan `as soon as` perlu dibaca ulang saat audit mutu di Fase 12.

## 2026-10-21: Fase 9 (konten hari 45-51 dan bank minggu 7)

1. **Pola minggu 7.** Komposisi 3 mudah, 6 sedang, 6 sulit untuk 15 soal inti. Hard Challenge 5 soal sulit. Hari 45, 47, 49 membaca (teks Bulan 2, 225 sampai 385 kata). Hari 46, 48, 50 mendengarkan. Hari 51 review dengan naskah.
2. **Topik minggu 7.** Bentuk sejajar, bentuk kata dan akhiran (-tion, -ment, -ive, -al, -ly), inversi setelah kata keterangan negatif, skimming dan scanning, serta ide utama. Semua teks, naskah, dan soal ditulis sendiri. Tidak ada soal resmi yang disalin.
3. **Kalimat negatif di contoh.** Contoh negatif (`negative`) harus berupa kalimat negatif yang benar. Beberapa contoh di hari 46 sampai 48 sempat berisi kalimat yang salah dengan sengaja, dan hari 51 sempat memuat daftar yang tidak sejajar. Semuanya sudah diperbaiki.
4. **Validator menangkap empat masalah.** Tanda titik tiga di hari 45, 48, dan bank (diganti dengan garis bawah). Hari 47 A4 yang sulit belum punya stepByStep. Hari 48 tip memakai `see...`. Di bank, W07-015 sempat menaruh kunci jawaban di huruf yang salah. Semuanya sudah diperbaiki.
5. **Bank minggu 7 sudah lolos validator.** 30 soal sulit. Jawaban benar tersebar: A 8, B 6, C 8, D 8. Topik: paralel, bentuk-kata, akhiran-sifat-keterangan, inversi, skimming-scanning, dan ide-utama.
6. **Batas kualitas tetap sama.** Validator lolos, tetapi audit kalimat per kalimat belum dilakukan. Pengecoh dengan `whether`, `whenever`, dan `as soon as` perlu dibaca ulang saat audit mutu di Fase 12.

## 2026-10-21: Fase 8 (konten hari 38-44 dan bank minggu 6)

1. **Pola minggu 6.** Komposisi 3 mudah, 6 sedang, 6 sulit untuk 15 soal inti. Hard Challenge 5 soal sulit. Hari 39, 41, 43 membaca (teks Bulan 2, 225 sampai 385 kata). Hari 38, 40, 42 mendengarkan. Hari 44 review dengan naskah.
2. **Topik anak kalimat dan penghubung.** Kurikulum memakai label "TOEFL Structure". Semua teks, naskah, dan soal ditulis sendiri. Tidak ada soal resmi yang disalin.
3. **Validator menangkap dua jenis masalah.** Tanda titik tiga di penjelasan dan hint (hari 39, 42, 44, dan bank), serta hari 44 A4 yang bertingkat sulit tetapi belum punya examTrap dan ruleAndExamples. Keduanya sudah diperbaiki.
4. **Bank minggu 6 sudah lolos validator.** 30 soal sulit. Jawaban benar tersebar: A 8, B 8, C 7, D 7. Topik: penghubung antarkalimat, anak kalimat keterangan, anak kalimat sifat, anak kalimat kata benda, dan frasa yang diringkas.
5. **Batas kualitas tetap sama.** Validator lolos, tetapi audit kalimat per kalimat belum dilakukan. Beberapa pengecoh dengan `whether`, `whenever`, dan `as soon as` perlu dibaca ulang saat audit mutu di Fase 12.

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
