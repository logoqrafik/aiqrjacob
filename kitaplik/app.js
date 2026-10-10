(() => {
  'use strict';
  const C = window.CONFIG;
  const KEY = 'raf.v1';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const today = () => new Date().toISOString().slice(0, 10);
  const STATUS = { reading: 'Okuyorum', want: 'Okunacak', done: 'Okudum', wish: 'İstek' };

  // ---------- durum ----------
  let S = load();
  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY));
      if (d && Array.isArray(d.books)) return { books: d.books, seen: d.seen || [] };
    } catch (e) { /* boş başla */ }
    return { books: [], seen: [] };
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Kaydedilemedi, depolama dolu olabilir.'); }
  }
  const byId = id => S.books.find(b => b.id === id);

  let view = 'raf', filter = 'all', q = '';

  // ---------- yardımcılar ----------
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 2800);
  }
  const norm = s => String(s || '').toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  function findDup(c) {
    return S.books.find(b => (c.isbn && b.isbn === c.isbn) ||
      (norm(b.title) === norm(c.title) && norm((b.authors || [])[0]) === norm((c.authors || [])[0])));
  }
  function coverHTML(b, cls = '') {
    return b.cover
      ? `<img class="cover ${cls}" src="${esc(b.cover)}" alt="" loading="lazy" referrerpolicy="no-referrer">`
      : `<div class="cover ${cls}">${esc(b.title)}</div>`;
  }
  const finishedThisYear = () => S.books.filter(b => b.status === 'done' && b.finishedAt && b.finishedAt.slice(0, 4) === String(new Date().getFullYear()));
  const daysSince = d => Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 864e5));

  // ---------- kitap arama ----------
  async function searchBooks(text) {
    const raw = text.replace(/[-\s]/g, '');
    const isIsbn = /^(\d{13}|\d{9}[\dXx])$/.test(raw);
    let out = [];
    try {
      const url = 'https://www.googleapis.com/books/v1/volumes?maxResults=10&printType=books&q=' +
        (isIsbn ? 'isbn:' + raw : encodeURIComponent(text));
      const j = await (await fetch(url)).json();
      out = (j.items || []).map(it => {
        const v = it.volumeInfo || {};
        const id13 = (v.industryIdentifiers || []).find(x => x.type === 'ISBN_13');
        const idAny = (v.industryIdentifiers || [])[0];
        return {
          isbn: (id13 || idAny || {}).identifier || (isIsbn ? raw : ''),
          title: [v.title, v.subtitle].filter(Boolean).join(': '),
          authors: v.authors || [],
          pages: v.pageCount || 0,
          cover: ((v.imageLinks || {}).thumbnail || '').replace('http://', 'https://')
        };
      });
    } catch (e) { /* yedeğe geç */ }
    if (!out.length && isIsbn) {
      try {
        const j = await (await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${raw}&format=json&jscmd=data`)).json();
        const d = j['ISBN:' + raw];
        if (d) out = [{ isbn: raw, title: d.title, authors: (d.authors || []).map(a => a.name), pages: d.number_of_pages || 0, cover: (d.cover || {}).medium || '' }];
      } catch (e) { /* sonuç yok */ }
    }
    return out;
  }

  // ---------- barkod ----------
  const canScan = 'BarcodeDetector' in window && navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
  async function scanIsbn(title) {
    const el = $('#scan');
    el.innerHTML = `<video playsinline muted></video><div class="frame"></div>
      <div class="hud"><b>${esc(title)}</b><button data-scan-close style="color:#fff;font-size:15px">Kapat</button></div>`;
    el.hidden = false;
    let stream, stopped = false;
    const done = v => { stopped = true; if (stream) stream.getTracks().forEach(t => t.stop()); el.hidden = true; el.innerHTML = ''; return v; };
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    } catch (e) { toast('Kameraya izin verilmedi.'); return done(null); }
    const video = $('video', el);
    video.srcObject = stream; await video.play();
    const det = new BarcodeDetector({ formats: ['ean_13', 'ean_8'] });
    return new Promise(res => {
      el.querySelector('[data-scan-close]').onclick = () => res(done(null));
      (async function loop() {
        while (!stopped) {
          try {
            const r = await det.detect(video);
            if (r.length) return res(done(r[0].rawValue));
          } catch (e) { /* devam */ }
          await new Promise(r => setTimeout(r, 250));
        }
      })();
    });
  }

  // ---------- ekran: raf ----------
  function renderRaf() {
    const reading = S.books.find(b => b.status === 'reading');
    let list = S.books.filter(b => filter === 'all' ? b.status !== 'wish' : b.status === filter);
    if (q) list = list.filter(b => norm(b.title + ' ' + (b.authors || []).join(' ')).includes(norm(q)));
    list.sort((a, b) => (b.addedAt || '').localeCompare(a.addedAt || ''));

    const pct = reading && reading.pages ? Math.min(100, Math.round((reading.page || 0) / reading.pages * 100)) : 0;
    const nowCard = reading ? `
      <div class="now" data-open="${reading.id}">
        ${coverHTML(reading, 'sm')}
        <div class="meta">
          <div class="muted small">Şu an</div>
          <div class="t">${esc(reading.title)}</div>
          <div class="muted small">${esc((reading.authors || []).join(', '))}</div>
          <div class="bar"><i style="width:${pct}%"></i></div>
          <div class="small muted">${reading.page || 0}${reading.pages ? ' / ' + reading.pages : ''} sayfa${reading.pages ? ' · %' + pct : ''}</div>
        </div>
      </div>` : '';

    const chips = [['all', 'Raf'], ['reading', 'Okuyorum'], ['want', 'Okunacak'], ['done', 'Okudum'], ['wish', 'İstek']]
      .map(([k, n]) => `<button class="chip ${filter === k ? 'on' : ''}" data-filter="${k}">${n}</button>`).join('');

    const grid = list.length ? `<div class="grid">${list.map(b => `
      <button class="book" data-open="${b.id}">
        ${coverHTML(b)}
        <div class="bt">${esc(b.title)}</div>
        ${b.lent ? '<span class="tag lent">ödünçte</span>' : ''}
      </button>`).join('')}</div>`
      : `<div class="empty">${S.books.length ? 'Burada bir şey yok.' : 'Raf bomboş. Kitaplar henüz gelmedi,<br>ama sen gelince gelirler.'}</div>`;

    return `${nowCard}
      <input type="search" id="q" placeholder="Kitap veya yazar ara" value="${esc(q)}">
      <div class="chips" style="margin-top:10px">${chips}</div>
      ${canScan ? '<div class="btns"><button class="btn" data-act="check">Bende var mı? (Kitapçı modu)</button></div>' : ''}
      ${grid}`;
  }

  // ---------- ekran: alıntılar ----------
  function allQuotes() {
    return S.books.flatMap(b => (b.quotes || []).map(x => ({ ...x, book: b })));
  }
  function renderQuotes() {
    const qs = allQuotes().sort((a, b) => b.at.localeCompare(a.at));
    if (!qs.length) return `<div class="empty">Alıntı defteri boş.<br>Bir kitabı açıp alıntı ekleyebilirsin.</div>`;
    const day = Math.floor(Date.now() / 864e5);
    const pick = qs[day % qs.length];
    const item = x => `<div class="quote">“${esc(x.text)}”<cite>${esc(x.book.title)}${x.page ? ' · s. ' + esc(x.page) : ''}</cite></div>`;
    return `<div class="muted small" style="margin-bottom:6px">Bugünün alıntısı</div>
      <div class="qotd">${item(pick)}</div>${qs.map(item).join('')}`;
  }

  // ---------- ekran: ödünçte ----------
  function renderLent() {
    const lent = S.books.filter(b => b.lent).sort((a, b) => a.lent.at.localeCompare(b.lent.at));
    if (!lent.length) return `<div class="empty">Kimseye kitap vermemişsin.<br>Akıllıca.</div>`;
    return lent.map(b => {
      const d = daysSince(b.lent.at);
      return `<div class="row">${coverHTML(b, 'sm')}
        <div class="grow"><b>${esc(b.title)}</b>
          <div class="muted small">${esc(b.lent.to)} · ${d === 0 ? 'bugün verildi' : d + ' gündür dışarıda'}</div>
          ${d > 60 ? '<div class="small" style="color:var(--accent)">Nazikçe hatırlatma vakti.</div>' : ''}
        </div>
        <button class="btn" data-return="${b.id}">Geri geldi</button></div>`;
    }).join('');
  }

  // ---------- ekran: yıl ----------
  function paceLine(perMonth, monthCount) {
    const now = new Date();
    const left = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
    if (monthCount >= perMonth) return `Bu ay hedef tamam (${monthCount}/${perMonth}). Dinlenebilirsin, ama dinlenmeyeceksin.`;
    return `Bu ay ${monthCount}/${perMonth}. Ayın bitmesine ${left} gün var. Ben yetişemem, sen yetişirsin.`;
  }
  function renderYear() {
    const fin = finishedThisYear();
    const pages = fin.reduce((a, b) => a + (b.pages || 0), 0);
    const rated = fin.filter(b => b.rating);
    const avg = rated.length ? (rated.reduce((a, b) => a + b.rating, 0) / rated.length).toFixed(1) : '–';
    const longest = fin.slice().sort((a, b) => (b.pages || 0) - (a.pages || 0))[0];
    const months = Array(12).fill(0);
    fin.forEach(b => months[+b.finishedAt.slice(5, 7) - 1]++);
    const max = Math.max(C.perMonth, ...months);
    const mn = ['O', 'Ş', 'M', 'N', 'M', 'H', 'T', 'A', 'E', 'E', 'K', 'A'];
    const bars = months.map((n, i) => `<div class="m"><span>${n || ''}</span><i class="${n >= C.perMonth ? 'hit' : ''}" style="height:${n / max * 100}%"></i><span>${mn[i]}</span></div>`).join('');
    const monthCount = months[new Date().getMonth()];
    return `<h2>${new Date().getFullYear()}</h2>
      <div class="stats">
        <div class="stat"><b>${fin.length}</b><span class="muted small">kitap</span></div>
        <div class="stat"><b>${pages.toLocaleString('tr')}</b><span class="muted small">sayfa</span></div>
        <div class="stat"><b>${avg}</b><span class="muted small">ort. puan</span></div>
      </div>
      <div class="muted small">${esc(paceLine(C.perMonth, monthCount))}</div>
      <div class="months">${bars}</div>
      <div class="muted small">Turuncu: aylık hedefi (${C.perMonth}) tutturduğun aylar.</div>
      ${longest && longest.pages ? `<p class="small muted">En uzun kitap: <b>${esc(longest.title)}</b> (${longest.pages} sayfa)</p>` : ''}
      <div class="btns" style="margin-top:22px">
        <button class="btn" data-act="export">Yedekle</button>
        <button class="btn" data-act="import">Yedekten yükle</button>
      </div>
      <div class="small muted">Her şey sadece bu telefonda saklanır. Arada yedek almak iyi fikir.</div>
      <div class="credit">${esc(C.footer)}<br>— ${esc(C.giver)}</div>`;
  }

  // ---------- ana render ----------
  function render() {
    $('#hello').textContent = `Merhaba ${C.friend}. ${C.greetings[Math.floor(Date.now() / 864e5) % C.greetings.length]}`;
    $('#main').innerHTML = { raf: renderRaf, alinti: renderQuotes, odunc: renderLent, yil: renderYear }[view]();
    document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.view === view));
    document.querySelector('.fab').style.display = view === 'raf' ? '' : 'none';
  }

  // ---------- sheet ----------
  function openSheet(html) { const s = $('#sheet'); delete s.dataset.id; delete s.dataset.pending; s.innerHTML = `<div class="panel">${html}</div>`; s.hidden = false; }
  function closeSheet() { $('#sheet').hidden = true; $('#sheet').innerHTML = ''; render(); }

  function showLetter(n) {
    const msg = C.milestones[n];
    openSheet(`<div class="big">${n}</div>
      <div class="letter">${esc(msg)}<div class="sign">— ${esc(C.giver)}</div></div>
      <div class="btns"><button class="btn pri" data-close style="width:100%">Teşekkürler</button></div>`);
  }

  function openBook(id) {
    const b = byId(id); if (!b) return;
    const stars = [1, 2, 3, 4, 5].map(n => `<button class="${(b.rating || 0) >= n ? 'on' : ''}" data-star="${n}">★</button>`).join('');
    openSheet(`
      <div class="head"><div class="muted small">${esc(STATUS[b.status])}</div><button data-close class="btn">Kapat</button></div>
      <div class="row" style="border:0">${coverHTML(b, 'sm')}<div class="grow"><h2>${esc(b.title)}</h2><div class="muted">${esc((b.authors || []).join(', '))}</div>${b.pages ? `<div class="muted small">${b.pages} sayfa</div>` : ''}</div></div>
      <div class="chips">${Object.entries(STATUS).map(([k, n]) => `<button class="chip ${b.status === k ? 'on' : ''}" data-status="${k}">${n}</button>`).join('')}</div>
      ${b.status === 'reading' ? `<label class="l">Kaçıncı sayfadasın?</label><input type="number" inputmode="numeric" id="pg" min="0" value="${b.page || 0}">` : ''}
      ${b.status === 'done' ? `<label class="l">Bitirme tarihi</label><input type="date" id="fin" value="${esc(b.finishedAt || today())}">
        <label class="l">Puan</label><div class="stars">${stars}</div>` : ''}
      ${!b.pages ? `<label class="l">Sayfa sayısı</label><input type="number" inputmode="numeric" id="tp" min="0" placeholder="Biliyorsan yaz">` : ''}
      <label class="l">Notlar</label><textarea id="nt" placeholder="Bu kitap hakkında aklında kalanlar">${esc(b.notes || '')}</textarea>
      <label class="l">Alıntılar</label>
      ${(b.quotes || []).map((x, i) => `<div class="quote">“${esc(x.text)}”<cite>${x.page ? 's. ' + esc(x.page) + ' · ' : ''}<button data-delq="${i}" style="color:var(--accent)">sil</button></cite></div>`).join('')}
      <textarea id="qt" placeholder="Alıntıyı buraya yaz" style="margin-top:8px"></textarea>
      <div style="display:flex;gap:8px;margin-top:8px"><input id="qp" placeholder="Sayfa" style="width:90px"><button class="btn" data-addq style="flex:1">Alıntı ekle</button></div>
      <label class="l">Ödünç</label>
      ${b.lent ? `<div class="small">${esc(b.lent.to)} kişisine verildi (${daysSince(b.lent.at)} gün önce).</div><div class="btns"><button class="btn" data-return="${b.id}" data-keep>Geri geldi</button></div>`
        : `<div style="display:flex;gap:8px"><input id="lt" placeholder="Kime verdin?"><button class="btn" data-lend>Ver</button></div>`}
      <div class="btns" style="margin-top:22px"><button class="btn danger" data-del>Kitabı sil</button></div>`);
    $('#sheet').dataset.id = id;
  }

  // ---------- ekleme sheet'i ----------
  let addStatus = 'want';
  function openAdd(prefill = '') {
    openSheet(`
      <div class="head"><h2>Kitap ekle</h2><button data-close class="btn">Kapat</button></div>
      <div class="chips">${Object.entries(STATUS).map(([k, n]) => `<button class="chip ${addStatus === k ? 'on' : ''}" data-addstatus="${k}">${n}</button>`).join('')}</div>
      ${canScan ? '<div class="btns"><button class="btn pri" data-act="scan-add" style="width:100%">Barkodu tara</button></div>' : '<div class="small muted">Bu tarayıcıda barkod okuma yok. ISBN yazarak ya da adıyla arayabilirsin.</div>'}
      <div style="display:flex;gap:8px;margin-top:10px"><input id="sq" placeholder="ISBN ya da kitap adı" value="${esc(prefill)}"><button class="btn" data-search>Ara</button></div>
      <div id="res"></div>
      <div class="btns"><button class="btn" data-manual>Bulamadın mı? Elle ekle</button></div>`);
    if (prefill) doSearch();
  }
  let lastResults = [];
  async function doSearch() {
    const text = ($('#sq') || {}).value?.trim(); if (!text) return;
    $('#res').innerHTML = '<div class="empty">Aranıyor…</div>';
    lastResults = await searchBooks(text);
    $('#res').innerHTML = lastResults.length
      ? lastResults.map((r, i) => `<div class="row">${coverHTML(r, 'sm')}<div class="grow"><b>${esc(r.title)}</b><div class="muted small">${esc(r.authors.join(', '))}${r.pages ? ' · ' + r.pages + ' s.' : ''}</div></div><button class="btn pri" data-pick="${i}">Ekle</button></div>`).join('')
      : '<div class="empty">Bulunamadı. Elle ekleyebilirsin.</div>';
  }
  function addBook(c, status) {
    const dup = findDup(c);
    if (dup) {
      if (dup.status === 'wish' && status !== 'wish') {
        dup.status = status; dup.addedAt = new Date().toISOString(); save();
        toast('İstek listesinden rafa taşındı.'); return dup;
      }
      toast('Bu kitap zaten rafında: ' + dup.title); return null;
    }
    const b = { id: uid(), isbn: c.isbn || '', title: c.title || 'Adsız', authors: c.authors || [], cover: c.cover || '', pages: c.pages || 0,
      status, page: 0, rating: 0, notes: '', quotes: [], lent: null, addedAt: new Date().toISOString(), finishedAt: status === 'done' ? today() : '' };
    S.books.push(b); save(); toast('Rafa eklendi.'); return b;
  }

  // "Bende var mı?" kitapçı modu
  async function checkOwned() {
    const isbn = await scanIsbn('Barkodu okut');
    if (!isbn) return;
    const own = S.books.find(b => b.isbn === isbn && b.status !== 'wish');
    if (own) { openSheet(`<div class="letter">Bu sende var. ✓<br><b>${esc(own.title)}</b></div><div class="btns"><button class="btn pri" data-close style="width:100%">Tamam</button></div>`); return; }
    const r = (await searchBooks(isbn))[0];
    openSheet(`<div class="letter">Bu sende yok.<br><b>${esc(r ? r.title : isbn)}</b></div>
      <div class="btns"><button class="btn pri" data-quickwish style="flex:1">İstek listesine ekle</button><button class="btn" data-close>Kapat</button></div>`);
    $('#sheet').dataset.pending = JSON.stringify(r || { isbn, title: 'ISBN ' + isbn });
  }

  // ---------- olaylar ----------
  document.addEventListener('click', async e => {
    const t = e.target.closest('button, [data-open]'); if (!t) return;
    const d = t.dataset;
    const sid = $('#sheet').dataset.id;

    if (d.view) { view = d.view; return render(); }
    if (d.filter) { filter = d.filter; return render(); }
    if (d.open) return openBook(d.open);
    if ('close' in d) return closeSheet();
    if (d.act === 'add') return openAdd();
    if (d.act === 'check') return checkOwned();
    if (d.act === 'scan-add') { const isbn = await scanIsbn('Barkodu okut'); if (isbn) { $('#sq').value = isbn; doSearch(); } return; }
    if (d.act === 'export') {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }));
      a.download = `raf-yedek-${today()}.json`; a.click(); return;
    }
    if (d.act === 'import') {
      const i = document.createElement('input'); i.type = 'file'; i.accept = 'application/json';
      i.onchange = async () => {
        try {
          const j = JSON.parse(await i.files[0].text());
          if (!Array.isArray(j.books)) throw 0;
          S = { books: j.books, seen: j.seen || [] }; save(); render(); toast('Yedek yüklendi.');
        } catch (err) { toast('Bu dosya geçerli bir yedek değil.'); }
      }; i.click(); return;
    }
    if (d.addstatus) { addStatus = d.addstatus; document.querySelectorAll('[data-addstatus]').forEach(c => c.classList.toggle('on', c.dataset.addstatus === addStatus)); return; }
    if ('search' in d) return doSearch();
    if (d.pick) { const b = addBook(lastResults[+d.pick], addStatus); if (b) { closeSheet(); } return; }
    if ('manual' in d) {
      const title = prompt('Kitabın adı?'); if (!title) return;
      const author = prompt('Yazarı? (boş bırakabilirsin)') || '';
      const b = addBook({ title, authors: author ? [author] : [] }, addStatus); if (b) closeSheet(); return;
    }
    if ('quickwish' in d) {
      const c = JSON.parse($('#sheet').dataset.pending); addBook(c, 'wish'); return closeSheet();
    }
    if (d.return) {
      const b = byId(d.return); if (b) { b.lent = null; save(); toast('Kitap eve döndü.'); }
      return 'keep' in d ? openBook(d.return) : render();
    }
    // aşağıdakiler açık kitap için
    const b = sid && byId(sid); if (!b) return;
    if (d.status) {
      const was = b.status; b.status = d.status;
      if (d.status === 'done') { b.finishedAt = b.finishedAt || today(); if (b.pages) b.page = b.pages; }
      if (d.status === 'reading' && !b.page) b.page = 0;
      save(); openBook(b.id);
      if (d.status === 'done' && was !== 'done') {
        const n = S.books.filter(x => x.status === 'done').length;
        if (C.milestones[n] && !S.seen.includes(n)) { S.seen.push(n); save(); setTimeout(() => showLetter(n), 350); }
      }
      return;
    }
    if (d.star) { b.rating = b.rating === +d.star ? 0 : +d.star; save(); return openBook(b.id); }
    if ('addq' in d) {
      const text = $('#qt').value.trim(); if (!text) return;
      (b.quotes = b.quotes || []).push({ text, page: $('#qp').value.trim(), at: new Date().toISOString() }); save(); return openBook(b.id);
    }
    if (d.delq) { b.quotes.splice(+d.delq, 1); save(); return openBook(b.id); }
    if ('lend' in d) {
      const to = $('#lt').value.trim(); if (!to) return toast('Kime verdiğini yaz.');
      b.lent = { to, at: today() }; save(); return openBook(b.id);
    }
    if ('del' in d) {
      if (confirm('Bu kitap silinsin mi?')) { S.books = S.books.filter(x => x.id !== b.id); save(); closeSheet(); }
    }
  });

  document.addEventListener('input', e => { if (e.target.id === 'q') { q = e.target.value; const pos = e.target.selectionStart; render(); const n = $('#q'); n.focus(); n.setSelectionRange(pos, pos); } });
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'sq') doSearch(); });
  document.addEventListener('change', e => {
    const id = $('#sheet').dataset.id, b = id && byId(id); if (!b) return;
    if (e.target.id === 'pg') b.page = Math.max(0, +e.target.value || 0);
    else if (e.target.id === 'fin') b.finishedAt = e.target.value || today();
    else if (e.target.id === 'nt') b.notes = e.target.value;
    else if (e.target.id === 'tp') { b.pages = Math.max(0, +e.target.value || 0); }
    else return;
    save();
  });

  render();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
