// Ortak: isteği yapan üyeyi Supabase'ten doğrular, abonelik/ücretsiz erişimi ve günlük sınırı denetler.
// SUPABASE_URL ve SUPABASE_ANON_KEY tanımlı değilse (hesap sistemi kapalı) herkese açık çalışır.
const T = 6000;
async function jfetch(url, opt = {}) {
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), T);
  try { const r = await fetch(url, { ...opt, signal: ac.signal }); const d = await r.json().catch(() => null); return { ok: r.ok, status: r.status, data: d }; }
  catch (e) { return { ok: false, status: 0, data: null }; } finally { clearTimeout(t); }
}

async function requireMember(req) {
  const url = (process.env.SUPABASE_URL || '').replace(/\/$/, ''), key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return { ok: true, open: true };                     // hesap sistemi kapalı
  const tok = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  if (!tok) return { ok: false, status: 401, error: 'Giriş yapman gerekiyor.' };
  const h = { apikey: key, authorization: 'Bearer ' + tok };
  const u = await jfetch(`${url}/auth/v1/user`, { headers: h });
  if (!u.ok || !u.data || !u.data.id) return { ok: false, status: 401, error: 'Oturumun süresi dolmuş. Yeniden giriş yap.' };
  const [set, prof] = await Promise.all([
    jfetch(`${url}/rest/v1/app_settings?key=eq.billing_enabled&select=value`, { headers: h }),
    jfetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(u.data.id)}&select=free,plan,paid_until`, { headers: h })
  ]);
  const billing = !!(set.ok && Array.isArray(set.data) && set.data[0] && set.data[0].value === 'true');
  const p = prof.ok && Array.isArray(prof.data) ? prof.data[0] : null;
  const active = !!p && (p.free || (p.plan === 'active' && p.paid_until && new Date(p.paid_until) > new Date()));
  if (billing && !active) return { ok: false, status: 402, error: 'Bu özellik için aktif üyelik gerekiyor.' };
  const max = Math.max(1, parseInt(process.env.DAILY_LIMIT || '60', 10));
  const use = await jfetch(`${url}/rest/v1/rpc/bump_usage`, { method: 'POST', headers: { ...h, 'content-type': 'application/json' }, body: JSON.stringify({ p_max: max }) });
  if (use.ok && use.data === false) return { ok: false, status: 429, error: 'Bugünlük istek sınırına ulaştın. Yarın yeniden dene.' };
  return { ok: true, userId: u.data.id };
}
module.exports = { requireMember };
