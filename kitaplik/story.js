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

  let status = 'basladim', file = null, imgEl = null, apiImg = '', result = null, blobUrl = '', lastBlob = null, busy = false;

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
  function shrinkTo(i, max) {
    const k = Math.min(1, max / Math.max(i.naturalWidth, i.naturalHeight));
    const cv = document.createElement('canvas'); cv.width = Math.round(i.naturalWidth * k); cv.height = Math.round(i.naturalHeight * k);
    cv.getContext('2d').drawImage(i, 0, 0, cv.width, cv.height);
    return cv.toDataURL('image/jpeg', 0.85);
  }

  $('#sfile').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const { i, u } = await loadImage(f);
      file = f; imgEl = i; apiImg = shrinkTo(i, 1024);
      $('#spreview').src = u; $('#spreview').hidden = false;
      $('#sLabel').textContent = 'Başka fotoğraf seç';
      $('#stitle').value = ''; $('#sauthor').value = ''; result = null;
      $('#sout').innerHTML = '';
    } catch (err) { toast(err.message); }
  });

  $('#sStatus').addEventListener('click', e => {
    const b = e.target.closest('[data-st]'); if (!b) return;
    status = b.dataset.st;
    document.querySelectorAll('#sStatus .cchip').forEach(c => c.classList.toggle('on', c === b));
    if (result && imgEl) draw();
  });

  // ---------- istek ----------
  async function generate(reroll) {
    if (busy) return;
    if (!file || !imgEl) return toast('Önce kitabın fotoğrafını yükle.');
    const title = (reroll && result ? result.title : $('#stitle').value).trim();
    const author = (reroll && result ? result.author : $('#sauthor').value).trim();
    const body = { mode: 'story' };
    if (title) { body.title = title; body.author = author; } else body.image = apiImg;
    if (reroll && result) body.exclude = result.quotes;

    busy = true; $('#sgo').disabled = true;
    $('#sout').innerHTML = '<div class="status"><div class="dots"><i></i><i></i><i></i></div><div>Görsel hazırlanıyor…</div></div>';
    try {
      let code = ''; try { code = JSON.parse(localStorage.getItem('sa.code')) || ''; } catch (e) { /* yok */ }
      const r = await fetch('/api/quotes', { method: 'POST', headers: { 'content-type': 'application/json', 'x-access-code': code }, body: JSON.stringify(body) });
      if (r.status === 401) {
        const c = prompt('Erişim kodu?');
        if (c) { try { localStorage.setItem('sa.code', JSON.stringify(c)); } catch (e) { /* önemsiz */ } busy = false; $('#sgo').disabled = false; return generate(reroll); }
        throw new Error('Erişim kodu gerekli.');
      }
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Bir şey ters gitti.');
      if (!d.found) {
        $('#sout').innerHTML = '<div class="status">Fotoğraftaki kitabı tanıyamadım.<br>Kitap adını ve yazarı yazıp tekrar dene.</div>';
        $('#stitle').focus(); return;
      }
      result = d;
      if (!$('#stitle').value) { $('#stitle').value = d.title; $('#sauthor').value = d.author; }
      await draw();
      if (!d.quotes.length) toast('Bu kitaptan güvenle hatırladığım alıntı yok.');
    } catch (e) {
      $('#sout').innerHTML = `<div class="status">${esc(e.message)}</div>`;
    } finally { busy = false; $('#sgo').disabled = false; }
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

  // Fotoğrafı 9:16'ya kırp ve otomatik düzelt: seviye (kontrast), gama (parlaklık), doygunluk
  function paintPhoto(c) {
    const s = Math.max(W / imgEl.naturalWidth, H / imgEl.naturalHeight);
    const dw = imgEl.naturalWidth * s, dh = imgEl.naturalHeight * s;
    c.fillStyle = '#0e0f1a'; c.fillRect(0, 0, W, H);
    c.drawImage(imgEl, (W - dw) / 2, (H - dh) / 2, dw, dh);
  }
  function enhance(c) {
    const id = c.getImageData(0, 0, W, H), d = id.data;
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
      x = x * 0.92 + 0.08 * (x * x * (3 - 2 * x)); // çok hafif S eğrisi
      lut[v] = x * 255;
    }
    const SAT = 1.14;
    for (let i = 0; i < d.length; i += 4) {
      const r = lut[d[i]], g = lut[d[i + 1]], b = lut[d[i + 2]], y = 0.299 * r + 0.587 * g + 0.114 * b;
      d[i] = y + (r - y) * SAT; d[i + 1] = y + (g - y) * SAT; d[i + 2] = y + (b - y) * SAT;
    }
    c.putImageData(id, 0, 0);
  }

  function overlay(c, res, th) {
    // Okunabilirlik için yumuşak karartmalar
    let g = c.createRadialGradient(W / 2, H / 2, H * 0.22, W / 2, H / 2, H * 0.78);
    g.addColorStop(0, 'rgba(8,8,22,0)'); g.addColorStop(1, 'rgba(8,8,22,.26)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    g = c.createLinearGradient(0, 0, 0, 560); g.addColorStop(0, 'rgba(8,8,22,.32)'); g.addColorStop(1, 'rgba(8,8,22,0)'); c.fillStyle = g; c.fillRect(0, 0, W, 520);
    g = c.createLinearGradient(0, 860, 0, H); g.addColorStop(0, 'rgba(8,8,22,0)'); g.addColorStop(1, 'rgba(8,8,22,.5)'); c.fillStyle = g; c.fillRect(0, 860, W, H - 860);

    // Üstte asılı ayraç (bookmark)
    c.save(); c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 24; c.fillStyle = th.accent; c.beginPath();
    c.moveTo(886, 0); c.lineTo(954, 0); c.lineTo(954, 214); c.lineTo(920, 178); c.lineTo(886, 214); c.closePath(); c.fill(); c.restore();

    // Durum hapı
    c.font = `600 36px ${SANS}`;
    const tw = c.measureText(th.pill).width, pw = 44 + 48 + 14 + tw + 44, ph = 94, px = (W - pw) / 2, py = 262;
    c.save(); c.shadowColor = th.accent; c.shadowBlur = 36; rr(c, px, py, pw, ph, ph / 2); c.fillStyle = 'rgba(14,14,32,.42)'; c.fill(); c.restore();
    rr(c, px, py, pw, ph, ph / 2); c.strokeStyle = th.accent; c.lineWidth = 3; c.stroke();
    c.textBaseline = 'middle'; c.textAlign = 'left';
    c.font = `40px ${EMOJI}`; c.fillStyle = '#fff'; c.fillText(th.icon, px + 40, py + ph / 2 + 2);
    c.font = `600 36px ${SANS}`; c.fillText(th.pill, px + 44 + 48 + 14, py + ph / 2 + 1);

    // Alıntı kutuları
    const qs = (res.quotes || []).slice(0, 3);
    const boxes = qs.map(q => {
      let size = 37, lines, maxW = 580;
      c.font = `italic 400 ${size}px ${SERIF}`; lines = wrap(c, q, maxW);
      while (lines.length > 5 && size > 28) { size -= 3; c.font = `italic 400 ${size}px ${SERIF}`; lines = wrap(c, q, maxW); }
      const lh = size * 1.38, tw2 = Math.max(...lines.map(l => c.measureText(l).width));
      return { lines, size, lh, w: 92 + tw2 + 36, h: 32 * 2 + lines.length * lh };
    });
    const gap = 30, total = boxes.reduce((a, b) => a + b.h, 0) + gap * Math.max(0, boxes.length - 1);
    let y = Math.max(560, 1510 - total);
    boxes.forEach((b, i) => {
      const left = i % 2 === 0, x = left ? 84 : W - 84 - b.w;
      c.save(); c.shadowColor = 'rgba(0,0,0,.38)'; c.shadowBlur = 34; c.shadowOffsetY = 8; rr(c, x, y, b.w, b.h, 36); c.fillStyle = 'rgba(14,14,32,.44)'; c.fill(); c.restore();
      const hg = c.createLinearGradient(0, y, 0, y + b.h); hg.addColorStop(0, 'rgba(255,255,255,.16)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
      rr(c, x, y, b.w, b.h, 36); c.fillStyle = hg; c.fill(); c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 2; c.stroke();
      // tırnak ikonu
      c.textBaseline = 'alphabetic'; c.textAlign = 'left'; c.font = `700 84px ${SERIF}`; c.fillStyle = th.accent; c.fillText('“', x + 28, y + 36 + 64);
      // metin
      c.font = `italic 400 ${b.size}px ${SERIF}`; c.fillStyle = '#fff';
      c.save(); c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 8;
      b.lines.forEach((l, k) => c.fillText(l, x + 92, y + 32 + b.size * 1.0 + k * b.lh)); c.restore();
      // köşe emojisi
      c.textBaseline = 'middle'; c.textAlign = 'center'; c.font = `50px ${EMOJI}`;
      c.save(); c.translate(left ? x + b.w - 34 : x + 34, y - 6); c.rotate(left ? 0.14 : -0.14); c.fillText(th.stickers[i % th.stickers.length], 0, 0); c.restore();
      y += b.h + gap;
    });

    // Alt bilgi: kitap adı + yazar
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    let size = 54; c.font = `700 ${size}px ${SANS}`; let tl = wrap(c, res.title, 880);
    if (tl.length > 1) { size = 44; c.font = `700 ${size}px ${SANS}`; tl = wrap(c, res.title, 880).slice(0, 2); }
    const fy = 1568, blockH = tl.length * size * 1.2 + 44 + 30;
    c.fillStyle = th.accent; rr(c, 84, fy - size, 7, blockH, 4); c.fill();
    c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 14; c.fillStyle = '#fff'; c.font = `700 ${size}px ${SANS}`;
    tl.forEach((l, k) => c.fillText(l, 114, fy + k * size * 1.2)); c.restore();
    const ay = fy + (tl.length - 1) * size * 1.2 + 46;
    c.font = `500 32px ${SANS}`; c.fillStyle = 'rgba(255,255,255,.86)'; c.fillText(res.author, 114, ay);
    c.font = `500 24px ${SANS}`; c.fillStyle = 'rgba(255,255,255,.5)'; c.fillText('Satır Arası ile hazırlandı', 114, ay + 40);
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
    const c = cv.getContext('2d', { willReadFrequently: true });
    paintPhoto(c); enhance(c); overlay(c, result, ST[status]);
    const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.93));
    if (!blob) throw new Error('Görsel oluşturulamadı.');
    lastBlob = blob; if (blobUrl) URL.revokeObjectURL(blobUrl); blobUrl = URL.createObjectURL(blob);
    const canShare = !!(navigator.canShare && navigator.canShare({ files: [new File([blob], 'x.jpg', { type: 'image/jpeg' })] }));
    $('#sout').innerHTML = `<div class="sresult">
      <div class="preview"><img src="${blobUrl}" alt="Hazırlanan hikâye görseli"></div>
      <div class="sactions">
        <button class="btn main" data-sdl>⬇️ Görseli indir</button>
        ${canShare ? '<button class="btn" data-sshare>📤 Paylaş</button>' : ''}
        <button class="btn" data-sre ${canShare ? '' : 'style="grid-column:1/-1"'}>🔄 Başka alıntılar</button>
      </div>
      <p class="snote">Alıntılar yapay zekâ ile kitaptan hatırlanıyor, paylaşmadan önce kontrol et. Durumu (Başladım / Okuyorum / Bitirdim) yukarıdan değiştirirsen görsel anında yenilenir. iPhone'da indirme olmazsa görsele uzun basıp "Fotoğraflara Ekle"yi seç.</p>
    </div>`;
  }

  const ascii = t => String(t || '').toLocaleLowerCase('tr').replace(/[ığüşöç]/g, ch => ({ 'ı': 'i', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c' }[ch])).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const fname = () => `satir-arasi-${ST[status].name}-${ascii(result.title).slice(0, 40) || 'kitap'}.jpg`;

  $('#sout').addEventListener('click', async e => {
    if (e.target.closest('[data-sdl]') && lastBlob) {
      const a = document.createElement('a'); a.href = blobUrl; a.download = fname(); document.body.appendChild(a); a.click(); a.remove();
      toast('Görsel indiriliyor…');
    } else if (e.target.closest('[data-sshare]') && lastBlob) {
      try { await navigator.share({ files: [new File([lastBlob], fname(), { type: 'image/jpeg' })], title: result.title }); }
      catch (err) { if (err.name !== 'AbortError') toast('Paylaşılamadı, indirmeyi dene.'); }
    } else if (e.target.closest('[data-sre]')) generate(true);
  });

  $('#sgo').addEventListener('click', () => generate(false));

  // Test için dışarı açılan küçük yardımcı
  window.__story = { W, H };
})();
