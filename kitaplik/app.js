(() => {
  'use strict';
  const C = window.CONFIG, D = window.DAILY, POOL = window.POOL || [];
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CATS = ['Motivasyon', 'Güçlü Kal', 'Duygusal', 'Düşündüren', 'Umut'];
  const OWN = 'sa.own', RECENT = 'sa.recent';
  const hello = [
    'Bir kitap seç, içinden en güzel cümleleri bulalım.',
    'Aradığın cümle burada ya da senin defterinde.',
    'Okumaya vaktin yoksa alıntılar var. Vaktin varsa da var.'
  ];

  const get = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const toast = m => { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 2200); };
  const dayNum = () => { const d = new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); };
  // Türkçe karakterlerden bağımsız karşılaştırma: "ozgurluk" = "Özgürlük"
  const norm = s => String(s || '').toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').replace(/[^a-z0-9]+/g, ' ').trim();
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  $('#hello').textContent = `Merhaba ${C.friend}. ${hello[dayNum() % hello.length]}`;
  document.querySelector('.credit').innerHTML = `${esc(C.footer)}<br>— ${esc(C.giver)}<br><small style="opacity:.55">sürüm ${esc(C.version || '')}</small>`;

  // ---------- kitaplık: hazır havuz + kullanıcının kendi eklediği alıntılar ----------
  function library() {
    const books = [];
    const mk = (t, a) => ({ key: norm(t) + '|' + norm(a), t, a: a || '', cats: [[], [], [], [], []] });
    POOL.forEach(p => { const b = mk(p.t, p.a); CATS.forEach((c, i) => (p.q[c] || []).forEach(q => b.cats[i].push({ q, own: false }))); books.push(b); });
    get(OWN, []).forEach(o => {
      let b = books.find(x => norm(x.t) === norm(o.t) && (!norm(o.a) || norm(x.a) === norm(o.a)));
      if (!b) { b = mk(o.t, o.a); books.push(b); }
      if (!b.a && o.a) b.a = o.a;
      (b.cats[o.c] || b.cats[2]).push({ q: o.q, own: true, id: o.id, p: o.p });
    });
    return books;
  }
  const count = b => b.cats.reduce((a, c) => a + c.length, 0);
  function find(text) {
    const toks = norm(text).split(' ').filter(Boolean);
    if (!toks.length) return [];
    const nt = norm(text);
    return library().filter(b => { const h = norm(b.t + ' ' + b.a); return toks.every(t => h.includes(t)); })
      .sort((x, y) => (norm(y.t).startsWith(nt) - norm(x.t).startsWith(nt)) || x.t.localeCompare(y.t, 'tr'));
  }
  const byKey = k => library().find(b => b.key === k);
  window.SA = { CATS, norm, library, find, count, toast, esc, get };

  function rows(list, attr) {
    return list.map(b => `<button class="srow" ${attr}="${esc(b.key)}"><b>${esc(b.t)}</b><small>${esc(b.a)}${b.a ? ' · ' : ''}${count(b)} alıntı</small></button>`).join('');
  }

  // ---------- günün alıntısı / kitabı ----------
  const hash = str => [...str].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  function todaysBook() { return D.books[(dayNum() + 5) % D.books.length]; }
  function renderDaily() {
    const n = dayNum();
    const q = D.quotes[n % D.quotes.length], b = todaysBook();
    const have = library().find(x => norm(x.t) === norm(b.t) && count(x) > 0);
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
            ${have ? `<button class="dbtn" data-open="${esc(have.key)}">Alıntılara bak →</button>`
                   : '<button class="dbtn" data-dadd>İlk alıntıyı sen ekle +</button>'}
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
    $('#out').innerHTML = ''; $('#q').value = ''; $('#sug').innerHTML = '';
    scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------- kitap sonucu ----------
  let curKey = null;
  function pushRecent(key) { set(RECENT, [key, ...get(RECENT, []).filter(k => k !== key)].slice(0, 8)); renderRecent(); }
  function show(key, sel = -1) {
    const b = byKey(key); if (!b) return;
    curKey = key; if (sel === -1) pushRecent(key);
    const cats = b.cats.map((q, i) => ({ q, i })).filter(c => c.q.length);
    let html = `<div class="book"><h2>${esc(b.t)}</h2><div class="muted">${esc(b.a)}</div></div>`;
    if (!cats.length) {
      html += `<div class="status">Bu kitapta henüz alıntı yok.</div>`;
    } else {
      html += `<div class="ask">Hangi ruh halindesin?</div><div class="cats">${cats.map(c =>
        `<button class="cchip c${c.i} ${sel === c.i ? 'on' : ''}" data-c="${c.i}">${esc(CATS[c.i])}</button>`).join('')}</div>`;
      const pick = cats.find(c => c.i === sel);
      if (pick) {
        html += `<div class="qs" style="--g:var(--g${pick.i});--glow:var(--glow${pick.i})">${pick.q.map((x, k) =>
          `<div class="q" style="--i:${k}" data-q="${esc(x.q)}">${esc(x.q)}<small>${x.own ? 'Senin eklediğin' : 'Seçki'}${x.p ? ' · s. ' + esc(x.p) : ''} · kopyalamak için dokun${x.own ? ` · <button class="del" data-del="${esc(x.id)}">sil</button>` : ''}</small></div>`).join('')}</div>` +
          `<p class="note">Şiir dizeleri ve alıntılar baskıya göre noktalama bakımından küçük farklar gösterebilir.</p>`;
      }
    }
    html += `<div class="btns2" style="margin-top:18px"><button class="btn2" data-addfor="${esc(b.key)}">➕ Bu kitaba alıntı ekle</button><button class="btn2" data-webbook="${esc(b.key)}">🌐 İnternetten doğrula</button></div><div id="webres"></div>`;
    setOut(html);
  }

  function renderRecent() {
    const lib = library();
    $('#recent').innerHTML = get(RECENT, []).map(k => lib.find(b => b.key === k)).filter(Boolean)
      .map(b => `<button data-open="${esc(b.key)}">${esc(b.t)}</button>`).join('');
  }

  // ---------- arama ----------
  $('#q').addEventListener('input', e => {
    const text = e.target.value.trim();
    if (!text) { $('#sug').innerHTML = ''; return; }
    const list = find(text).slice(0, 6);
    $('#sug').innerHTML = list.length ? rows(list, 'data-open')
      : `<div class="none">“${esc(text)}” havuzda yok.</div><button class="srow web" data-web="${esc(text)}"><b>🌐 İnternette ara</b><small>Wikiquote'ta kaynaklı alıntı bul</small></button><button class="srow add" data-addfor="" data-title="${esc(text)}">➕ Bu kitaba ilk alıntıyı ekle</button>`;
  });
  $('#q').addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const text = e.target.value.trim(), l = find(text);
    if (l.length === 1) show(l[0].key); else if (!l.length && text) doWeb(text);
  });

  // ---------- alıntı ekleme ----------
  let addCat = 2;
  function buildCatChips() {
    $('#acat').innerHTML = CATS.map((c, i) => `<button class="cchip c${i} ${i === addCat ? 'on' : ''}" data-ac="${i}">${esc(c)}</button>`).join('');
  }
  function openAdd(title = '', author = '', quote = '') {
    $('#addbox').hidden = false; buildCatChips();
    $('#titles').innerHTML = [...new Set(library().map(b => b.t))].map(t => `<option value="${esc(t)}">`).join('');
    $('#at').value = title; $('#aa').value = author; $('#aq').value = quote; $('#ap').value = '';
    $('#addbox').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => (title && !quote ? $('#aq') : $('#at')).focus(), 350);
  }
  $('#at').addEventListener('change', e => { // bilinen kitapsa yazarı otomatik doldur
    const b = library().find(x => norm(x.t) === norm(e.target.value)); if (b && !$('#aa').value) $('#aa').value = b.a;
  });
  $('#asave').addEventListener('click', () => {
    const t = $('#at').value.trim(), a = $('#aa').value.trim(), q = $('#aq').value.trim(), p = $('#ap').value.trim();
    if (!t) return toast('Kitap adını yaz.');
    if (!q) return toast('Alıntıyı yaz.');
    const own = get(OWN, []);
    if (own.some(o => norm(o.t) === norm(t) && norm(o.q) === norm(q))) return toast('Bu alıntı zaten ekli.');
    own.push({ id: uid(), t, a, c: addCat, q, p });
    if (!set(OWN, own)) return toast('Kaydedilemedi, depolama dolu olabilir.');
    $('#addbox').hidden = true; toast('Alıntı eklendi ✓');
    const b = library().find(x => norm(x.t) === norm(t) && (!norm(a) || norm(x.a) === norm(a)));
    if (b) show(b.key, addCat);
    renderDaily();
  });


  // ---------- internet araması (Wikiquote) ----------
  let webList = [], webCtx = null;
  const loadingHTML = t => `<div class="status"><div class="dots"><i></i><i></i><i></i></div><div>${esc(t)}</div></div>`;
  async function doWeb(text, key) {
    const book = key ? byKey(key) : null;
    const query = book ? (book.a || book.t) : text;      // doğrulamada yazara göre ara (kitap adı sayfada geçmeyebilir)
    webCtx = { book, text };
    if (!book) setOut(`<div class="ask">“${esc(text)}” internette aranıyor</div><div id="webres"></div>`);
    const box = $('#webres'); if (!box) return;
    box.innerHTML = loadingHTML('Wikiquote taranıyor…');
    let res;
    try { res = await window.WEB.webSearch(query); } catch (e) { res = { quotes: [], failed: 2 }; }
    let list = res.quotes;
    if (book) { // yazar sayfasından gelenleri kitap adına göre daralt; yoksa hepsini göster
      const tt = norm(book.t).split(' ').filter(Boolean);
      const narrowed = list.filter(x => tt.every(t => norm(x.work + ' ' + x.src + ' ' + x.page).includes(t)));
      if (narrowed.length) list = narrowed;
    }
    webList = list.slice(0, 12);
    if (res.failed >= 2) { box.innerHTML = '<div class="status">İnternete ulaşılamadı. Bağlantını kontrol edip tekrar dene.</div>'; return; }
    let head = '';
    if (book) { // havuzdaki alıntıları internetteki sonuçlarla karşılaştır
      let ok = 0, total = 0;
      document.querySelectorAll('#out .q[data-q]').forEach(card => {
        total++;
        const hit = res.quotes.some(w => window.WEB.similar(card.dataset.q, w.q));
        if (hit) ok++;
        const s = card.querySelector('small'); if (s && !s.querySelector('.vb')) s.insertAdjacentHTML('beforeend', hit ? ' · <span class="vb ok">✓ Wikiquote\'ta doğrulandı</span>' : ' · <span class="vb no">Wikiquote\'ta eşleşme yok</span>');
      });
      head = total ? `<div class="vsum">Görünen ${total} alıntıdan <b>${ok}</b> tanesi Wikiquote'ta bulundu. "Eşleşme yok", alıntının yanlış olduğu anlamına gelmez, o sayfada listelenmemiş olabilir.</div>` : '';
    }
    if (!webList.length) { box.innerHTML = head + `<div class="status">İnternette (Wikiquote) “${esc(query)}” için alıntı bulunamadı.<br>Kendi kitabından ekleyebilirsin.</div>` + (book ? '' : `<div class="btns2"><button class="btn2" data-addfor="" data-title="${esc(text)}">➕ Alıntı ekle</button></div>`); return; }
    box.innerHTML = head + `<div class="ask">İnternette bulunanlar <span class="muted2">· Wikiquote</span></div>` + webList.map((w, i) =>
      `<div class="wq"><div class="wqt">${esc(w.q)}</div><small>${w.lang === 'tr' ? '🇹🇷' : '🇬🇧'} ${esc(w.page)}${w.work ? ' · ' + esc(w.work) : ''}${w.src ? ' · ' + esc(w.src) : ''} · <a href="${esc(w.url)}" target="_blank" rel="noopener">kaynağı aç ↗</a></small><button class="btn2" data-wadd="${i}">➕ Havuza ekle</button></div>`).join('')
      + (res.failed ? '<p class="note">Dillerden biri şu an yanıt vermedi, sonuçlar eksik olabilir.</p>' : '') + '<p class="note">Wikiquote topluluk tarafından hazırlanan, kaynak gösteren bir alıntı sitesidir. İngilizce sonuçlar çeviri değildir.</p>';
  }
  function addFromWeb(i) {
    const w = webList[i]; if (!w) return;
    const ctx = webCtx || {};
    const t = ctx.book ? ctx.book.t : (w.work || ctx.text || w.page), au = ctx.book ? ctx.book.a : (w.work ? w.page : '');
    openAdd(t, au, w.q);
  }

  // ---------- yedek ----------
  function exportOwn() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ own: get(OWN, []) }, null, 2)], { type: 'application/json' }));
    a.download = `satir-arasi-alintilarim-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(a); a.click(); a.remove();
  }
  function importOwn() {
    const i = document.createElement('input'); i.type = 'file'; i.accept = 'application/json';
    i.onchange = async () => {
      try {
        const j = JSON.parse(await i.files[0].text()); if (!Array.isArray(j.own)) throw 0;
        const own = get(OWN, []); let add = 0;
        j.own.forEach(o => { if (o && o.t && o.q && !own.some(x => norm(x.t) === norm(o.t) && norm(x.q) === norm(o.q))) { own.push({ id: uid(), t: String(o.t), a: String(o.a || ''), c: Math.min(4, Math.max(0, +o.c || 0)), q: String(o.q), p: String(o.p || '') }); add++; } });
        set(OWN, own); toast(add + ' alıntı yüklendi.'); renderDaily(); renderRecent();
      } catch (e) { toast('Bu dosya geçerli bir yedek değil.'); }
    };
    i.click();
  }

  // ---------- tıklamalar ----------
  document.addEventListener('click', e => {
    const del = e.target.closest('[data-del]');
    if (del) {
      if (confirm('Bu alıntı silinsin mi?')) {
        set(OWN, get(OWN, []).filter(o => o.id !== del.dataset.del));
        const on = document.querySelector('.cchip.on[data-c]'), b = byKey(curKey);
        const idx = on ? +on.dataset.c : -1;
        if (b && idx >= 0 && b.cats[idx].length) show(curKey, idx); else if (b && count(b)) show(curKey, -2); else clearOut();
        renderDaily();
      }
      return;
    }
    const q = e.target.closest('[data-q]');
    if (q) { navigator.clipboard?.writeText(q.dataset.q).then(() => toast('Kopyalandı.'), () => toast('Kopyalanamadı.')); return; }
    if (e.target.closest('[data-back]')) return clearOut();
    const open = e.target.closest('[data-open]'); if (open) { $('#sug').innerHTML = ''; show(open.dataset.open); scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const af = e.target.closest('[data-addfor]');
    if (af) { const b = byKey(af.dataset.addfor); openAdd(b ? b.t : (af.dataset.title || ''), b ? b.a : ''); return; }
    if (e.target.closest('[data-dadd]')) { const b = todaysBook(); openAdd(b.t, b.a); return; }
    const wb = e.target.closest('[data-web]'); if (wb) { doWeb(wb.dataset.web); return; }
    const wk = e.target.closest('[data-webbook]'); if (wk) { doWeb('', wk.dataset.webbook); return; }
    const wa = e.target.closest('[data-wadd]'); if (wa) { addFromWeb(+wa.dataset.wadd); return; }
    const ac = e.target.closest('[data-ac]'); if (ac) { addCat = +ac.dataset.ac; buildCatChips(); return; }
    const c = e.target.closest('[data-c]'); if (c && curKey) { show(curKey, +c.dataset.c); return; }
    const act = e.target.closest('[data-act]'); if (!act) return;
    const a = act.dataset.act;
    if (a === 'add') openAdd();
    else if (a === 'closeadd') $('#addbox').hidden = true;
    else if (a === 'export') exportOwn();
    else if (a === 'import') importOwn();
    else if (a === 'all') {
      const lib = library().sort((x, y) => x.t.localeCompare(y.t, 'tr'));
      setOut(`<div class="ask">Tüm kitaplar</div><div class="sug open">${lib.length ? rows(lib, 'data-open') : '<div class="none">Henüz kitap yok.</div>'}</div>`);
    }
  });

  renderDaily();
  renderRecent();
})();
