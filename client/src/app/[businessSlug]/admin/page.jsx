'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { io } from 'socket.io-client'; 

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({ name: '', logo_url: '', theme_color: '#3b82f6', whatsapp_number: '', welcome_message: '', footer_text: '' });
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const params = useParams();
  const businessSlug = params.businessSlug;
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const audioRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem(`token_${businessSlug}`);
    if (!token) {
      router.push(`/${businessSlug}/admin/login`);
      return;
    }

    const savedBusiness = localStorage.getItem(`business_${businessSlug}`);
    if (savedBusiness) setBusiness(JSON.parse(savedBusiness));

    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    fetchData(token);
    
    const socket = io(API_URL); 
    socket.emit('join_business_room', businessSlug);

    socket.on('new_order', (newOrder) => {
        audioRef.current?.play().catch(() => {});
        setOrders(prev => [newOrder, ...prev]);
    });

    socket.on('order_status_updated', (updatedOrder) => {
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    });

    return () => socket.disconnect();
  }, [businessSlug]);

  const fetchData = async (token) => {
    try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const [oRes, pRes, sRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/orders`, { headers }),
          fetch(`${API_URL}/api/admin/products`, { headers }),
          fetch(`${API_URL}/api/admin/settings`, { headers })
        ]);

        if (oRes.status === 401 || oRes.status === 403) {
            handleLogout();
            return;
        }

        setOrders(await oRes.json());
        setProducts(await pRes.json());
        setSettings(await sRes.json());
        setLoading(false);
    } catch (e) { console.error(e); }
  };

  const updateSettings = async () => {
    try {
      const token = localStorage.getItem(`token_${businessSlug}`);
      const res = await fetch(`${API_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        alert('Ayarlar başarıyla güncellendi! ✅');
        const updated = await res.json();
        setSettings(updated);
        // Localstorage'daki business bilgisini de güncelle
        localStorage.setItem(`business_${businessSlug}`, JSON.stringify(updated));
      }
    } catch (e) { alert('Güncelleme sırasında hata oluştu.'); }
  };

  const updateOrderStatus = async (id, status) => {
    try {
        const token = localStorage.getItem(`token_${businessSlug}`);
        await fetch(`${API_URL}/api/admin/orders/${id}/status`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
    } catch (e) { fetchData(localStorage.getItem(`token_${businessSlug}`)); }
  };

  const handleLogout = () => {
    localStorage.removeItem(`token_${businessSlug}`);
    localStorage.removeItem(`business_${businessSlug}`);
    router.push(`/${businessSlug}/admin/login`);
  };

  if(loading) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center'}}>Yukleniyor...</div>;

  return (
    <div style={{minHeight:'100vh', display:'flex', background:'#f8f9fb', color:'#0f172a', fontFamily:'Inter, sans-serif'}}>
      <div style={{width: '280px', background:'#0f172a', color:'#fff'}}>
         <div style={{padding:'32px 24px'}}>
            <h1 style={{fontSize:'1.4rem', fontWeight:'900', letterSpacing:'-1px'}}>{settings?.name || 'RestoPanel'}</h1>
            <span style={{fontSize:'0.7rem', color:'#3b82f6', background:'rgba(59, 130, 246, 0.1)', padding:'4px 8px', borderRadius:'100px'}}>GÜVENLİ OTURUM ✅</span>
         </div>
         <div style={{padding:'10px 0'}}>
            {[
              { id: 'dashboard', label: '📊 DASHBOARD' },
              { id: 'orders', label: '📦 SİPARİŞLER' },
              { id: 'products', label: '🥘 ÜRÜNLER' },
              { id: 'settings', label: '⚙️ GENEL AYARLAR' }
            ].map(tab => (
              <div key={tab.id} onClick={() => setActiveTab(tab.id)} style={{padding:'16px 24px', cursor:'pointer', background: activeTab === tab.id ? 'rgba(255,255,255,0.1)' : 'transparent', borderLeft: activeTab === tab.id ? '4px solid #3b82f6' : '4px solid transparent', fontSize:'0.85rem', fontWeight:'700'}}>
                 {tab.label}
              </div>
            ))}
            <div onClick={handleLogout} style={{padding:'16px 24px', cursor:'pointer', color:'#ef4444', marginTop:'40px', fontWeight:'700', fontSize:'0.85rem'}}>ÇIKIŞ YAP 🚪</div>
         </div>
      </div>

      <div style={{flex:1, padding:'40px', overflowY:'auto'}}>
        {activeTab === 'dashboard' && (
           <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'24px'}}>
              <div style={{background:'#fff', padding:'32px', borderRadius:'24px', boxShadow:'0 4px 6px rgba(0,0,0,0.02)'}}>
                 <p style={{fontSize:'0.8rem', color:'#64748b', marginBottom:'8px'}}>TOPLAM SİPARİŞ</p>
                 <h2 style={{fontSize:'2rem', fontWeight:'900'}}>{orders.length}</h2>
              </div>
              <div style={{background:'#fff', padding:'32px', borderRadius:'24px', boxShadow:'0 4px 6px rgba(0,0,0,0.02)'}}>
                 <p style={{fontSize:'0.8rem', color:'#64748b', marginBottom:'8px'}}>AKTİF ÜRÜN</p>
                 <h2 style={{fontSize:'2rem', fontWeight:'900'}}>{products.length}</h2>
              </div>
              <div style={{background:'#fff', padding:'32px', borderRadius:'24px', boxShadow:'0 4px 6px rgba(0,0,0,0.02)'}}>
                 <p style={{fontSize:'0.8rem', color:'#64748b', marginBottom:'8px'}}>TEMA RENGI</p>
                 <div style={{width:'40px', height:'40px', background: settings.theme_color, borderRadius:'10px'}}></div>
              </div>
           </div>
        )}

        {activeTab === 'orders' && (
           <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(380px, 1fr))', gap:'24px'}}>
              {orders.map(o => (
                <div key={o.id} style={{background:'#fff', padding:'28px', borderRadius:'24px', boxShadow:'0 4px 6px rgba(0,0,0,0.02)'}}>
                   <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
                      <span style={{fontWeight:'800', fontSize:'1.1rem'}}>{o.customer_name}</span>
                      <span style={{fontSize:'0.7rem', color:'#64748b', background:'#f1f5f9', padding:'4px 8px', borderRadius:'8px'}}>{o.status.toUpperCase()}</span>
                   </div>
                   <div style={{padding:'16px', background:'#f8f9fb', borderRadius:'16px', marginBottom:'24px'}}>
                      {(() => {
                        try {
                          const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
                          return items.map((it, idx) => <p key={idx} style={{margin:'6px 0', fontSize:'0.9rem'}}><strong>{it.quantity}x</strong> {it.name}</p>);
                        } catch(e) { return <p>Hata: Veri okunamadı</p>; }
                      })()}
                   </div>
                   <div style={{display:'flex', gap:'12px'}}>
                     {o.status === 'pending' && <button onClick={() => updateOrderStatus(o.id, 'preparing')} style={{flex:1, padding:'14px', borderRadius:'12px', background:'#10b981', color:'#fff', border:'none', fontWeight:'700', cursor:'pointer'}}>Hazırla</button>}
                     {o.status === 'preparing' && <button onClick={() => updateOrderStatus(o.id, 'ready')} style={{flex:1, padding:'14px', borderRadius:'12px', background:'#3b82f6', color:'#fff', border:'none', fontWeight:'700', cursor:'pointer'}}>Müşteriye Çağrı</button>}
                     {o.status === 'ready' && <button onClick={() => updateOrderStatus(o.id, 'completed')} style={{flex:1, padding:'14px', borderRadius:'12px', background:'#0f172a', color:'#fff', border:'none', fontWeight:'700', cursor:'pointer'}}>Tamamla</button>}
                   </div>
                </div>
              ))}
           </div>
        )}

        {activeTab === 'settings' && (
          <div style={{maxWidth:'800px', background:'#fff', padding:'48px', borderRadius:'32px', boxShadow:'0 4px 6px rgba(0,0,0,0.02)'}}>
             <h2 style={{fontSize:'1.8rem', fontWeight:'900', marginBottom:'40px'}}>Genel Ayarlar</h2>
             
             <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px', marginBottom:'32px'}}>
                <div>
                  <label style={{display:'block', fontSize:'0.8rem', fontWeight:'700', color:'#64748b', marginBottom:'8px'}}>Dükkan Adı</label>
                  <input value={settings.name} onChange={e=>setSettings({...settings, name:e.target.value})} style={{width:'100%', padding:'16px', borderRadius:'14px', border:'1px solid #e2e8f0', outline:'none'}} />
                </div>
                <div>
                  <label style={{display:'block', fontSize:'0.8rem', fontWeight:'700', color:'#64748b', marginBottom:'8px'}}>WhatsApp No (Örn: 905XXXXXXXXX)</label>
                  <input value={settings.whatsapp_number} onChange={e=>setSettings({...settings, whatsapp_number:e.target.value})} style={{width:'100%', padding:'16px', borderRadius:'14px', border:'1px solid #e2e8f0', outline:'none'}} />
                </div>
             </div>

             <div style={{marginBottom:'32px'}}>
                <label style={{display:'block', fontSize:'0.8rem', fontWeight:'700', color:'#64748b', marginBottom:'8px'}}>Logo URL</label>
                <input value={settings.logo_url} onChange={e=>setSettings({...settings, logo_url:e.target.value})} style={{width:'100%', padding:'16px', borderRadius:'14px', border:'1px solid #e2e8f0', outline:'none'}} placeholder="https://..." />
             </div>

             <div style={{marginBottom:'32px'}}>
                <label style={{display:'block', fontSize:'0.8rem', fontWeight:'700', color:'#64748b', marginBottom:'8px'}}>Hoşgeldin Mesajı</label>
                <textarea value={settings.welcome_message} onChange={e=>setSettings({...settings, welcome_message:e.target.value})} style={{width:'100%', padding:'16px', borderRadius:'14px', border:'1px solid #e2e8f0', outline:'none', minHeight:'100px'}} placeholder="Menümüze hoşgeldiniz..."></textarea>
             </div>

             <div style={{marginBottom:'40px'}}>
                <label style={{display:'block', fontSize:'0.8rem', fontWeight:'700', color:'#64748b', marginBottom:'8px'}}>Tema Rengi</label>
                <input type="color" value={settings.theme_color} onChange={e=>setSettings({...settings, theme_color:e.target.value})} style={{width:'100%', height:'50px', borderRadius:'14px', border:'1px solid #e2e8f0', cursor:'pointer'}} />
             </div>

             <button onClick={updateSettings} style={{width:'100%', padding:'20px', borderRadius:'16px', background:'#3b82f6', color:'#fff', border:'none', fontWeight:'800', fontSize:'1rem', cursor:'pointer', boxShadow:'0 10px 20px rgba(59, 130, 246, 0.2)'}}>Ayarları Uygula 🚀</button>
          </div>
        )}
      </div>
    </div>
  );
}
