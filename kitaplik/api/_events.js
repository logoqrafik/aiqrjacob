// Adsız kullanım sayacı: yalnızca (gün, olay adı, ülke kodu) bazında sayar. Kişi, IP, kitap adı ya da içerik saklanmaz.
const NAMES = new Set(['quotes_text', 'quotes_photo', 'story_made', 'story_download', 'design_saved', 'design_export', 'card_made', 'book_added', 'push_on']);
const base = () => (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const key = () => process.env.SUPABASE_SERVICE_KEY || '';

async function track(req, name) {
  if (!NAMES.has(name) || !base() || !key()) return false;
  const country = String((req.headers && req.headers['x-vercel-ip-country']) || 'XX').slice(0, 2);
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), 2500);
  try {
    const r = await fetch(`${base()}/rest/v1/rpc/bump_event`, { method: 'POST', headers: { apikey: key(), authorization: 'Bearer ' + key(), 'content-type': 'application/json' }, body: JSON.stringify({ p_name: name, p_country: country }), signal: ac.signal });
    return r.ok;
  } catch (e) { return false; } finally { clearTimeout(t); }
}
module.exports = { track, NAMES };
