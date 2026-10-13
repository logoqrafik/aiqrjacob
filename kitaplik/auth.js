// Hesap sistemi: Google / Facebook ile giriş, kullanıcıya özel veri, üyelik kontrolü, bulut eşitleme.
// config.js içinde supabase.url ve supabase.anonKey boşsa uygulama eski "yerel mod"da, girişsiz çalışır.
(() => {
  'use strict';
  const C = window.CONFIG || {}, SB = C.supabase || {};
  const V = '22';
  const SCRIPTS = ['daily.js', 'app.js', 'cards.js', 'shelf.js', 'shapes.js', 'story.js', 'studio.js'];
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function boot() {
    return new Promise(ok => {
      let n = SCRIPTS.length;
      SCRIPTS.forEach(src => { const s = document.createElement('script'); s.src = `${src}?v=${V}`; s.async = false; s.onload = s.onerror = () => { if (--n === 0) ok(); }; document.body.appendChild(s); });
    });
  }
  if (!SB.url || !SB.anonKey) { window.ACCOUNT = null; boot(); return; } // yerel mod

  // ---------- yerel veri (bu cihazdaki önbellek) ----------
  const LS_KEYS = () => Object.keys(localStorage).filter(k => k.startsWith('sa.'));
  const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const idb = () => new Promise((ok, no) => { const r = indexedDB.open('sa-studio', 1); r.onupgradeneeded = () => r.result.createObjectStore('designs', { keyPath: 'id' }); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
  async function idbAll() { try { const db = await idb(); return await new Promise(ok => { const q = db.transaction('designs').objectStore('designs').getAll(); q.onsuccess = () => { db.close(); ok(q.result || []); }; q.onerror = () => { db.close(); ok([]); }; }); } catch (e) { return []; } }
  async function idbReplace(list) {
    try {
      const db = await idb();
      await new Promise(ok => { const t = db.transaction('designs', 'readwrite'), s = t.objectStore('designs'); s.clear(); list.forEach(d => s.put(d)); t.oncomplete = t.onerror = t.onabort = () => { db.close(); ok(); }; });
    } catch (e) { /* önemsiz */ }
  }
  async function wipeLocal() {
    LS_KEYS().forEach(k => localStorage.removeItem(k));
    await idbReplace([]);
  }
  const hasLocalData = async () => !!(localStorage.getItem('sa.lib') || localStorage.getItem('sa.books') || (await idbAll()).length);

  // ---------- ekranlar ----------
  document.body.classList.add('gated');
  const gate = document.createElement('div'); gate.id = 'gate'; document.body.appendChild(gate);
  const card = html => { gate.innerHTML = `<div class="gate-card"><img class="logo" src="logo.svg" alt="" width="72" height="72"><h1>Satır Arası</h1>${html}</div>`; };
  const busy = t => card(`<div class="dots" style="justify-content:center;margin:22px 0 10px"><i></i><i></i><i></i></div><p class="gate-p">${esc(t)}</p>`);
  const GICON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9a6 6 0 1 1 0-12c1.9 0 3.2.8 3.9 1.5l2.7-2.6A9.8 9.8 0 0 0 12 2a10 10 0 1 0 0 20c5.8 0 9.6-4 9.6-9.8 0-.7-.1-1.2-.2-1.7z"/></svg>';
  const FICON = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z"/></svg>';
  function loginScreen(msg) {
    card(`<p class="gate-p">Kitaplar için kişisel alıntı, raf ve tasarım köşen. Giriş yap, her şeyin sadece sana ait olsun.</p>
      ${msg ? `<div class="gate-err">${esc(msg)}</div>` : ''}
      <button class="gbtn" data-p="google">${GICON}<span>Google ile devam et</span></button>
      <button class="gbtn" data-p="facebook">${FICON}<span>Facebook ile devam et</span></button>
      <p class="gate-s">Devam ederek <a href="gizlilik.html" target="_blank" rel="noopener">Gizlilik Politikası</a>'nı kabul etmiş olursun. Verilerin yalnızca senin hesabında saklanır, kimse göremez.</p>`);
  }
  gate.addEventListener('click', async e => {
    const b = e.target.closest('[data-p]'); if (!b || !window.__sb) return;
    busy('Yönlendiriliyorsun…');
    const { error } = await window.__sb.auth.signInWithOAuth({ provider: b.dataset.p, options: { redirectTo: location.origin + location.pathname } });
    if (error) loginScreen('Giriş başlatılamadı: ' + error.message);
  });

  // ---------- ana akış ----------
  (async () => {
    busy('Hazırlanıyor…');
    try { await new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'vendor/supabase.js?v=' + V; s.onload = ok; s.onerror = () => no(new Error('yüklenemedi')); document.head.appendChild(s); }); }
    catch (e) { return card('<p class="gate-p">Giriş sistemi yüklenemedi. İnternet bağlantını kontrol edip sayfayı yenile.</p><button class="gbtn" onclick="location.reload()">Yenile</button>'); }
    const sb = window.__sb = window.supabase.createClient(SB.url, SB.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    sb.auth.onAuthStateChange(ev => { if (ev === 'SIGNED_OUT' && window.ACCOUNT) location.reload(); });
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return loginScreen('');
    try { await enter(sb, session); } catch (e) { card(`<p class="gate-p">Bir sorun oluştu: ${esc(e.message || e)}</p><button class="gbtn" onclick="location.reload()">Tekrar dene</button>`); }
  })();

  async function enter(sb, session) {
    busy('Hesabın açılıyor…');
    const uid = session.user.id, email = session.user.email || '';
    let prof = null;
    for (let i = 0; i < 4 && !prof; i++) { const r = await sb.from('profiles').select('free,plan,paid_until').eq('id', uid).maybeSingle(); prof = r.data; if (!prof) await new Promise(k => setTimeout(k, 450)); }
    const st = await sb.from('app_settings').select('value').eq('key', 'billing_enabled');
    const billing = !!(st.data && st.data[0] && st.data[0].value === 'true');
    const active = !!prof && (prof.free || (prof.plan === 'active' && prof.paid_until && new Date(prof.paid_until) > new Date()));
    if (billing && !active) return paywall(sb, email);

    // bu cihazda başka birinin verisi kalmasın; kendi eski yerel verin varsa buluta aktarmayı sor
    const [cs, cd] = await Promise.all([sb.from('user_state').select('lib,books').eq('user_id', uid).maybeSingle(), sb.from('designs').select('*').eq('user_id', uid)]);
    if (cs.error || cd.error) throw new Error('Verilerin alınamadı. Bağlantını kontrol et.');
    const cloudEmpty = !cs.data && !(cd.data || []).length, last = localStorage.getItem('sa.uid');
    let migrate = false;
    if (last && last !== uid) await wipeLocal();
    else if (!last && await hasLocalData()) {
      if (cloudEmpty) { migrate = await askMigrate(); if (!migrate) await wipeLocal(); } else await wipeLocal();
    }
    if (!migrate) {
      if (cs.data) { localStorage.setItem('sa.lib', JSON.stringify(cs.data.lib || {})); localStorage.setItem('sa.books', JSON.stringify(cs.data.books || [])); }
      await idbReplace((cd.data || []).map(r => ({ id: r.id, name: r.name, at: r.at, thumb: r.thumb, state: r.state, photo: r.photo || '' })));
    }
    localStorage.setItem('sa.uid', uid);

    const flush = async () => { dirty = false; const r = await sb.from('user_state').upsert({ user_id: uid, lib: lsGet('sa.lib', {}), books: lsGet('sa.books', []), updated_at: new Date().toISOString() }); if (r.error) dirty = true; return !r.error; };
    let timer = 0, dirty = false;
    const queue = () => { dirty = true; clearTimeout(timer); timer = setTimeout(flush, 1500); };
    // Supabase sorguları tembeldir: await edilmezse hiç gönderilmez
    const pushDesign = async d => { const r = await sb.from('designs').upsert({ id: d.id, user_id: uid, name: d.name, at: d.at, thumb: d.thumb, state: d.state, photo: d.photo || '' }); return !r.error; };
    const dropDesign = async id => { await sb.from('designs').delete().eq('user_id', uid).eq('id', id); };
    async function pushAll() { await flush(); for (const d of await idbAll()) await pushDesign(d); }
    if (migrate) await pushAll();

    window.ACCOUNT = {
      email, free: !!(prof && prof.free), plan: prof ? prof.plan : 'none', billing, active,
      token: async () => { const r = await sb.auth.getSession(); return r.data.session ? r.data.session.access_token : ''; },
      redeem: async code => { const r = await sb.rpc('redeem_invite', { p_code: code }); return !r.error && r.data === true; },
      signOut: async () => { clearTimeout(timer); await flush(); await wipeLocal(); await sb.auth.signOut(); location.reload(); },
      deleteMe: async () => { clearTimeout(timer); await sb.rpc('delete_my_data'); await wipeLocal(); await sb.auth.signOut(); location.reload(); }
    };
    gate.remove(); document.body.classList.remove('gated');
    await boot();
    document.addEventListener('sa-lib', queue); window.addEventListener('sa-books', queue);
    document.addEventListener('sa-design', e => { const { op, d } = e.detail || {}; if (op === 'put') pushDesign(d); else if (op === 'del') dropDesign(d.id); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && dirty) flush(); });
    window.addEventListener('pagehide', () => { if (dirty) flush(); });
  }

  function askMigrate() {
    return new Promise(ok => {
      card(`<p class="gate-p">Bu cihazda daha önce oluşturduğun raf, alıntı ve tasarımlar var. Hesabına aktarılsın mı?</p>
        <button class="gbtn main" data-m="1"><span>Evet, hesabıma aktar</span></button>
        <button class="gbtn" data-m="0"><span>Hayır, bu cihazdakileri sil</span></button>`);
      gate.addEventListener('click', function h(e) { const b = e.target.closest('[data-m]'); if (!b) return; gate.removeEventListener('click', h); busy('Aktarılıyor…'); ok(b.dataset.m === '1'); });
    });
  }

  function paywall(sb, email) {
    card(`<p class="gate-p">Satır Arası aylık üyelikle kullanılır. Ödeme altyapısı çok yakında açılacak. Davet kodun varsa gir.</p>
      <input id="gCode" placeholder="Davet kodu" autocomplete="off" autocapitalize="characters">
      <div class="gate-err" id="gErr" hidden></div>
      <button class="gbtn main" id="gGo"><span>Kodu kullan</span></button>
      <button class="gbtn" id="gOut"><span>Çıkış yap</span></button>
      <p class="gate-s">${esc(email)} ile giriş yapıldı.</p>`);
    $('#gGo').onclick = async () => {
      const code = $('#gCode').value.trim(); if (!code) return;
      const r = await sb.rpc('redeem_invite', { p_code: code });
      if (!r.error && r.data === true) return location.reload();
      const e = $('#gErr'); e.hidden = false; e.textContent = 'Bu kod geçersiz ya da daha önce kullanılmış.';
    };
    $('#gOut').onclick = async () => { await wipeLocal(); await sb.auth.signOut(); location.reload(); };
  }
})();
