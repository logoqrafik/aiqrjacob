// Bir cihazın bildirim aboneliğini kaydeder ya da siler. Herkese açık (abonelik adresi zaten gizli bir uç noktadır).
const store = require('./_push');
const okSub = s => s && typeof s.endpoint === 'string' && /^https:\/\//.test(s.endpoint) && s.endpoint.length < 1000 && s.keys && typeof s.keys.p256dh === 'string' && typeof s.keys.auth === 'string';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST gerekli' });
  if (!store.ready()) return res.status(503).json({ error: 'Bildirimler henüz kurulmadı.' });
  const b = req.body || {};
  try {
    if (b.action === 'unsubscribe') { if (typeof b.endpoint !== 'string') return res.status(400).json({ error: 'Geçersiz istek' }); await store.remove(b.endpoint); return res.status(200).json({ ok: true }); }
    if (!okSub(b.subscription)) return res.status(400).json({ error: 'Geçersiz abonelik' });
    const { endpoint, keys, expirationTime } = b.subscription;
    const ok = await store.save({ endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth }, expirationTime: expirationTime || null });
    return ok ? res.status(200).json({ ok: true }) : res.status(502).json({ error: 'Kaydedilemedi' });
  } catch (e) { return res.status(502).json({ error: 'Kaydedilemedi' }); }
};
