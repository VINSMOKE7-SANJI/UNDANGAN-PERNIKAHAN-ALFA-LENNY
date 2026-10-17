/**
 * BACKEND RSVP + GAME LEADERBOARD — VERSI FINAL
 * =========================================================
 * Aturan yang dijaga di server (tidak bisa dibypass dari browser):
 *
 *  1. TOKEN RAHASIA  — POST wajib membawa token yang sama dengan
 *                      ALLOWED_TOKEN (juga ada di js/config.js).
 *  2. RSVP SEKALI    — nama yang sudah ada di sheet RSVP akan ditolak
 *                      (walaupun cache/history browser dihapus).
 *  3. GAME SEKALI    — nama yang sudah ada di sheet GAME akan ditolak.
 *  4. GAME HARUS RSVP— skor hanya diterima jika nama sudah RSVP.
 *  5. ANTI-BALAPAN   — pengecekan + penulisan dikunci LockService,
 *                      sehingga dua klik bersamaan tidak lolos ganda.
 *  6. VALIDASI       — panjang nama/ucapan dibatasi, skor 0..100000,
 *                      HTML di-strip, formula injection di Sheets dicegah.
 *
 * Nama dibandingkan setelah dinormalisasi: huruf kecil, spasi ganda
 * dihapus, spasi depan/belakang dihapus. "  YESAYA " = "yesaya".
 *
 * CARA PASANG / UPDATE:
 * 1. Buka Google Sheet → Extensions → Apps Script
 * 2. Hapus isi lama, tempel seluruh isi file ini
 * 3. Pastikan ALLOWED_TOKEN sama dengan submitToken di js/config.js
 * 4. Deploy → Manage deployments → pencil (edit) → New version → Deploy
 *    (URL /exec tetap sama, tidak perlu ganti scriptURL)
 * =========================================================
 */

// ─── TOKEN: harus SAMA dengan submitToken di js/config.js ───
const ALLOWED_TOKEN  = "AL-iPTlslnyVJcU0oLBNWd5CnpmMvJMdPTx";
// ────────────────────────────────────────────────────────────

const SHEET_RSVP   = "RSVP";
const SHEET_GAME   = "GAME";
const RSVP_HEADERS = ["Timestamp", "Nama", "Kehadiran", "JumlahTamu", "Ucapan"];
const GAME_HEADERS = ["Timestamp", "Nama", "Skor"];
const MAX_SCORE    = 100000;
const MAX_NAME_LEN = 80;
const MAX_MSG_LEN  = 500;
const LOCK_WAIT_MS = 15000;
const ATTEND_OPTIONS = ["Hadir", "Tidak Hadir", "Ragu-ragu"];

/* ── Sanitasi: hapus tag HTML & cegah formula injection (= + - @ |) ── */
function sanitize_(str) {
  if (typeof str !== "string") return String(str == null ? "" : str);
  return str
    .replace(/<[^>]*>/g, "")
    .trim()
    .replace(/^[=+\-@|]/, "'$&")
    .slice(0, MAX_MSG_LEN);
}

/* ── Kunci pembanding nama: sanitasi + huruf kecil + spasi rapi ── */
function nameKey_(str) {
  return sanitize_(String(str == null ? "" : str))
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/* ── Ambil sheet; buat dengan header jika belum ada ── */
function getSheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
  }
  return sheet;
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ── Cari nama di sheet RSVP. Kolom B = Nama. ── */
function hasRsvp_(key) {
  const data = getSheet_(SHEET_RSVP, RSVP_HEADERS).getDataRange().getValues();
  for (let r = 1; r < data.length; r++) {
    if (nameKey_(data[r][1]) === key) return true;
  }
  return false;
}

/* ── Cari nama di sheet GAME. Kolom B = Nama, C = Skor. ── */
function findGame_(key) {
  const data = getSheet_(SHEET_GAME, GAME_HEADERS).getDataRange().getValues();
  for (let r = 1; r < data.length; r++) {
    if (nameKey_(data[r][1]) === key) return { score: Number(data[r][2]) || 0 };
  }
  return null;
}

