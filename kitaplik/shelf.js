// "Rafım" sekmesi: okuma günlüğü, hedef, okunacaklar, favori alıntılar, notlar, paylaşım kartları, yedek.
// Her şey bu cihazda (localStorage) saklanır. Kişisel metinler config.js içinde.
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const C = window.CONFIG || {};
  const nk = s => window.SA.norm(s);
  const toast = m => { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 2400); };
  const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const STATUS = { read: 'Okudum', reading: 'Okuyorum', want: 'Okunacak' };
  const RANK = { want: 0, reading: 1, read: 2 };
  const KEY = 'sa.lib';
  const blank = () => ({ books: [], favs: [], notes: [], goal: 5, wm: { mode: 'lotus', text: '' }, seen: {} });
  let lib = (() => { try { const d = JSON.parse(localStorage.getItem(KEY)); return d && typeof d === 'object' ? { ...blank(), ...d } : blank(); } catch (e) { return blank(); } })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(lib)); } catch (e) { toast('Kaydedilemedi, depolama dolu olabilir.'); } document.dispatchEvent(new CustomEvent('sa-lib')); };
  const uid = p => p + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  const CVP = [['#5f63d6', '#8d63cc'], ['#8d63cc', '#c4678c'], ['#c4678c', '#d99a52'], ['#3f9d98', '#5f63d6'], ['#d99a52', '#3f9d98']];
  const hash = s => [...String(s)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const ymOf = ts => { const d = new Date(ts); return d.getFullYear() * 12 + d.getMonth(); };
  const fmtDay = ts => new Date(ts).toLocaleDateString('tr', { day: 'numeric', month: 'long', year: 'numeric' });

  // ---------- veri ----------
  const find = t => lib.books.find(b => nk(b.title) === nk(t));
  const readBooks = () => lib.books.filter(b => b.status === 'read');
  const doneIn = (y, m) => readBooks().filter(b => b.done && ymOf(b.done) === y * 12 + m);
  const doneInYear = y => readBooks().filter(b => b.done && new Date(b.done).getFullYear() === y);
  function thumbFrom(img, maxH = 260) {
    try {
      const k = Math.min(1, maxH / (img.naturalHeight || img.height)), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round((img.naturalWidth || img.width) * k)); c.height = Math.max(1, Math.round((img.naturalHeight || img.height) * k));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.72);
    } catch (e) { return ''; }
  }
  function addBook(b) {
    const t = String(b.title || '').trim(); if (!t) return null;
    let x = find(t); const wasRead = !!x && x.status === 'read';
    if (!x) { x = { id: uid('b'), title: t.slice(0, 120), author: String(b.author || '').trim().slice(0, 80), status: b.status || 'want', at: Date.now(), rating: 0, note: '', thumb: b.thumb || '' }; lib.books.unshift(x); }
    else {
      if (b.author && !x.author) x.author = String(b.author).trim().slice(0, 80);
      if (b.thumb && !x.thumb) x.thumb = b.thumb;
      if (b.status && RANK[b.status] > RANK[x.status]) x.status = b.status; // yalnızca yukarı: okuduğunu "okunacak"a düşürmez
    }
    if (x.status === 'read' && !x.done) x.done = Date.now();
    save(); if (x.status === 'read' && !wasRead) celebrate(); return x;
  }
  function setStatus(id, st) {
    const x = lib.books.find(b => b.id === id); if (!x) return;
    const was = x.status; x.status = st; x.done = st === 'read' ? (x.done || Date.now()) : 0;
    save(); if (st === 'read' && was !== 'read') celebrate();
  }
  const isFav = q => lib.favs.some(f => f.q === q);
  function toggleFav(q, title, author) {
    const i = lib.favs.findIndex(f => f.q === q);
    if (i >= 0) lib.favs.splice(i, 1); else lib.favs.unshift({ q, title: title || '', author: author || '', at: Date.now() });
    save(); return i < 0;
  }
  function markLayer(fy) {
    const w = lib.wm || {};
    if (w.mode === 'text' && String(w.text || '').trim()) return { type: 'text', wm: true, text: String(w.text).trim().slice(0, 30), font: 'Cormorant Garamond', italic: true, bold: true, size: 44, rot: 0, color: '#ffffff', align: 'center', w: 70, lh: 120, box: false, boxColor: '#0e0e20', boxA: 46, boxPad: 30, shadow: true, shB: 8, fx: 0.5, fy };
    return { type: 'lotus', wm: true, size: 112, rot: 0, color: '#ffffff', alpha: 80, shadow: true, shB: 8, fx: 0.5, fy };
  }

  // ---------- sürpriz kartlar ----------
  function celebrate() {
    const n = readBooks().length, now = new Date(), gk = 'g' + now.getFullYear() + '-' + now.getMonth(), S = C.surprises || {};
    let text = '';
    if (S[n] && !lib.seen['n' + n]) { lib.seen['n' + n] = 1; text = S[n]; }
    else if (lib.goal > 0 && doneIn(now.getFullYear(), now.getMonth()).length >= lib.goal && !lib.seen[gk] && C.goalMsg) { lib.seen[gk] = 1; text = C.goalMsg; }
    if (!text) return;
    try { localStorage.setItem(KEY, JSON.stringify(lib)); } catch (e) { /* önemsiz */ }
    const o = document.createElement('div'); o.className = 'surprise';
    o.innerHTML = `<div class="sp-card" role="dialog" aria-label="Sürpriz"><div class="sp-ico">🎁</div><p>${esc(text)}</p><small>— ${esc(C.giver || '')}</small><button class="btn2 main">Teşekkürler ❤️</button></div>`;
    o.addEventListener('click', e => { if (e.target === o || e.target.closest('button')) o.remove(); });
    document.body.appendChild(o);
  }

  // ---------- istatistik ----------
  function streak() {
    const goal = Math.max(1, lib.goal | 0), cnt = k => readBooks().filter(b => b.done && ymOf(b.done) === k).length;
    let k = ymOf(Date.now()), c = 0; if (cnt(k) < goal) k--;
    while (cnt(k) >= goal && c < 600) { c++; k--; }
    return c;
  }

  // ---------- çizim yardımcıları (alıntı tasarımı) ----------
  const W = 1080, H = 1920;
  const PALS = [['#12142b', '#251c4a', '#3d2250'], ['#0f1f2a', '#12384a', '#1f5d62'], ['#1c1316', '#3a1f2b', '#5a2a3a'], ['#14110f', '#2b2118', '#4a3524']];
  const mkCanvas = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  function bgCanvas(i = 0) {
    const c = mkCanvas(), x = c.getContext('2d'), p = PALS[i % PALS.length], g = x.createLinearGradient(0, 0, W * 0.6, H);
    g.addColorStop(0, p[0]); g.addColorStop(0.55, p[1]); g.addColorStop(1, p[2]); x.fillStyle = g; x.fillRect(0, 0, W, H);
    [[W * 0.9, H * 0.1, 640, 'rgba(95,99,214,.33)'], [W * 0.05, H * 0.86, 680, 'rgba(196,103,140,.26)'], [W * 0.95, H * 0.58, 520, 'rgba(63,157,152,.2)']].forEach(([cx, cy, r, col]) => {
      const rg = x.createRadialGradient(cx, cy, 0, cx, cy, r); rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = rg; x.fillRect(0, 0, W, H);
    });
    return c;
  }
  const base = { type: 'text', rot: 0, italic: false, bold: false, color: '#ffffff', align: 'center', w: 80, lh: 130, box: false, boxColor: '#0e0e20', boxA: 46, boxPad: 30, shadow: true, shB: 10, font: 'Outfit', fx: 0.5, fy: 0.5 };
  const T = (text, size, o = {}) => ({ ...base, text, size, ...o });
  const api = () => window.__studioApi;
  const meas = L => api().measureLayer(L);

  async function quoteDesign(text, src) {
    const c = bgCanvas(hash(text)), n = text.length, size = n < 60 ? 80 : n < 120 ? 66 : n < 200 ? 54 : 44;
    const mark = T('“', 220, { font: 'Playfair Display', bold: true, color: '#c4678c', shadow: false, fy: 0.27 });
    const main = T(text, size, { font: 'Playfair Display', italic: true, w: 80, lh: 140 });
    const layers = [mark, main]; if (src) layers.push(T(src, 36, { color: '#cfd3e6', w: 80, shadow: false }));
    await api().fontsFor(layers);
    const mm = meas(main); main.fy = 0.5; if (src) { const s = layers[2], sm = meas(s); s.fy = (0.5 * H + mm.hh + 40 + sm.hh) / H; }
    mark.fy = (0.5 * H - mm.hh - 90) / H;
    layers.push(markLayer(0.955)); return { bg: c, layers };
  }
  async function toStudio(d) {
    if (!window.__studioImport) return toast('Tasarım aracı yüklenemedi, sayfayı yenile.');
    try { await api().fontsFor(d.layers); const ok = await window.__studioImport({ photo: d.bg.toDataURL('image/jpeg', 0.9), layers: d.layers }); if (ok) { $('[data-tab="studio"]').click(); toast('Tasarım sekmesinde düzenleyebilirsin 🎨'); } }
    catch (e) { toast('Tasarım açılamadı: ' + e.message); }
  }

  // ---------- görünüm ----------
  let view = { shelf: 'read', open: null, kind: 'done', rand: null, card: null };
  const root = () => $('#tab-shelf');
  const ratingStr = n => n ? `<span class="rt">${'★'.repeat(n)}</span>` : '';
  function secGoal() {
    const now = new Date(), y = now.getFullYear(), m = now.getMonth(), n = doneIn(y, m).length, goal = Math.max(1, lib.goal | 0), pct = Math.min(100, Math.round(n / goal * 100)), yc = doneInYear(y).length, st = streak();
    const first = new Date(y, m, 1), off = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate(), on = new Set(doneIn(y, m).map(b => new Date(b.done).getDate()));
    let cal = ['P', 'S', 'Ç', 'P', 'C', 'C', 'P'].map(d => `<i class="dh">${d}</i>`).join('') + '<i></i>'.repeat(off);
    for (let d = 1; d <= days; d++) cal += `<i class="d ${on.has(d) ? 'on' : ''} ${d === now.getDate() ? 'today' : ''}">${d}</i>`;
    return `<section class="card st"><h3 class="st-h">${MONTHS[m]} hedefin</h3>
      <div class="goalrow"><div class="goalbig"><b>${n}</b><span>/ ${goal} kitap</span></div><div class="stepper"><button class="btn2 sq" data-goal="-1" aria-label="Hedefi azalt">−</button><button class="btn2 sq" data-goal="1" aria-label="Hedefi artır">+</button></div></div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <div class="stats"><div><b>${yc}</b><span>bu yıl</span></div><div><b>${readBooks().length}</b><span>toplam</span></div><div><b>${st ? '🔥 ' + st : '–'}</b><span>aylık seri</span></div></div>
      <div class="cal">${cal}</div></section>`;
  }
  function bookRow(b) {
    const open = view.open === b.id, p = CVP[hash(b.title) % 5];
    const th = b.thumb ? `<img src="${b.thumb}" alt="">` : `<span>${esc(b.title.slice(0, 2))}</span>`;
    let h = `<div class="bk ${open ? 'open' : ''}"><button class="bkh" data-open="${b.id}"><div class="bth" data-ct="${esc(b.title)}" data-ca="${esc(b.author)}" style="background:linear-gradient(150deg,${p[0]},${p[1]})">${th}</div><div class="bki"><b>${esc(b.title)}</b><span>${esc(b.author || '—')}</span><small>${STATUS[b.status]}${b.done ? ' · ' + fmtDay(b.done) : ''} ${ratingStr(b.rating)}</small></div></button>`;
    if (open) {
      h += `<div class="bkx">`;
      h += `<div class="stars" aria-label="Puan">${[1, 2, 3, 4, 5].map(i => `<button class="${i <= b.rating ? 'on' : ''}" data-star="${i}" aria-label="${i} yıldız">★</button>`).join('')}</div>`;
      h += `<textarea data-note="${b.id}" placeholder="Bu kitap hakkında kısa notun (isteğe bağlı)" maxlength="400">${esc(b.note || '')}</textarea>`;
      h += `<div class="btns2">${['want', 'reading', 'read'].map(s => `<button class="btn2 ${b.status === s ? 'on' : ''}" data-st="${s}">${STATUS[s]}</button>`).join('')}</div>`;
      h += `<div class="btns2" style="margin-top:8px">${b.status === 'read' ? '<button class="btn2" data-cardof="done">🎞️ Bitirdim kartı</button>' : ''}<button class="btn2 danger" data-bdel>🗑️ Sil</button></div></div>`;
    }
    return h + '</div>';
  }
  function secShelf() {
    const cnt = s => lib.books.filter(b => b.status === s).length, list = lib.books.filter(b => b.status === view.shelf).sort((a, b) => (b.done || b.at) - (a.done || a.at));
    const chips = [['read', 'c3', '✅ Okuduklarım'], ['reading', 'c4', '📖 Okuyorum'], ['want', 'c1', '📌 Okunacaklar']].map(([s, c, l]) => `<button class="cchip ${c} ${view.shelf === s ? 'on' : ''}" data-shelf="${s}">${l} <small>${cnt(s)}</small></button>`).join('');
    return `<section class="card st"><h3 class="st-h">Rafım</h3><div class="cats" style="margin-bottom:14px">${chips}</div>
      <div class="bklist">${list.length ? list.map(bookRow).join('') : '<div class="none">Burada henüz kitap yok. Aşağıdan ekleyebilir, Hikâye sekmesinde "Bitirdim" diyerek ya da Alıntılar sekmesindeki düğmelerle de ekleyebilirsin.</div>'}</div>
      <div class="ask2">Kitap ekle</div>
      <input id="shT" placeholder="Kitap adı" autocomplete="off" maxlength="120"><input id="shA" placeholder="Yazar (isteğe bağlı)" autocomplete="off" maxlength="80">
      <div class="btns2"><button class="btn2" data-add="read">✅ Okudum</button><button class="btn2" data-add="reading">📖 Okuyorum</button><button class="btn2" data-add="want">📌 Okuyacağım</button></div></section>`;
  }
  const qItem = (kind, i, q, src) => `<div class="qi"><p>“${esc(q)}”</p>${src ? `<small>${esc(src)}</small>` : ''}<div class="qa"><button data-qdesign="${kind}:${i}">🎨 Tasarla</button><button data-qcopy="${kind}:${i}">⧉ Kopyala</button><button data-qdel="${kind}:${i}" aria-label="Sil">🗑️</button></div></div>`;
  function secFavs() {
    const rnd = view.rand ? `<div class="rand"><p>“${esc(view.rand.t)}”</p><small>${esc(view.rand.s || '')}</small><div class="qa"><button data-rdesign>🎨 Tasarla</button><button data-rcopy>⧉ Kopyala</button></div></div>` : '';
    return `<section class="card st"><h3 class="st-h">Favori alıntılarım</h3>
      <button class="btn2 wide" data-rand>🎲 Bana bir cümle ver</button>${rnd}
      ${lib.favs.length ? lib.favs.map((f, i) => qItem('f', i, f.q, [f.title, f.author].filter(Boolean).join(' · '))).join('') : '<div class="none">Alıntılar sekmesinde bir alıntının köşesindeki ♡ işaretine dokununca burada birikir.</div>'}</section>`;
  }
  function secNotes() {
    return `<section class="card st"><h3 class="st-h">Kendi alıntılarım ve notlarım</h3>
      <textarea id="nTxt" placeholder="Fiziksel kitaptan beğendiğin bir cümleyi ya da bir notu yaz" maxlength="600"></textarea>
      <div class="two"><input id="nBook" placeholder="Kitap" autocomplete="off" maxlength="120"><input id="nPage" placeholder="Sayfa" inputmode="numeric" maxlength="5"></div>
      <button class="btn2 wide" data-nadd>➕ Ekle</button>
      ${lib.notes.length ? lib.notes.map((n, i) => qItem('n', i, n.q, [n.title, n.page ? 's. ' + n.page : ''].filter(Boolean).join(' · '))).join('') : '<div class="none">Henüz kendi alıntın yok.</div>'}</section>`;
  }
  function cardOptions() {
    const now = new Date();
    if (view.kind === 'done') { const bs = readBooks().sort((a, b) => b.done - a.done); return bs.length ? bs.map(b => `<option value="${b.id}">${esc(b.title)}</option>`).join('') : ''; }
    if (view.kind === 'month') { const set = new Set([ymOf(now)]); readBooks().forEach(b => b.done && set.add(ymOf(b.done))); return [...set].sort((a, b) => b - a).map(k => `<option value="${k}">${MONTHS[k % 12]} ${Math.floor(k / 12)} (${doneIn(Math.floor(k / 12), k % 12).length} kitap)</option>`).join(''); }
    const set = new Set([now.getFullYear()]); readBooks().forEach(b => b.done && set.add(new Date(b.done).getFullYear()));
    return [...set].sort((a, b) => b - a).map(y => `<option value="${y}">${y} (${doneInYear(y).length} kitap)</option>`).join('');
  }
  function secCards() {
    const kinds = [['done', 'c3', '✅ Bitirdim kartı'], ['month', 'c1', '🗓️ Aylık özet'], ['year', 'c4', '🏆 Yılın kitapları']];
    const opts = cardOptions();
    let res = '';
    if (view.card) res = `<div class="sresult"><div class="preview"><canvas id="cardCv" width="540" height="960" aria-label="Kart önizlemesi"></canvas></div><div class="sactions"><button class="btn main" data-cdl>⬇️ Görseli indir</button><button class="btn design" data-cdesign>🎨 Tasarla</button>${window.CARDS && window.CARDS.videoMime() ? '<button class="btn" data-cvid>🎬 Video indir</button>' : ''}<button class="btn" data-creplay>↻ Tekrar oynat</button><button class="btn" data-cshare style="grid-column:1/-1">📤 Paylaş</button></div><p class="snote" id="cardNote">Kart hareketli önizleniyor. İndirdiğin görsel sabit, video ise 6 saniyelik hareketli halidir.</p></div>`;
    return `<section class="card st"><h3 class="st-h">Paylaşım kartları</h3><p class="hint" style="margin:0 0 12px;text-align:left">Gerçek kapaklar ve yazar portreleriyle hareketli 9:16 kartlar. <b>Tasarla</b> ile yazıları ve yerleri değiştirebilirsin.</p>
      <div class="cats" style="margin-bottom:12px">${kinds.map(([k, c, l]) => `<button class="cchip ${c} ${view.kind === k ? 'on' : ''}" data-kind="${k}">${l}</button>`).join('')}</div>
      ${opts ? `<select id="shSel" aria-label="Seçim">${opts}</select><button class="btn2 main wide" data-cmake style="margin:12px 0 0">✨ Kartı hazırla</button>` : '<div class="none">Önce rafına "Okudum" olarak bir kitap ekle.</div>'}${res}</section>`;
  }
  function secPicks() {
    const P = C.picks || []; if (!P.length) return '';
    return `<section class="card st"><h3 class="st-h">${esc((C.giver || '').replace(/\s*\S*$/, '') || 'Önerilerim')} önerileri</h3><p class="hint" style="margin:0 0 10px;text-align:left">Elle seçilmiş. Beğendiğin olursa okunacaklara ekle.</p>
      ${P.map((p, i) => `<div class="pick"><div class="pcv" data-ct="${esc(p.t)}" data-ca="${esc(p.a)}"></div><div class="ptx"><b>${esc(p.t)}</b><span>${esc(p.a)}</span>${p.n ? `<small>${esc(p.n)}</small>` : ''}</div>${find(p.t) ? '<em>rafında</em>' : `<button class="btn2" data-pick="${i}">📌 Ekle</button>`}</div>`).join('')}</section>`;
  }
  function secSettings() {
    const w = lib.wm || {}, standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    return `<section class="card st"><h3 class="st-h">Ayarlar</h3>
      <div class="ask2" style="margin-top:0">Tasarımlardaki filigran</div>
      <div class="cats" style="margin-bottom:10px"><button class="cchip c1 ${w.mode !== 'text' ? 'on' : ''}" data-wm="lotus">🪷 Lotus</button><button class="cchip c3 ${w.mode === 'text' ? 'on' : ''}" data-wm="text">✍️ Adım</button></div>
      <input id="shWm" placeholder="Filigranda görünecek ad (örn. @adin)" value="${esc(w.text || '')}" maxlength="30" ${w.mode === 'text' ? '' : 'hidden'}>
      <p class="hint" style="margin:0;text-align:left">Yeni hazırlanan görsellerde kullanılır. Tasarım sekmesinde yerini değiştirebilirsin.</p>
      <div class="ask2">Yedek</div>
      <div class="btns2"><button class="btn2" data-export>⬇️ Yedek al</button><label class="btn2" style="text-align:center;cursor:pointer">⬆️ Yedekten yükle<input type="file" id="shImp" accept="application/json,.json" hidden></label></div>
      <p class="hint" style="margin:8px 0 0;text-align:left">Raf, alıntılar, notlar ve kayıtlı tasarımlar bu telefonda duruyor. Telefon değiştirirsen ya da tarayıcı verisini silersen kaybolmaması için ara sıra yedek al.</p>
      ${standalone ? '' : `<div class="ask2">Ana ekrana ekle</div>${ios ? '<p class="hint" style="margin:0;text-align:left">Safari\'de <b>Paylaş</b> düğmesine, sonra <b>Ana Ekrana Ekle</b>\'ye dokun. Uygulama gibi açılır.</p>' : '<button class="btn2 wide" data-install hidden>📲 Ana ekrana ekle</button><p class="hint" id="shInstHint" style="margin:0;text-align:left">Tarayıcı menüsünden <b>Ana ekrana ekle</b>\'yi seç. Uygulama gibi açılır.</p>'}`}</section>`;
  }
  function render() {
    const r = root(); if (!r) return; stopPlayer();
    r.innerHTML = secGoal() + secShelf() + secFavs() + secNotes() + secCards() + secPicks() + secSettings();
    if (window.CARDS) window.CARDS.hydrate(r);
    const cv = $('#cardCv'); if (cv && view.card) player = window.CARDS.play(view.card.scene, cv);
  }

  // ---------- olaylar ----------
  const pool = () => [...lib.favs.map(f => ({ t: f.q, s: [f.title, f.author].filter(Boolean).join(' · ') })), ...lib.notes.map(n => ({ t: n.q, s: n.title || '' }))];
  const qOf = key => { const [k, i] = key.split(':'); return (k === 'f' ? lib.favs : lib.notes)[+i]; };
  const srcOf = q => q ? (q.title ? q.title + (q.author ? ' · ' + q.author : '') : '') : '';
  let deferred = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; const b = $('[data-install]'); if (b) { b.hidden = false; const h = $('#shInstHint'); if (h) h.hidden = true; } });

  let player = null;
  const stopPlayer = () => { if (player) { player.stop(); player = null; } };
  async function makeCard() {
    const v = $('#shSel') && $('#shSel').value, btn = $('[data-cmake]'); if (!v || !window.CARDS) return;
    btn.disabled = true; btn.textContent = 'Kapaklar ve görseller hazırlanıyor…';
    try {
      let scene;
      if (view.kind === 'done') scene = await window.CARDS.build('done', lib.books.find(b => b.id === v));
      else if (view.kind === 'month') scene = await window.CARDS.build('month', { y: Math.floor(+v / 12), m: +v % 12, books: doneIn(Math.floor(+v / 12), +v % 12) });
      else scene = await window.CARDS.build('year', { y: +v, books: doneInYear(+v) });
      stopPlayer(); view.card = { scene, name: `satir-arasi-${view.kind}-${Date.now().toString(36)}` };
      render();
    } catch (e) { toast(e.message || 'Kart hazırlanamadı.'); }
    finally { const b2 = $('[data-cmake]'); if (b2) { b2.disabled = false; b2.textContent = '✨ Kartı hazırla'; } }
  }
  async function shareBlob(blob, name, type) {
    try { await navigator.share({ files: [new File([blob], name, { type })], title: 'Satır Arası' }); } catch (err) { if (err.name !== 'AbortError') toast('Paylaşılamadı, indirmeyi dene.'); }
  }
  function saveBlob(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }

  async function exportBackup() {
    let designs = []; try { designs = window.__studioDB ? await window.__studioDB.all() : []; } catch (e) { /* önemsiz */ }
    let books = []; try { books = JSON.parse(localStorage.getItem('sa.books')) || []; } catch (e) { /* önemsiz */ }
    const blob = new Blob([JSON.stringify({ app: 'satir-arasi', v: 1, at: Date.now(), lib, books, designs })], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); const d = new Date(), p = n => String(n).padStart(2, '0');
    a.download = `satir-arasi-yedek-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('Yedek indiriliyor…');
  }
  async function importBackup(file) {
    try {
      const d = JSON.parse(await file.text());
      if (!d || d.app !== 'satir-arasi' || !d.lib) throw new Error('Bu bir Satır Arası yedeği değil.');
      if (!confirm('Mevcut raf, alıntı ve notların bu yedekle değiştirilsin mi?')) return;
      lib = { ...blank(), ...d.lib }; try { localStorage.setItem('sa.books', JSON.stringify(d.books || [])); } catch (e) { /* önemsiz */ }
      if (window.__studioDB && Array.isArray(d.designs)) for (const x of d.designs) { try { await window.__studioDB.put(x); } catch (e) { /* önemsiz */ } }
      save(); view.open = null; view.card = null; render(); toast('Yedek yüklendi ✓');
    } catch (e) { toast(e.message || 'Yedek okunamadı.'); }
  }

  document.addEventListener('click', async e => {
    if (!e.target.closest('#tab-shelf')) return;
    const t = e.target, g = s => t.closest(s);
    let el;
    if ((el = g('[data-goal]'))) { lib.goal = Math.min(30, Math.max(1, (lib.goal | 0) + +el.dataset.goal)); save(); return render(); }
    if ((el = g('[data-shelf]'))) { view.shelf = el.dataset.shelf; view.open = null; return render(); }
    if ((el = g('[data-open]'))) { view.open = view.open === el.dataset.open ? null : el.dataset.open; return render(); }
    const row = g('.bk'), bid = row && row.querySelector('[data-open]').dataset.open;
    if ((el = g('[data-star]')) && bid) { const b = lib.books.find(x => x.id === bid); b.rating = b.rating === +el.dataset.star ? 0 : +el.dataset.star; save(); return render(); }
    if ((el = g('[data-st]')) && bid) { setStatus(bid, el.dataset.st); return render(); }
    if (g('[data-bdel]') && bid) { if (confirm('Bu kitap raftan silinsin mi?')) { lib.books = lib.books.filter(x => x.id !== bid); view.open = null; save(); render(); } return; }
    if (g('[data-cardof]') && bid) { view.kind = 'done'; render(); const s = $('#shSel'); if (s) { s.value = bid; s.scrollIntoView({ behavior: 'smooth', block: 'center' }); } return; }
    if ((el = g('[data-add]'))) {
      const ti = $('#shT').value.trim(); if (!ti) return toast('Önce kitap adını yaz.');
      addBook({ title: ti, author: $('#shA').value, status: el.dataset.add }); view.shelf = el.dataset.add; render(); return toast('Rafına eklendi 📚');
    }
    if (g('[data-rand]')) { const p = pool(), src = p.length ? p : (window.DAILY ? window.DAILY.quotes.map(q => ({ t: q.t, s: q.a + ' · ' + q.s })) : []); if (!src.length) return; let n = src[Math.floor(Math.random() * src.length)]; if (src.length > 1 && view.rand && n.t === view.rand.t) n = src[(src.indexOf(n) + 1) % src.length]; view.rand = n; return render(); }
    if (g('[data-rcopy]') && view.rand) { navigator.clipboard?.writeText(`“${view.rand.t}” — ${view.rand.s}`).then(() => toast('Kopyalandı.'), () => toast('Kopyalanamadı.')); return; }
    if (g('[data-rdesign]') && view.rand) return toStudio(await quoteDesign(view.rand.t, view.rand.s));
    if ((el = g('[data-qdesign]'))) { const q = qOf(el.dataset.qdesign); if (q) toStudio(await quoteDesign(q.q, srcOf(q))); return; }
    if ((el = g('[data-qcopy]'))) { const q = qOf(el.dataset.qcopy); if (q) navigator.clipboard?.writeText(`“${q.q}”${srcOf(q) ? ' — ' + srcOf(q) : ''}`).then(() => toast('Kopyalandı.'), () => toast('Kopyalanamadı.')); return; }
    if ((el = g('[data-qdel]'))) { const [k, i] = el.dataset.qdel.split(':'); (k === 'f' ? lib.favs : lib.notes).splice(+i, 1); save(); return render(); }
    if (g('[data-nadd]')) {
      const q = $('#nTxt').value.replace(/\s*\n\s*/g, ' ').trim(); if (!q) return toast('Önce cümleyi yaz.');
      lib.notes.unshift({ q: q.slice(0, 600), title: $('#nBook').value.trim().slice(0, 120), page: $('#nPage').value.replace(/\D/g, '').slice(0, 5), at: Date.now() }); save(); render(); return toast('Eklendi ✓');
    }
    if ((el = g('[data-kind]'))) { view.kind = el.dataset.kind; view.card = null; return render(); }
    if (g('[data-cmake]')) return makeCard();
    if (g('[data-creplay]') && player) return player.replay();
    if (g('[data-cdl]') && view.card) { try { saveBlob(await window.CARDS.still(view.card.scene), view.card.name + '.jpg'); toast('Görsel indiriliyor…'); } catch (err) { toast(err.message); } return; }
    if (g('[data-cdesign]') && view.card) { const sc = view.card.scene; return toStudio({ bg: sc.bgFinal(), layers: sc.layers }); }
    if (g('[data-cshare]') && view.card) { try { return shareBlob(await window.CARDS.still(view.card.scene), view.card.name + '.jpg', 'image/jpeg'); } catch (err) { return toast(err.message); } }
    if ((el = g('[data-cvid]')) && view.card) {
      const note = $('#cardNote'); el.disabled = true; const old = el.textContent;
      try {
        const r = await window.CARDS.record(view.card.scene, p => { el.textContent = '🎬 Kaydediliyor %' + Math.round(p * 100); });
        saveBlob(r.blob, view.card.name + '.' + r.ext); toast('Video indiriliyor…');
        if (note && r.ext === 'webm') note.textContent = 'Bu tarayıcı WebM üretti. iPhone ve bazı uygulamalar bunu açmayabilir; orada Safari ile MP4 alabilirsin ya da sabit görseli kullan.';
      } catch (err) { toast(err.message || 'Video hazırlanamadı.'); }
      finally { el.disabled = false; el.textContent = old; }
      return;
    }
    if ((el = g('[data-pick]'))) { const p = (C.picks || [])[+el.dataset.pick]; if (p) { addBook({ title: p.t, author: p.a, status: 'want' }); view.shelf = 'want'; render(); toast('Okunacaklara eklendi 📌'); } return; }
    if ((el = g('[data-wm]'))) { lib.wm = { ...(lib.wm || {}), mode: el.dataset.wm }; save(); render(); const i = $('#shWm'); if (i && !i.hidden) i.focus(); return; }
    if (g('[data-export]')) return exportBackup();
    if (g('[data-install]') && deferred) { deferred.prompt(); deferred = null; return; }
  });
  document.addEventListener('change', e => {
    if (e.target.dataset && e.target.dataset.note) { const b = lib.books.find(x => x.id === e.target.dataset.note); if (b) { b.note = e.target.value.trim().slice(0, 400); save(); } }
    else if (e.target.id === 'shImp' && e.target.files[0]) { importBackup(e.target.files[0]); e.target.value = ''; }
  });
  document.addEventListener('input', e => { if (e.target.id === 'shWm') { lib.wm = { ...(lib.wm || {}), mode: 'text', text: e.target.value }; try { localStorage.setItem(KEY, JSON.stringify(lib)); } catch (x) { /* önemsiz */ } } });
  document.addEventListener('sa-open-shelf', render);
  document.addEventListener('DOMContentLoaded', () => { const b = $('[data-tab="shelf"]'); if (b) b.addEventListener('click', render); });
  if (document.readyState !== 'loading') { const b = $('[data-tab="shelf"]'); if (b) b.addEventListener('click', render); }
  render();

  window.LIB = { addBook, setStatus, has: (t, st) => { const x = find(t); return !!x && (!st || x.status === st); }, isFav, toggleFav, markLayer, thumbFrom, get state() { return lib; } };
})();
