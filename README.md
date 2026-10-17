# Undangan Digital Alfa & Lenny

Undangan pernikahan statis (HTML/CSS/JS) untuk GitHub Pages, dengan RSVP, ucapan,
dan mini game yang tersimpan di Google Sheets lewat Google Apps Script.

## Isi folder

```
index.html                  halaman utama
css/style.css               seluruh tampilan
js/config.js                SEMUA pengaturan (tanggal, nomor WA, URL backend, token)
js/script.js                cover, slideshow, galeri, RSVP, ucapan
js/game.js                  mini game & papan peringkat
google-apps-script/Code.gs  backend (dipasang di Google Apps Script)
assets/background.mp4       video latar (bingkai ornamen hijau-emas)
assets/memories.mp4         video kenangan (sebelum galeri)
assets/images/              foto-foto (lihat daftar di bawah)
assets/audio/music.mp3      musik latar (BELUM ADA: unggah file mp3 Anda dengan nama ini)
scripts/optimize_images.py  konversi PNG -> JPG & perkecil foto
```

## Daftar foto yang dipakai

| Bagian | File | Keterangan |
|---|---|---|
| Halaman pembuka | `bg-open1.jpg` … `bg-open3.jpg` | ganti bergantian setiap 6 detik |
| Sampul (hero & penutup) | `cover-1.jpg` … `cover-3.jpg` | ganti setiap 6 detik |
| Mempelai pria | `groom1.jpg` … `groom3.jpg` | ganti setiap 10 detik |
| Mempelai wanita | `bride1.jpg` … `bride3.jpg` | ganti setiap 10 detik |
| Foto Kenangan 1 | `gallery-01.jpg` … `gallery-10.jpg` | 2 baris x 5 kolom |
| Foto Kenangan 2 | `gallery-11.jpg` … `gallery-20.jpg` | 2 baris x 5 kolom |
| Foto Kenangan 3 | `gallery-21.jpg` … `gallery-30.jpg` | 2 baris x 5 kolom |
| Ikon & preview | `favicon.jpg`, `og-image.jpg` | |

Nama file harus huruf kecil, tanpa spasi, dengan ekstensi `.jpg`.
Jika menambah foto baru dalam format PNG/JPEG, jalankan:

```
python3 scripts/optimize_images.py assets/images
```

Script ini mengubah semua file ke JPG (kualitas 85, tidak dipotong, sisi terpanjang
maksimal 1600 px), merapikan nama file (spasi jadi tanda hubung), dan melewati file
yang rusak. Jalankan dari folder project.

Galeri menampilkan 10 foto per blok. Setiap 10 detik, baris atas bergeser ke kiri
dan baris bawah ke kanan, sehingga foto berputar berlawanan arah. Angka 10 detik
dan jumlah foto bisa diubah di `js/config.js` (`galleryStepSeconds`, `galleryGroups`).

## Pengaturan utama (js/config.js)

- `weddingDateTime`: jadwal pemberkatan, `2026-10-25T09:00:00+07:00` (09.00 WIB).
  Teks jam di halaman ("09.00 – 10.00 WIB") diatur di `index.html`, bagian `event-time`.
- `footerAdWhatsApp`: nomor WhatsApp iklan footer, `6281247770168`.
- `gameEndDate` / `gameAnnounceDate`: batas bermain dan tanggal pengumuman pemenang.
- `scriptURL`: URL Web App Google Apps Script (`.../exec`).
- `submitToken`: token rahasia, harus sama dengan `ALLOWED_TOKEN` di `Code.gs`.

## Backend: Google Sheets + Apps Script

Sheet memakai dua tab yang dibuat otomatis:

- `RSVP`: Timestamp | Nama | Kehadiran | JumlahTamu | Ucapan
- `GAME`: Timestamp | Nama | Skor

Aturan yang dijaga di server (`Code.gs`), jadi tidak bisa dilewati dari browser:

1. POST wajib membawa `submitToken` yang benar.
2. Satu nama hanya boleh RSVP sekali. Pengecekan memakai nama yang sudah
   dinormalisasi (huruf kecil, spasi rapi), dan dikunci `LockService`.
3. Satu nama hanya boleh main game sekali, dan hanya jika nama itu sudah RSVP.
4. Skor 0 sampai 100.000. HTML dihapus dan formula Sheets dicegah.
5. Browser juga memeriksa status ke server (`?action=status&name=...`) sebelum
   membuka form atau game. Menghapus cache/history browser tidak membuka kunci lagi.

Cara pasang / memperbarui:

1. Buka Google Sheet → Extensions → Apps Script.
2. Hapus isi lama, tempel seluruh isi `google-apps-script/Code.gs`.
3. Deploy → Manage deployments → ikon pensil → New version → Deploy.
   URL `/exec` tetap sama, jadi `scriptURL` tidak perlu diubah.
4. Setiap kali `Code.gs` diubah, ulangi langkah 3.

Token: file ini sudah berisi token yang sama di `js/config.js` dan `google-apps-script/Code.gs`.
Jika ingin mengganti, ubah keduanya sekaligus lalu deploy ulang.

Catatan: token terlihat di kode JavaScript publik. Itu hanya pagar terhadap pengiriman
iseng, bukan kata sandi. Data sensitif tidak disimpan di situs ini.

## Menguji sebelum dibagikan

1. Buka `index.html?to=Nama+Tamu`, lalu cek nama di sampul dan kolom RSVP terkunci.
2. Kirim RSVP. Pastikan baris muncul di tab `RSVP`.
3. Hapus data situs di browser (cache & cookies), buka lagi link yang sama.
   Form RSVP harus berubah menjadi "Anda sudah mengonfirmasi kehadiran".
4. Main game sampai selesai. Pastikan skor muncul di tab `GAME` dan papan peringkat.
   Setelah cache dihapus, game harus terkunci.

## Hosting di GitHub Pages

1. Upload seluruh isi folder ini ke repository (`main`).
2. Settings → Pages → Deploy from a branch → `main` / `(root)`.
3. Bagikan link dengan parameter nama: `https://<user>.github.io/<repo>/?to=Nama+Tamu`.
   Nama pada `?to=` dipakai sebagai nama di RSVP dan papan peringkat.
