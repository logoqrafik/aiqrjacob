(() => {
  'use strict';
  const C = window.CONFIG, D = window.DAILY, $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CATS = ['Motivasyon', 'Güçlü Kal', 'Duygusal', 'Düşündüren', 'Umut'];
  const BOOKS = 'sa.books';
  const hello = [
    'Bir kitap seç, içinden en güzel cümleleri çıkaralım.',
    'Kitabın kapağı yeter. Gerisini yapay zekâ okur.',
    'Okumaya vaktin yoksa alıntılar var. Vaktin varsa da var.'
  ];
  const wait = ['Kitap karıştırılıyor…', 'Sayfalar çevriliyor…', 'Altı çizilecek cümleler aranıyor…'];
  const loading = t => `<div class="status"><div class="dots"><i></i><i></i><i></i></div><div class="msg">${esc(t)}</div></div>`;

  const get = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* önemsiz */ } };
  const toast = m => { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 2200); };
  const dayNum = () => { const d = new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); };
  const norm = s => String(s || '').toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').replace(/[^a-z0-9]+/g, ' ').trim();

  $('#hello').textContent = `Merhaba ${C.friend}. ${hello[dayNum() % hello.length]}`;
  document.querySelector('.credit').innerHTML = `${esc(C.footer)}<br>— ${esc(C.giver)}<br><small style="opacity:.55">sürüm ${esc(C.version || '')}</small>`;

  // ---------- alıntı üretimi (sunucu: /api/quotes) + telefonda saklanan kayıtlar ----------
  // Aynı kitap bir daha sorulursa kayıttan açılır: anında, kota harcamaz.
  const recs = () => get(BOOKS, []);
  function findRec(query) {
    const n = norm(query); if (!n) return null;
    return recs().find(r => r.qn.includes(n) || norm(r.title) === n || norm(r.title + ' ' + r.author) === n) || null;
  }
  function saveRec(rec, query) {
    const qn = [...new Set([norm(query), norm(rec.title), norm(rec.title + ' ' + rec.author)].filter(Boolean))];
    const list = recs().filter(r => norm(r.title) !== norm(rec.title));
    list.unshift({ title: rec.title, author: rec.author, categories: rec.categories, qn });
    set(BOOKS, list.slice(0, 40));
  }
  async function post(body) {
    const r = await fetch('/api/quotes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => { throw new Error('Sunucu şu an yanıt vermiyor. Biraz sonra tekrar dene.'); });
    if (!r.ok) throw new Error(d.error || 'Bir şey ters gitti.');
    return d;
  }
  async function fetchBook(query) {
    const hit = findRec(query); if (hit) return hit;
    const d = await post({ query }); if (!d.found) return null;
    saveRec(d, query); return findRec(d.title) || d;
  }
  async function fetchByImage(dataUrl) {
    const d = await post({ image: dataUrl }); if (!d.found) return null;
    const hit = findRec(d.title); if (hit) return hit;
    saveRec(d, d.title); return findRec(d.title) || d;
  }
  // Fotoğrafı küçültüp JPEG'e çevir (hızlı yükleme + sunucu limiti)
  function shrink(file, max = 1280) {
    return new Promise((ok, no) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const cv = document.createElement('canvas'); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url); ok(cv.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => no(new Error('Fotoğraf okunamadı'));
      img.src = url;
    });
  }
  window.SA = { CATS, fetchBook, fetchByImage, shrink, norm };

  // ---------- günün alıntısı / kitabı ----------
  const hash = str => [...str].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const todaysBook = () => D.books[(dayNum() + 5) % D.books.length];
  function renderDaily() {
    const n = dayNum(), q = D.quotes[n % D.quotes.length], b = todaysBook();
    $('#daily').innerHTML = `
      <div class="dcard quote">
        <span class="dlabel">Günün alıntısı</span>
        <span class="qmark" aria-hidden="true">“</span>
        <div class="dq" data-q="${esc(`“${q.t}” — ${q.a}`)}">${esc(q.t)}</div>
        <div class="dsrc"><b>${esc(q.a)}</b> · ${esc(q.s)}</div>
      </div>
      <div class="dcard pick">
        <span class="dlabel">Günün kitabı</span>
        <div class="dbook">
          <div class="cover cv${hash(b.t) % 5}" data-ct="${esc(b.t)}" data-ca="${esc(b.a)}"><b>${esc(b.t)}</b><span>${esc(b.a)}</span></div>
          <div class="dinfo">
            <div class="dbt">${esc(b.t)}</div>
            <div class="dba">${esc(b.a)}</div>
            <div class="dbd">${esc(b.d)}</div>
            <button class="dbtn" data-dbook>Alıntıları getir →</button>
          </div>
        </div>
      </div>`;
    if (window.CARDS) window.CARDS.hydrate($('#daily'));
  }

  // ---------- çıktı alanı ----------
  function setOut(html) {
    document.body.classList.add('has-out');
    $('#out').innerHTML = `<button class="back" data-back>← Bugüne dön</button>${html}`;
  }
  function clearOut() {
    document.body.classList.remove('has-out');
    $('#out').innerHTML = '';
    scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------- fotoğraf ----------
  let image = '';
  $('#file').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      image = await shrink(f);
      $('#preview').src = image; $('#preview').hidden = false;
      $('#photoLabel').textContent = 'Başka fotoğraf seç';
      $('#title').value = ''; $('#author').value = '';
      go(); // fotoğraf yeterli: alıntılar hemen getirilir
    } catch (err) { toast(err.message); }
  });

  // ---------- sonuç: 5 kategori, seçilen kategorinin alıntıları ----------
  let cur = null;
  function show(rec, sel = -1) {
    cur = rec;
    const cats = rec.categories.map((c, i) => ({ ...c, i })).filter(c => c.quotes.length);
    const inLib = window.LIB && window.LIB.has(rec.title);
    let html = `<div class="book"><img class="bkcv" alt="" hidden data-ct="${esc(rec.title)}" data-ca="${esc(rec.author)}"><h2>${esc(rec.title)}</h2><div class="muted">${esc(rec.author)}</div>${window.LIB ? `<div class="bkacts"><button data-bshelf="want">${inLib ? '📚 Rafında' : '📌 Okunacaklara ekle'}</button><button data-bshelf="read">✅ Okudum</button></div>` : ''}</div>`;
    if (!cats.length) {
      html += '<div class="status">Bu kitaptan alıntı çıkaramadım.</div>';
    } else {
      html += `<div class="ask">Hangi ruh halindesin?</div><div class="cats">${cats.map(c =>
        `<button class="cchip c${c.i} ${sel === c.i ? 'on' : ''}" data-c="${c.i}">${esc(c.name)}</button>`).join('')}</div>`;
      const pick = cats.find(c => c.i === sel);
      if (pick) {
        html += `<div class="qs" style="--g:var(--g${pick.i});--glow:var(--glow${pick.i})">${pick.quotes.map((q, k) =>
          `<div class="q" style="--i:${k}" data-q="${esc(q)}">${window.LIB ? `<button class="heart ${window.LIB.isFav(q) ? 'on' : ''}" data-heart="${pick.i}:${k}" aria-label="Favorilere ekle">${window.LIB.isFav(q) ? '♥' : '♡'}</button>` : ''}“${esc(q)}”<small>Kopyalamak için dokun</small></div>`).join('')}</div>` +
          `<p class="note">Alıntılar yapay zekâ tarafından kitaptan hatırlanarak yazılıyor. Kelimesi kelimesine doğru olmayabilir, paylaşmadan önce kitaptan kontrol et. Çeviri kitaplarda ifadeler baskıya göre değişir.</p>`;
      }
    }
    setOut(html);
    if (window.CARDS) window.CARDS.hydrate($('#out'));
  }

  function renderRecent() {
    $('#recent').innerHTML = recs().map((r, i) => `<button data-h="${i}">${esc(r.title)}</button>`).join('');
  }

  async function go() {
    const title = $('#title').value.trim(), author = $('#author').value.trim();
    if (!title && !image) return toast('Fotoğraf yükle ya da kitap adını yaz.');
    $('#go').disabled = true;
    let i = 0; setOut(loading(wait[0]));
    const timer = setInterval(() => { $('#out .msg') && ($('#out .msg').textContent = wait[++i % wait.length]); }, 2500);
    try {
      const rec = title ? await fetchBook(author ? `${title} - ${author}` : title) : await fetchByImage(image);
      if (!rec) { setOut('<div class="status">Bu kitabı tanıyamadım.<br>Adını ve yazarını yazarak dene.</div>'); return; }
      show(rec); renderRecent();
    } catch (e) {
      setOut(`<div class="status">${esc(e.message)}</div>`);
    } finally { clearInterval(timer); $('#go').disabled = false; }
  }

  $('#go').addEventListener('click', go);
  ['#title', '#author'].forEach(s => $(s).addEventListener('keydown', e => { if (e.key === 'Enter') go(); }));
  document.addEventListener('click', e => {
    const ht = e.target.closest('[data-heart]');
    if (ht && cur) {
      const [ci, k] = ht.dataset.heart.split(':').map(Number), text = cur.categories[ci] && cur.categories[ci].quotes[k]; if (!text) return;
      const on = window.LIB.toggleFav(text, cur.title, cur.author); ht.classList.toggle('on', on); ht.textContent = on ? '♥' : '♡'; toast(on ? 'Favorilere eklendi ♥' : 'Favorilerden çıkarıldı'); return;
    }
    const bs = e.target.closest('[data-bshelf]');
    if (bs && cur) { window.LIB.addBook({ title: cur.title, author: cur.author, status: bs.dataset.bshelf }); bs.parentNode.firstElementChild.textContent = '📚 Rafında'; toast(bs.dataset.bshelf === 'read' ? 'Okuduklarına eklendi ✅' : 'Okunacaklara eklendi 📌'); return; }
    const q = e.target.closest('[data-q]');
    if (q) { navigator.clipboard?.writeText(q.dataset.q).then(() => toast('Kopyalandı.'), () => toast('Kopyalanamadı.')); return; }
    if (e.target.closest('[data-back]')) return clearOut();
    if (e.target.closest('[data-dbook]')) {
      const b = todaysBook(); image = ''; $('#preview').hidden = true; $('#photoLabel').textContent = 'Kitabın fotoğrafını yükle';
      $('#title').value = b.t; $('#author').value = b.a; return go();
    }
    const c = e.target.closest('[data-c]'); if (c && cur) { show(cur, +c.dataset.c); return; }
    const h = e.target.closest('[data-h]'); if (h) { show(recs()[+h.dataset.h]); scrollTo({ top: 0, behavior: 'smooth' }); }
  });
  renderDaily();
  renderRecent();
})();
