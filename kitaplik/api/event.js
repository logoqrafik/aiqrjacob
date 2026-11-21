// Tarayıcıdan adsız olay sayacı: gövdede yalnızca izin verilen bir olay adı kabul edilir.
const { track, NAMES } = require('./_events');
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST gerekli' });
  const name = String((req.body && req.body.name) || '');
  if (!NAMES.has(name)) return res.status(400).json({ error: 'Geçersiz olay' });
  await track(req, name);
  return res.status(204).end();
};
