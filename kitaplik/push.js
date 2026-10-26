// Haftalık bildirimler: izin isteme, abonelik, abonelikten çıkma. Public anahtar config.js içinde (push.publicKey).
(() => {
  'use strict';
  const KEY = (window.CONFIG && window.CONFIG.push && window.CONFIG.push.publicKey) || '';
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const can = !!KEY && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const keyBytes = s => { const p = '='.repeat((4 - s.length % 4) % 4), raw = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(raw, c => c.charCodeAt(0)); };
  const post = body => fetch('/api/push-subscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const getReg = () => navigator.serviceWorker.getRegistration().then(r => r || navigator.serviceWorker.register('sw.js').then(() => navigator.serviceWorker.ready));

  // 'kapali' (yapılandırılmamış) | 'ios-ekle' | 'desteklenmiyor' | 'engelli' | 'acik' | 'kapat'
  async function state() {
    if (!KEY) return 'kapali';
    if (ios && !standalone) return 'ios-ekle';
    if (!can) return 'desteklenmiyor';
    if (Notification.permission === 'denied') return 'engelli';
    try { const r = await navigator.serviceWorker.getRegistration(); const s = r && await r.pushManager.getSubscription(); return s ? 'acik' : 'kapat'; } catch (e) { return 'kapat'; }
  }
  async function enable() {
    if (!can) throw new Error('Bu tarayıcı bildirimleri desteklemiyor.');
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') throw new Error('Bildirim izni verilmedi.');
    const r = await getReg();
    const s = (await r.pushManager.getSubscription()) || await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(KEY) });
    const resp = await post({ subscription: s.toJSON() });
    if (!resp.ok) { const d = await resp.json().catch(() => ({})); throw new Error(d.error || 'Abonelik kaydedilemedi.'); }
    return true;
  }
  async function disable() {
    const r = await navigator.serviceWorker.getRegistration(); const s = r && await r.pushManager.getSubscription();
    if (s) { try { await post({ action: 'unsubscribe', endpoint: s.endpoint }); } catch (e) { /* önemsiz */ } await s.unsubscribe(); }
  }
  // Açıkken aboneliği sunucuyla sessizce eşitle (adres yenilenmiş olabilir)
  if (can && Notification.permission === 'granted') navigator.serviceWorker.getRegistration().then(r => r && r.pushManager.getSubscription()).then(s => { if (s) post({ subscription: s.toJSON() }).catch(() => {}); }).catch(() => {});
  window.PUSH = { configured: !!KEY, state, enable, disable };
})();
