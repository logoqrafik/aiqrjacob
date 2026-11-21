// Yönetici: son 31 günün kullanım özeti (olay başına son kullanım zamanı, toplamlar, ülkeler).
const crypto = require('crypto');
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST gerekli' });
  const secret = process.env.ADMIN_SECRET || '';
  if (!secret) return res.status(503).json({ error: 'Yönetici şifresi tanımlı değil.' });
  if (!same((req.body && req.body.password) || '', secret)) return res.status(401).json({ error: 'Şifre yanlış.' });
  const url = (process.env.SUPABASE_URL || '').replace(/\/$/, ''), key = process.env.SUPABASE_SERVICE_KEY || '';
  if (!url || !key) return res.status(503).json({ error: 'Supabase ayarı eksik.' });
  const since = new Date(Date.now() - 31 * 864e5).toISOString().slice(0, 10);
  let rows;
  try {
    const r = await fetch(`${url}/rest/v1/app_events?select=day,name,country,n,last_at&day=gte.${since}&order=day.desc&limit=5000`, { headers: { apikey: key, authorization: 'Bearer ' + key } });
    if (!r.ok) return res.status(502).json({ error: 'Sayaç okunamadı.' });
    rows = await r.json();
  } catch (e) { return res.status(502).json({ error: 'Sayaç okunamadı.' }); }
  const week = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10), events = {}, countries = {};
  rows.forEach(r => {
    const e = events[r.name] || (events[r.name] = { last: '', d7: 0, d31: 0 });
    e.d31 += r.n; if (r.day >= week) e.d7 += r.n; if (r.last_at > e.last) e.last = r.last_at;
    countries[r.country] = (countries[r.country] || 0) + r.n;
  });
  const last = Object.values(events).reduce((m, e) => (e.last > m ? e.last : m), '');
  return res.status(200).json({ last, events, countries });
};
