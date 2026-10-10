// "Tasarım" sekmesi: kitap kapağı olmadan, arka plan seçip alıntı görseli tasarlama.
// Canvas tabanlı: sürükle / iki parmakla büyüt-küçült-döndür, yazı tipi, renk önerisi, kutu/gölge, kaydet.
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const toast = m => { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 2200); };

  const FORMATS = { story: { w: 1080, h: 1920 }, post: { w: 1080, h: 1080 }, portrait: { w: 1080, h: 1350 } };
  const FONTS = [
    { id: 'Playfair Display', label: 'Playfair', fb: 'Georgia, serif' },
    { id: 'Cormorant Garamond', label: 'Cormorant', fb: 'Georgia, serif' },
    { id: 'EB Garamond', label: 'Garamond', fb: 'Georgia, serif' },
    { id: 'Lora', label: 'Lora', fb: 'Georgia, serif' },
    { id: 'Libre Baskerville', label: 'Baskerville', fb: 'Georgia, serif' },
    { id: 'Crimson Pro', label: 'Crimson', fb: 'Georgia, serif' },
    { id: 'DM Serif Display', label: 'Gösterişli', fb: 'Georgia, serif' },
    { id: 'Fraunces', label: 'Fraunces', fb: 'Georgia, serif' },
    { id: 'Courier Prime', label: 'Daktilo', fb: '"Courier New", monospace' },
    { id: 'Dancing Script', label: 'El yazısı', fb: 'cursive' },
    { id: 'Caveat', label: 'Not defteri', fb: 'cursive' },
    { id: 'Outfit', label: 'Modern', fb: 'system-ui, sans-serif' }
  ];
  const SOLIDS = [['Krem', '#f4ecd8'], ['Parşömen', '#e6d5ad'], ['Beyaz', '#fbfaf7'], ['Mürekkep', '#14110f'], ['Gece', '#0e1424'], ['Bordo', '#5a1f2b'], ['Orman', '#1f3a2e'], ['Adaçayı', '#a9b8a0'], ['Gül kurusu', '#d9a5a0'], ['Hardal', '#d9a441'], ['Lavanta', '#b9a9d6'], ['Toprak', '#b5654a'], ['Deniz', '#1d4e5f'], ['Gri', '#8d8a86']];
  const GRADS = [
    { id: 'gunbatimi', name: 'Gün batımı', a: 160, s: ['#ff9a8b', '#d0587f', '#6a3d9a'] },
    { id: 'geceyarisi', name: 'Gece yarısı', a: 170, s: ['#0f1530', '#1f2a5a', '#4a3d8f'] },
    { id: 'orman', name: 'Orman sisi', a: 165, s: ['#cfe3d0', '#6f9a82', '#1f3a2e'] },
    { id: 'roze', name: 'Gül altını', a: 150, s: ['#f7d6c9', '#e4a9a0', '#b9707a'] },
    { id: 'okyanus', name: 'Okyanus', a: 175, s: ['#a8e0e0', '#2f7f95', '#0e2f4a'] },
    { id: 'lavanta', name: 'Lavanta', a: 155, s: ['#e9defa', '#b7a2e6', '#6b55b0'] },
    { id: 'seftali', name: 'Şeftali', a: 140, s: ['#ffe6c7', '#ffb08a', '#ee7f7f'] },
    { id: 'kahve', name: 'Kahve', a: 165, s: ['#e7d2b5', '#9a6b47', '#3b2417'] },
    { id: 'aurora', name: 'Aurora', a: 160, s: ['#27324f', '#3f9d98', '#8d63cc'] },
    { id: 'sis', name: 'Gri sis', a: 170, s: ['#eceff1', '#aab4bd', '#5e6a75'] },
    { id: 'col', name: 'Çöl', a: 150, s: ['#f6e0b5', '#d99a52', '#9a4d3a'] },
    { id: 'murekkep', name: 'Mürekkep', a: 170, s: ['#1b1b2a', '#101018', '#050508'] }
  ];
  const TEXTURES = [
    { id: 'kagit', name: 'Kâğıt', base: '#f1e7d0', acc: '#b9a67a' },
    { id: 'cizgili', name: 'Çizgili defter', base: '#f7f1e1', acc: '#7fa6d6' },
    { id: 'kareli', name: 'Kareli', base: '#f4f1ea', acc: '#9aa7b8' },
    { id: 'noktali', name: 'Noktalı', base: '#1d1a2b', acc: '#c9b8ff' },
    { id: 'yildiz', name: 'Yıldızlı gece', base: '#0b1026', acc: '#ffffff' },
    { id: 'bokeh', name: 'Bokeh', base: '#2b1d4a', acc: '#ffcf99' },
    { id: 'kemer', name: 'Kemerler', base: '#ead9c5', acc: '#c1785b' },
    { id: 'dalga', name: 'Dalgalar', base: '#16324a', acc: '#4aa3a0' },
    { id: 'film', name: 'Eski film', base: '#1a1714', acc: '#8a7a63' }
  ];

  // ---------- renk yardımcıları ----------
  const hex2rgb = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const rgb2hex = (r, g, b) => '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  const rgba = (hex, a) => { const [r, g, b] = hex2rgb(hex); return `rgba(${r},${g},${b},${a})`; };
  const lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const relLum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const contrast = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
    if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
    return [h, s, l];
  }
  function hsl2hex(h, s, l) {
    h = ((h % 360) + 360) % 360; const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2; let r = 0, g = 0, b = 0;
    if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0]; else if (h < 180) [r, g, b] = [0, c, x]; else if (h < 240) [r, g, b] = [0, x, c]; else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
    return rgb2hex((r + m) * 255, (g + m) * 255, (b + m) * 255);
  }
  const hexLum = hex => relLum(...hex2rgb(hex));

  // ---------- durum ----------
  const fresh = () => ({ format: 'story', bg: { kind: 'gradient', id: 'gunbatimi', color: '#f4ecd8', tex: 'kagit', dim: 0, fit: 'cover' }, layers: [], sel: null, seq: 0 });
  let S = fresh(), photoData = '', photoImg = null, photoVer = 0, curId = null, curName = '', dirty = false;
  let history = [], base = JSON.stringify(S), PAL = [], lastStyle = { font: 'Playfair Display', italic: true, bold: false, shadow: true, shB: 18, box: false, boxColor: '#000000', boxA: 40, boxPad: 36, align: 'center', w: 80, lh: 135 };
  const cv = $('#stCanvas'), cx = cv.getContext('2d');
  const mc = document.createElement('canvas').getContext('2d');
  const byId = id => S.layers.find(l => l.id === id) || null;
  const sel = () => byId(S.sel);
  const W = () => FORMATS[S.format].w, H = () => FORMATS[S.format].h;

  // geri alma: her anlamlı değişiklikten sonra çağrılır
  function commit() { const snap = JSON.stringify(S); if (snap === base) return; history.push(base); if (history.length > 40) history.shift(); base = snap; dirty = true; }
  function undo() {
    if (!history.length) return toast('Geri alınacak bir şey yok.');
    S = JSON.parse(history.pop()); base = JSON.stringify(S); dirty = true; applyAll();
  }

  // ---------- yazı tipleri ----------
  const fontOf = id => FONTS.find(f => f.id === id) || FONTS[0];
  const EMO = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"';
  const fontStr = (L, size = L.size) => `${L.italic ? 'italic ' : ''}${L.bold ? 700 : 400} ${size}px "${fontOf(L.font).id}", ${fontOf(L.font).fb}, ${EMO}`;
  const isIcon = L => L && (L.type === 'ribbon' || L.type === 'lotus');
  const isMark = L => !!(L && (L.wm || L.type === 'lotus'));
  const isText = L => !isIcon(L) && !L.wm;
  function loadFont(L) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.race([document.fonts.load(fontStr(L, 40), 'Aİıİşğ'), new Promise(r => setTimeout(r, 1800))]).catch(() => {});
  }
  async function preloadFonts() {
    if (!document.fonts || !document.fonts.load) return;
    const jobs = FONTS.flatMap(f => [document.fonts.load(`400 40px "${f.id}"`, 'Aİı'), document.fonts.load(`italic 400 40px "${f.id}"`, 'Aİı')]);
    await Promise.race([Promise.allSettled(jobs), new Promise(r => setTimeout(r, 2500))]); render();
  }

  // ---------- arka plan ----------
  function rng(seed) { let a = 0; for (const ch of String(seed)) a = (a * 31 + ch.charCodeAt(0)) >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function linGrad(c, w, h, ang, stops) {
    const r = ang * Math.PI / 180, len = Math.abs(w * Math.sin(r)) + Math.abs(h * Math.cos(r)), dx = Math.sin(r) * len / 2, dy = -Math.cos(r) * len / 2;
    const g = c.createLinearGradient(w / 2 - dx, h / 2 - dy, w / 2 + dx, h / 2 + dy); stops.forEach((col, i) => g.addColorStop(i / (stops.length - 1), col)); return g;
  }
  function vignette(c, w, h, a) { const g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`); c.fillStyle = g; c.fillRect(0, 0, w, h); }
  function grain(c, w, h, acc, n, a, seed) { const r = rng(seed); c.fillStyle = rgba(acc, a); for (let i = 0; i < n; i++) c.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
  function drawTexture(c, w, h, t) {
    const r = rng(t.id); c.fillStyle = t.base; c.fillRect(0, 0, w, h);
    if (t.id === 'kagit' || t.id === 'cizgili' || t.id === 'kareli') {
      grain(c, w, h, t.acc, Math.round(w * h / 260), 0.1, t.id); vignette(c, w, h, 0.16);
      if (t.id === 'cizgili') { c.fillStyle = rgba(t.acc, 0.55); for (let y = 200; y < h; y += 66) c.fillRect(0, y, w, 2); c.fillStyle = 'rgba(205,85,85,.45)'; c.fillRect(120, 0, 3, h); }
      if (t.id === 'kareli') { c.fillStyle = rgba(t.acc, 0.3); for (let x = 0; x < w; x += 54) c.fillRect(x, 0, 1.5, h); for (let y = 0; y < h; y += 54) c.fillRect(0, y, w, 1.5); }
    } else if (t.id === 'noktali') {
      c.fillStyle = rgba(t.acc, 0.4); for (let y = 40; y < h; y += 60) for (let x = 40; x < w; x += 60) { c.beginPath(); c.arc(x, y, 3, 0, 7); c.fill(); } vignette(c, w, h, 0.3);
    } else if (t.id === 'yildiz') {
      c.fillStyle = linGrad(c, w, h, 180, ['#0b1026', '#1b1f4a', '#3a2a63']); c.fillRect(0, 0, w, h);
      for (let i = 0; i < 280; i++) { const x = r() * w, y = r() * h, s = r(); c.fillStyle = `rgba(255,255,255,${0.25 + s * 0.7})`; c.beginPath(); c.arc(x, y, 0.8 + s * 2.2, 0, 7); c.fill(); }
      for (let i = 0; i < 7; i++) { const x = r() * w, y = r() * h, g = c.createRadialGradient(x, y, 0, x, y, 28); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(x - 28, y - 28, 56, 56); }
    } else if (t.id === 'bokeh') {
      c.fillStyle = linGrad(c, w, h, 160, ['#3a2766', '#2b1d4a', '#16102a']); c.fillRect(0, 0, w, h);
      for (let i = 0; i < 38; i++) { const x = r() * w, y = r() * h, rad = 40 + r() * 150, g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, rgba(t.acc, 0.2 + r() * 0.18)); g.addColorStop(0.75, rgba(t.acc, 0.08)); g.addColorStop(1, rgba(t.acc, 0)); c.fillStyle = g; c.beginPath(); c.arc(x, y, rad, 0, 7); c.fill(); }
    } else if (t.id === 'kemer') {
      grain(c, w, h, '#8a6a4a', Math.round(w * h / 400), 0.07, 'k');
      const sun = c.createRadialGradient(w * 0.7, h * 0.28, 0, w * 0.7, h * 0.28, w * 0.2); sun.addColorStop(0, rgba(t.acc, 0.55)); sun.addColorStop(1, rgba(t.acc, 0)); c.fillStyle = sun; c.fillRect(0, 0, w, h);
      const arches = [[0.1, 0.56, 0.4, 0.35], [0.32, 0.46, 0.36, 0.5], [0.58, 0.52, 0.34, 0.45]];
      arches.forEach(([ax, ay, aw, al], i) => { const x = ax * w, y = ay * h, ww = aw * w; c.fillStyle = rgba(t.acc, al); c.beginPath(); c.moveTo(x, h); c.lineTo(x, y + ww / 2); c.arc(x + ww / 2, y + ww / 2, ww / 2, Math.PI, 0); c.lineTo(x + ww, h); c.closePath(); c.fill(); });
    } else if (t.id === 'dalga') {
      c.fillStyle = linGrad(c, w, h, 180, ['#16324a', '#0f2236']); c.fillRect(0, 0, w, h);
      for (let k = 0; k < 6; k++) { const base0 = h * (0.55 + k * 0.08), amp = 40 + k * 8, f = 0.004 + k * 0.0008, ph = r() * 6; c.fillStyle = rgba(t.acc, 0.1 + k * 0.07); c.beginPath(); c.moveTo(0, h); for (let x = 0; x <= w; x += 8) c.lineTo(x, base0 + Math.sin(x * f * 6 + ph) * amp); c.lineTo(w, h); c.closePath(); c.fill(); }
    } else if (t.id === 'film') {
      grain(c, w, h, '#ffffff', Math.round(w * h / 90), 0.06, 'f'); grain(c, w, h, '#000000', Math.round(w * h / 90), 0.1, 'g'); vignette(c, w, h, 0.55);
      const lk = c.createLinearGradient(0, 0, w * 0.4, 0); lk.addColorStop(0, rgba('#d9803c', 0.28)); lk.addColorStop(1, rgba('#d9803c', 0)); c.fillStyle = lk; c.fillRect(0, 0, w, h);
    }
  }
  function buildBg() {
    const w = W(), h = H(), cvs = document.createElement('canvas'); cvs.width = w; cvs.height = h; const c = cvs.getContext('2d'), b = S.bg;
    if (b.kind === 'solid') { c.fillStyle = b.color; c.fillRect(0, 0, w, h); }
    else if (b.kind === 'gradient') { const g = GRADS.find(x => x.id === b.id) || GRADS[0]; c.fillStyle = linGrad(c, w, h, g.a, g.s); c.fillRect(0, 0, w, h); }
    else if (b.kind === 'texture') drawTexture(c, w, h, TEXTURES.find(x => x.id === b.tex) || TEXTURES[0]);
    else if (b.kind === 'photo') {
      c.fillStyle = '#17171f'; c.fillRect(0, 0, w, h);
      if (photoImg) {
        const iw = photoImg.naturalWidth, ih = photoImg.naturalHeight; c.imageSmoothingQuality = 'high';
        if (b.fit === 'contain') { // bulanık zemin + bütün fotoğraf
          const t1 = document.createElement('canvas'); t1.width = 24; t1.height = Math.max(24, Math.round(24 * h / w)); const k = Math.max(t1.width / iw, t1.height / ih);
          t1.getContext('2d').drawImage(photoImg, (t1.width - iw * k) / 2, (t1.height - ih * k) / 2, iw * k, ih * k);
          const t2 = document.createElement('canvas'); t2.width = 120; t2.height = Math.round(120 * h / w); t2.getContext('2d').drawImage(t1, 0, 0, t2.width, t2.height);
          c.drawImage(t2, 0, 0, w, h); c.fillStyle = 'rgba(8,8,22,.35)'; c.fillRect(0, 0, w, h);
          const s = Math.min(w * 0.88 / iw, h * 0.88 / ih), dw = iw * s, dh = ih * s;
          c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 50; c.fillStyle = '#000'; c.fillRect((w - dw) / 2, (h - dh) / 2, dw, dh); c.restore(); c.drawImage(photoImg, (w - dw) / 2, (h - dh) / 2, dw, dh);
        } else { const s = Math.max(w / iw, h / ih); c.drawImage(photoImg, (w - iw * s) / 2, (h - ih * s) / 2, iw * s, ih * s); }
      } else { c.fillStyle = 'rgba(255,255,255,.35)'; c.font = '600 44px Outfit, sans-serif'; c.textAlign = 'center'; c.fillText('Fotoğraf yükle', w / 2, h / 2); }
    }
    if (b.dim > 0) { c.fillStyle = `rgba(0,0,0,${b.dim / 100})`; c.fillRect(0, 0, w, h); }
    return cvs;
  }
  let bgCanvas = null, bgKey = '';
  function ensureBg() { const key = JSON.stringify([S.format, S.bg, photoVer]); if (key === bgKey && bgCanvas) return false; bgCanvas = buildBg(); bgKey = key; return true; }

  // ---------- renk önerisi: arka planın (ya da kapağın) renklerine uygun yazı renkleri ----------
  function analyze(canvas) {
    const w = 40, h = Math.max(20, Math.round(40 * canvas.height / canvas.width)), t = document.createElement('canvas'); t.width = w; t.height = h;
    const x = t.getContext('2d'); x.drawImage(canvas, 0, 0, w, h); const d = x.getImageData(0, 0, w, h).data, n = w * h, bk = new Map(); let ls = 0;
    for (let i = 0; i < d.length; i += 4) {
      ls += relLum(d[i], d[i + 1], d[i + 2]); const k = ((d[i] >> 5) << 6) | ((d[i + 1] >> 5) << 3) | (d[i + 2] >> 5), e = bk.get(k) || { n: 0, r: 0, g: 0, b: 0 };
      e.n++; e.r += d[i]; e.g += d[i + 1]; e.b += d[i + 2]; bk.set(k, e);
    }
    const sorted = [...bk.values()].sort((a, b) => b.n - a.n).map(e => [e.r / e.n, e.g / e.n, e.b / e.n]), dom = [];
    for (const c of sorted) { if (dom.length >= 3) break; if (dom.every(p => Math.hypot(p[0] - c[0], p[1] - c[1], p[2] - c[2]) > 55)) dom.push(c); }
    return { avg: ls / n, dom };
  }
  function suggest() {
    if (!bgCanvas) return [];
    const { avg, dom } = analyze(bgCanvas), dark = avg < 0.36, cands = [];
    const add = (name, hex, tint) => cands.push({ name, hex, tint });
    add('Krem', '#fff4df'); add('Beyaz', '#ffffff'); add('Mürekkep', '#1b1410'); add('Siyah', '#0c0c0c');
    dom.forEach((c, i) => {
      const [h, s] = rgb2hsl(...c), sat = Math.min(0.6, Math.max(0.18, s));
      add(i === 0 ? 'Ana ton açığı' : 'Ton ' + (i + 1) + ' açık', hsl2hex(h, sat, 0.92), true);
      add(i === 0 ? 'Ana ton koyusu' : 'Ton ' + (i + 1) + ' koyu', hsl2hex(h, Math.min(0.5, sat), 0.12), true);
      if (i === 0) { add('Zıt vurgu', dark ? hsl2hex(h + 180, 0.7, 0.74) : hsl2hex(h + 180, 0.55, 0.26), true); add('Altın vurgu', dark ? '#f0c987' : '#7a4d12', true); }
    });
    const seen = new Set();
    return cands.map(c => ({ ...c, ratio: contrast(hexLum(c.hex), avg) })).filter(c => c.ratio >= 3.2 && !seen.has(c.hex) && seen.add(c.hex))
      .sort((a, b) => (Math.min(b.ratio, 9) + (b.tint ? 2.5 : 0)) - (Math.min(a.ratio, 9) + (a.tint ? 2.5 : 0))).slice(0, 8);
  }
  function refreshPalette() { PAL = suggest(); renderPal(); }

  // ---------- yazı katmanı ----------
  function wrapInto(c, para, maxW, out) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      let w = word;
      while (c.measureText(w).width > maxW && w.length > 1) { // çok uzun kelimeyi böl
        let k = w.length - 1; while (k > 1 && c.measureText(w.slice(0, k)).width > maxW) k--; if (line) { out.push(line); line = ''; } out.push(w.slice(0, k)); w = w.slice(k);
      }
      const t = line ? line + ' ' + w : w;
      if (c.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
    }
    out.push(line);
  }
  function layout(c, L) {
    if (isIcon(L)) { const hh = L.size * window.SH.RATIO[L.type] / 2; return { lines: [], lh: 0, tw: L.size, th: hh * 2, hw: L.size / 2, hh, ex: 0 }; }
    c.font = fontStr(L); const maxW = Math.max(80, L.w / 100 * W()), lines = [];
    String(L.text || '').split('\n').forEach(p => { if (!p.trim()) lines.push(''); else wrapInto(c, p, maxW, lines); });
    if (!lines.length) lines.push('');
    const lh = L.size * L.lh / 100, tw = Math.max(20, ...lines.map(l => c.measureText(l).width)), th = lines.length * lh, pad = L.box ? L.boxPad : 0, ex = L.qm ? Math.round(L.size * 1.7) : 0;
    return { lines, lh, tw, th, hw: tw / 2 + pad + ex / 2, hh: th / 2 + pad, ex };
  }
  function rr(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function drawLayer(c, L) {
    const m = layout(c, L);
    c.save(); c.translate(L.fx * W(), L.fy * H()); c.rotate(L.rot * Math.PI / 180);
    if (isIcon(L)) {
      c.globalAlpha = (L.alpha == null ? 100 : L.alpha) / 100;
      if (L.shadow) { c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = L.shB; }
      if (L.type === 'ribbon') window.SH.ribbon(c, L.size, L.color); else window.SH.lotus(c, L.size, L.color, Math.max(1.6, L.size / 40));
      c.restore(); return;
    }
    if (L.box) {
      const r = L.boxR == null ? 28 : L.boxR;
      c.save(); if (L.bsh) { c.shadowColor = L.brd ? rgba(L.brdC || '#ffffff', 0.55) : 'rgba(0,0,0,.4)'; c.shadowBlur = 30; c.shadowOffsetY = 8; }
      c.fillStyle = rgba(L.boxColor, L.boxA / 100); rr(c, -m.hw, -m.hh, m.hw * 2, m.hh * 2, r); c.fill(); c.restore();
      if (L.brd) { rr(c, -m.hw, -m.hh, m.hw * 2, m.hh * 2, r); c.strokeStyle = L.brdC || '#ffffff'; c.lineWidth = Math.max(2, L.size / 12); c.stroke(); }
    }
    if (L.qm) { c.save(); c.font = `700 ${Math.round(L.size * 2.3)}px "Fraunces", Georgia, serif`; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = L.qmC || '#ffffff'; c.fillText('\u201C', -m.hw + L.size * 0.5, -m.hh + (L.boxPad || 0) + L.size * 1.55); c.restore(); }
    c.font = fontStr(L); c.textBaseline = 'middle'; c.textAlign = L.align; c.fillStyle = L.color;
    if (L.shadow) { c.shadowColor = hexLum(L.color) > 0.45 ? 'rgba(0,0,0,.6)' : 'rgba(255,255,255,.55)'; c.shadowBlur = L.shB; c.shadowOffsetY = L.shB * 0.2; }
    const x = (L.align === 'left' ? -m.tw / 2 : L.align === 'right' ? m.tw / 2 : 0) + m.ex / 2;
    m.lines.forEach((ln, i) => c.fillText(ln, x, -m.th / 2 + m.lh * (i + 0.5)));
    c.restore();
  }
  const uiScale = () => Math.max(1, cv.width / (cv.getBoundingClientRect().width || cv.width));
  const handleLocal = m => ({ x: m.hw + 14, y: m.hh + 14 });
  let guide = { v: false, h: false };
  function drawSel(c, L) {
    const m = layout(mc, L), u = uiScale(), hp = handleLocal(m);
    c.save(); c.translate(L.fx * W(), L.fy * H()); c.rotate(L.rot * Math.PI / 180);
    c.lineWidth = 2.5 * u; c.setLineDash([10 * u, 8 * u]); c.strokeStyle = 'rgba(255,255,255,.9)'; c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 4;
    c.strokeRect(-m.hw - 10, -m.hh - 10, m.hw * 2 + 20, m.hh * 2 + 20); c.setLineDash([]);
    c.beginPath(); c.arc(hp.x, hp.y, 20 * u, 0, 7); c.fillStyle = '#8d63cc'; c.fill(); c.lineWidth = 3 * u; c.strokeStyle = '#fff'; c.stroke();
    c.fillStyle = '#fff'; c.font = `700 ${20 * u}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowBlur = 0; c.fillText('⤡', hp.x, hp.y + 1 * u);
    c.restore();
    if (guide.v || guide.h) { c.save(); c.strokeStyle = 'rgba(255,211,110,.9)'; c.lineWidth = 2 * u; c.setLineDash([14 * u, 10 * u]); if (guide.v) { c.beginPath(); c.moveTo(W() / 2, 0); c.lineTo(W() / 2, H()); c.stroke(); } if (guide.h) { c.beginPath(); c.moveTo(0, H() / 2); c.lineTo(W(), H() / 2); c.stroke(); } c.restore(); }
  }
  function render(ui = true) {
    if (cv.width !== W() || cv.height !== H()) { cv.width = W(); cv.height = H(); }
    if (ensureBg()) refreshPalette();
    cx.clearRect(0, 0, W(), H()); cx.drawImage(bgCanvas, 0, 0);
    S.layers.forEach(L => drawLayer(cx, L));
    if (ui && sel()) drawSel(cx, sel());
  }

  // ---------- katman işlemleri ----------
  function autoSize(t) { const n = String(t).length; return n < 40 ? 84 : n < 90 ? 66 : n < 160 ? 52 : 42; }
  function addLayer(text, opt = {}) {
    const best = PAL[0] ? PAL[0].hex : '#ffffff', n = S.layers.filter(isText).length;
    const L = { id: ++S.seq, text, fx: 0.5, fy: clamp(0.5 + ((n % 5) - 2) * 0.13, 0.12, 0.88), size: autoSize(text), rot: 0, color: lastStyle.color || best, ...lastStyle, ...opt };
    if (!lastStyle.color) L.color = best;
    S.layers.push(L); S.sel = L.id; commit(); loadFont(L).then(() => render()); applyAll(); return L;
  }
  function rememberStyle(L) { if (isIcon(L)) return; const { font, italic, bold, shadow, shB, box, boxColor, boxA, boxPad, align, w, lh, color } = L; lastStyle = { font, italic, bold, shadow, shB, box, boxColor, boxA, boxPad, align, w, lh, color }; }

  // ---------- panel (kontroller) ----------
  const NAMES = { solid: 'Düz renk', gradient: 'Gradyan', texture: 'Doku', photo: 'Fotoğraf' };
  function renderBgGrid() {
    const b = S.bg, g = $('#stBgGrid'); $('#stPhotoBox').hidden = b.kind !== 'photo';
    document.querySelectorAll('#stBgKind .cchip').forEach(c => c.classList.toggle('on', c.dataset.bk === b.kind));
    document.querySelectorAll('#stFit .cchip').forEach(c => c.classList.toggle('on', c.dataset.fit === b.fit));
    if (b.kind === 'solid') g.innerHTML = SOLIDS.map(([n, hx]) => `<button class="sw ${b.color === hx ? 'on' : ''}" style="background:${hx}" data-sc="${hx}" title="${esc(n)}"><span>${esc(n)}</span></button>`).join('') + `<label class="sw" style="display:grid;place-items:center;background:#222"><span>Özel</span><input type="color" id="stBgColor" value="${b.color}" style="position:absolute;inset:0;opacity:0;width:100%;height:100%"></label>`;
    else if (b.kind === 'gradient') g.innerHTML = GRADS.map(x => `<button class="sw ${b.id === x.id ? 'on' : ''}" style="background:linear-gradient(${x.a}deg,${x.s.join(',')})" data-sg="${x.id}" title="${esc(x.name)}"><span>${esc(x.name)}</span></button>`).join('');
    else if (b.kind === 'texture') g.innerHTML = TEXTURES.map(x => `<button class="sw ${b.tex === x.id ? 'on' : ''}" data-st="${x.id}" title="${esc(x.name)}" style="background:${x.base}"><span>${esc(x.name)}</span></button>`).join('');
    else g.innerHTML = '';
    $('#stDim').value = b.dim; $('#stDimO').textContent = b.dim + '%';
  }
  function renderFonts() { $('#stFonts').innerHTML = FONTS.map(f => `<button class="fbtn" data-f="${esc(f.id)}" style="font-family:'${f.id}',${f.fb}">Aa Şş<small>${esc(f.label)}</small></button>`).join(''); }
  function renderPal() {
    const L = sel(), box = $('#stPal'); if (!box) return;
    $('#stPalLabel').textContent = S.bg.kind === 'photo' ? '· kapağa uyumlu öneriler' : '· arka plana uyumlu öneriler';
    box.innerHTML = PAL.map((c, i) => `<button class="sw ${L && L.color.toLowerCase() === c.hex.toLowerCase() ? 'on' : ''} ${i < 2 ? 'best' : ''}" style="background:${c.hex}" data-pc="${c.hex}" title="${esc(c.name)} · kontrast ${c.ratio.toFixed(1)}"><span style="color:${hexLum(c.hex) > 0.5 ? '#111' : '#fff'};background:none;text-shadow:none">${esc(c.name)}</span></button>`).join('');
  }
  function renderLayers() {
    $('#stLayers').innerHTML = S.layers.map((L, i) => `<button class="${L.id === S.sel ? 'on' : ''}" data-l="${L.id}">${i + 1}. ${isMark(L) ? '🪷 Filigran' : L.type === 'ribbon' ? '🔖 Ayraç' : esc(String(L.text).replace(/\s+/g, ' ').slice(0, 14) || '…')}</button>`).join('');
  }
  function syncCtl() {
    const L = sel(); $('#stNoSel').hidden = !!L; $('#stCtl').hidden = !L; renderLayers();
    document.querySelectorAll('#stFormat .cchip').forEach(c => c.classList.toggle('on', c.dataset.sf === S.format));
    if (!L) { renderPal(); return; }
    const ic = isIcon(L);
    document.querySelectorAll('#stCtl .txo, [data-al], #stBold, #stItal').forEach(el => el.hidden = ic);
    if (ic) { const set0 = (id, v, fmt) => { $(id).value = v; $(id + 'O').textContent = fmt(v); }; set0('#stSize', Math.round(L.size), v => v + ' px'); set0('#stRot', Math.round(L.rot), v => v + '°'); $('#stColor').value = /^#[0-9a-f]{6}$/i.test(L.color) ? L.color : '#ffffff'; $('#stShadow').checked = !!L.shadow; $('#stShCtl').hidden = !L.shadow; $('#stShB').value = L.shB; $('#stShBO').textContent = L.shB; renderPal(); return; }
    if (document.activeElement !== $('#stTxt')) $('#stTxt').value = L.text;
    document.querySelectorAll('#stFonts .fbtn').forEach(b => b.classList.toggle('on', b.dataset.f === L.font));
    const set = (id, v, fmt) => { $(id).value = v; $(id + 'O').textContent = fmt ? fmt(v) : v; };
    set('#stSize', Math.round(L.size), v => v + ' px'); set('#stRot', Math.round(L.rot), v => v + '°'); set('#stW', Math.round(L.w), v => v + '%'); set('#stLh', Math.round(L.lh), v => (v / 100).toFixed(2));
    document.querySelectorAll('[data-al]').forEach(b => b.classList.toggle('on', b.dataset.al === L.align));
    $('#stBold').classList.toggle('on', !!L.bold); $('#stItal').classList.toggle('on', !!L.italic);
    $('#stColor').value = /^#[0-9a-f]{6}$/i.test(L.color) ? L.color : '#ffffff';
    $('#stBox').checked = !!L.box; $('#stBoxCtl').hidden = !L.box; $('#stBoxC').value = L.boxColor; set('#stBoxA', L.boxA, v => v + '%'); set('#stBoxP', L.boxPad, v => v + ' px'); set('#stBoxR', L.boxR == null ? 28 : L.boxR, v => v);
    $('#stBoxSh').checked = !!L.bsh; $('#stBrd').checked = !!L.brd; $('#stBrdC').value = L.brdC || '#4fb8b2'; $('#stQm').checked = !!L.qm; $('#stQmC').value = L.qmC || '#4fb8b2';
    $('#stShadow').checked = !!L.shadow; $('#stShCtl').hidden = !L.shadow; set('#stShB', L.shB, v => v);
    renderPal();
  }
  function applyAll() { renderBgGrid(); syncCtl(); render(); }

  // slider / alan bağlama
  function bindRange(id, fn) { const el = $(id); el.addEventListener('input', () => { const L = sel(); if (!L) return; fn(L, +el.value); syncOut(id, +el.value); render(); }); el.addEventListener('change', () => { const L = sel(); if (L) rememberStyle(L); commit(); }); }
  function syncOut(id, v) { const o = $(id + 'O'); if (!o) return; const m = { '#stSize': v + ' px', '#stRot': v + '°', '#stW': v + '%', '#stLh': (v / 100).toFixed(2), '#stBoxA': v + '%', '#stBoxP': v + ' px', '#stBoxR': v, '#stShB': v }; o.textContent = m[id] ?? v; }
  bindRange('#stSize', (L, v) => L.size = v); bindRange('#stRot', (L, v) => L.rot = v); bindRange('#stW', (L, v) => L.w = v); bindRange('#stLh', (L, v) => L.lh = v);
  bindRange('#stBoxR', (L, v) => L.boxR = v); bindRange('#stBoxA', (L, v) => L.boxA = v); bindRange('#stBoxP', (L, v) => L.boxPad = v); bindRange('#stShB', (L, v) => L.shB = v);
  $('#stTxt').addEventListener('input', e => { const L = sel(); if (!L) return; L.text = e.target.value; renderLayers(); render(); });
  $('#stTxt').addEventListener('change', () => commit());
  $('#stColor').addEventListener('input', e => { const L = sel(); if (!L) return; L.color = e.target.value; rememberStyle(L); renderPal(); render(); });
  $('#stColor').addEventListener('change', () => commit());
  $('#stBoxC').addEventListener('input', e => { const L = sel(); if (!L) return; L.boxColor = e.target.value; rememberStyle(L); render(); });
  $('#stBoxC').addEventListener('change', () => commit());
  $('#stBox').addEventListener('change', e => { const L = sel(); if (!L) return; L.box = e.target.checked; rememberStyle(L); commit(); syncCtl(); render(); });
  $('#stShadow').addEventListener('change', e => { const L = sel(); if (!L) return; L.shadow = e.target.checked; rememberStyle(L); commit(); syncCtl(); render(); });
  const chk = (id, key) => $(id).addEventListener('change', e => { const L = sel(); if (!L) return; L[key] = e.target.checked; commit(); render(); });
  chk('#stBoxSh', 'bsh'); chk('#stBrd', 'brd'); chk('#stQm', 'qm');
  const colr = (id, key) => { $(id).addEventListener('input', e => { const L = sel(); if (!L) return; L[key] = e.target.value; render(); }); $(id).addEventListener('change', () => commit()); };
  colr('#stBrdC', 'brdC'); colr('#stQmC', 'qmC');
  $('#stBold').addEventListener('click', () => { const L = sel(); if (!L) return; L.bold = !L.bold; rememberStyle(L); loadFont(L).then(() => render()); commit(); syncCtl(); render(); });
  $('#stItal').addEventListener('click', () => { const L = sel(); if (!L) return; L.italic = !L.italic; rememberStyle(L); loadFont(L).then(() => render()); commit(); syncCtl(); render(); });
  $('#stCenH').addEventListener('click', () => { const L = sel(); if (!L) return; L.fx = 0.5; commit(); render(); });
  $('#stCenV').addEventListener('click', () => { const L = sel(); if (!L) return; L.fy = 0.5; commit(); render(); });
  $('#stDup').addEventListener('click', () => { const L = sel(); if (!L) return; const c = { ...L, id: ++S.seq, fx: clamp(L.fx + 0.05, 0, 1), fy: clamp(L.fy + 0.06, 0, 1) }; S.layers.push(c); S.sel = c.id; commit(); applyAll(); });
  $('#stDel').addEventListener('click', delSel);
  $('#stAll').addEventListener('click', () => { const L = sel(); if (!L) return; S.layers.filter(isText).forEach(o => Object.assign(o, { boxR: L.boxR, bsh: L.bsh, brd: L.brd, brdC: L.brdC, qm: L.qm, qmC: L.qmC, font: L.font, italic: L.italic, bold: L.bold, color: L.color, shadow: L.shadow, shB: L.shB, box: L.box, boxColor: L.boxColor, boxA: L.boxA, boxPad: L.boxPad, align: L.align, lh: L.lh })); commit(); Promise.all(S.layers.map(loadFont)).then(() => render()); applyAll(); toast('Stil tüm yazılara uygulandı.'); });
  function delSel() { const L = sel(); if (!L) return; S.layers = S.layers.filter(x => x.id !== L.id); S.sel = null; commit(); applyAll(); }
  $('#stUndo').addEventListener('click', undo);
  $('#stAdd').addEventListener('click', () => { addLayer('Alıntını buraya yaz ✍️'); setTimeout(() => { $('#stText').scrollIntoView({ behavior: 'smooth', block: 'start' }); $('#stTxt').focus(); $('#stTxt').select(); }, 150); });

  document.addEventListener('click', e => {
    if (!e.target.closest('#tab-studio')) return;
    const f = e.target.closest('[data-f]'); if (f) { const L = sel(); if (L) { L.font = f.dataset.f; rememberStyle(L); commit(); syncCtl(); render(); loadFont(L).then(() => render()); } return; }
    const al = e.target.closest('[data-al]'); if (al) { const L = sel(); if (L) { L.align = al.dataset.al; rememberStyle(L); commit(); syncCtl(); render(); } return; }
    const pc = e.target.closest('[data-pc]'); if (pc) { const L = sel(); if (L) { L.color = pc.dataset.pc; rememberStyle(L); commit(); syncCtl(); render(); } return; }
    const lb = e.target.closest('[data-l]'); if (lb) { S.sel = +lb.dataset.l; syncCtl(); render(); return; }
    const sf = e.target.closest('[data-sf]'); if (sf) { S.format = sf.dataset.sf; commit(); applyAll(); return; }
    const bk = e.target.closest('[data-bk]'); if (bk) { S.bg.kind = bk.dataset.bk; commit(); applyAll(); return; }
    const sc = e.target.closest('[data-sc]'); if (sc) { S.bg.kind = 'solid'; S.bg.color = sc.dataset.sc; commit(); applyAll(); return; }
    const sg = e.target.closest('[data-sg]'); if (sg) { S.bg.kind = 'gradient'; S.bg.id = sg.dataset.sg; commit(); applyAll(); return; }
    const stx = e.target.closest('[data-st]'); if (stx && stx.classList.contains('sw')) { S.bg.kind = 'texture'; S.bg.tex = stx.dataset.st; commit(); applyAll(); return; }
    const fit = e.target.closest('[data-fit]'); if (fit) { S.bg.fit = fit.dataset.fit; commit(); applyAll(); return; }
  });
  document.addEventListener('input', e => { if (e.target.id === 'stBgColor') { S.bg.kind = 'solid'; S.bg.color = e.target.value; render(); } });
  document.addEventListener('change', e => { if (e.target.id === 'stBgColor') { commit(); applyAll(); } });
  $('#stDim').addEventListener('input', e => { S.bg.dim = +e.target.value; $('#stDimO').textContent = S.bg.dim + '%'; render(); });
  $('#stDim').addEventListener('change', () => commit());
  $('#stFile').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const url = URL.createObjectURL(f), img = new Image(); await new Promise((ok, no) => { img.onload = ok; img.onerror = () => no(new Error('Fotoğraf okunamadı')); img.src = url; });
      const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      photoData = c.toDataURL('image/jpeg', 0.86); await loadPhoto(); S.bg.kind = 'photo'; $('#stFileLabel').textContent = 'Başka fotoğraf seç'; commit(); applyAll();
    } catch (err) { toast(err.message); }
  });
  function loadPhoto() { return new Promise(ok => { if (!photoData) { photoImg = null; photoVer++; return ok(); } const i = new Image(); i.onload = () => { photoImg = i; photoVer++; ok(); }; i.onerror = () => { photoImg = null; photoVer++; ok(); }; i.src = photoData; }); }

  // ---------- dokunma / fare: sürükle, tutamaçla ya da iki parmakla büyüt-döndür ----------
  const ptrs = new Map(); let gest = null;
  const posOf = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * cv.width / r.width, y: (e.clientY - r.top) * cv.height / r.height }; };
  const toLocal = (L, p) => { const dx = p.x - L.fx * W(), dy = p.y - L.fy * H(), r = -L.rot * Math.PI / 180; return { x: dx * Math.cos(r) - dy * Math.sin(r), y: dx * Math.sin(r) + dy * Math.cos(r) }; };
  const hitL = (L, p, tol = 14 * uiScale()) => { const m = layout(mc, L), q = toLocal(L, p), t = tol; return Math.abs(q.x) <= m.hw + t && Math.abs(q.y) <= m.hh + t; };
  const onHandle = (L, p) => { const m = layout(mc, L), q = toLocal(L, p), h = handleLocal(m); return Math.hypot(q.x - h.x, q.y - h.y) <= 34 * uiScale(); };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y), ang = (a, b) => Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
  const normDeg = d => { d = ((d + 180) % 360 + 360) % 360 - 180; return d; };
  cv.addEventListener('pointerdown', e => {
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* önemsiz */ }
    const p = posOf(e); ptrs.set(e.pointerId, p); const L = sel();
    if (ptrs.size === 2 && L) { const [a, b] = [...ptrs.values()]; gest = { type: 'pinch', d0: dist(a, b), a0: ang(a, b), size0: L.size, rot0: L.rot, mid0: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, fx0: L.fx, fy0: L.fy, moved: false }; return; }
    if (L && onHandle(L, p)) { const c = { x: L.fx * W(), y: L.fy * H() }; gest = { type: 'handle', c, d0: dist(c, p), a0: ang(c, p), size0: L.size, rot0: L.rot, moved: false }; return; }
    const hit = [...S.layers].reverse().find(l => hitL(l, p, 0)) || [...S.layers].reverse().find(l => hitL(l, p));
    if (hit) { S.sel = hit.id; gest = { type: 'drag', dx: p.x - hit.fx * W(), dy: p.y - hit.fy * H(), moved: false }; syncCtl(); } else { S.sel = null; gest = null; syncCtl(); }
    render();
  });
  cv.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId)) return; const p = posOf(e); ptrs.set(e.pointerId, p); const L = sel(); if (!gest || !L) return;
    if (gest.type === 'pinch' && ptrs.size >= 2) {
      const [a, b] = [...ptrs.values()]; L.size = clamp(gest.size0 * dist(a, b) / Math.max(1, gest.d0), 16, 420); L.rot = normDeg(gest.rot0 + ang(a, b) - gest.a0);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; L.fx = clamp(gest.fx0 + (mid.x - gest.mid0.x) / W(), -0.2, 1.2); L.fy = clamp(gest.fy0 + (mid.y - gest.mid0.y) / H(), -0.2, 1.2); gest.moved = true;
    } else if (gest.type === 'handle') {
      L.size = clamp(gest.size0 * dist(gest.c, p) / Math.max(1, gest.d0), 16, 420); let r = normDeg(gest.rot0 + ang(gest.c, p) - gest.a0); for (const s of [0, 90, -90, 180, -180, 45, -45, 135, -135]) if (Math.abs(r - s) < 3) r = s; L.rot = r; gest.moved = true;
    } else if (gest.type === 'drag') {
      let fx = (p.x - gest.dx) / W(), fy = (p.y - gest.dy) / H(); guide = { v: Math.abs(fx - 0.5) < 0.012, h: Math.abs(fy - 0.5) < 0.012 }; if (guide.v) fx = 0.5; if (guide.h) fy = 0.5;
      L.fx = clamp(fx, -0.2, 1.2); L.fy = clamp(fy, -0.2, 1.2); gest.moved = true;
    }
    syncOutOnly(L); render();
  });
  function syncOutOnly(L) { $('#stSize').value = Math.round(L.size); $('#stSizeO').textContent = Math.round(L.size) + ' px'; $('#stRot').value = Math.round(L.rot); $('#stRotO').textContent = Math.round(L.rot) + '°'; }
  const endPtr = e => {
    ptrs.delete(e.pointerId);
    if (ptrs.size === 0) { if (gest && gest.moved) { const L = sel(); if (L) rememberStyle(L); commit(); } gest = null; guide = { v: false, h: false }; render(); }
    else if (gest && gest.type === 'pinch') { if (gest.moved) commit(); gest = null; }
  };
  cv.addEventListener('pointerup', endPtr); cv.addEventListener('pointercancel', endPtr);
  document.addEventListener('keydown', e => {
    if ($('#tab-studio').hidden || /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName)) return; const L = sel(); if (!L) return;
    if (e.key === 'Delete' || e.key === 'Backspace') { delSel(); e.preventDefault(); }
    const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]; if (d) { L.fx += d[0] * 0.01; L.fy += d[1] * 0.01; commit(); render(); e.preventDefault(); }
  });

  // ---------- dışa aktarma ----------
  async function exportCanvas() {
    await Promise.all(S.layers.map(loadFont)); const prev = S.sel; ensureBg();
    const c = document.createElement('canvas'); c.width = W(); c.height = H(); const x = c.getContext('2d'); x.drawImage(bgCanvas, 0, 0); S.layers.forEach(L => drawLayer(x, L)); S.sel = prev; return c;
  }
  const stamp = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`; };
  async function download(type) {
    if (!S.layers.some(isText)) return toast('Önce bir yazı ekle.');
    const c = await exportCanvas(), mime = type === 'jpg' ? 'image/jpeg' : 'image/png';
    c.toBlob(b => { if (!b) return toast('Görsel oluşturulamadı.'); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `satir-arasi-${S.format}-${stamp()}.${type}`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast('Görsel indiriliyor…'); }, mime, 0.93);
  }
  $('#stPng').addEventListener('click', () => download('png')); $('#stJpg').addEventListener('click', () => download('jpg'));
  (async () => { try { const f = new File([new Blob(['x'])], 'x.png', { type: 'image/png' }); if (navigator.canShare && navigator.canShare({ files: [f] })) $('#stShare').hidden = false; } catch (e) { /* yok */ } })();
  $('#stShare').addEventListener('click', async () => {
    const c = await exportCanvas(); c.toBlob(async b => { try { await navigator.share({ files: [new File([b], `satir-arasi-${stamp()}.png`, { type: 'image/png' })], title: 'Satır Arası' }); } catch (e) { if (e.name !== 'AbortError') toast('Paylaşılamadı, indirmeyi dene.'); } }, 'image/png');
  });

  // ---------- kaydet / tekrar düzenle (IndexedDB, olmazsa localStorage) ----------
  const DB = (() => {
    let dbp = null; const LS = 'sa.designs';
    const open = () => dbp || (dbp = new Promise((ok, no) => { try { const r = indexedDB.open('sa-studio', 1); r.onupgradeneeded = () => r.result.createObjectStore('designs', { keyPath: 'id' }); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); } catch (e) { no(e); } }));
    const tx = (mode, fn) => open().then(db => new Promise((ok, no) => { const t = db.transaction('designs', mode), rq = fn(t.objectStore('designs')); t.oncomplete = () => ok(rq && rq.result); t.onerror = () => no(t.error); t.onabort = () => no(t.error); }));
    const lsGet = () => { try { return JSON.parse(localStorage.getItem(LS)) || []; } catch (e) { return []; } };
    const lsSet = a => { try { localStorage.setItem(LS, JSON.stringify(a)); } catch (e) { throw new Error('Depolama dolu'); } };
    return {
      all: () => tx('readonly', s => s.getAll()).catch(() => lsGet()),
      put: d => tx('readwrite', s => s.put(d)).catch(() => { const a = lsGet().filter(x => x.id !== d.id); a.push({ ...d, photo: '' }); lsSet(a); }),
      del: id => tx('readwrite', s => s.delete(id)).catch(() => lsSet(lsGet().filter(x => x.id !== id)))
    };
  })();
  async function thumb() { const c = await exportCanvas(), t = document.createElement('canvas'); t.width = 270; t.height = Math.round(270 * c.height / c.width); t.getContext('2d').drawImage(c, 0, 0, t.width, t.height); return t.toDataURL('image/jpeg', 0.75); }
  const fmtDate = ts => new Date(ts).toLocaleString('tr', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  async function renderSaved() {
    const list = (await DB.all()).sort((a, b) => b.at - a.at);
    $('#stSaved').innerHTML = list.length ? list.map(d => `<div class="sd ${d.id === curId ? 'cur' : ''}"><img src="${d.thumb}" alt="" data-open="${d.id}"><div class="meta">${esc(d.name)}<small>${fmtDate(d.at)}</small></div><div class="acts"><button data-open="${d.id}" aria-label="Aç">✏️</button><button data-copy="${d.id}" aria-label="Çoğalt">⧉</button><button data-ren="${d.id}" aria-label="Adını değiştir">Aa</button><button data-rm="${d.id}" aria-label="Sil">🗑️</button></div></div>`).join('') : '<div class="none">Henüz kayıtlı tasarım yok. Bir tasarım yapıp 💾 Kaydet\'e bas.</div>';
  }
  async function save() {
    if (!S.layers.some(isText)) return toast('Önce bir yazı ekle.');
    const id = curId || 'd' + Date.now().toString(36), name = curName || `Tasarım ${fmtDate(Date.now())}`;
    const snap = JSON.parse(JSON.stringify(S)); snap.sel = null;
    try { await DB.put({ id, name, at: Date.now(), thumb: await thumb(), state: snap, photo: S.bg.kind === 'photo' || photoData ? photoData : '' }); }
    catch (e) { return toast('Kaydedilemedi: ' + e.message); }
    curId = id; curName = name; dirty = false; toast('Kaydedildi ✓'); renderSaved();
  }
  async function openDesign(id) {
    const d = (await DB.all()).find(x => x.id === id); if (!d) return;
    if (dirty && S.layers.length && !confirm('Kaydedilmemiş değişiklikler var. Bu tasarım açılsın mı?')) return;
    S = JSON.parse(JSON.stringify(d.state)); S.sel = null; S.seq = Math.max(S.seq || 0, ...S.layers.map(l => l.id), 0); photoData = d.photo || ''; await loadPhoto();
    curId = d.id; curName = d.name; history = []; base = JSON.stringify(S); dirty = false; await Promise.all(S.layers.map(loadFont)); applyAll(); renderSaved(); scrollTo({ top: $('#stCanvas').getBoundingClientRect().top + scrollY - 90, behavior: 'smooth' }); toast('Tasarım açıldı.');
  }
  async function newDesign() {
    if (dirty && S.layers.length && !confirm('Kaydedilmemiş değişiklikler silinsin mi?')) return;
    S = fresh(); photoData = ''; photoImg = null; photoVer++; curId = null; curName = ''; history = []; base = JSON.stringify(S); dirty = false; applyAll(); addLayer('Alıntını buraya yaz ✍️'); addMark(false); S.sel = S.layers.find(isText).id; applyAll(); dirty = false; renderSaved();
  }
  $('#stSave').addEventListener('click', save); $('#stNew').addEventListener('click', newDesign);
  $('#stSaved').addEventListener('click', async e => {
    const o = e.target.closest('[data-open]'), cp = e.target.closest('[data-copy]'), rn = e.target.closest('[data-ren]'), rm = e.target.closest('[data-rm]');
    if (o) return openDesign(o.dataset.open);
    const all = await DB.all();
    if (cp) { const d = all.find(x => x.id === cp.dataset.copy); if (d) { await DB.put({ ...d, id: 'd' + Date.now().toString(36), name: d.name + ' (kopya)', at: Date.now() }); renderSaved(); toast('Çoğaltıldı.'); } }
    else if (rn) { const d = all.find(x => x.id === rn.dataset.ren); const n = d && prompt('Tasarımın adı', d.name); if (n && n.trim()) { await DB.put({ ...d, name: n.trim().slice(0, 60) }); if (d.id === curId) curName = n.trim(); renderSaved(); } }
    else if (rm) { if (confirm('Bu tasarım silinsin mi?')) { await DB.del(rm.dataset.rm); if (rm.dataset.rm === curId) { curId = null; curName = ''; } renderSaved(); } }
  });

  // ---------- kitaptan alıntı getir (Alıntılar sekmesindeki aynı kaynak) ----------
  let bookRec = null, bookCat = -1;
  $('#stBook').addEventListener('click', () => { const b = $('#stBookBox'); b.hidden = !b.hidden; if (!b.hidden) { b.scrollIntoView({ behavior: 'smooth', block: 'start' }); $('#stBt').focus(); } });
  function renderBook() {
    const r = bookRec, box = $('#stBres'); if (!r) { box.innerHTML = ''; return; }
    const cats = r.categories.map((c, i) => ({ ...c, i })).filter(c => c.quotes.length);
    box.innerHTML = `<div class="book" style="margin-top:14px"><h2 style="font-size:22px">${esc(r.title)}</h2><div class="muted">${esc(r.author || '')}</div></div><div class="cats" style="margin:12px 0">${cats.map(c => `<button class="cchip c${c.i} ${bookCat === c.i ? 'on' : ''}" data-bc="${c.i}">${esc(c.name)}</button>`).join('')}</div>` +
      (bookCat >= 0 ? (r.categories[bookCat].quotes.map((q, k) => `<button class="pq" data-bq="${bookCat}:${k}"><i style="border-color:var(--c2);color:var(--c2);font-style:normal;font-weight:800">+</i><span>${esc(q)}</span></button>`).join('')) : '<div class="none">Bir kategori seç, eklemek istediğin alıntıya dokun.</div>');
  }
  $('#stBgo').addEventListener('click', async () => {
    const t = $('#stBt').value.trim(), a = $('#stBa').value.trim(); if (!t) return toast('Önce kitap adını yaz.');
    if (!window.SA || !window.SA.fetchBook) return toast('Alıntı servisi yüklenemedi.');
    const btn = $('#stBgo'); btn.disabled = true; $('#stBres').innerHTML = '<div class="status" style="padding:18px 0"><div class="dots"><i></i><i></i><i></i></div><div>Alıntılar getiriliyor…</div></div>';
    try { bookRec = await window.SA.fetchBook(a ? `${t} - ${a}` : t); bookCat = -1; if (!bookRec) { $('#stBres').innerHTML = '<div class="status" style="padding:18px 0">Bu kitabı tanıyamadım.</div>'; } else renderBook(); }
    catch (e) { $('#stBres').innerHTML = `<div class="status" style="padding:18px 0">${esc(e.message)}</div>`; }
    finally { btn.disabled = false; }
  });
  $('#stBres').addEventListener('click', e => {
    const bc = e.target.closest('[data-bc]'); if (bc) { bookCat = +bc.dataset.bc; renderBook(); return; }
    const bq = e.target.closest('[data-bq]'); if (bq && bookRec) { const [c, k] = bq.dataset.bq.split(':').map(Number); addLayer(bookRec.categories[c].quotes[k]); toast('Tasarıma eklendi ✓'); }
  });

  // ---------- filigran (lotus) ve hikâyeden içe aktarma ----------
  const markLayer = () => { const fy = S.format === 'story' ? 0.955 : 0.93, m = window.LIB ? window.LIB.markLayer(fy) : { type: 'lotus', wm: true, fx: 0.5, fy, size: 112, rot: 0, color: '#ffffff', alpha: 80, shadow: true, shB: 8 }; return { ...m, id: ++S.seq }; };
  function hasMark() { return S.layers.some(isMark); }
  function addMark(select) { if (hasMark()) { const m = S.layers.find(isMark); S.sel = m.id; applyAll(); return toast('Filigran zaten var, istersen sürükleyebilirsin.'); } const L = markLayer(); S.layers.push(L); if (select) S.sel = L.id; commit(); applyAll(); }
  $('#stMark').addEventListener('click', () => { addMark(true); });

  // Hikâye sekmesinin hazırladığı görseli (arka plan fotoğrafı + katmanlar) düzenlenebilir tasarım olarak aç
  async function importDesign(d) {
    if (dirty && S.layers.some(isText) && !confirm('Kaydedilmemiş tasarımın var. Hikâye görseli onun yerine açılsın mı?')) return false;
    S = fresh(); S.bg.kind = 'photo'; S.bg.fit = 'cover'; photoData = d.photo; await loadPhoto();
    S.layers = d.layers.map(l => ({ ...l, id: ++S.seq })); S.sel = null; curId = null; curName = '';
    await Promise.all(S.layers.map(loadFont)); history = []; base = JSON.stringify(S); dirty = true;
    $('#stFileLabel').textContent = 'Başka fotoğraf seç'; applyAll(); renderSaved(); return true;
  }
  // Çevrimdışı çizim (hikâye önizlemesi için): arka plan tuvali + katmanlar, stüdyonun kendi çizicisiyle
  async function renderDesign(d) {
    await Promise.all(d.layers.map(loadFont));
    const prev = S; S = { format: 'story', bg: prev.bg, layers: [], sel: null, seq: 0 };
    try { const c = document.createElement('canvas'); c.width = 1080; c.height = 1920; const x = c.getContext('2d'); x.drawImage(d.bg, 0, 0); d.layers.forEach(L => drawLayer(x, L)); return c; }
    finally { S = prev; }
  }
  function measureLayer(L) { const prev = S; S = { format: 'story' }; try { return layout(mc, L); } finally { S = prev; } }

  // ---------- başlangıç ----------
  function init() {
    renderFonts(); renderBgGrid(); render(); addLayer('Alıntını buraya yaz ✍️'); addMark(false); S.sel = S.layers.find(isText).id; applyAll(); dirty = false; history = []; base = JSON.stringify(S); renderSaved(); preloadFonts();
  }
  init();
  window.__studioImport = importDesign; window.__studioDB = DB;
  function paint(c, layers) { const prev = S; S = { format: 'story', bg: prev.bg, layers: [], sel: null, seq: 0 }; try { layers.forEach(L => drawLayer(c, L)); } finally { S = prev; } }
  window.__studioApi = { paint, renderDesign, measureLayer, loadFont, fontsFor: ls => Promise.all(ls.map(loadFont)) };
  window.__studio = { get S() { return S; }, get PAL() { return PAL; }, FORMATS, FONTS, render, exportCanvas, layout: L => layout(mc, L) };
})();
