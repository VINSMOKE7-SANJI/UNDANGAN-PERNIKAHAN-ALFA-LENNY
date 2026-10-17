(function () {
  "use strict";

  const REDUCED_MOTION = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pad2 = function (n) { return String(n).padStart(2, "0"); };

  /* ---------- Nama tamu dari URL (?to=Nama) ---------- */
  const params = new URLSearchParams(window.location.search);
  const guest = params.get("to");
  let invitedGuestName = "";
  if (guest) {
    invitedGuestName = decodeURIComponent(guest.replace(/\+/g, " ")).trim();
    document.getElementById("guestName").textContent = invitedGuestName;
  }

  // Nama dari link undangan dikunci di form RSVP, dan itu juga nama pemain game.
  const rsvpNameInput = document.getElementById("rsvpName");
  if (invitedGuestName && rsvpNameInput) {
    rsvpNameInput.value = invitedGuestName;
    rsvpNameInput.readOnly = true;
    rsvpNameInput.classList.add("locked");
    const lockNote = document.getElementById("rsvpNameLockNote");
    if (lockNote) lockNote.classList.remove("hidden");
  }

  /* ---------- Slideshow crossfade (berulang tanpa henti) ---------- */
  const SLIDES = {
    bgopen: { srcs: [1, 2, 3].map(function (n) { return "assets/images/bg-open" + n + ".jpg"; }), sec: CONFIG.bgOpenIntervalSeconds || 6 },
    cover:  { srcs: [1, 2, 3].map(function (n) { return "assets/images/cover-" + n + ".jpg"; }), sec: CONFIG.coverIntervalSeconds || 6 },
    groom:  { srcs: [1, 2, 3].map(function (n) { return "assets/images/groom" + n + ".jpg"; }), sec: CONFIG.coupleIntervalSeconds || 10 },
    bride:  { srcs: [1, 2, 3].map(function (n) { return "assets/images/bride" + n + ".jpg"; }), sec: CONFIG.coupleIntervalSeconds || 10 }
  };

  function startSlides(container, cfg) {
    const imgs = cfg.srcs.map(function (src, i) {
      const img = document.createElement("img");
      img.src = src;
      img.alt = "";
      img.decoding = "async";
      if (i === 0) img.classList.add("active");
      img.addEventListener("error", function () { img.classList.add("missing"); });
      container.appendChild(img);
      return img;
    });
    if (imgs.length < 2 || REDUCED_MOTION) return;
    let idx = 0;
    setInterval(function () {
      imgs[idx].classList.remove("active");
      idx = (idx + 1) % imgs.length;
      imgs[idx].classList.add("active");
    }, cfg.sec * 1000);
  }

  document.querySelectorAll("[data-slides]").forEach(function (el) {
    const cfg = SLIDES[el.getAttribute("data-slides")];
    if (cfg) startSlides(el, cfg);
  });

  /* ---------- Buka undangan ---------- */
  const cover = document.getElementById("cover");
  const main = document.getElementById("main");
  const openBtn = document.getElementById("openBtn");
  const bgMusic = document.getElementById("bgMusic");
  const musicBtn = document.getElementById("musicBtn");
  const bgVideo = document.getElementById("bgVideo");

  document.body.style.overflow = "hidden";

  openBtn.addEventListener("click", function () {
    cover.classList.add("closing");
    main.classList.remove("hidden");
    document.body.style.overflow = "auto";
    setTimeout(function () { cover.remove(); }, 850);

    bgMusic.volume = 0.6;
    bgMusic.play().then(function () {
      musicBtn.classList.add("playing");
    }).catch(function () { /* autoplay diblokir: tamu bisa tekan tombol musik */ });

    if (bgVideo) {
      bgVideo.play().catch(function () { /* video tetap tampil dengan frame pertama */ });
    }

    initCountdown();
    initReveal();
    setTimeout(loadWishes, 300);
    if (CONFIG.rsvpPollSeconds) {
      setInterval(loadWishes, CONFIG.rsvpPollSeconds * 1000);
    }
  });

  musicBtn.addEventListener("click", function () {
    if (bgMusic.paused) {
      bgMusic.play().then(function () { musicBtn.classList.add("playing"); }).catch(function () {});
    } else {
      bgMusic.pause();
      musicBtn.classList.remove("playing");
    }
  });

  // Jika file video latar gagal dimuat, tampilkan latar cadangan
  if (bgVideo) {
    bgVideo.addEventListener("error", function () {
      const zone = document.querySelector(".video-zone");
      if (zone) zone.classList.add("video-failed");
    });
  }

  /* ---------- Video kenangan: musik jeda saat diputar ---------- */
  const memoriesVideo = document.getElementById("memoriesVideo");
  let musicPausedByMemories = false;
  if (memoriesVideo) {
    memoriesVideo.addEventListener("play", function () {
      if (!bgMusic.paused) {
        musicPausedByMemories = true;
        bgMusic.pause();
        musicBtn.classList.remove("playing");
      }
    });
    const resumeMusicAfterMemories = function () {
      if (musicPausedByMemories) {
        musicPausedByMemories = false;
        bgMusic.play().then(function () { musicBtn.classList.add("playing"); }).catch(function () {});
      }
    };
    memoriesVideo.addEventListener("pause", resumeMusicAfterMemories);
    memoriesVideo.addEventListener("ended", resumeMusicAfterMemories);
  }

  /* ---------- Menu navigasi kiri atas (filter + klik ke halaman) ---------- */
  const navMenuBtn = document.getElementById("navMenuBtn");
  const navMenuPanel = document.getElementById("navMenuPanel");
  const navFilterInput = document.getElementById("navFilterInput");
  const navMenuItems = Array.from(document.querySelectorAll("#navMenuList li"));
  const navEmptyMsg = document.getElementById("navEmptyMsg");

  navMenuBtn.addEventListener("click", function () {
    const willOpen = navMenuPanel.classList.contains("hidden");
    navMenuPanel.classList.toggle("hidden", !willOpen);
    navMenuBtn.classList.toggle("open", willOpen);
    if (willOpen) { navFilterInput.value = ""; filterNavItems(""); navFilterInput.focus(); }
  });

  document.addEventListener("click", function (e) {
    if (!navMenuPanel.classList.contains("hidden") &&
        !navMenuPanel.contains(e.target) && e.target !== navMenuBtn && !navMenuBtn.contains(e.target)) {
      navMenuPanel.classList.add("hidden");
      navMenuBtn.classList.remove("open");
    }
  });

  navMenuItems.forEach(function (li) {
    li.querySelector("a").addEventListener("click", function () {
      navMenuPanel.classList.add("hidden");
      navMenuBtn.classList.remove("open");
    });
  });

  function filterNavItems(q) {
    const query = q.trim().toLowerCase();
    let visibleCount = 0;
    navMenuItems.forEach(function (li) {
      const title = li.querySelector("a").getAttribute("data-title").toLowerCase();
      const match = !query || title.indexOf(query) > -1;
      li.classList.toggle("hidden", !match);
      if (match) visibleCount++;
    });
    navEmptyMsg.classList.toggle("hidden", visibleCount > 0);
  }
  navFilterInput.addEventListener("input", function () { filterNavItems(navFilterInput.value); });

  /* ---------- Dot navigation: status aktif ---------- */
  const dotLinks = document.querySelectorAll("#dotnav a");
  const sections = Array.from(dotLinks).map(function (a) {
    return document.querySelector(a.getAttribute("href"));
  });
  function updateActiveDot() {
    let idx = 0;
    const mid = window.scrollY + window.innerHeight / 2;
    sections.forEach(function (sec, i) {
      if (sec && sec.offsetTop <= mid) idx = i;
    });
    dotLinks.forEach(function (a, i) { a.classList.toggle("active", i === idx); });
  }
  window.addEventListener("scroll", updateActiveDot);

  /* ---------- Animasi saat di-scroll ---------- */
  function initReveal() {
    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Countdown ---------- */
  function initCountdown() {
    const target = new Date(CONFIG.weddingDateTime).getTime();
    const dEl = document.getElementById("cd-days");
    const hEl = document.getElementById("cd-hours");
    const mEl = document.getElementById("cd-mins");
    const sEl = document.getElementById("cd-secs");
    function tick() {
      let diff = Math.max(target - Date.now(), 0);
      const days = Math.floor(diff / 86400000); diff -= days * 86400000;
      const hours = Math.floor(diff / 3600000); diff -= hours * 3600000;
      const mins = Math.floor(diff / 60000); diff -= mins * 60000;
      const secs = Math.floor(diff / 1000);
      dEl.textContent = pad2(days);
      hEl.textContent = pad2(hours);
      mEl.textContent = pad2(mins);
      sEl.textContent = pad2(secs);
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- Live streaming (opsional) ---------- */
  const liveSection = document.getElementById("liveSection");
  const liveBtn = document.getElementById("liveBtn");
  if (CONFIG.liveStreamingURL) {
    liveBtn.href = CONFIG.liveStreamingURL;
    liveSection.classList.remove("hidden");
  }

  /* ---------- Galeri: 3 blok foto kenangan, tiap blok 2 baris x 5 kolom ----------
     Baris atas bergeser ke kiri, baris bawah ke kanan, berlawanan arah.
     Setiap CONFIG.galleryStepSeconds detik, tiap baris geser satu foto. */
  const mosaicRows = [];

  function renderRing(state, base) {
    state.track.innerHTML = "";
    for (let k = 0; k < 6; k++) {               // 5 foto + 1 cadangan di kanan (untuk loop mulus)
      const tile = document.createElement("div");
      tile.className = "mosaic-tile";
      const img = document.createElement("img");
      img.src = state.ring[(base + k) % 5];
      img.alt = "Foto kenangan";
      img.loading = "lazy";
      img.decoding = "async";
      img.addEventListener("error", function () { tile.classList.add("missing"); });
      tile.appendChild(img);
      state.track.appendChild(tile);
    }
  }

  function stepRow(state) {
    const track = state.track;
    const EASE = "transform 1.4s cubic-bezier(.45,.05,.25,1)";
    if (state.dir < 0) {
      track.style.transition = EASE;
      track.style.transform = "translate3d(-16.6667%,0,0)";
      setTimeout(function () {
        track.style.transition = "none";
        state.base = (state.base + 1) % 5;
        renderRing(state, state.base);
        track.style.transform = "translate3d(0,0,0)";
      }, 1450);
    } else {
      state.base = (state.base + 4) % 5;
      renderRing(state, state.base);
      track.style.transition = "none";
      track.style.transform = "translate3d(-16.6667%,0,0)";
      void track.offsetWidth;                   // paksa reflow sebelum animasi
      track.style.transition = EASE;
      track.style.transform = "translate3d(0,0,0)";
    }
  }

  (CONFIG.galleryGroups || []).forEach(function (group, gi) {
    const root = document.querySelector('.mosaic[data-group="' + gi + '"]');
    if (!root) return;
    const nums = [];
    for (let n = group.from; n <= group.to; n++) nums.push(n);
    const rowsNums = [nums.slice(0, 5), nums.slice(5, 10)];
    rowsNums.forEach(function (rowNums, r) {
      const row = document.createElement("div");
      row.className = "mosaic-row";
      const track = document.createElement("div");
      track.className = "mosaic-track";
      row.appendChild(track);
      root.appendChild(row);
      const state = {
        ring: rowNums.map(function (n) { return "assets/images/gallery-" + pad2(n) + ".jpg"; }),
        base: 0,
        track: track,
        dir: r === 0 ? -1 : 1
      };
      renderRing(state, 0);
      mosaicRows.push(state);
    });
    root.addEventListener("click", function (e) {
      if (e.target.tagName === "IMG") openLightbox(e.target.src);
    });
  });

  if (mosaicRows.length && !REDUCED_MOTION) {
    setInterval(function () { mosaicRows.forEach(stepRow); }, (CONFIG.galleryStepSeconds || 10) * 1000);
  }

  function openLightbox(src) {
    const box = document.createElement("div");
    box.className = "lightbox";
    const close = document.createElement("button");
    close.className = "lightbox-close";
    close.setAttribute("aria-label", "Tutup");
    close.innerHTML = "&times;";
    const big = document.createElement("img");
    big.src = src;
    big.alt = "Foto";
    box.appendChild(close);
    box.appendChild(big);
    box.addEventListener("click", function (e) {
      if (e.target === box || e.target === close) box.remove();
    });
    document.body.appendChild(box);
  }

  /* ---------- Salin nomor rekening ---------- */
  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  document.querySelectorAll(".btn-copy").forEach(function (btn) {
    const originalHtml = btn.innerHTML;
    btn.addEventListener("click", function () {
      const val = btn.getAttribute("data-copy");
      const msgEl = document.getElementById(btn.getAttribute("data-target"));

      function showCopied() {
        if (msgEl) {
          msgEl.classList.add("show");
          setTimeout(function () { msgEl.classList.remove("show"); }, 1800);
        }
        btn.classList.add("copied");
        btn.innerHTML = '<span>Tersalin</span><i class="check-icon">&#10003;</i>';
        btn.disabled = true;
        setTimeout(function () {
          btn.classList.remove("copied");
          btn.innerHTML = originalHtml;
          btn.disabled = false;
        }, 1800);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(val).then(showCopied).catch(function () {
          if (fallbackCopy(val)) showCopied();
          else alert("Nomor rekening: " + val);
        });
      } else {
        if (fallbackCopy(val)) showCopied();
        else alert("Nomor rekening: " + val);
      }
    });
  });

  /* ---------- RSVP: server adalah sumber kebenaran ----------
     - Sebelum kirim: cek ke server apakah nama sudah RSVP.
     - Sesudah kirim: verifikasi ke server bahwa data benar-benar tersimpan.
     Jadi menghapus cache / history browser tidak membuka kunci RSVP lagi. */
  const RSVP_DONE_KEY = "al_rsvp_done";
  const RSVP_NAME_KEY = "al_rsvp_last_name";
  const rsvpForm = document.getElementById("rsvpForm");
  const rsvpSubmitBtn = document.getElementById("rsvpSubmitBtn");
  const rsvpThanks = document.getElementById("rsvpThanks");
  const rsvpAlready = document.getElementById("rsvpAlready");
  const rsvpError = document.getElementById("rsvpError");

  function storageGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function storageSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function storageDel(k) { try { localStorage.removeItem(k); } catch (e) {} }

  function showForm() {
    rsvpForm.classList.remove("hidden");
    rsvpThanks.classList.add("hidden");
    rsvpAlready.classList.add("hidden");
  }
  function showAlready() {
    rsvpForm.classList.add("hidden");
    rsvpThanks.classList.add("hidden");
    rsvpAlready.classList.remove("hidden");
    storageSet(RSVP_DONE_KEY, "true");
  }
  function showThanks(name) {
    rsvpForm.classList.add("hidden");
    rsvpAlready.classList.add("hidden");
    rsvpThanks.classList.remove("hidden");
    storageSet(RSVP_DONE_KEY, "true");
    storageSet(RSVP_NAME_KEY, name);
    window.dispatchEvent(new CustomEvent("al:rsvp-submitted", { detail: { name: name } }));
  }
  function setError(msg) {
    if (!rsvpError) return;
    rsvpError.textContent = msg || "";
    rsvpError.classList.toggle("hidden", !msg);
  }
  function setBusy(busy, label) {
    rsvpSubmitBtn.disabled = busy;
    rsvpSubmitBtn.querySelector("span").textContent = busy ? label : "Kirim Konfirmasi";
  }

  function fetchStatus(name) {
    return fetch(CONFIG.scriptURL + "?action=status&name=" + encodeURIComponent(name))
      .then(function (r) { return r.json(); });
  }

  // Saat halaman dibuka: cocokkan dengan server.
  function syncRsvpStatus() {
    // Nama dari link undangan dipakai sebagai nama pemain game. Game tetap
    // memverifikasi ke server (harus sudah RSVP), jadi aman disimpan di sini.
    if (invitedGuestName) storageSet(RSVP_NAME_KEY, invitedGuestName);
    const name = invitedGuestName || storageGet(RSVP_NAME_KEY) || "";
    if (!name || !CONFIG.scriptURL) {
      if (storageGet(RSVP_DONE_KEY) === "true") showAlready();
      return;
    }
    fetchStatus(name).then(function (s) {
      if (!s || !s.ok) return;
      if (s.rsvp) { showAlready(); }
      else {
        storageDel(RSVP_DONE_KEY);
        showForm();
      }
    }).catch(function () {
      // offline: pakai catatan lokal
      if (storageGet(RSVP_DONE_KEY) === "true") showAlready();
    });
  }
  syncRsvpStatus();

  rsvpForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("rsvpName").value.trim();
    const attend = document.getElementById("rsvpAttend").value;
    const guests = document.getElementById("rsvpGuests").value;
    const message = document.getElementById("rsvpMessage").value.trim();
    if (!name || !attend || !message) return;
    setError("");
    setBusy(true, "Memeriksa...");

    fetchStatus(name)
      .then(function (s) {
        if (s && s.rsvp) { showAlready(); return null; }
        setBusy(true, "Mengirim...");
        return sendToSheet({ action: "rsvp", name: name, attend: attend, guests: guests, message: message })
          .catch(function () { /* no-cors: respons tidak terbaca, verifikasi di bawah */ })
          .then(function () { verifyRsvp(name, 0); });
      })
      .catch(function () {
        setBusy(false);
        setError("Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.");
      });
  });

  function verifyRsvp(name, attempt) {
    setTimeout(function () {
      fetchStatus(name).then(function (s) {
        if (s && s.rsvp) {
          setBusy(false);
          showThanks(name);
          loadWishes();
        } else if (attempt < 3) {
          verifyRsvp(name, attempt + 1);
        } else {
          setBusy(false);
          setError("Konfirmasi belum tercatat. Silakan tekan Kirim Konfirmasi sekali lagi.");
        }
      }).catch(function () {
        if (attempt < 3) verifyRsvp(name, attempt + 1);
        else { setBusy(false); setError("Tidak bisa memverifikasi konfirmasi. Cek koneksi lalu coba lagi."); }
      });
    }, 2000);
  }

  /* ---------- Backend (Google Apps Script) ----------
     Apps Script tidak mendukung CORS preflight untuk POST dari browser,
     jadi POST memakai mode:"no-cors". Responsnya tidak bisa dibaca, karena itu
     keberhasilannya diverifikasi lewat GET ?action=status. */
  function sendToSheet(payload) {
    if (!CONFIG.scriptURL) return Promise.reject(new Error("scriptURL belum diisi di js/config.js"));
    const body = Object.assign({}, payload, { token: CONFIG.submitToken || "" });
    return fetch(CONFIG.scriptURL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(body)
    });
  }

  /* ---------- Dinding ucapan: statistik + halaman ---------- */
  let wishesData = [];
  let wishesPage = 1;

  function loadWishes() {
    if (!CONFIG.scriptURL) {
      document.getElementById("wishesList").innerHTML =
        '<p class="wishes-empty">Ucapan akan tampil di sini setelah backend RSVP disambungkan (lihat README).</p>';
      return;
    }
    fetch(CONFIG.scriptURL + "?action=list")
      .then(function (res) { return res.json(); })
      .then(function (data) {
        wishesData = Array.isArray(data) ? data : [];
        updateStats(wishesData);
        renderWishesPage();
      })
      .catch(function () {
        document.getElementById("wishesList").innerHTML =
          '<p class="wishes-empty">Gagal memuat ucapan. Coba muat ulang halaman.</p>';
      });
  }

  function updateStats(data) {
    let hadir = 0, tidak = 0, ragu = 0;
    data.forEach(function (row) {
      const a = (row.attend || "").toLowerCase();
      if (a.indexOf("tidak") > -1) tidak++;
      else if (a.indexOf("ragu") > -1) ragu++;
      else if (a.indexOf("hadir") > -1) hadir++;
    });
    document.getElementById("statHadir").textContent = hadir;
    document.getElementById("statTidak").textContent = tidak;
    document.getElementById("statRagu").textContent = ragu;
  }

  function renderWishesPage() {
    const list = document.getElementById("wishesList");
    const pagination = document.getElementById("wishesPagination");
    const perPage = CONFIG.wishesPerPage || 10;
    const reversed = wishesData.slice().reverse();
    const totalPages = Math.max(Math.ceil(reversed.length / perPage), 1);
    if (wishesPage > totalPages) wishesPage = totalPages;

    if (!reversed.length) {
      list.innerHTML = '<p class="wishes-empty">Jadilah yang pertama memberi ucapan &amp; doa.</p>';
      pagination.classList.add("hidden");
      return;
    }

    const start = (wishesPage - 1) * perPage;
    const pageItems = reversed.slice(start, start + perPage);

    list.innerHTML = pageItems.map(function (row) {
      return (
        '<div class="wish-item">' +
          '<p class="wish-name">' + escapeHtml(row.name) + '</p>' +
          '<span class="wish-status">' + escapeHtml(row.attend) + '</span>' +
          '<p class="wish-msg">' + escapeHtml(row.message) + '</p>' +
        '</div>'
      );
    }).join("");

    if (reversed.length > perPage) {
      pagination.classList.remove("hidden");
      document.getElementById("wishesPageInfo").textContent = wishesPage + " / " + totalPages;
      document.getElementById("wishesPrev").disabled = wishesPage <= 1;
      document.getElementById("wishesNext").disabled = wishesPage >= totalPages;
    } else {
      pagination.classList.add("hidden");
    }
  }

  document.getElementById("wishesPrev").addEventListener("click", function () {
    if (wishesPage > 1) { wishesPage--; renderWishesPage(); }
  });
  document.getElementById("wishesNext").addEventListener("click", function () {
    wishesPage++; renderWishesPage();
  });

  function escapeHtml(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- Footer iklan ---------- */
  const footerAdBtn = document.getElementById("footerAdBtn");
  footerAdBtn.addEventListener("click", function (e) {
    e.preventDefault();
    const text = encodeURIComponent("Halo, saya tertarik order undangan digital seperti punya Alfa & Lenny.");
    window.open("https://wa.me/" + CONFIG.footerAdWhatsApp + "?text=" + text, "_blank");
  });

})();
