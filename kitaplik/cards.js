// Paylaşım kartları motoru: gerçek kapak + yazar portresi + hareketli arka plan.
// Aynı sahne üç şeyi üretir: canlı önizleme, sabit görsel (JPG), kısa video. Tasarla ile Tasarım sekmesine de aktarılır.
(() => {
  'use strict';
  const W = 1080, H = 1920, ACC = '#e8ae66', PINK = '#f6b3cc';
  const nk = s => window.SA.norm(s);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const api = () => window.__studioApi;
  const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const hash = s => [...String(s)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  function rng(seed) { let a = hash(seed); return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const fmtDay = ts => new Date(ts).toLocaleDateString('tr', { day: 'numeric', month: 'long', year: 'numeric' });
  const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);

  // ---------- gerçek kapak / yazar portresi ----------
  const CK = 'sa.cov'; let cov = {};
  try { cov = JSON.parse(localStorage.getItem(CK)) || {}; } catch (e) { cov = {}; }
  function persist() {
    const ks = Object.keys(cov); if (ks.length > 80) ks.sort((a, b) => cov[a].at - cov[b].at).slice(0, ks.length - 80).forEach(k => delete cov[k]);
    try { localStorage.setItem(CK, JSON.stringify(cov)); }
    catch (e) { try { Object.keys(cov).sort((a, b) => cov[a].at - cov[b].at).slice(0, 30).forEach(k => delete cov[k]); localStorage.setItem(CK, JSON.stringify(cov)); } catch (e2) { /* dolu */ } }
  }
  let active = 0; const waiters = [];
  const slot = () => new Promise(ok => { if (active < 3) { active++; ok(); } else waiters.push(ok); });
  const free = () => { const n = waiters.shift(); if (n) n(); else active--; };
  function shrink(blob, maxH) {
    return new Promise((ok, no) => {
      const u = URL.createObjectURL(blob), i = new Image();
      i.onload = () => { const k = Math.min(1, maxH / i.naturalHeight), c = document.createElement('canvas'); c.width = Math.round(i.naturalWidth * k); c.height = Math.round(i.naturalHeight * k); c.getContext('2d').drawImage(i, 0, 0, c.width, c.height); URL.revokeObjectURL(u); ok(c.toDataURL('image/jpeg', 0.82)); };
      i.onerror = () => { URL.revokeObjectURL(u); no(new Error('img')); }; i.src = u;
    });
  }
  const pend = new Map(), DAY3 = 3 * 864e5;
  // Küçük kapak (liste/raf için), telefonda saklanır. Bulunamazsa '' döner.
  function getCover(title, author) {
    if (!title) return Promise.resolve('');
    const k = nk(title) + '|' + nk(author), e = cov[k];
    if (e && (e.u || Date.now() - e.at < DAY3)) return Promise.resolve(e.u || '');
    if (pend.has(k)) return pend.get(k);
    const p = (async () => {
      await slot();
      try {
        const r = await fetch(`/api/cover?t=${encodeURIComponent(title)}&a=${encodeURIComponent(author || '')}`);
        if (r.status === 404) { cov[k] = { u: '', at: Date.now() }; persist(); return ''; }
        if (!r.ok) throw new Error('http');
        const u = await shrink(await r.blob(), 240); cov[k] = { u, at: Date.now() }; persist(); return u;
      } catch (e2) { cov[k] = { u: '', at: Date.now() - DAY3 + 10 * 60e3 }; return ''; } // ağ hatası: 10 dk sonra tekrar dene
      finally { free(); pend.delete(k); }
    })();
    pend.set(k, p); return p;
  }
  const loadImg = src => new Promise(ok => { if (!src) return ok(null); const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
  async function fetchImg(url) {
    try { const r = await fetch(url); if (!r.ok) return null; const u = URL.createObjectURL(await r.blob()); const i = await loadImg(u); return i; } catch (e) { return null; }
  }
  const bigMem = new Map(), porMem = new Map();
  // Kartlar için büyük kapak: sunucudan (tarayıcı önbelleğinden) tam boy; olmazsa küçük kayıt
  async function coverBig(book) {
    const k = nk(book.title) + '|' + nk(book.author);
    if (!bigMem.has(k)) bigMem.set(k, (async () => { const i = await fetchImg(`/api/cover?t=${encodeURIComponent(book.title)}&a=${encodeURIComponent(book.author || '')}`); return i || loadImg((cov[k] && cov[k].u) || book.thumb || ''); })());
    return bigMem.get(k);
  }
  function getPortrait(name) {
    name = String(name || '').trim(); if (!name) return Promise.resolve(null);
    const k = nk(name); if (!porMem.has(k)) porMem.set(k, fetchImg(`/api/portrait?name=${encodeURIComponent(name)}`)); return porMem.get(k);
  }
  // [data-ct] işaretli öğelere gerçek kapağı yerleştirir (<img>, .cover ya da başka kutu)
  function hydrate(root = document) {
    root.querySelectorAll('[data-ct]:not([data-cd])').forEach(el => {
      el.setAttribute('data-cd', '1');
      getCover(el.dataset.ct, el.dataset.ca).then(u => {
        if (!u || !el.isConnected) return;
        if (el.tagName === 'IMG') { el.src = u; el.hidden = false; el.parentNode.classList.add('hascv'); }
        else { if (el.classList.contains('cover')) el.classList.add('real'); el.innerHTML = `<img src="${u}" alt="">`; }
      });
    });
  }

  // ---------- çizim parçaları ----------
  const PALS = [
    { base: ['#0f1226', '#1c1840', '#2a1a45'], blobs: ['95,99,214', '196,103,140', '63,157,152'] },
    { base: ['#0c1b26', '#0f3345', '#1a4d54'], blobs: ['63,157,152', '95,99,214', '217,154,82'] },
    { base: ['#1a1117', '#331a28', '#4d2236'], blobs: ['196,103,140', '217,154,82', '141,99,204'] },
    { base: ['#12100e', '#27201a', '#40301f'], blobs: ['217,154,82', '196,103,140', '63,157,152'] }
  ];
  function mesh(x, T, pal) {
    const g = x.createLinearGradient(0, 0, W * 0.5, H); g.addColorStop(0, pal.base[0]); g.addColorStop(0.55, pal.base[1]); g.addColorStop(1, pal.base[2]); x.fillStyle = g; x.fillRect(0, 0, W, H);
    pal.blobs.forEach((c, i) => {
      const cx = W * (0.5 + 0.45 * Math.sin(T * 0.35 + i * 2.1)), cy = H * (0.2 + 0.3 * i + 0.08 * Math.cos(T * 0.3 + i)), rg = x.createRadialGradient(cx, cy, 0, cx, cy, 720);
      rg.addColorStop(0, `rgba(${c},.4)`); rg.addColorStop(1, `rgba(${c},0)`); x.fillStyle = rg; x.fillRect(0, 0, W, H);
    });
  }
  function bokeh(x, T, seed, n = 30) {
    const r = rng(seed); x.save(); x.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const bx = r() * W + Math.sin(T * 0.4 + i) * 16, sp = 16 + r() * 38, by = (((r() * H - T * sp) % H) + H) % H, rad = 8 + r() * 26, al = (0.07 + 0.13 * r()) * (0.65 + 0.35 * Math.sin(T * 1.2 + r() * 6));
      const rg = x.createRadialGradient(bx, by, 0, bx, by, rad); rg.addColorStop(0, `rgba(255,236,204,${al})`); rg.addColorStop(1, 'rgba(255,236,204,0)'); x.fillStyle = rg; x.beginPath(); x.arc(bx, by, rad, 0, 7); x.fill();
    }
    x.restore();
  }
  const scratch = {};
  function portrait(x, img, a, T, res, k) {
    const key = res; let s = scratch[key]; if (!s) { s = scratch[key] = document.createElement('canvas'); s.width = Math.round(W * res); s.height = Math.round(H * res); }
    const c = s.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, s.width, s.height); c.scale(res, res);
    const zoom = 1.06 + 0.05 * (0.5 - 0.5 * Math.cos(T * 0.45)), sc = Math.max(W / img.naturalWidth, H / img.naturalHeight) * zoom, dw = img.naturalWidth * sc, dh = img.naturalHeight * sc;
    c.drawImage(img, (W - dw) / 2 + Math.sin(T * 0.3) * 14, -(dh - H) * 0.2, dw, dh);
    c.globalCompositeOperation = 'saturation'; c.fillStyle = 'rgba(128,128,128,.85)'; c.fillRect(0, 0, W, H);          // siyah-beyaz'a yakın
    c.globalCompositeOperation = 'multiply'; const tg = c.createLinearGradient(0, 0, W, H); tg.addColorStop(0, '#8f94f2'); tg.addColorStop(1, '#e58bb0'); c.fillStyle = tg; c.fillRect(0, 0, W, H);   // renk tonu
    c.globalCompositeOperation = 'source-over';
    x.save(); x.globalAlpha = ease(a) * k; x.drawImage(s, 0, 0, W, H); x.restore();
  }
  function shades(x, top, bottomFrom) {
    let g = x.createLinearGradient(0, 0, 0, 520); g.addColorStop(0, `rgba(8,8,22,${top})`); g.addColorStop(1, 'rgba(8,8,22,0)'); x.fillStyle = g; x.fillRect(0, 0, W, 520);
    g = x.createLinearGradient(0, bottomFrom, 0, H); g.addColorStop(0, 'rgba(8,8,22,0)'); g.addColorStop(0.45, 'rgba(8,8,22,.82)'); g.addColorStop(1, 'rgba(8,8,22,.94)'); x.fillStyle = g; x.fillRect(0, bottomFrom, W, H - bottomFrom);
  }
  function rrect(x, px, py, w, h, r) { x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r); x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath(); }
  const CVP = [['#5f63d6', '#8d63cc'], ['#8d63cc', '#c4678c'], ['#c4678c', '#d99a52'], ['#3f9d98', '#5f63d6'], ['#d99a52', '#3f9d98']];
  // Kapak: gerçek görsel; hiç bulunamazsa sade bir yer tutucu. p: giriş animasyonu 0..1
  function cover(x, img, book, cx, cy, w, h, rot, p) {
    const e = ease(p); if (e <= 0) return;
    x.save(); x.globalAlpha = e; x.translate(cx, cy + (1 - e) * 70); x.rotate(rot * Math.PI / 180); x.scale(0.94 + 0.06 * e, 0.94 + 0.06 * e);
    const r = Math.max(6, w * 0.035), px = -w / 2, py = -h / 2;
    x.save(); x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = 40; x.shadowOffsetY = 16; rrect(x, px, py, w, h, r); x.fillStyle = '#111'; x.fill(); x.restore();
    x.save(); rrect(x, px, py, w, h, r); x.clip();
    if (img) { const s = Math.max(w / img.naturalWidth, h / img.naturalHeight); x.drawImage(img, -img.naturalWidth * s / 2, -img.naturalHeight * s / 2, img.naturalWidth * s, img.naturalHeight * s); }
    else {
      const pl = CVP[hash(book.title) % 5], g = x.createLinearGradient(px, py, px + w, py + h); g.addColorStop(0, pl[0]); g.addColorStop(1, pl[1]); x.fillStyle = g; x.fillRect(px, py, w, h);
      x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; const fs = Math.round(w * 0.11); x.font = `700 ${fs}px Outfit, system-ui, sans-serif`;
      const lines = []; let ln = ''; book.title.split(/\s+/).forEach(wd => { const t = ln ? ln + ' ' + wd : wd; if (x.measureText(t).width > w * 0.78 && ln) { lines.push(ln); ln = wd; } else ln = t; }); lines.push(ln);
      lines.slice(0, 5).forEach((l, i, arr) => x.fillText(l, 0, -((arr.length - 1) * fs * 1.2) / 2 + i * fs * 1.2));
    }
    const sp = x.createLinearGradient(px, 0, px + w * 0.12, 0); sp.addColorStop(0, 'rgba(0,0,0,.35)'); sp.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = sp; x.fillRect(px, py, w, h);   // sırt gölgesi
    const gl = x.createLinearGradient(px, py, px + w, py + h); gl.addColorStop(0, 'rgba(255,255,255,.16)'); gl.addColorStop(0.4, 'rgba(255,255,255,0)'); x.fillStyle = gl; x.fillRect(px, py, w, h);
    x.restore(); rrect(x, px, py, w, h, r); x.strokeStyle = 'rgba(255,255,255,.22)'; x.lineWidth = 2; x.stroke(); x.restore();
  }

  // ---------- yazı katmanları (Tasarım sekmesinde düzenlenebilir) ----------
  const base = { type: 'text', rot: 0, italic: false, bold: false, color: '#ffffff', align: 'center', w: 80, lh: 130, box: false, boxColor: '#0e0e20', boxA: 46, boxPad: 30, shadow: true, shB: 10, font: 'Outfit', fx: 0.5, fy: 0.5 };
  const T = (text, size, o = {}) => ({ ...base, text, size, ...o });
  const meas = L => api().measureLayer(L);
  function stackLeft(items, x, centerY, gap) { const ms = items.map(meas), total = ms.reduce((a, m) => a + m.hh * 2, 0) + gap * (items.length - 1); let y = centerY - total / 2; items.forEach((L, i) => { L.align = 'left'; L.fx = (x + ms[i].hw) / W; L.fy = (y + ms[i].hh) / H; y += ms[i].hh * 2 + gap; }); }
  function stackLeftTop(items, x, top, gap) { const ms = items.map(meas); let y = top; items.forEach((L, i) => { L.align = 'left'; L.fx = (x + ms[i].hw) / W; L.fy = (y + ms[i].hh) / H; y += ms[i].hh * 2 + gap; }); }
  function stackCenter(items, top, gap) { let y = top; items.forEach(L => { const m = meas(L); L.fx = 0.5; L.fy = (y + m.hh) / H; y += m.hh * 2 + gap; }); }
  const mark = () => (window.LIB ? window.LIB.markLayer(0.955) : { type: 'lotus', wm: true, size: 112, rot: 0, color: '#ffffff', alpha: 80, shadow: true, shB: 8, fx: 0.5, fy: 0.955 });

  // ---------- sahneler ----------
  // 1) Bitirdim: yazar portresi, küçük gerçek kapak, başlık
  async function sceneDone(b) {
    const [img, por] = await Promise.all([coverBig(b), getPortrait(b.author)]), pal = PALS[hash(b.title) % 4];
    const kick = T('BİTİRDİM ✅', 40, { bold: true, color: PINK, g: 1 }), date = T(fmtDay(b.done || Date.now()), 32, { color: '#dfe2ef', g: 1, shadow: false });
    const right = [kick, date]; if (b.rating) right.push(T(stars(b.rating), 52, { color: ACC, g: 1, shadow: false }));
    if (b.note) right.push(T(`“${b.note.slice(0, 140)}”`, 38, { font: 'Fraunces', italic: true, w: 42, color: '#eef0fa', g: 1 }));
    let tsize = 92; const mkT = s => T(b.title, s, { font: 'Playfair Display', bold: true, w: 84, lh: 112, g: 2 });
    let title = mkT(tsize); const author = b.author ? T(b.author, 42, { color: '#e6e8f2', g: 3, shadow: false }) : null;
    const layers = [...right, title, ...(author ? [author] : [])]; await api().fontsFor(layers);
    while (meas(title).th / (title.size * 1.12) > 2.1 && tsize > 60) { tsize -= 8; layers[layers.indexOf(title)] = title = mkT(tsize); await api().fontsFor([title]); }
    stackLeft(right, 470, 1010, 16); stackLeftTop([title, ...(author ? [author] : [])], 96, 1335, 14);
    const m = mark(); m.g = 4; layers.push(m);
    return mk('done', layers, (x, a, T0, res) => {
      mesh(x, T0, pal); if (por) portrait(x, por, a, T0, res, 0.92); shades(x, 0.4, 620); bokeh(x, T0, b.title, 26);
      cover(x, img, b, 261, 1010, 330, 495, -2, (a - 0.05) / 0.45);
    });
  }
  // 2) Aylık özet: dağınık gerçek kapaklar, dev ay numarası, portre
  async function sceneMonth(y, m, books) {
    const bs = books.slice().sort((a, b) => a.done - b.done), n = Math.min(bs.length, 6), imgs = await Promise.all(bs.slice(0, n).map(coverBig));
    const pal = PALS[(y * 12 + m) % 4], last = bs[bs.length - 1], por = await getPortrait(last.author);
    let slots, cw, ch;
    if (n === 1) { cw = 440; ch = 660; slots = [[540, 1010, 0]]; }
    else if (n === 2) { cw = 360; ch = 540; slots = [[320, 1000, -3], [760, 1050, 3]]; }
    else if (n <= 4) { cw = 300; ch = 450; slots = [[310, 830, -3.5], [770, 790, 3], [300, 1300, 3], [780, 1260, -3]]; }
    else { cw = 270; ch = 405; slots = [[200, 830, -3], [540, 790, 2.5], [880, 830, -2], [200, 1290, 2.5], [540, 1250, -2.5], [880, 1290, 3]]; }
    const head = [T('AYLIK OKUMA ÖZETİ', 34, { bold: true, color: ACC, fy: 215 / H, g: 0 }), T(MONTHS[m], 150, { font: 'Playfair Display', bold: true, fy: 345 / H, g: 0 }), T(String(y), 44, { color: '#dfe2ef', fy: 470 / H, g: 0, shadow: false })];
    const foot = [T(`${bs.length} kitap${bs.length > n ? ` · +${bs.length - n} daha` : ''}`, 48, { color: '#eef0fa', g: 1 })];
    const best = bs.filter(b => b.rating >= 4).sort((a, b) => b.rating - a.rating)[0]; if (best) foot.push(T(`En çok sevdiğim: ${best.title}`, 34, { color: '#cfd3e6', w: 86, g: 1, shadow: false }));
    const layers = [...head, ...foot]; await api().fontsFor(layers); stackCenter(foot, Math.max(slots.reduce((a, s) => Math.max(a, s[1] + ch / 2), 0) + 60, 1560), 14);
    const mm = mark(); mm.g = 2; layers.push(mm);
    const num = String(m + 1).padStart(2, '0');
    return mk('month', layers, (x, a, T0, res) => {
      mesh(x, T0, pal); if (por) portrait(x, por, a, T0, res, 0.5); shades(x, 0.35, 900);
      x.save(); x.globalAlpha = ease(a) * 0.9; x.font = '700 760px "Playfair Display", Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 3; x.strokeStyle = 'rgba(255,255,255,.11)'; x.strokeText(num, W / 2, 640 + Math.sin(T0 * 0.5) * 8); x.restore();
      bokeh(x, T0, 'm' + m, 28);
      for (let i = 0; i < n; i++) cover(x, imgs[i], bs[i], slots[i][0], slots[i][1] + Math.sin(T0 * 0.9 + i * 1.7) * 6, cw, ch, slots[i][2], (a - 0.08 - i * 0.07) / 0.4);
    });
  }
  // 3) Yılın kitapları: numaralı liste, gerçek kapaklar
  async function sceneYear(y, all) {
    const top = all.slice().sort((a, b) => (b.rating - a.rating) || (a.done - b.done)).slice(0, 5), imgs = await Promise.all(top.map(coverBig)), pal = PALS[(y + 1) % 4], por = await getPortrait(top[0].author);
    const layers = [T('YILIN KİTAPLARI', 34, { bold: true, color: ACC, fy: 215 / H, g: 0 }), T(String(y), 150, { font: 'Playfair Display', bold: true, fy: 345 / H, g: 0 }), T(`${all.length} kitap okudum${all.length > 5 ? ' · en sevdiklerim' : ''}`, 38, { color: '#dfe2ef', fy: 465 / H, g: 0, shadow: false })];
    const rows = top.map((b, i) => [T(b.title, 38, { bold: true, w: 50, g: i + 1 }), ...(b.author ? [T(b.author, 28, { color: '#cfd3e6', w: 50, g: i + 1, shadow: false })] : []), ...(b.rating ? [T(stars(b.rating), 32, { color: ACC, w: 50, g: i + 1, shadow: false })] : [])]);
    const nums = top.map((b, i) => T(String(i + 1).padStart(2, '0'), 78, { font: 'Playfair Display', italic: true, color: ACC, g: i + 1, w: 20 }));
    layers.push(...rows.flat(), ...nums); await api().fontsFor(layers);
    const n = top.length, rh = n >= 5 ? 214 : n === 4 ? 240 : n === 3 ? 280 : n === 2 ? 330 : 380, ch = Math.min(rh * 0.93, 330), cw = Math.round(ch * 2 / 3), y0 = 640 + (1070 - n * rh) / 2, cy = i => y0 + rh * (i + 0.5), tx = 205 + cw + 40;
    rows.forEach((r, i) => { stackLeft(r, tx, cy(i), 8); nums[i].align = 'center'; nums[i].fx = 130 / W; nums[i].fy = cy(i) / H; });
    const mm = mark(); mm.g = 6; layers.push(mm);
    return mk('year', layers, (x, a, T0, res) => {
      mesh(x, T0, pal); if (por) portrait(x, por, a, T0, res, 0.55); shades(x, 0.35, 760); bokeh(x, T0, 'y' + y, 28);
      for (let i = 0; i < top.length; i++) { const p = ease((a - 0.1 - i * 0.09) / 0.4); cover(x, imgs[i], top[i], 205 + cw / 2 + (1 - p) * 120, cy(i) + Math.sin(T0 * 0.8 + i) * 3, cw, ch, 0, p); }
    });
  }

  // ---------- sahne nesnesi, oynatıcı, dışa aktarma ----------
  function groupsFor(layers, res) {
    const by = new Map(); layers.forEach(L => { const g = L.g || 0; if (!by.has(g)) by.set(g, []); by.get(g).push(L); });
    return [...by.entries()].sort((a, b) => a[0] - b[0]).map(([g, ls]) => {
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      ls.forEach(L => { const m = meas(L), r = L.rot ? Math.hypot(m.hw, m.hh) : 0, hw = (r || m.hw) + 90, hh = (r || m.hh) + 90, cx = L.fx * W, cy = L.fy * H; x0 = Math.min(x0, cx - hw); x1 = Math.max(x1, cx + hw); y0 = Math.min(y0, cy - hh); y1 = Math.max(y1, cy + hh); });
      x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(W, Math.ceil(x1)); y1 = Math.min(H, Math.ceil(y1));
      const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil((x1 - x0) * res)); cv.height = Math.max(1, Math.ceil((y1 - y0) * res));
      const c = cv.getContext('2d'); c.scale(res, res); c.translate(-x0, -y0); api().paint(c, ls); return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, cv };
    });
  }
  function mk(kind, layers, draw) {
    const memo = {};
    const sc = { kind, layers, draw, groups: res => memo[res] || (memo[res] = groupsFor(layers, res)),
      frame(x, a, T0, res) { x.save(); x.scale(res, res); draw(x, a, T0, res); const gs = sc.groups(res), N = gs.length; gs.forEach((g, i) => { const p = ease((a - 0.12 - 0.5 * i / Math.max(1, N)) / 0.32); if (p <= 0) return; x.globalAlpha = p; x.drawImage(g.cv, g.x, g.y + (1 - p) * 38, g.w, g.h); }); x.restore(); },
      bgFinal() { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); draw(x, 1, 3, 1); return c; } };
    return sc;
  }
  async function build(kind, arg) {
    if (!api()) throw new Error('Tasarım aracı yüklenemedi, sayfayı yenile.');
    if (kind === 'done') return sceneDone(arg);
    if (kind === 'month') return sceneMonth(arg.y, arg.m, arg.books);
    return sceneYear(arg.y, arg.books);
  }
  function play(scene, canvas) {
    const res = canvas.width / W, ctx = canvas.getContext('2d'), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; let t0 = performance.now(), stop = false;
    const loop = now => { if (stop || !canvas.isConnected) return; const el = now - t0; ctx.clearRect(0, 0, canvas.width, canvas.height); scene.frame(ctx, reduce ? 1 : clamp(el / 2600, 0, 1), reduce ? 3 : el / 1000, res); requestAnimationFrame(loop); };
    requestAnimationFrame(loop); return { replay() { t0 = performance.now(); }, stop() { stop = true; } };
  }
  function still(scene) {
    const c = document.createElement('canvas'); c.width = W; c.height = H; scene.frame(c.getContext('2d'), 1, 3, 1);
    return new Promise((ok, no) => c.toBlob(b => b ? ok(b) : no(new Error('Görsel oluşturulamadı.')), 'image/jpeg', 0.93));
  }
  const MIMES = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  const videoMime = () => { try { return (window.MediaRecorder && HTMLCanvasElement.prototype.captureStream && MIMES.find(t => MediaRecorder.isTypeSupported(t))) || ''; } catch (e) { return ''; } };
  function record(scene, onProgress, ms = 6000) {
    return new Promise((ok, no) => {
      const mime = videoMime(); if (!mime) return no(new Error('Bu tarayıcı video kaydını desteklemiyor.'));
      const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), chunks = [];
      let rec; try { rec = new MediaRecorder(c.captureStream(30), { mimeType: mime, videoBitsPerSecond: 7e6 }); } catch (e) { return no(e); }
      rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onerror = e => no(e.error || new Error('Kayıt hatası'));
      rec.onstop = () => { const blob = new Blob(chunks, { type: mime.split(';')[0] }); blob.size ? ok({ blob, ext: mime.startsWith('video/mp4') ? 'mp4' : 'webm' }) : no(new Error('Video boş çıktı')); };
      const t0 = performance.now(); rec.start(250);
      const loop = now => { const el = now - t0; x.clearRect(0, 0, W, H); scene.frame(x, clamp(el / 2600, 0, 1), el / 1000, 1); if (onProgress) onProgress(clamp(el / ms, 0, 1)); if (el >= ms) { rec.stop(); return; } requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    });
  }

  window.CARDS = { build, play, still, record, videoMime, getCover, getPortrait, hydrate };
  hydrate(); // sayfa açılırken zaten çizilmiş öğeler (günün kitabı) için
})();
