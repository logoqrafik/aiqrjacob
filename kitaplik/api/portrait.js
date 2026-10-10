// Vercel fonksiyonu: yazarın Vikipedi'deki ana görselini (çoğunlukla portre) aynı alan adından döndürür.
const UA = 'SatirArasi/1.0 (yazar portresi; https://github.com/logoqrafik/aiqrjacob)';
const norm = s => String(s || '').toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').replace(/[^a-z0-9]+/g, ' ').trim();
const toks = s => norm(s).split(' ').filter(w => w.length > 1);

async function getJSON(url, ms = 6000) {
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), ms);
  try { const r = await fetch(url, { signal: ac.signal, headers: { 'user-agent': UA, accept: 'application/json' } }); return r.ok ? await r.json() : null; }
  catch (e) { return null; } finally { clearTimeout(t); }
}
async function getImage(url, ms = 8000) {
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), ms);
  try {
    const r = await fetch(url, { signal: ac.signal, headers: { 'user-agent': UA }, redirect: 'follow' });
    const type = r.headers.get('content-type') || '';
    if (!r.ok || !/^image\/(jpeg|png|webp)/.test(type)) return null;
    const buf = Buffer.from(await r.arrayBuffer()); return buf.length > 4000 ? { buf, type } : null;
  } catch (e) { return null; } finally { clearTimeout(t); }
}
// Sayfa başlığı gerçekten bu kişi mi? Adın bütün kelimeleri başlıkta geçmeli (ya da soyadı + ilk ad harfi).
function isPerson(title, name) {
  const tt = toks(title), nt = toks(name); if (!tt.length || !nt.length) return false;
  if (nt.every(w => tt.includes(w))) return tt.length <= nt.length + 3;
  const last = nt[nt.length - 1]; return tt.includes(last) && tt[0] && tt[0][0] === nt[0][0] && tt.length <= nt.length + 3;
}
async function find(lang, name) {
  const q = new URLSearchParams({ action: 'query', generator: 'search', gsrsearch: name, gsrlimit: '5', prop: 'pageimages', piprop: 'thumbnail', pithumbsize: '1100', pilimit: '5', format: 'json', formatversion: '2' });
  const d = await getJSON(`https://${lang}.wikipedia.org/w/api.php?${q}`); const pages = d && d.query && d.query.pages; if (!Array.isArray(pages)) return null;
  for (const p of pages.filter(p => p.thumbnail && p.thumbnail.source && isPerson(p.title, name)).sort((a, b) => a.index - b.index)) {
    const img = await getImage(p.thumbnail.source); if (img) return { ...img, title: p.title, lang };
  }
  return null;
}

module.exports = async (req, res) => {
  const name = String((req.query && req.query.name) || '').trim().slice(0, 100);
  if (!name) return res.status(400).json({ error: 'Yazar adı gerekli' });
  const hit = (await find('tr', name)) || (await find('en', name));
  if (!hit) { res.setHeader('Cache-Control', 'public, s-maxage=3600'); return res.status(404).json({ error: 'Portre bulunamadı' }); }
  res.setHeader('Content-Type', hit.type); res.setHeader('X-Portrait-Source', `${hit.lang}.wikipedia.org/${encodeURIComponent(hit.title)}`);
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400');
  return res.status(200).send(hit.buf);
};
module.exports._isPerson = isPerson;
