// Bildirim abonelikleri için küçük Supabase REST yardımcısı (yalnızca sunucuda, service_role anahtarıyla).
const base = () => (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const key = () => process.env.SUPABASE_SERVICE_KEY || '';
const ready = () => !!(base() && key());
const hdr = extra => ({ apikey: key(), authorization: 'Bearer ' + key(), 'content-type': 'application/json', ...extra });

async function save(sub) {
  const r = await fetch(`${base()}/rest/v1/push_subs?on_conflict=endpoint`, { method: 'POST', headers: hdr({ prefer: 'resolution=merge-duplicates,return=minimal' }), body: JSON.stringify({ endpoint: sub.endpoint, sub }) });
  return r.ok;
}
async function remove(endpoint) {
  const r = await fetch(`${base()}/rest/v1/push_subs?endpoint=eq.${encodeURIComponent(endpoint)}`, { method: 'DELETE', headers: hdr({}) });
  return r.ok;
}
async function all() {
  const out = []; let from = 0;
  for (;;) {
    const r = await fetch(`${base()}/rest/v1/push_subs?select=endpoint,sub&order=created_at.asc`, { headers: hdr({ range: `${from}-${from + 999}`, 'range-unit': 'items' }) });
    if (!r.ok) throw new Error('Abonelikler okunamadı');
    const rows = await r.json(); out.push(...rows); if (rows.length < 1000) break; from += 1000;
  }
  return out;
}
module.exports = { ready, save, remove, all };
