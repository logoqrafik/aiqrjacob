// Vercel fonksiyonu: kitap adı (ve/veya yazar) için 5 kategoride alıntılar. Google Gemini (ücretsiz kota).
// GEMINI_API_KEY gerekir. Hızlı model önce denenir; her denemenin süre sınırı vardır.
const CATEGORIES = ['Motivasyon', 'Güçlü Kal', 'Duygusal', 'Düşündüren', 'Umut'];

const SYSTEM = `Sen titiz bir kitap editörüsün. Kullanıcı bir kitabı fotoğrafla ya da ad/yazar ile verir.
Görev: kitabı belirle, sonra bu kitaptan şu 5 kategoride alıntılar çıkar: ${CATEGORIES.join(', ')}.

Kurallar:
- Her kategoriye 5 ila 10 alıntı ver. Alıntılar BU kitaptan olmalı; kitabın en bilinen ve en çok alıntılanan cümleleri öncelikli, sonra kitabın diğer güzel cümleleri.
- Bir alıntıyı yalnızca bir kategoriye koy. Her alıntı en fazla 2-3 cümle olsun.
- Türkçe yaz; kitap çeviriyse Türkçe baskıdaki ifadeyi hatırladığın kadarıyla ver.
- Kitabı tanıyamazsan ya da iyi bilmiyorsan found:false döndür, uydurma.
- Yalnızca geçerli JSON döndür, başka metin yazma. Şema:
{"found":true,"title":"...","author":"...","categories":[{"name":"Motivasyon","quotes":["..."]}, ...]}
- Kategori adları aynen şunlar ve bu sırada olsun: ${CATEGORIES.join(', ')}.`;

const { requireMember } = require('./_auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST gerekli' });
  const who = await requireMember(req);
  if (!who.ok) return res.status(who.status).json({ error: who.error });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'Alıntı üretimi şu an kapalı.' });
  const b = req.body || {};
  const query = String(b.query || [b.title, b.author].filter(Boolean).join(' - ')).trim().slice(0, 240);
  const parts = [];
  if (!query && b.image) {
    const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(String(b.image));
    if (!m || String(b.image).length > 5000000) return res.status(400).json({ error: 'Geçersiz fotoğraf' });
    parts.push({ inlineData: { mimeType: m[1], data: m[2] } }, { text: 'Bu kitabın fotoğrafı. Kitabı belirle ve alıntıları çıkar.' });
  } else if (query) parts.push({ text: 'Kitap: ' + query });
  else return res.status(400).json({ error: 'Fotoğraf ya da kitap adı gerekli' });

  const models = [process.env.MODEL, 'gemini-flash-lite-latest', 'gemini-3.8-flash'].filter((m, i, a) => m && a.indexOf(m) === i);
  const deadline = Date.now() + 52000;
  let data = null, quota = false, lastErr = '';
  for (const model of models) {
    const left = deadline - Date.now(); if (left < 4000) break;
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), Math.min(left, model === models[0] ? 26000 : 16000));
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST', signal: ctl.signal,
        headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: [{ role: 'user', parts }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.4, maxOutputTokens: 8000 }
        })
      });
      const j = await r.json();
      if (!r.ok) { if (r.status === 429) quota = true; lastErr = (j.error && j.error.message) || String(r.status); continue; }
      const text = (((j.candidates || [])[0] || {}).content || { parts: [] }).parts.map(c => c.text || '').join('');
      data = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
      break;
    } catch (e) { lastErr = e.name === 'AbortError' ? 'zaman aşımı' : 'cevap okunamadı'; }
    finally { clearTimeout(timer); }
  }
  if (!data) return res.status(502).json({ error: quota ? 'Bugünlük ücretsiz kota doldu. Biraz sonra tekrar dene.' : 'Yapay zekâ şu an yanıt vermiyor, biraz sonra tekrar dene.' });
  if (!data.found || !String(data.title || '').trim()) return res.status(200).json({ found: false });
  const seen = new Set();
  const categories = CATEGORIES.map(name => {
    const c = (data.categories || []).find(x => x && x.name === name);
    const quotes = ((c && c.quotes) || []).filter(q => typeof q === 'string').map(q => q.trim())
      .filter(q => q.length >= 12 && q.length <= 420 && !seen.has(q.toLowerCase()) && seen.add(q.toLowerCase())).slice(0, 10);
    return { name, quotes };
  });
  return res.status(200).json({ found: true, title: String(data.title).trim().slice(0, 160), author: String(data.author || '').trim().slice(0, 120), categories });
};