/* ════════════════════════════════════════════════════════
   doGet — baca data (publik, tanpa token)
     ?action=list          → daftar RSVP (dinding ucapan)
     ?action=leaderboard   → 20 skor tertinggi
     ?action=status&name=… → {rsvp, game, score} untuk satu nama
   ════════════════════════════════════════════════════════ */
function doGet(e) {
  const p      = (e && e.parameter) || {};
  const action = p.action || "";

  if (action === "list") {
    const data = getSheet_(SHEET_RSVP, RSVP_HEADERS).getDataRange().getValues();
    const rows = [];
    for (let r = 1; r < data.length; r++) {
      const name = data[r][1];
      if (!name) continue;
      rows.push({
        name:    String(name),
        attend:  String(data[r][2]),
        guests:  String(data[r][3]),
        message: String(data[r][4])
      });
    }
    return jsonResponse_(rows);
  }

  if (action === "leaderboard") {
    const data = getSheet_(SHEET_GAME, GAME_HEADERS).getDataRange().getValues();
    const rows = [];
    for (let r = 1; r < data.length; r++) {
      if (!data[r][1]) continue;
      rows.push({ name: String(data[r][1]), score: Number(data[r][2]) || 0 });
    }
    rows.sort(function (a, b) { return b.score - a.score; });
    return jsonResponse_(rows.slice(0, 20));
  }

  if (action === "status") {
    const key = nameKey_(p.name || "");
    if (!key) return jsonResponse_({ ok: false, error: "name_required" });
    const game = findGame_(key);
    return jsonResponse_({
      ok:    true,
      rsvp:  hasRsvp_(key),
      game:  !!game,
      score: game ? game.score : null
    });
  }

  return jsonResponse_({ ok: true, status: "Backend aktif." });
}

/* ════════════════════════════════════════════════════════
   doPost — simpan RSVP / skor game (dengan token + kunci)
   ════════════════════════════════════════════════════════ */
function doPost(e) {
  let payload = {};
  try {
    payload = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse_({ ok: false, error: "invalid_payload" });
  }

  if (!ALLOWED_TOKEN) {
    return jsonResponse_({ ok: false, error: "token_not_configured" });
  }
  if (payload.token !== ALLOWED_TOKEN) {
    return jsonResponse_({ ok: false, error: "unauthorized" });
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_MS)) {
    return jsonResponse_({ ok: false, error: "busy" });
  }

  try {
    /* ── RSVP ── */
    if (payload.action === "rsvp") {
      const name    = sanitize_(payload.name    || "");
      const attend  = sanitize_(payload.attend  || "");
      const guests  = sanitize_(payload.guests  || "1");
      const message = sanitize_(payload.message || "");

      if (!name || name.length > MAX_NAME_LEN)  return jsonResponse_({ ok: false, error: "invalid_name" });
      if (ATTEND_OPTIONS.indexOf(attend) === -1) return jsonResponse_({ ok: false, error: "invalid_attend" });
      if (!message)                              return jsonResponse_({ ok: false, error: "empty_message" });

      if (hasRsvp_(nameKey_(name))) {
        return jsonResponse_({ ok: false, error: "already_rsvp" });
      }
      getSheet_(SHEET_RSVP, RSVP_HEADERS).appendRow([new Date(), name, attend, guests, message]);
      return jsonResponse_({ ok: true });
    }

    /* ── SKOR GAME ── */
    if (payload.action === "game_score") {
      const name  = sanitize_(payload.name || "");
      const score = Number(payload.score);

      if (!name || name.length > MAX_NAME_LEN)           return jsonResponse_({ ok: false, error: "invalid_name" });
      if (!isFinite(score) || score < 0 || score > MAX_SCORE) return jsonResponse_({ ok: false, error: "invalid_score" });

      const key = nameKey_(name);
      if (!hasRsvp_(key))  return jsonResponse_({ ok: false, error: "rsvp_required" });
      if (findGame_(key))  return jsonResponse_({ ok: false, error: "already_played" });

      getSheet_(SHEET_GAME, GAME_HEADERS).appendRow([new Date(), name, Math.floor(score)]);
      return jsonResponse_({ ok: true });
    }

    return jsonResponse_({ ok: false, error: "unknown_action" });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
