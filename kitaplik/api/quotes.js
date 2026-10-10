// Vercel serverless fonksiyonu. Google Gemini (ücretsiz kota) kullanır. GEMINI_API_KEY ortam değişkeni gerekir.
// İsteğe bağlı: MODEL ile model adını değiştirebilirsin (verilmezse güncel modeller sırayla denenir).
// İsteğe bağlı: ACCESS_CODE tanımlarsan istek başlığında aynı kod gerekir (link sızarsa kota yanmasın).
const CATEGORIES = ['Motivasyon', 'Güçlü Kal', 'Duygusal', 'Düşündüren', 'Umut'];

const SYSTEM = `Sen titiz bir kitap editörüsün. Kullanıcı bir kitabı fotoğrafla ya da ad/yazar ile verir.
Görev: kitabı belirle, sonra bu kitaptan şu kategorilerde alıntılar çıkar: ${CATEGORIES.join(', ')}.

Kurallar:
- Her kategoriye 2-3 alıntı ver. Alıntılar gerçekten BU kitaptan olmalı. Emin olmadığın bir cümleyi asla uydurma; o kategoride daha az alıntı ver, hiç yoksa boş liste ver.
- Alıntılar kısa olsun (en fazla 2-3 cümle). Türkçe yaz. Kitap Türkçeye çeviriyse Türkçe çeviriyi hatırladığın kadarıyla ver.
- Kitabı tanıyamazsan found:false döndür.
- Yalnızca geçerli JSON döndür, başka metin yazma. Şema:
{"found":true,"title":"...","author":"...","categories":[{"name":"Motivasyon","quotes":["..."]}, ...]}
- Kategori adları aynen şunlar olsun, bu sırayla: ${CATEGORIES.join(', ')}.`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST gerekli' });
  if (process.env.ACCESS_CODE && req.headers['x-access-code'] !== process.env.ACCESS_CODE) {
    return res.status(401).json({ error: 'Erişim kodu gerekli' });
  }
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'Sunucuda API anahtarı tanımlı değil' });

  const { title = '', author = '', image = '' } = req.body || {};
  const content = [];
  if (image) {
    const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(image);
    if (!m) return res.status(400).json({ error: 'Geçersiz görsel' });
    content.push({ inlineData: { mimeType: m[1], data: m[2] } });
    content.push({ text: 'Bu kitabın kapağı. Kitabı belirle ve alıntıları çıkar.' });
  } else if (String(title).trim()) {
    content.push({ text: `Kitap: ${String(title).slice(0, 200)}\nYazar: ${String(author).slice(0, 200) || '(belirtilmedi)'}` });
  } else {
    return res.status(400).json({ error: 'Fotoğraf ya da kitap adı gerekli' });
  }

  // Google model adlarını sık değiştiriyor. Sırayla dener, çalışan ilk modeli kullanır.
  const models = [process.env.MODEL, 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-2.5-flash-lite']
    .filter((m, i, a) => m && a.indexOf(m) === i);
  let data = null, quota = false, lastErr = '';
  for (const model of models) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: [{ role: 'user', parts: content }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.4, maxOutputTokens: 8000 }
        })
      });
      const j = await r.json();
      if (!r.ok) {
        if (r.status === 429) quota = true;
        lastErr = (j.error && j.error.message) || String(r.status);
        continue;
      }
      const text = (((j.candidates || [])[0] || {}).content || { parts: [] }).parts.map(c => c.text || '').join('');
      data = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
      break;
    } catch (e) { lastErr = 'Cevap okunamadı'; }
  }
  if (!data) {
    return res.status(502).json({ error: quota ? 'Bugünlük ücretsiz kota doldu, biraz sonra tekrar dene.' : 'Yapay zekâya ulaşılamadı: ' + lastErr.slice(0, 160) });
  }
  try {
    if (!data.found) return res.status(200).json({ found: false });
    const cats = CATEGORIES.map(name => {
      const c = (data.categories || []).find(x => x.name === name);
      return { name, quotes: ((c && c.quotes) || []).filter(q => typeof q === 'string' && q.trim()).slice(0, 3) };
    });
    return res.status(200).json({ found: true, title: String(data.title || ''), author: String(data.author || ''), categories: cats });
  } catch (e) {
    return res.status(502).json({ error: 'Cevap okunamadı, tekrar dene.' });
  }
};
