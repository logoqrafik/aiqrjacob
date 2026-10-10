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

const SYSTEM_STORY = `Sen titiz bir kitap editörüsün. Kullanıcı bir kitabı fotoğrafla ya da ad/yazar ile verir.
Görev: kitabı belirle ve sosyal medya görseline konacak, bu kitaptan 3 alıntı seç: kitabın en ünlü, en duygusal ya da en dikkat çekici cümleleri.

Kurallar:
- Alıntılar gerçekten BU kitaptan olmalı. Emin olmadığın cümleyi asla uydurma; emin olduğun kadarını ver (1-3 arası), hiç yoksa boş liste ver.
- Her alıntı tek ve kısa bir cümle olsun (en fazla 140 karakter). Türkçe yaz. Kitap Türkçeye çeviriyse Türkçe çeviriyi hatırladığın kadarıyla ver.
- "Önceki alıntılar" verilirse onları tekrar etme, farklı cümleler seç.
- Kitabı tanıyamazsan found:false döndür.
- Yalnızca geçerli JSON döndür, başka metin yazma. Şema:
{"found":true,"title":"...","author":"...","quotes":["...","..."]}`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST gerekli' });
  if (process.env.ACCESS_CODE && req.headers['x-access-code'] !== process.env.ACCESS_CODE) {
    return res.status(401).json({ error: 'Erişim kodu gerekli' });
  }
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'Sunucuda API anahtarı tanımlı değil' });

  const { title = '', author = '', image = '', mode = '', exclude = [] } = req.body || {};
  const story = mode === 'story';
  const avoid = (Array.isArray(exclude) ? exclude : []).filter(x => typeof x === 'string').slice(0, 6).map(x => x.slice(0, 200));
  const content = [];
  if (image) {
    const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(image);
    if (!m) return res.status(400).json({ error: 'Geçersiz görsel' });
    content.push({ inlineData: { mimeType: m[1], data: m[2] } });
    content.push({ text: story ? 'Bu fotoğraftaki kitabı belirle (kapağından ya da görünen yazılarından) ve alıntıları seç.' : 'Bu kitabın kapağı. Kitabı belirle ve alıntıları çıkar.' });
  } else if (String(title).trim()) {
    content.push({ text: `Kitap: ${String(title).slice(0, 200)}\nYazar: ${String(author).slice(0, 200) || '(belirtilmedi)'}` });
  } else {
    return res.status(400).json({ error: 'Fotoğraf ya da kitap adı gerekli' });
  }
  if (story && avoid.length) content.push({ text: 'Önceki alıntılar (tekrar etme):\n- ' + avoid.join('\n- ') });

  // Google model adlarını sık değiştiriyor ve bazı modeller yoğunlukta takılıyor.
  // Hızlı model önce denenir; her denemenin süre sınırı vardır, takılırsa sıradakine geçilir.
  const models = [process.env.MODEL, 'gemini-flash-lite-latest', 'gemini-3.8-flash', 'gemini-flash-latest']
    .filter((m, i, a) => m && a.indexOf(m) === i);
  const deadline = Date.now() + 52000;
  let data = null, quota = false, lastErr = '';
  for (const model of models) {
    const left = deadline - Date.now();
    if (left < 4000) break;
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), Math.min(left, model === models[0] ? 24000 : 16000));
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST', signal: ctl.signal,
        headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: story ? SYSTEM_STORY : SYSTEM }] },
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
    } catch (e) { lastErr = e.name === 'AbortError' ? 'zaman aşımı (' + model + ')' : 'Cevap okunamadı'; }
    finally { clearTimeout(timer); }
  }
  if (!data) {
    return res.status(502).json({ error: quota ? 'Bugünlük ücretsiz kota doldu, biraz sonra tekrar dene.' : 'Yapay zekâ şu an yanıt vermiyor, biraz sonra tekrar dene. (' + lastErr.slice(0, 120) + ')' });
  }
  try {
    if (!data.found) return res.status(200).json({ found: false });
    if (story) {
      const quotes = (Array.isArray(data.quotes) ? data.quotes : []).filter(q => typeof q === 'string' && q.trim()).map(q => q.trim().slice(0, 200)).slice(0, 3);
      return res.status(200).json({ found: true, title: String(data.title || ''), author: String(data.author || ''), quotes });
    }
    const cats = CATEGORIES.map(name => {
      const c = (data.categories || []).find(x => x.name === name);
      return { name, quotes: ((c && c.quotes) || []).filter(q => typeof q === 'string' && q.trim()).slice(0, 3) };
    });
    return res.status(200).json({ found: true, title: String(data.title || ''), author: String(data.author || ''), categories: cats });
  } catch (e) {
    return res.status(502).json({ error: 'Cevap okunamadı, tekrar dene.' });
  }
};
