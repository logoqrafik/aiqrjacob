// Yönetici: abone sayısını gösterir ya da tüm abonelere tek seferlik bildirim gönderir.
// Gerekli ortam değişkenleri: ADMIN_SECRET, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY
const crypto = require('crypto');
const webpush = require('web-push');
const store = require('./_push');

const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST gerekli' });
  const secret = process.env.ADMIN_SECRET || '';
  if (!secret) return res.status(503).json({ error: 'Yönetici şifresi tanımlı değil.' });
  const b = req.body || {};
  if (!same(b.password || '', secret)) return res.status(401).json({ error: 'Şifre yanlış.' });
  if (!store.ready() || !process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return res.status(503).json({ error: 'Bildirim ayarları eksik (VAPID ya da Supabase).' });
  let subs; try { subs = await store.all(); } catch (e) { return res.status(502).json({ error: e.message }); }
  if (b.action === 'count') return res.status(200).json({ count: subs.length });

  const title = String(b.title || '').trim().slice(0, 80), body = String(b.body || '').trim().slice(0, 240);
  let url = String(b.url || '/').trim(); if (!/^\/|^https:\/\//.test(url)) url = '/';
  if (!title || !body) return res.status(400).json({ error: 'Başlık ve mesaj gerekli.' });
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@example.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  const payload = JSON.stringify({ title, body, url });
  let sent = 0, gone = 0, failed = 0;
  for (let i = 0; i < subs.length; i += 25) {
    await Promise.all(subs.slice(i, i + 25).map(async row => {
      try { await webpush.sendNotification(row.sub, payload, { TTL: 60 * 60 * 24 * 3, urgency: 'normal' }); sent++; }
      catch (e) { if (e.statusCode === 404 || e.statusCode === 410) { gone++; try { await store.remove(row.endpoint); } catch (x) { /* önemsiz */ } } else failed++; }
    }));
  }
  return res.status(200).json({ sent, gone, failed, total: subs.length });
};
