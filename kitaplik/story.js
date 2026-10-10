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

  let status = 'basladim', file = null, imgEl = null, result = null, blobUrl = '', lastBlob = null, busy = false;
  const SA = window.SA, MAXQ = 5, AUTO = 3; // en fazla 5 alıntı; otomatik seçimde 3 tane (görsel kalabalık olmasın)
  let picked = [], customs = [], pickables = [], redrawT = 0, bookRec = null;

  const toast = m => { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 2200); };

  // ---------- sekmeler ----------
  function setTab(name) {
    $('#tab-quotes').hidden = name !== 'quotes';
    $('#tab-story').hidden = name !== 'story';
    $('#tab-studio').hidden = name !== 'studio';
    document.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
    try { history.replaceState(null, '', name === 'story' ? '#hikaye' : name === 'studio' ? '#tasarim' : location.pathname); } catch (e) { /* önemsiz */ }
    scrollTo({ top: 0 });
  }
  document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
  if (location.hash === '#hikaye') setTab('story'); else if (location.hash === '#tasarim') setTab('studio');

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
      bookRec = null; picked = []; customs = []; $('#stitle').value = ''; $('#sauthor').value = '';
      $('#spreview').src = u; $('#spreview').hidden = false;
      $('#sLabel').textContent = 'Başka fotoğraf seç';
      $('#sout').innerHTML = '';
      renderPicker(false);
      await generate(); // fotoğraf yeterli: görsel hemen hazırlanır
      autoIdentify(f);  // arka planda kitabı tanı; tanırsa kitap adı ve alıntılar otomatik eklenir
    } catch (err) { toast(err.message); }
  });

  const setPickLoading = t => { $('#spick').innerHTML = `<div class="status" style="padding:18px 0"><div class="dots"><i></i><i></i><i></i></div><div>${esc(t)}</div></div>`; };
  function applyRec(rec) {
    bookRec = rec; $('#stitle').value = rec.title; $('#sauthor').value = rec.author || '';
    picked = []; renderPicker(true); queueRedraw();
  }
  async function autoIdentify(f) {
    try {
      const data = await SA.shrink(f);
      setPickLoading('Kitap tanınıyor, alıntılar getiriliyor…');
      const rec = await SA.fetchByImage(data);
      if (file !== f) return;                               // başka fotoğraf seçildi
      if (!rec || $('#stitle').value.trim()) { renderPicker(false); return; } // tanınmadı ya da kullanıcı kendi yazdı
      applyRec(rec); toast('Kitap tanındı: ' + rec.title);
    } catch (e) { if (file === f) renderPicker(false); /* sessiz: kitap adı elle yazılabilir */ }
  }

  $('#sStatus').addEventListener('click', e => {
    const b = e.target.closest('[data-st]'); if (!b) return;
    status = b.dataset.st;
    document.querySelectorAll('#sStatus .cchip').forEach(c => c.classList.toggle('on', c === b));
    if (result && imgEl) draw();
  });

  // ---------- kitap ve alıntı seçimi ----------
  const cleanQ = q => String(q).replace(/\s*\n\s*/g, ' / ').trim();
  function renderPicker(autoSelect) {
    pickables = [];
    if (bookRec) bookRec.categories.forEach((c, i) => c.quotes.forEach(q => pickables.push({ q: cleanQ(q), cat: i })));
    const valid = new Set([...pickables.map(p => p.q), ...customs]);
    picked = picked.filter(q => valid.has(q));
    if (autoSelect && !picked.length) { // her kategoriden birer alıntı, en fazla 3
      const seen = new Set();
      for (const p of pickables) { if (picked.length >= AUTO) break; if (!seen.has(p.cat)) { seen.add(p.cat); picked.push(p.q); } }
      for (const p of pickables) { if (picked.length >= AUTO) break; if (!picked.includes(p.q)) picked.push(p.q); }
    }
    let html = '';
    if (!pickables.length && !customs.length) html = '<div class="none">Fotoğraf yüklersen kitabı kendim tanırım. Ya da kitap adını yazıp "Bu kitaptan alıntıları getir"e bas. Kendi cümleni de yazabilirsin. Hepsi isteğe bağlı.</div>';
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
    else { if (picked.length >= MAXQ) return toast('En fazla 5 alıntı seçebilirsin.'); picked.push(q); }
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

  // Yazılan kitap için alıntıları getir
  $('#sfetch').addEventListener('click', async () => {
    const t = $('#stitle').value.trim(), a = $('#sauthor').value.trim();
    if (!t) return toast('Önce kitap adını yaz.');
    const btn = $('#sfetch'); btn.disabled = true; setPickLoading('Alıntılar getiriliyor…');
    try {
      const rec = await SA.fetchBook(a ? `${t} - ${a}` : t);
      if (!rec) { renderPicker(false); toast('Bu kitabı tanıyamadım.'); } else applyRec(rec);
    } catch (e) { renderPicker(false); toast(e.message); }
    finally { btn.disabled = false; }
  });
  $('#stitle').addEventListener('input', queueRedraw);
  $('#sauthor').addEventListener('input', queueRedraw);

  // sonucu oluştur (hazırla düğmesi ve yeniden çizim için ortak)
  function buildResult() {
    if (!imgEl) { toast('Önce kitabın fotoğrafını yükle.'); return null; }
    // Kitap adı ve alıntı isteğe bağlı: yoksa yalnızca fotoğraf + durum etiketi çizilir
    result = { title: $('#stitle').value.trim(), author: $('#sauthor').value.trim(), quotes: picked.slice() };
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

  // ---------- tasarım: hikâye görseli = arka plan fotoğrafı + düzenlenebilir katmanlar ----------
  // Aynı katmanlar hem burada çizilir hem de "Tasarla" ile Tasarım sekmesine aktarılır.
  const GAPX = 84;
  function backdrop() {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
    c.drawImage(preparePhoto(W, H, true), 0, 0);
    let g = c.createRadialGradient(W / 2, H / 2, H * 0.22, W / 2, H / 2, H * 0.78);
    g.addColorStop(0, 'rgba(8,8,22,0)'); g.addColorStop(1, 'rgba(8,8,22,.26)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    g = c.createLinearGradient(0, 0, 0, 520); g.addColorStop(0, 'rgba(8,8,22,.32)'); g.addColorStop(1, 'rgba(8,8,22,0)'); c.fillStyle = g; c.fillRect(0, 0, W, 520);
    g = c.createLinearGradient(0, 860, 0, H); g.addColorStop(0, 'rgba(8,8,22,0)'); g.addColorStop(1, 'rgba(8,8,22,.5)'); c.fillStyle = g; c.fillRect(0, 860, W, H - 860);
    return cv;
  }
  const baseText = { type: 'text', rot: 0, italic: false, bold: false, color: '#ffffff', align: 'center', w: 80, lh: 135, box: false, boxColor: '#0e0e20', boxA: 46, boxPad: 30, shadow: true, shB: 10, font: 'Outfit' };
  function buildDesign(res, th) {
    const api = window.__studioApi, M = L => api.measureLayer(L), layers = [];
    // alıntı kutuları: sığana kadar yazıyı küçült
    const qs = (res.quotes || []).slice(0, MAXQ);
    let size = qs.length >= 4 ? 30 : 36, qL = [], total = 0, gap = qs.length >= 4 ? 18 : 28;
    const mk = (q, sz) => ({ ...baseText, text: q, font: 'Fraunces', italic: true, size: sz, align: 'left', w: 54, lh: 136, box: true, boxR: 34, bsh: true, brd: true, brdC: '#cfd3e6', qm: true, qmC: th.accent, shB: 8, fx: 0.5, fy: 0.5 });
    for (;;) {
      qL = qs.map(q => { let sz = size, L = mk(q, sz); while (M(L).lines.length > 5 && sz > 26) { sz -= 2; L = mk(q, sz); } return L; });
      total = qL.reduce((a, L) => a + M(L).hh * 2, 0) + gap * Math.max(0, qL.length - 1);
      if (!qL.length || total <= 940 || size <= 24) break; size -= 2;
    }
    let y = Math.max(560, 1510 - total);
    qL.forEach((L, i) => {
      const m = M(L), left = i % 2 === 0, x0 = left ? GAPX : W - GAPX - m.hw * 2;
      L.fx = (x0 + m.hw) / W; L.fy = (y + m.hh) / H;
      const st = th.stickers[i % th.stickers.length];
      layers.push(L);
      layers.push({ ...baseText, text: st, size: 46, w: 20, shadow: false, rot: left ? 8 : -8, fx: (left ? x0 + m.hw * 2 - 30 : x0 + 30) / W, fy: (y - 4) / H });
      y += m.hh * 2 + gap;
    });
    // durum etiketi
    const pill = { ...baseText, text: `${th.icon}  ${th.pill}`, size: 34, bold: true, w: 92, box: true, boxPad: 26, boxR: 200, bsh: true, brd: true, brdC: th.accent, boxA: 42, fx: 0.5, fy: 0.5 };
    pill.fy = 300 / H; layers.push(pill);
    // kitap adı + yazar
    if (res.title || res.author) {
      let ty = 1560;
      if (res.title) {
        let t = { ...baseText, text: res.title, size: 54, bold: true, align: 'left', w: 82, lh: 120, fx: 0.5, fy: 0.5 };
        if (M(t).lines.length > 1) t = { ...t, size: 44 };
        const m = M(t); t.fx = (GAPX + m.hw) / W; t.fy = (ty + m.hh) / H; layers.push(t); ty += m.hh * 2 + 12;
      }
      if (res.author) {
        const a = { ...baseText, text: res.author, size: 32, align: 'left', w: 82, color: '#e6e8f2', fx: 0.5, fy: 0.5 };
        const m = M(a); a.fx = (GAPX + m.hw) / W; a.fy = (ty + m.hh) / H; layers.push(a);
      }
    }
    // ayraç ve filigran (lotus)
    layers.push({ type: 'ribbon', size: 68, rot: 0, color: th.accent, shadow: true, shB: 24, fx: 920 / W, fy: 107 / H });
    layers.push({ type: 'lotus', size: 112, rot: 0, color: '#ffffff', alpha: 80, shadow: true, shB: 8, fx: 0.5, fy: 0.955 });
    return layers;
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

  let lastDesign = null;
  async function draw() {
    await fontsReady();
    const api = window.__studioApi; if (!api) throw new Error('Tasarım aracı yüklenemedi, sayfayı yenile.');
    const bg = backdrop(), th = ST[status], layers = buildDesign(result, th);
    await api.fontsFor(layers);
    const layers2 = buildDesign(result, th); // yazı tipleri yüklendikten sonra ölçüleri yeniden hesapla
    lastDesign = { bg, layers: layers2 };
    const cv = await api.renderDesign(lastDesign);
    window.__story.lastLayout = layers2;
    const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.93));
    if (!blob) throw new Error('Görsel oluşturulamadı.');
    lastBlob = blob; if (blobUrl) URL.revokeObjectURL(blobUrl); blobUrl = URL.createObjectURL(blob);
    const canShare = !!(navigator.canShare && navigator.canShare({ files: [new File([blob], 'x.jpg', { type: 'image/jpeg' })] }));
    $('#sout').innerHTML = `<div class="sresult">
      <div class="preview"><img src="${blobUrl}" alt="Hazırlanan hikâye görseli"></div>
      <div class="sactions">
        <button class="btn main" data-sdl>⬇️ Görseli indir</button>
        <button class="btn design" data-sdesign>🎨 Tasarla</button>
        ${canShare ? '<button class="btn" data-sshare>📤 Paylaş</button>' : ''}
        <button class="btn" data-sedit ${canShare ? '' : 'style="grid-column:1/-1"'}>✏️ Alıntıları değiştir</button>
      </div>
      <p class="snote">Durumu ya da alıntıları değiştirirsen görsel anında yenilenir. Kutuları, yazıyı ve simgeleri kendin yerleştirmek için <b>Tasarla</b>'ya bas. iPhone'da indirme olmazsa görsele uzun basıp "Fotoğraflara Ekle"yi seç.</p>
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
    } else if (e.target.closest('[data-sdesign]') && lastDesign) {
      const btn = e.target.closest('[data-sdesign]'); btn.disabled = true;
      try {
        const ok = await window.__studioImport({ photo: lastDesign.bg.toDataURL('image/jpeg', 0.9), layers: lastDesign.layers });
        if (ok) { setTab('studio'); toast('Tasarım sekmesinde düzenleyebilirsin 🎨'); }
      } catch (err) { toast('Tasarım açılamadı: ' + err.message); }
      finally { btn.disabled = false; }
    } else if (e.target.closest('[data-sedit]')) $('#spick').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  $('#sgo').addEventListener('click', () => generate());
  renderPicker(false);

  // Test için dışarı açılan küçük yardımcı
  window.__story = { W, H, lastLayout: null, get design() { return lastDesign; } };
})();
