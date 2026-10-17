/* =========================================================
   KONFIGURASI UNDANGAN
   Ubah nilai-nilai di bawah ini sesuai kebutuhan.
   ========================================================= */
const CONFIG = {
  // Jadwal pemberkatan = target countdown. Format WIB (GMT+7).
  weddingDateTime: "2026-10-25T09:00:00+07:00",

  // ---- Slideshow (crossfade, berulang tanpa henti) ----
  // Detik per gambar. Gambar: assets/images/bg-open1.jpg ... bg-open3.jpg, dst.
  bgOpenIntervalSeconds: 6,   // halaman pembuka (bg-open1..3)
  coverIntervalSeconds: 6,    // sampul utama (cover-1..3)
  coupleIntervalSeconds: 10,  // foto mempelai (groom1..3 & bride1..3)

  // ---- Galeri ----
  // Foto: assets/images/gallery-01.jpg ... gallery-30.jpg
  galleryCount: 30,
  // Tiap blok "foto kenangan" = 2 baris x 5 kolom. Angka = nomor foto awal & akhir.
  galleryGroups: [
    { from: 1,  to: 10 },   // Foto Kenangan 1: gallery-01 s/d gallery-10
    { from: 11, to: 20 },   // Foto Kenangan 2: gallery-11 s/d gallery-20
    { from: 21, to: 30 }    // Foto Kenangan 3: gallery-21 s/d gallery-30
  ],
  // Setiap berapa detik satu baris bergeser satu foto (baris atas ke kiri, bawah ke kanan).
  galleryStepSeconds: 10,

  // URL Web App Google Apps Script (lihat google-apps-script/Code.gs & README.md)
  scriptURL: "https://script.google.com/macros/s/AKfycbxKRWeJDz96k9IuSM_4BFyB2EG4mB3j0hmBnwMqGFvA9nVvTHd67jJ_jI9e-Hd_pXEZrw/exec",

  // Berapa detik ucapan & papan peringkat diperbarui otomatis.
  rsvpPollSeconds: 15,

  // Jumlah ucapan per halaman.
  wishesPerPage: 10,

  // Link live streaming. Kosongkan ("") jika tidak ada.
  liveStreamingURL: "",

  // Footer iklan "Order Undangan Digital" -- nomor WhatsApp tujuan (format 62...).
  footerAdWhatsApp: "6281247770168",

  // Game ditutup setelah tanggal ini, dan pemenang diumumkan pada tanggal kedua.
  gameEndDate: "2026-10-23T23:59:59+07:00",
  gameAnnounceDate: "2026-10-28T00:00:00+07:00",

  // Jumlah nama teratas di papan peringkat game.
  leaderboardTopCount: 10,

  // TOKEN -- harus SAMA PERSIS dengan ALLOWED_TOKEN di google-apps-script/Code.gs.
  submitToken: "AL-iPTlslnyVJcU0oLBNWd5CnpmMvJMdPTx"
};
