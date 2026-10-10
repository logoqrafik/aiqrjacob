// Vercel fonksiyonu: kitabın gerçek kapak görselini bulur ve aynı alan adından döndürür (CORS/tuval sorunu olmaz).
// Sıra: Open Library, sonra Google Books. İkisi de ücretsiz; Google için isteğe bağlı GOOGLE_BOOKS_KEY kullanılır.
const UA = 'SatirArasi/1.0 (kitap kapağı; https://github.com/logoqrafik/aiqrjacob)';
const norm = s => String(s || '').toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').replace(/[^a-z0-9]+/g, ' ').trim();
const toks = s => norm(s).split(' ').filter(w => w.length > 1);

async function getJSON(url, ms = 6000) {
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), ms);
  try { const r = await fetch(url, { signal: ac.signal, headers: { 'user-agent': UA, accept: 'application/json' } }); return r.ok ? await r.json() : null; }
  catch (e) { return null; } finally { clearTimeout(t); }
}
async function getImage(url, ms = 7000) {
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), ms);
  try {
    const r = await fetch(url, { signal: ac.signal, headers: { 'user-agent': UA }, redirect: 'follow' });
    const type = r.headers.get('content-type') || '';
    if (!r.ok || !/^image\/(jpeg|png|webp)/.test(type)) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    return buf.length > 2500 ? { buf, type } : null; // çok küçükse "kapak yok" yer tutucusudur
  } catch (e) { return null; } finally { clearTimeout(t); }
}
// Aday başlık, aranan başlıkla uyuşuyor mu? Yazar uyuşuyorsa puan artar.
function score(candTitle, candAuthors, qTitle, qAuthor) {
  const a = norm(candTitle), b = norm(qTitle); if (!a || !b) return 0;
  let s = 0;
  if (a === b) s = 3; else if (a.includes(b) || b.includes(a)) s = 2;
  else { const bt = toks(qTitle); if (bt.length && bt.filter(w => a.split(' ').includes(w)).length / bt.length >= 0.8) s = 1; }
  if (!s) return 0;
  if (qAuthor) { const qa = toks(qAuthor), ca = toks((candAuthors || []).join(' ')); if (qa.length && ca.length) s += qa.some(w => ca.includes(w)) ? 1.5 : -0.5; }
  return s;
}
const best = (list, fn) => list.map(x => ({ x, s: fn(x) })).filter(o => o.s > 0).sort((a, b) => b.s - a.s).map(o => o.x);

async function fromOpenLibrary(t, a) {
  const q = new URLSearchParams({ title: t, limit: '8', fields: 'title,author_name,cover_i' }); if (a) q.set('author', a);
  const d = await getJSON('https://openlibrary.org/search.json?' + q); if (!d || !Array.isArray(d.docs)) return null;
  for (const doc of best(d.docs.filter(x => x.cover_i), x => score(x.title, x.author_name, t, a)).slice(0, 2)) {
    const img = await getImage(`https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg?default=false`); if (img) return { ...img, src: 'openlibrary' };
  }
  return null;
}
async function fromGoogle(t, a) {
  const q = new URLSearchParams({ q: `intitle:${t}${a ? ' inauthor:' + a : ''}`, maxResults: '8', printType: 'books', fields: 'items(volumeInfo(title,authors,imageLinks))' });
  if (process.env.GOOGLE_BOOKS_KEY) q.set('key', process.env.GOOGLE_BOOKS_KEY);
  const d = await getJSON('https://www.googleapis.com/books/v1/volumes?' + q); if (!d || !Array.isArray(d.items)) return null;
  const items = d.items.map(i => i.volumeInfo || {}).filter(v => v.imageLinks && (v.imageLinks.thumbnail || v.imageLinks.smallThumbnail));
  for (const v of best(items, v => score(v.title, v.authors, t, a)).slice(0, 2)) {
    const u = String(v.imageLinks.thumbnail || v.imageLinks.smallThumbnail).replace(/^http:/, 'https:').replace(/&edge=curl/, '');
    const img = (await getImage(u.replace(/zoom=\d/, 'zoom=2'))) || (await getImage(u)); if (img) return { ...img, src: 'google' };
  }
  return null;
}

module.exports = async (req, res) => {
  const t = String((req.query && req.query.t) || '').trim().slice(0, 160), a = String((req.query && req.query.a) || '').trim().slice(0, 100);
  if (!t) return res.status(400).json({ error: 'Kitap adı gerekli' });
  const hit = (await fromOpenLibrary(t, a)) || (await fromGoogle(t, a));
  if (!hit) { res.setHeader('Cache-Control', 'public, s-maxage=3600'); return res.status(404).json({ error: 'Kapak bulunamadı' }); }
  res.setHeader('Content-Type', hit.type); res.setHeader('X-Cover-Source', hit.src);
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400');
  return res.status(200).send(hit.buf);
};
module.exports._score = score;
