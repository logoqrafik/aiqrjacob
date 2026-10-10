// İnternette alıntı arama: Wikiquote (Türkçe ve İngilizce). Ücretsiz, anahtarsız, kaynaklı.
// Tarayıcıdan doğrudan sorgulanır; sunucu ve kredi gerekmez.
(() => {
  'use strict';
  const LANGS = ['tr', 'en'];
  const SKIP_HEAD = /dış bağlantılar|external links|kaynakça|references|ayrıca bakınız|see also|hakkında|hakkındaki|about|quotes about|misattributed|atfedilen|yanlış|disputed|tartışmalı|notlar|notes|şiirleri hakkında/i;
  const norm = s => String(s || '').toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').replace(/[^a-z0-9]+/g, ' ').trim();

  // Vikimetin işaretlerini temizle
  function clean(w) {
    let s = String(w);
    s = s.replace(/<!--[\s\S]*?-->/g, '').replace(/<ref[^>]*\/>/gi, '').replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '');
    for (let i = 0; i < 4; i++) s = s.replace(/\{\{[^{}]*\}\}/g, '');
    s = s.replace(/\[\[(?:File|Dosya|Image|Resim|Category|Kategori):[^\]]*\]\]/gi, '');
    s = s.replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, '$1').replace(/\[\[([^\]]*)\]\]/g, '$1');
    s = s.replace(/\[https?:\/\/\S+\s+([^\]]+)\]/g, '$1').replace(/\[https?:\/\/\S+\]/g, '');
    s = s.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '');
    s = s.replace(/'{2,}/g, '').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'");
    return s.replace(/\s+/g, ' ').trim();
  }
  const stripQuotes = s => s.replace(/^[\s"“”«»„‟]+|[\s"“”«»„‟]+$/g, '').trim();

  // Bir sayfanın vikimetninden alıntıları çıkar: [{ q, src, heading }]
  function parseQuotes(wikitext) {
    const out = []; let heading = '', skip = false, last = null;
    for (const raw of String(wikitext || '').split('\n')) {
      const h = raw.match(/^(={2,6})\s*(.+?)\s*\1\s*$/);
      if (h) { heading = clean(h[2]); skip = SKIP_HEAD.test(heading); last = null; continue; }
      if (skip) continue;
      const q = raw.match(/^\*(?!\*)\s*(.+)$/);
      if (q) {
        const text = stripQuotes(clean(q[1]));
        last = null;
        if (text.length >= 20 && text.length <= 420 && !/^(bkz|see|ayrıca)/i.test(text)) { last = { q: text, src: '', heading }; out.push(last); }
        continue;
      }
      const s = raw.match(/^(?:\*{2,}|:+)\s*(.+)$/);
      if (s && last) { const t = clean(s[1]); if (t) last.src = last.src ? last.src + ' · ' + t : t; }
    }
    return out;
  }

  const api = (lang, params) => `https://${lang}.wikiquote.org/w/api.php?` + new URLSearchParams({ format: 'json', formatversion: '2', origin: '*', ...params });
  async function jget(url, ms = 9000) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms);
    try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json(); }
    finally { clearTimeout(t); }
  }

  async function searchLang(lang, text, tokens) {
    const s = await jget(api(lang, { action: 'query', list: 'search', srsearch: text, srlimit: '4', srnamespace: '0' }));
    const pages = ((s.query || {}).search || []).slice(0, 3);
    const got = await Promise.allSettled(pages.map(p => jget(api(lang, { action: 'parse', page: p.title, prop: 'wikitext', redirects: '1' })).then(j => ({ title: ((j.parse || {}).title) || p.title, wikitext: (j.parse || {}).wikitext }))));
    const found = [];
    got.forEach(g => {
      if (g.status !== 'fulfilled' || !g.value.wikitext) return;
      const { title, wikitext } = g.value;
      parseQuotes(wikitext).forEach(x => {
        const hay = norm(title + ' ' + x.heading + ' ' + x.src);
        if (tokens.every(t => hay.includes(t))) found.push({ q: x.q, work: x.heading, src: x.src, page: title, lang, url: `https://${lang}.wikiquote.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}` });
      });
    });
    return found;
  }

  // Ana arama: iki dilde paralel; sonuç { quotes, failed } (failed: kaç dil ulaşılamadı)
  async function webSearch(text) {
    const tokens = norm(text).split(' ').filter(Boolean);
    if (!tokens.length) return { quotes: [], failed: 0 };
    const res = await Promise.allSettled(LANGS.map(l => searchLang(l, text, tokens)));
    const seen = new Set(), quotes = [];
    let failed = 0;
    res.forEach(r => {
      if (r.status !== 'fulfilled') { failed++; return; }
      r.value.forEach(x => { const k = norm(x.q).slice(0, 60); if (!seen.has(k)) { seen.add(k); quotes.push(x); } });
    });
    // kaynağı (eser/sayfa) yazılı olanlar ve Türkçe sonuçlar önce
    quotes.sort((a, b) => (!!b.src - !!a.src) || ((b.lang === 'tr') - (a.lang === 'tr')));
    return { quotes: quotes.slice(0, 24), failed };
  }

  // İki alıntı aynı mı? (noktalama/büyük-küçük harf/Türkçe karakter farkı gözetmez)
  function similar(a, b) {
    const x = norm(a), y = norm(b); if (!x || !y) return false;
    if (Math.min(x.length, y.length) >= 20 && (x.includes(y) || y.includes(x))) return true;
    const A = new Set(x.split(' ')), B = new Set(y.split(' ')); let n = 0; A.forEach(t => { if (B.has(t)) n++; });
    return Math.min(A.size, B.size) >= 4 && n / Math.min(A.size, B.size) >= 0.85;
  }

  window.WEB = { parseQuotes, webSearch, similar, clean };
})();
