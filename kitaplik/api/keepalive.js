// Günde bir kez çağrılır (vercel.json > crons). Supabase ücretsiz projesi 7 gün boşta kalınca duraklatılır;
// bu hafif sorgu projeyi "kullanılıyor" tutar. Veri okumaz/yazmaz, yalnızca tabloda 1 satırlık boş bir sorgu yapar.
module.exports = async (req, res) => {
  const url = (process.env.SUPABASE_URL || '').replace(/\/$/, ''), key = process.env.SUPABASE_SERVICE_KEY || '';
  if (!url || !key) return res.status(200).json({ ok: false, reason: 'Supabase ayarı yok' });
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), 8000);
  try {
    const r = await fetch(`${url}/rest/v1/push_subs?select=endpoint&limit=1`, { headers: { apikey: key, authorization: 'Bearer ' + key }, signal: ac.signal });
    return res.status(200).json({ ok: r.ok, status: r.status, at: new Date().toISOString() });
  } catch (e) { return res.status(200).json({ ok: false, reason: 'istek başarısız' }); }
  finally { clearTimeout(t); }
};
