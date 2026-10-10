// Vercel serverless fonksiyonu. ANTHROPIC_API_KEY ortam değişkeni gerekir.
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
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'Sunucuda API anahtarı tanımlı değil' });

  const { title = '', author = '', image = '' } = req.body || {};
  const content = [];
  if (image) {
    const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(image);
    if (!m) return res.status(400).json({ error: 'Geçersiz görsel' });
    content.push({ type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } });
    content.push({ type: 'text', text: 'Bu kitabın kapağı. Kitabı belirle ve alıntıları çıkar.' });
  } else if (String(title).trim()) {
    content.push({ type: 'text', text: `Kitap: ${String(title).slice(0, 200)}\nYazar: ${String(author).slice(0, 200) || '(belirtilmedi)'}` });
  } else {
    return res.status(400).json({ error: 'Fotoğraf ya da kitap adı gerekli' });
  }

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: process.env.MODEL || 'claude-sonnet-5-5', max_tokens: 2000, system: SYSTEM, messages: [{ role: 'user', content }] })
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: (j.error && j.error.message) || 'Yapay zekâ isteği başarısız' });
    const text = (j.content || []).map(c => c.text || '').join('');
    const data = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
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
