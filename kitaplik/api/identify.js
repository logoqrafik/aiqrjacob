// Vercel fonksiyonu: kitap kapağı fotoğrafından yalnızca kitabın adını ve yazarını tanır.
// Alıntı üretmez (alıntılar havuzdan / Wikiquote'tan gelir). GEMINI_API_KEY gerekir.
const SYSTEM = `Bir kitap fotoğrafına bakıyorsun. Kapaktaki ya da görünen yazılardan kitabın adını ve yazarını belirle.
Kurallar:
- Yalnızca görünen yazılara ve kesin bildiğin kitaplara dayan. Emin değilsen tahmin yürütme, found:false döndür.
- Kitap adını ve yazar adını Türkçe baskıdaki yazılışıyla, doğru büyük/küçük harfle yaz.
- Yalnızca geçerli JSON döndür: {"found":true,"title":"...","author":"..."} ya da {"found":false}`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST gerekli' });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'Kitap tanıma şu an kapalı. Kitap adını yazarak arayabilirsin.' });
  const image = (req.body || {}).image || '';
  const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(image);
  if (!m || image.length > 5_000_000) return res.status(400).json({ error: 'Geçersiz fotoğraf' });

  const models = [process.env.MODEL, 'gemini-flash-lite-latest', 'gemini-3.8-flash'].filter((x, i, a) => x && a.indexOf(x) === i);
  let lastErr = '', quota = false;
  for (const model of models) {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), model === models[0] ? 15000 : 12000);
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST', signal: ctl.signal,
        headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: [{ role: 'user', parts: [{ inlineData: { mimeType: m[1], data: m[2] } }, { text: 'Bu fotoğraftaki kitap hangisi?' }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0, maxOutputTokens: 300 }
        })
      });
      const j = await r.json();
      if (!r.ok) { if (r.status === 429) quota = true; lastErr = (j.error && j.error.message) || String(r.status); continue; }
      const text = (((j.candidates || [])[0] || {}).content || { parts: [] }).parts.map(c => c.text || '').join('');
      const d = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
      if (!d.found || !String(d.title || '').trim()) return res.status(200).json({ found: false });
      return res.status(200).json({ found: true, title: String(d.title).trim().slice(0, 160), author: String(d.author || '').trim().slice(0, 120) });
    } catch (e) { lastErr = e.name === 'AbortError' ? 'zaman aşımı' : 'cevap okunamadı'; }
    finally { clearTimeout(timer); }
  }
  return res.status(502).json({ error: quota ? 'Bugünlük ücretsiz kitap tanıma hakkı doldu. Kitap adını yazarak arayabilirsin.' : 'Kitap şu an tanınamadı. Kitap adını yazarak arayabilirsin.' });
};
