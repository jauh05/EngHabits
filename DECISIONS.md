# DECISIONS

Catatan keputusan teknis, urut dari yang terbaru.

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
