// "Hikâye" sekmesi: kitap fotoğrafından 9:16 sosyal medya görseli üretir.
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const W = 1080, H = 1920;
  const SERIF = '"Fraunces", Georgia, "Times New Roman", serif';
  const SANS = '"Outfit", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  const EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

  // Durum temaları (renkler paletteki tonların açık tonları)
  const ST = {
    basladim: { pill: 'Yeni bir kitaba başladım', icon: '🌱', stickers: ['🌱', '✨', '📖'], accent: '#4fb8b2', name: 'basladim' },
    okuyorum: { pill: 'Şu an okuyorum', icon: '📖', stickers: ['🌙', '☕', '✨'], accent: '#e8ae66', name: 'okuyorum' },
    bitirdim: { pill: 'Bu kitabı bitirdim', icon: '✅', stickers: ['🎉', '🤍', '✨'], accent: '#de7fa4', name: 'bitirdim' }
  };

  let status = 'basladim', layout = 'safe', file = null, imgEl = null, result = null, blobUrl = '', lastBlob = null, busy = false;
  const SA = window.SA, MAXQ = 3;
  let picked = [], customs = [], pickables = [], redrawT = 0;

  const toast = m => { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 2200); };

  // ---------- sekmeler ----------
  function setTab(name) {
    $('#tab-quotes').hidden = name !== 'quotes';
    $('#tab-story').hidden = name !== 'story';
    document.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
    try { history.replaceState(null, '', name === 'story' ? '#hikaye' : location.pathname); } catch (e) { /* önemsiz */ }
    scrollTo({ top: 0 });
  }
  document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
  if (location.hash === '#hikaye') setTab('story');

  // ---------- fotoğraf ----------
  function loadImage(f) {
    return new Promise((ok, no) => {
      const u = URL.createObjectURL(f), i = new Image();
      i.onload = () => ok({ i, u }); i.onerror = () => no(new Error('Fotoğraf okunamadı'));
      i.src = u;
    });
  }
  $('#sfile').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const { i, u } = await loadImage(f);
      file = f; imgEl = i; result = null; lastBlob = null;
      $('#spreview').src = u; $('#spreview').hidden = false;
      $('#sLabel').textContent = 'Başka fotoğraf seç';
      $('#sout').innerHTML = '';
      await generate(); // fotoğraf yeterli: görsel hemen hazırlanır
      autoIdentify(f);  // arka planda kitabı tanı; tanırsa kitap adı ve havuz alıntıları otomatik eklenir
    } catch (err) { toast(err.message); }
  });

  async function autoIdentify(f) {
    if ($('#stitle').value.trim() || !SA.identifyFile) return;
    try {
      const r = await SA.identifyFile(f);
      if (!r || file !== f || $('#stitle').value.trim()) return; // başka fotoğraf seçildi ya da kullanıcı kendi yazdı
      $('#stitle').value = r.title; $('#sauthor').value = r.author || '';
      picked = []; renderPicker(true); queueRedraw(); toast('Kitap tanındı: ' + r.title);
    } catch (e) { /* sessiz: kullanıcı kitap adını elle yazabilir */ }
  }

  $('#sStatus').addEventListener('click', e => {
    const b = e.target.closest('[data-st]'); if (!b) return;
    status = b.dataset.st;
    document.querySelectorAll('#sStatus .cchip').forEach(c => c.classList.toggle('on', c === b));
    if (result && imgEl) draw();
  });

  $('#sLayout').addEventListener('click', e => {
    const b = e.target.closest('[data-ly]'); if (!b) return;
    layout = b.dataset.ly;
    document.querySelectorAll('#sLayout .cchip').forEach(c => c.classList.toggle('on', c === b));
    if (result && imgEl) draw();
  });

  // ---------- kitap ve alıntı seçimi (yapay zekâ yok, havuzdan) ----------
  const cleanQ = q => String(q).replace(/\s*\n\s*/g, ' / ').trim();
  function matchedBook() {
    const t = SA.norm($('#stitle').value); if (!t) return null; const a = SA.norm($('#sauthor').value);
    return SA.library().find(b => SA.norm(b.t) === t && (!a || SA.norm(b.a) === a)) || null;
  }
  function renderPicker(autoSelect) {
    const b = matchedBook(), title = $('#stitle').value.trim();
    pickables = [];
    if (b) b.cats.forEach((arr, i) => arr.forEach(x => pickables.push({ q: cleanQ(x.q), cat: i })));
    const valid = new Set([...pickables.map(p => p.q), ...customs]);
    picked = picked.filter(q => valid.has(q));
    if (autoSelect && !picked.length) { // her kategoriden birer alıntı, en fazla 3
      const seen = new Set();
      for (const p of pickables) { if (picked.length >= MAXQ) break; if (!seen.has(p.cat)) { seen.add(p.cat); picked.push(p.q); } }
      for (const p of pickables) { if (picked.length >= MAXQ) break; if (!picked.includes(p.q)) picked.push(p.q); }
    }
    let html = '';
    if (!title) html = '<div class="none">İstersen kitap adını yaz, havuzdaki alıntılar burada listelensin. Ya da aşağıya kendi cümleni yaz. İkisi de isteğe bağlı.</div>';
    else if (!pickables.length) html = '<div class="none">Bu kitap havuzda yok. İstersen aşağıya kitaptan bir cümle yazıp ekleyebilirsin.</div>';
    SA.CATS.forEach((name, ci) => {
      const items = pickables.map((p, idx) => ({ ...p, idx })).filter(p => p.cat === ci);
      if (!items.length) return;
      html += `<div class="pcat c${ci}">${esc(name)}</div>` + items.map(p => `<button class="pq ${picked.includes(p.q) ? 'on' : ''}" data-pq="${p.idx}"><i></i><span>${esc(p.q)}</span></button>`).join('');
    });
    if (customs.length) html += '<div class="pcat">Senin cümlelerin</div>' + customs.map((q, k) => `<div class="pqrow"><button class="pq ${picked.includes(q) ? 'on' : ''}" data-pc="${k}"><i></i><span>${esc(q)}</span></button><button class="pqx" data-pcx="${k}" aria-label="Sil">✕</button></div>`).join('');
    $('#spick').innerHTML = html;
    $('#spick').dataset.n = picked.length;
  }
  function queueRedraw() { clearTimeout(redrawT); if (result && imgEl) redrawT = setTimeout(() => { buildResult(); if (result) draw(); }, 250); }
  function togglePick(q) {
    const i = picked.indexOf(q);
    if (i >= 0) picked.splice(i, 1);
    else { if (picked.length >= MAXQ) return toast('En fazla 3 alıntı seçebilirsin.'); picked.push(q); }
    renderPicker(false); queueRedraw();
  }

  $('#spick').addEventListener('click', e => {
    const pq = e.target.closest('[data-pq]'), pc = e.target.closest('[data-pc]'), px = e.target.closest('[data-pcx]');
    if (pq) togglePick(pickables[+pq.dataset.pq].q);
    else if (pc) togglePick(customs[+pc.dataset.pc]);
    else if (px) { const q = customs.splice(+px.dataset.pcx, 1)[0]; picked = picked.filter(x => x !== q); renderPicker(false); queueRedraw(); }
  });
  $('#saddc').addEventListener('click', () => {
    const q = cleanQ($('#scustom').value).slice(0, 220); if (!q) return toast('Önce cümleyi yaz.');
    if (!customs.includes(q)) customs.push(q);
    if (picked.length < MAXQ && !picked.includes(q)) picked.push(q);
    $('#scustom').value = ''; renderPicker(false); queueRedraw(); toast('Eklendi ✓');
  });

  // Kitap adı önerileri
  $('#stitle').addEventListener('input', () => {
    const text = $('#stitle').value.trim();
    const list = text ? SA.find(text).filter(b => SA.norm(b.t) !== SA.norm(text)).slice(0, 5) : [];
    $('#ssug').innerHTML = list.map(b => `<button class="srow" data-spk="${esc(b.key)}"><b>${esc(b.t)}</b><small>${esc(b.a)}${b.a ? ' · ' : ''}${SA.count(b)} alıntı</small></button>`).join('');
    const exact = SA.library().filter(b => SA.norm(b.t) === SA.norm(text));
    if (exact.length === 1 && !$('#sauthor').value.trim()) $('#sauthor').value = exact[0].a;
    renderPicker(true); queueRedraw();
  });
  $('#sauthor').addEventListener('input', () => { renderPicker(true); queueRedraw(); });
  $('#ssug').addEventListener('click', e => {
    const b = e.target.closest('[data-spk]'); if (!b) return;
    const bk = SA.library().find(x => x.key === b.dataset.spk); if (!bk) return;
    $('#stitle').value = bk.t; $('#sauthor').value = bk.a; $('#ssug').innerHTML = '';
    picked = []; renderPicker(true); queueRedraw();
  });

  // sonucu oluştur (hazırla düğmesi ve yeniden çizim için ortak)
  function buildResult() {
    const b = matchedBook(), title = $('#stitle').value.trim();
    if (!imgEl) { toast('Önce kitabın fotoğrafını yükle.'); return null; }
    // Kitap adı ve alıntı isteğe bağlı: yoksa yalnızca fotoğraf + durum etiketi çizilir
    result = { title: b ? b.t : title, author: b ? b.a : $('#sauthor').value.trim(), quotes: picked.slice() };
    return result;
  }
  async function generate() {
    if (busy) return;
    if (!buildResult()) { result = null; return; }
    busy = true; $('#sgo').disabled = true;
    try { await draw(); $('#sout').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    catch (e) { $('#sout').innerHTML = `<div class="status">${esc(e.message)}</div>`; }
    finally { busy = false; $('#sgo').disabled = false; }
  }

  // ---------- çizim yardımcıları ----------
  function rr(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function wrap(c, text, maxW) {
    const lines = []; let line = '';
    for (const w of text.split(/\s+/)) {
      const t = line ? line + ' ' + w : w;
      if (c.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
    }
    if (line) lines.push(line);
    return lines;
  }

  // Otomatik düzeltme: seviye (kontrast), gama (parlaklık), doygunluk. Gölgeler ezilmez.
  function enhance(c, w, h) {
    const id = c.getImageData(0, 0, w, h), d = id.data;
    const hist = new Uint32Array(256); let n = 0, sum = 0;
    for (let i = 0; i < d.length; i += 16) {
      const y = (d[i] * 54 + d[i + 1] * 183 + d[i + 2] * 19) >> 8; hist[y]++; n++; sum += y;
    }
    const pct = p => { let a = 0; for (let v = 0; v < 256; v++) { a += hist[v]; if (a >= n * p) return v; } return 255; };
    let lo = Math.min(pct(0.01), 18), hi = Math.max(pct(0.99), 205);
    if (hi - lo < 60) { lo = Math.max(0, lo - 15); hi = Math.min(255, hi + 15); }
    const meanS = Math.min(0.9, Math.max(0.1, (sum / n - lo) / (hi - lo)));
    const gamma = Math.min(1.45, Math.max(0.55, Math.log(0.5) / Math.log(meanS)));
    const lut = new Uint8ClampedArray(256);
    for (let v = 0; v < 256; v++) {
      let x = Math.min(1, Math.max(0, (v - lo) / (hi - lo)));
      x = Math.pow(x, gamma);
      x = x * 0.92 + 0.08 * (x * x * (3 - 2 * x));
      lut[v] = x * 255;
    }
    const SAT = 1.14;
    for (let i = 0; i < d.length; i += 4) {
      const r = lut[d[i]], g = lut[d[i + 1]], b = lut[d[i + 2]], y = 0.299 * r + 0.587 * g + 0.114 * b;
      d[i] = y + (r - y) * SAT; d[i + 1] = y + (g - y) * SAT; d[i + 2] = y + (b - y) * SAT;
    }
    c.putImageData(id, 0, 0);
  }

  // Fotoğrafı (w×h) hazırla: cover=true kırpar, false bütün olarak sığdırır
  function preparePhoto(w, h, cover) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const c = cv.getContext('2d', { willReadFrequently: true });
    c.imageSmoothingQuality = 'high';
    const iw = imgEl.naturalWidth, ih = imgEl.naturalHeight;
    const s = cover ? Math.max(w / iw, h / ih) : Math.min(w / iw, h / ih);
    c.fillStyle = '#0e0f1a'; c.fillRect(0, 0, w, h);
    c.drawImage(imgEl, (w - iw * s) / 2, (h - ih * s) / 2, iw * s, ih * s);
    enhance(c, w, h);
    return cv;
  }

  // Bulanık arka plan (ctx.filter gerektirmez, her tarayıcıda çalışır)
  function blurBackground(c, src) {
    const step = (from, w, h) => { const t = document.createElement('canvas'); t.width = w; t.height = h; const x = t.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(from, 0, 0, w, h); return t; };
    const s = Math.max(24 / src.width, 43 / src.height);
    const t1 = document.createElement('canvas'); t1.width = 24; t1.height = 43; const x1 = t1.getContext('2d');
    x1.drawImage(src, (24 - src.width * s) / 2, (43 - src.height * s) / 2, src.width * s, src.height * s);
    const t2 = step(t1, 96, 172), t3 = step(t2, 384, 683);
    c.imageSmoothingQuality = 'high'; c.drawImage(t3, 0, 0, W, H);
    c.fillStyle = 'rgba(10,10,28,.5)'; c.fillRect(0, 0, W, H);
    const g = c.createRadialGradient(W / 2, H * 0.4, 100, W / 2, H * 0.4, H * 0.75); g.addColorStop(0, 'rgba(255,255,255,.07)'); g.addColorStop(1, 'rgba(0,0,0,.28)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }

  function drawRibbon(c, th) {
    c.save(); c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 24; c.fillStyle = th.accent; c.beginPath();
    c.moveTo(886, 0); c.lineTo(954, 0); c.lineTo(954, 214); c.lineTo(920, 178); c.lineTo(886, 214); c.closePath(); c.fill(); c.restore();
  }
  function drawPill(c, th, py) {
    c.font = `600 36px ${SANS}`;
    const tw = c.measureText(th.pill).width, pw = 44 + 48 + 14 + tw + 44, ph = 94, px = (W - pw) / 2;
    c.save(); c.shadowColor = th.accent; c.shadowBlur = 36; rr(c, px, py, pw, ph, ph / 2); c.fillStyle = 'rgba(14,14,32,.42)'; c.fill(); c.restore();
    rr(c, px, py, pw, ph, ph / 2); c.strokeStyle = th.accent; c.lineWidth = 3; c.stroke();
    c.textBaseline = 'middle'; c.textAlign = 'left';
    c.font = `40px ${EMOJI}`; c.fillStyle = '#fff'; c.fillText(th.icon, px + 40, py + ph / 2 + 2);
    c.font = `600 36px ${SANS}`; c.fillText(th.pill, px + 44 + 48 + 14, py + ph / 2 + 1);
    return { x: px, y: py, w: pw, h: ph };
  }

  // Alıntı kutularını ölç (çizmeden)
  function measureQuotes(c, qs, startSize, maxW) {
    return qs.map(q => {
      let size = startSize, lines;
      c.font = `italic 400 ${size}px ${SERIF}`; lines = wrap(c, q, maxW);
      while (lines.length > 5 && size > 26) { size -= 2; c.font = `italic 400 ${size}px ${SERIF}`; lines = wrap(c, q, maxW); }
      const lh = size * 1.36, tw = Math.max(...lines.map(l => c.measureText(l).width));
      return { lines, size, lh, w: 92 + tw + 36, h: 30 * 2 + lines.length * lh };
    });
  }
  function drawQuoteBox(c, b, x, y, th, sticker, left) {
    c.save(); c.shadowColor = 'rgba(0,0,0,.38)'; c.shadowBlur = 30; c.shadowOffsetY = 8; rr(c, x, y, b.w, b.h, 34); c.fillStyle = 'rgba(14,14,32,.46)'; c.fill(); c.restore();
    const hg = c.createLinearGradient(0, y, 0, y + b.h); hg.addColorStop(0, 'rgba(255,255,255,.16)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
    rr(c, x, y, b.w, b.h, 34); c.fillStyle = hg; c.fill(); c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 2; c.stroke();
    c.textBaseline = 'alphabetic'; c.textAlign = 'left'; c.font = `700 80px ${SERIF}`; c.fillStyle = th.accent; c.fillText('“', x + 26, y + 30 + 60);
    c.font = `italic 400 ${b.size}px ${SERIF}`; c.fillStyle = '#fff';
    c.save(); c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 8;
    b.lines.forEach((l, k) => c.fillText(l, x + 92, y + 30 + b.size + k * b.lh)); c.restore();
    c.textBaseline = 'middle'; c.textAlign = 'center'; c.font = `46px ${EMOJI}`;
    c.save(); c.translate(left ? x + b.w - 30 : x + 30, y - 4); c.rotate(left ? 0.14 : -0.14); c.fillText(sticker, 0, 0); c.restore();
  }

  // ---- Düzen 1: "Kitap açıkta" — fotoğraf bütün, alıntılar altta; hiçbir şey kitabı kapatmaz ----
  function drawSafe(c, res, th) {
    const qs = (res.quotes || []).slice(0, 3), n = qs.length;
    const hasHead = !!(res.title || res.author);
    const GAP = 22, BOTTOM = 1716, CARD_TOP = hasHead ? 478 : 372, MIN_H = 640, SIDE = 60;
    let size = 33, boxes = [], stackH = 0;
    for (;;) {
      boxes = measureQuotes(c, qs, size, 740);
      stackH = boxes.reduce((a, b) => a + b.h, 0) + GAP * Math.max(0, n - 1);
      if (!n || BOTTOM - stackH - 40 - CARD_TOP >= MIN_H || size <= 26) break;
      size -= 2;
    }
    const stackTop = n ? BOTTOM - stackH : BOTTOM;
    const maxH = stackTop - (n ? 44 : 0) - CARD_TOP, maxW = W - SIDE * 2;
    const iw = imgEl.naturalWidth, ih = imgEl.naturalHeight, sc = Math.min(maxW / iw, maxH / ih);
    const cw = Math.max(200, Math.round(iw * sc)), ch = Math.max(200, Math.round(ih * sc));
    const photo = preparePhoto(cw, ch, false);
    blurBackground(c, photo);
    drawRibbon(c, th);
    drawPill(c, th, 208);

    // Kitap adı ve yazar (üstte, ortalı); ikisi de boşsa çizilmez
    if (hasHead) {
      c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      let ty = 384;
      if (res.title) {
        let ts = 52; c.font = `700 ${ts}px ${SANS}`;
        let tl = wrap(c, res.title, 900);
        if (tl.length > 1) { ts = 42; c.font = `700 ${ts}px ${SANS}`; tl = wrap(c, res.title, 900).slice(0, 2); }
        c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 14; c.fillStyle = '#fff';
        tl.forEach((l, k) => c.fillText(l, W / 2, 384 + k * ts * 1.15)); c.restore();
        ty = 384 + (tl.length - 1) * ts * 1.15 + 44;
      }
      if (res.author) { c.font = `500 30px ${SANS}`; c.fillStyle = 'rgba(255,255,255,.82)'; c.fillText(res.author, W / 2, ty); }
    }

    // Fotoğraf kartı
    // Kart + alıntılar tek grup olarak dikeyde ortalanır (yatay fotoğrafta boşluk kalmaz)
    const groupH = ch + (n ? 44 + stackH : 0);
    const cx = Math.round((W - cw) / 2), cy = Math.round(CARD_TOP + Math.max(0, (BOTTOM - CARD_TOP - groupH) / 2));
    c.save(); c.shadowColor = th.accent; c.shadowBlur = 60; rr(c, cx, cy, cw, ch, 34); c.fillStyle = '#000'; c.fill(); c.restore();
    c.save(); rr(c, cx, cy, cw, ch, 34); c.clip(); c.drawImage(photo, cx, cy); c.restore();
    rr(c, cx, cy, cw, ch, 34); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 3; c.stroke();
    // Kartın köşelerine yarım taşan iki emoji (kitabı kapatmaz)
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `58px ${EMOJI}`;
    c.save(); c.translate(cx + 6, cy + 6); c.rotate(-0.2); c.fillText(th.stickers[0], 0, 0); c.restore();
    c.save(); c.translate(cx + cw - 6, cy + ch - 6); c.rotate(0.2); c.fillText(th.stickers[1], 0, 0); c.restore();

    // Alıntılar (kartın altında)
    let y = cy + ch + 44; const rects = [];
    boxes.forEach((b, i) => {
      const left = i % 2 === 0, x = left ? SIDE : W - SIDE - b.w;
      drawQuoteBox(c, b, x, y, th, th.stickers[(i + 2) % th.stickers.length], left);
      rects.push({ x, y, w: b.w, h: b.h }); y += b.h + GAP;
    });
    c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.font = `500 22px ${SANS}`; c.fillStyle = 'rgba(255,255,255,.45)'; c.fillText('Satır Arası ile hazırlandı', W / 2, 1768);
    return { card: { x: cx, y: cy, w: cw, h: ch }, boxes: rects };
  }

  // ---- Düzen 2: "Tam ekran" — fotoğraf tüm alanı kaplar, alıntılar üstüne biner ----
  function drawFull(c, res, th) {
    const photo = preparePhoto(W, H, true); c.drawImage(photo, 0, 0);
    let g = c.createRadialGradient(W / 2, H / 2, H * 0.22, W / 2, H / 2, H * 0.78);
    g.addColorStop(0, 'rgba(8,8,22,0)'); g.addColorStop(1, 'rgba(8,8,22,.26)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    g = c.createLinearGradient(0, 0, 0, 520); g.addColorStop(0, 'rgba(8,8,22,.32)'); g.addColorStop(1, 'rgba(8,8,22,0)'); c.fillStyle = g; c.fillRect(0, 0, W, 520);
    g = c.createLinearGradient(0, 860, 0, H); g.addColorStop(0, 'rgba(8,8,22,0)'); g.addColorStop(1, 'rgba(8,8,22,.5)'); c.fillStyle = g; c.fillRect(0, 860, W, H - 860);
    drawRibbon(c, th); drawPill(c, th, 262);
    const qs = (res.quotes || []).slice(0, 3), boxes = measureQuotes(c, qs, 36, 580), gap = 28;
    const total = boxes.reduce((a, b) => a + b.h, 0) + gap * Math.max(0, boxes.length - 1);
    let y = Math.max(560, 1510 - total); const rects = [];
    boxes.forEach((b, i) => {
      const left = i % 2 === 0, x = left ? 84 : W - 84 - b.w;
      drawQuoteBox(c, b, x, y, th, th.stickers[i % th.stickers.length], left); rects.push({ x, y, w: b.w, h: b.h }); y += b.h + gap;
    });
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    if (res.title || res.author) {
      let size = 54, tl = [];
      if (res.title) {
        c.font = `700 ${size}px ${SANS}`; tl = wrap(c, res.title, 880);
        if (tl.length > 1) { size = 44; c.font = `700 ${size}px ${SANS}`; tl = wrap(c, res.title, 880).slice(0, 2); }
      }
      const fy = 1568, blockH = (tl.length ? tl.length * size * 1.2 : 0) + 44 + 30;
      c.fillStyle = th.accent; rr(c, 84, fy - (tl.length ? size : 34), 7, blockH, 4); c.fill();
      c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 14; c.fillStyle = '#fff'; c.font = `700 ${size}px ${SANS}`;
      tl.forEach((l, k) => c.fillText(l, 114, fy + k * size * 1.2)); c.restore();
      const ay = tl.length ? fy + (tl.length - 1) * size * 1.2 + 46 : fy;
      if (res.author) { c.font = `500 32px ${SANS}`; c.fillStyle = 'rgba(255,255,255,.86)'; c.fillText(res.author, 114, ay); }
      c.font = `500 24px ${SANS}`; c.fillStyle = 'rgba(255,255,255,.5)'; c.fillText('Satır Arası ile hazırlandı', 114, ay + 40);
    } else {
      c.font = `500 24px ${SANS}`; c.fillStyle = 'rgba(255,255,255,.55)'; c.fillText('Satır Arası ile hazırlandı', 84, 1640);
    }
    return { card: { x: 0, y: 0, w: W, h: H }, boxes: rects };
  }

  async function fontsReady() {
    if (!document.fonts || !document.fonts.load) return;
    try {
      await Promise.race([
        Promise.all([document.fonts.load(`italic 400 40px ${SERIF}`), document.fonts.load(`700 40px ${SANS}`), document.fonts.load(`600 36px ${SANS}`)]),
        new Promise(r => setTimeout(r, 1500))
      ]);
    } catch (e) { /* yedek yazı tipi */ }
  }

  async function draw() {
    await fontsReady();
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    window.__story.lastLayout = (layout === 'full' ? drawFull : drawSafe)(c, result, ST[status]);
    const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.93));
    if (!blob) throw new Error('Görsel oluşturulamadı.');
    lastBlob = blob; if (blobUrl) URL.revokeObjectURL(blobUrl); blobUrl = URL.createObjectURL(blob);
    const canShare = !!(navigator.canShare && navigator.canShare({ files: [new File([blob], 'x.jpg', { type: 'image/jpeg' })] }));
    $('#sout').innerHTML = `<div class="sresult">
      <div class="preview"><img src="${blobUrl}" alt="Hazırlanan hikâye görseli"></div>
      <div class="sactions">
        <button class="btn main" data-sdl>⬇️ Görseli indir</button>
        ${canShare ? '<button class="btn" data-sshare>📤 Paylaş</button>' : ''}
        <button class="btn" data-sedit ${canShare ? '' : 'style="grid-column:1/-1"'}>✏️ Alıntıları değiştir</button>
      </div>
      <p class="snote">Durumu, düzeni ya da alıntıları değiştirirsen görsel anında yenilenir. iPhone'da indirme olmazsa görsele uzun basıp "Fotoğraflara Ekle"yi seç.</p>
    </div>`;
  }

  const ascii = t => String(t || '').toLocaleLowerCase('tr').replace(/[ığüşöç]/g, ch => ({ 'ı': 'i', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c' }[ch])).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const fname = () => `satir-arasi-${ST[status].name}-${ascii(result.title).slice(0, 40) || 'gorsel'}.jpg`;

  $('#sout').addEventListener('click', async e => {
    if (e.target.closest('[data-sdl]') && lastBlob) {
      const a = document.createElement('a'); a.href = blobUrl; a.download = fname(); document.body.appendChild(a); a.click(); a.remove();
      toast('Görsel indiriliyor…');
    } else if (e.target.closest('[data-sshare]') && lastBlob) {
      try { await navigator.share({ files: [new File([lastBlob], fname(), { type: 'image/jpeg' })], title: result.title }); }
      catch (err) { if (err.name !== 'AbortError') toast('Paylaşılamadı, indirmeyi dene.'); }
    } else if (e.target.closest('[data-sedit]')) $('#spick').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  $('#sgo').addEventListener('click', () => generate());
  renderPicker(false);

  // Test için dışarı açılan küçük yardımcı
  window.__story = { W, H, lastLayout: null };
})();
