(() => {
  'use strict';
  const C = window.CONFIG, D = window.DAILY, $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const HIST = 'sa.history', CODE = 'sa.code';
  const hello = [
    'Bir kitap seç, içinden en güzel cümleleri çıkaralım.',
    'Kitabın kapağı yeter. Gerisini yapay zekâ okur.',
    'Okumaya vaktin yoksa alıntılar var. Vaktin varsa da var.'
  ];
  const wait = ['Kitap karıştırılıyor…', 'Sayfalar çevriliyor…', 'Altı çizilecek cümleler aranıyor…'];
  const loading = t => `<div class="status"><div class="dots"><i></i><i></i><i></i></div><div class="msg">${t}</div></div>`;

  // Bugünün sıra numarası (yerel saate göre, gece yarısı değişir)
  const dayNum = () => { const d = new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); };

  $('#hello').textContent = `Merhaba ${C.friend}. ${hello[dayNum() % hello.length]}`;
  document.querySelector('.credit').innerHTML = `${esc(C.footer)}<br>— ${esc(C.giver)}`;

  let image = '';
  const get = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* önemsiz */ } };
  const toast = m => { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 2000); };

  // ---------- günün alıntısı ve kitabı ----------
  const hash = str => [...str].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  function renderDaily() {
    const n = dayNum();
    const q = D.quotes[n % D.quotes.length], b = D.books[(n + 5) % D.books.length];
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
          <div class="cover cv${hash(b.t) % 5}"><b>${esc(b.t)}</b><span>${esc(b.a)}</span></div>
          <div class="dinfo">
            <div class="dbt">${esc(b.t)}</div>
            <div class="dba">${esc(b.a)}</div>
            <div class="dbd">${esc(b.d)}</div>
            <button class="dbtn" data-dbook>Alıntıları getir →</button>
          </div>
        </div>
      </div>`;
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

  // Fotoğrafı küçültüp JPEG'e çevir (hızlı yükleme + sunucu limiti)
  function shrink(file) {
    return new Promise((ok, no) => {
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, 1280 / Math.max(img.width, img.height));
        const cv = document.createElement('canvas'); cv.width = img.width * k; cv.height = img.height * k;
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url); ok(cv.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => no(new Error('Fotoğraf okunamadı'));
      img.src = url;
    });
  }

  $('#file').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      image = await shrink(f);
      $('#preview').src = image; $('#preview').hidden = false;
      $('#photoLabel').textContent = 'Başka fotoğraf seç';
    } catch (err) { toast(err.message); }
  });

  let cur = null;
  function show(d, sel = -1) {
    cur = d;
    const cats = d.categories.map((c, i) => ({ ...c, i })).filter(c => c.quotes.length);
    let html = `<div class="book"><h2>${esc(d.title)}</h2><div class="muted">${esc(d.author)}</div></div>`;
    if (!cats.length) {
      html += '<div class="status">Bu kitaptan güvenle hatırladığım alıntı yok.</div>';
    } else {
      html += `<div class="ask">Hangi ruh halindesin?</div><div class="cats">${cats.map(c =>
        `<button class="cchip c${c.i} ${sel === c.i ? 'on' : ''}" data-c="${c.i}">${esc(c.name)}</button>`).join('')}</div>`;
      const pick = cats.find(c => c.i === sel);
      if (pick) {
        html += `<div class="qs" style="--g:var(--g${pick.i});--glow:var(--glow${pick.i})">${pick.quotes.map((q, k) =>
          `<div class="q" style="--i:${k}" data-q="${esc(q)}">“${esc(q)}”<small>Kopyalamak için dokun</small></div>`).join('')}</div>` +
          `<p class="note">Alıntılar yapay zekâ (Google Gemini) tarafından kitaptan hatırlanarak yazılıyor. Kelimesi kelimesine doğru olmayabilir, kullanmadan önce kitaptan kontrol et. Çeviri kitaplarda ifadeler baskıya göre değişir.</p>`;
      }
    }
    setOut(html);
  }

  function renderRecent() {
    const h = get(HIST, []);
    $('#recent').innerHTML = h.map((x, i) => `<button data-h="${i}">${esc(x.title)}</button>`).join('');
  }

  async function go() {
    const title = $('#title').value.trim(), author = $('#author').value.trim();
    if (!image && !title) return toast('Fotoğraf yükle ya da kitap adını yaz.');
    $('#go').disabled = true;
    let i = 0; setOut(loading(wait[0]));
    const timer = setInterval(() => { $('#out .msg') && ($('#out .msg').textContent = wait[++i % wait.length]); }, 2500);
    try {
      const r = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-access-code': get(CODE, '') },
        body: JSON.stringify(image ? { image } : { title, author })
      });
      if (r.status === 401) {
        const c = prompt('Erişim kodu?'); if (c) { set(CODE, c); clearInterval(timer); $('#go').disabled = false; return go(); }
        throw new Error('Erişim kodu gerekli.');
      }
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Bir şey ters gitti.');
      if (!d.found) { setOut('<div class="status">Bu kitabı tanıyamadım. Adını ve yazarını yazarak dene.</div>'); return; }
      show(d);
      set(HIST, [d, ...get(HIST, []).filter(x => x.title !== d.title)].slice(0, 12)); renderRecent();
    } catch (e) {
      setOut(`<div class="status">${esc(e.message)}</div>`);
    } finally { clearInterval(timer); $('#go').disabled = false; }
  }

  $('#go').addEventListener('click', go);
  document.addEventListener('click', e => {
    const q = e.target.closest('[data-q]');
    if (q) { navigator.clipboard?.writeText(q.dataset.q).then(() => toast('Kopyalandı.'), () => toast('Kopyalanamadı.')); return; }
    if (e.target.closest('[data-back]')) return clearOut();
    if (e.target.closest('[data-dbook]')) {
      const b = D.books[(dayNum() + 5) % D.books.length];
      image = ''; $('#preview').hidden = true; $('#photoLabel').textContent = 'Kitabın fotoğrafını yükle';
      $('#title').value = b.t; $('#author').value = b.a; return go();
    }
    const c = e.target.closest('[data-c]');
    if (c && cur) { show(cur, +c.dataset.c); return; }
    const h = e.target.closest('[data-h]');
    if (h) { show(get(HIST, [])[+h.dataset.h]); scrollTo({ top: 0, behavior: 'smooth' }); }
  });
  renderDaily();
  renderRecent();
})();
