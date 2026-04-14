'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { io } from 'socket.io-client'; 

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({ name: '', logo_url: '', theme_color: '#3b82f6', whatsapp_number: '', welcome_message: '', footer_text: '' });
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
        alert('BUTA: Ayarlar mühürlendi! ✅');
        const updated = await res.json();
        setSettings(updated);
        localStorage.setItem(`business_${businessSlug}`, JSON.stringify(updated));
      }
    } catch (e) { alert('Hata oluştu.'); }
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

  if(loading) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#f8f9fb'}}>BUTA Sistem Yükleniyor...</div>;

  return (
    <div style={{minHeight:'100vh', display:'flex', background:'#f1f5f9', color:'#0f172a', fontFamily:'Inter, sans-serif'}}>
      <div style={{width: '300px', background:'#0f172a', color:'#fff', padding:'40px 0'}}>
         <div style={{padding:'0 32px 48px 32px'}}>
            <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px'}}>
              <div style={{width:'40px', height:'40px', background:'#3b82f6', borderRadius:'10px', display:'flex', justifyContent:'center', alignItems:'center', fontWeight:'900', fontSize:'1.2rem'}}>B</div>
              <span style={{fontSize:'1.4rem', fontWeight:'900', letterSpacing:'-1px'}}>BUTA Panel</span>
            </div>
            <p style={{fontSize:'0.8rem', color:'#64748b', fontWeight:'700'}}>{settings?.name?.toUpperCase()}</p>
         </div>
         <div style={{padding:'10px 0'}}>
            {[
              { id: 'dashboard', label: '📊 DASHBOARD' },
              { id: 'orders', label: '📦 SİPARİŞLER' },
              { id: 'products', label: '🥘 MENÜ YÖNETİMİ' },
              { id: 'settings', label: '⚙️ GENEL AYARLAR' }
            ].map(tab => (
              <div key={tab.id} onClick={() => setActiveTab(tab.id)} style={{padding:'18px 32px', cursor:'pointer', background: activeTab === tab.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent', borderLeft: activeTab === tab.id ? '4px solid #3b82f6' : '4px solid transparent', fontSize:'0.85rem', fontWeight:'800', color: activeTab === tab.id ? '#3b82f6' : '#94a3b8'}}>
                 {tab.label}
              </div>
            ))}
            <div onClick={handleLogout} style={{padding:'18px 32px', cursor:'pointer', color:'#ef4444', marginTop:'60px', fontWeight:'800', fontSize:'0.85rem'}}>GÜVENLİ ÇIKIŞ 🚪</div>
         </div>
      </div>

      <div style={{flex:1, padding:'60px', overflowY:'auto'}}>
        {activeTab === 'dashboard' && (
           <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'32px'}}>
              <div style={{background:'#fff', padding:'40px', borderRadius:'32px', boxShadow:'0 10px 30px rgba(0,0,0,0.02)', border:'1px solid rgba(0,0,0,0.03)'}}>
                 <p style={{fontSize:'0.75rem', color:'#64748b', fontWeight:'700', marginBottom:'12px'}}>BUGÜNKÜ SİPARİŞ</p>
                 <h2 style={{fontSize:'2.5rem', fontWeight:'900'}}>{orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length}</h2>
              </div>
              <div style={{background:'#fff', padding:'40px', borderRadius:'32px', boxShadow:'0 10px 30px rgba(0,0,0,0.02)', border:'1px solid rgba(0,0,0,0.03)'}}>
                 <p style={{fontSize:'0.75rem', color:'#64748b', fontWeight:'700', marginBottom:'12px'}}>TOPLAM ÜRÜN</p>
                 <h2 style={{fontSize:'2.5rem', fontWeight:'900'}}>{products.length}</h2>
              </div>
              <div style={{background:'#fff', padding:'40px', borderRadius:'32px', boxShadow:'0 10px 30px rgba(0,0,0,0.02)', border:'1px solid rgba(0,0,0,0.03)'}}>
                 <p style={{fontSize:'0.75rem', color:'#64748b', fontWeight:'700', marginBottom:'12px'}}>SİSTEM DURUMU</p>
                 <span style={{color:'#10b981', fontWeight:'900', fontSize:'1.2rem'}}>BUTA ONLINE ⚡</span>
              </div>
           </div>
        )}

        {activeTab === 'orders' && (
           <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(400px, 1fr))', gap:'32px'}}>
              {orders.map(o => (
                <div key={o.id} style={{background:'#fff', padding:'32px', borderRadius:'32px', boxShadow:'0 10px 30px rgba(0,0,0,0.02)', border:'1px solid rgba(0,0,0,0.03)'}}>
                   <div style={{display:'flex', justifyContent:'space-between', marginBottom:'24px'}}>
                      <span style={{fontWeight:'900', fontSize:'1.2rem'}}>{o.customer_name}</span>
                      <span style={{fontSize:'0.7rem', color:'#3b82f6', background:'#eff6ff', padding:'6px 12px', borderRadius:'100px', fontWeight:'800'}}>{o.status.toUpperCase()}</span>
                   </div>
                   <div style={{padding:'20px', background:'#f8fafc', borderRadius:'24px', marginBottom:'32px'}}>
                      {(() => {
                        try {
                          const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
                          return items.map((it, idx) => <p key={idx} style={{margin:'8px 0', fontSize:'0.95rem', fontWeight:'600'}}><strong>{it.quantity}x</strong> {it.name}</p>);
                        } catch(e) { return <p>Veri Hatası</p>; }
                      })()}
                   </div>
                   <div style={{display:'flex', gap:'16px'}}>
                     {o.status === 'pending' && <button onClick={() => updateOrderStatus(o.id, 'preparing')} style={{flex:1, padding:'16px', borderRadius:'16px', background:'#10b981', color:'#fff', border:'none', fontWeight:'800', cursor:'pointer'}}>Mutfak Onay</button>}
                     {o.status === 'preparing' && <button onClick={() => updateOrderStatus(o.id, 'ready')} style={{flex:1, padding:'16px', borderRadius:'16px', background:'#3b82f6', color:'#fff', border:'none', fontWeight:'800', cursor:'pointer'}}>Hazır Bildir</button>}
                     {o.status === 'ready' && <button onClick={() => updateOrderStatus(o.id, 'completed')} style={{flex:1, padding:'16px', borderRadius:'16px', background:'#0f172a', color:'#fff', border:'none', fontWeight:'800', cursor:'pointer'}}>Teslim Edildi</button>}
                   </div>
                </div>
              ))}
           </div>
        )}

        {activeTab === 'settings' && (
          <div style={{maxWidth:'900px', background:'#fff', padding:'56px', borderRadius:'40px', boxShadow:'0 10px 30px rgba(0,0,0,0.02)'}}>
             <h2 style={{fontSize:'2rem', fontWeight:'900', marginBottom:'48px'}}>BUTA İşletme Ayarları</h2>
             <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'32px', marginBottom:'40px'}}>
                <div style={{gridColumn:'span 2'}}>
                  <label style={{display:'block', fontSize:'0.8rem', fontWeight:'800', color:'#64748b', marginBottom:'12px'}}>BUTA LOGO URL</label>
                  <input value={settings.logo_url} onChange={e=>setSettings({...settings, logo_url:e.target.value})} style={{width:'100%', padding:'20px', borderRadius:'18px', border:'1px solid #e2e8f0', outline:'none', background:'#f8fafc'}} placeholder="https://..." />
                </div>
                <div>
                  <label style={{display:'block', fontSize:'0.8rem', fontWeight:'800', color:'#64748b', marginBottom:'12px'}}>İŞLETME ADI</label>
                  <input value={settings.name} onChange={e=>setSettings({...settings, name:e.target.value})} style={{width:'100%', padding:'20px', borderRadius:'18px', border:'1px solid #e2e8f0', outline:'none', background:'#f8fafc'}} />
                </div>
                <div>
                  <label style={{display:'block', fontSize:'0.8rem', fontWeight:'800', color:'#64748b', marginBottom:'12px'}}>WHATSAPP NO</label>
                  <input value={settings.whatsapp_number} onChange={e=>setSettings({...settings, whatsapp_number:e.target.value})} style={{width:'100%', padding:'20px', borderRadius:'18px', border:'1px solid #e2e8f0', outline:'none', background:'#f8fafc'}} />
                </div>
             </div>
             <div style={{marginBottom:'40px'}}>
                <label style={{display:'block', fontSize:'0.8rem', fontWeight:'800', color:'#64748b', marginBottom:'12px'}}>KARŞILAMA MESAJI</label>
                <textarea value={settings.welcome_message} onChange={e=>setSettings({...settings, welcome_message:e.target.value})} style={{width:'100%', padding:'20px', borderRadius:'18px', border:'1px solid #e2e8f0', outline:'none', minHeight:'120px', background:'#f8fafc'}} />
             </div>
             <div style={{marginBottom:'48px'}}>
                <label style={{display:'block', fontSize:'0.8rem', fontWeight:'800', color:'#64748b', marginBottom:'12px'}}>TEMA RENGİ</label>
                <input type="color" value={settings.theme_color} onChange={e=>setSettings({...settings, theme_color:e.target.value})} style={{width:'100%', height:'60px', borderRadius:'18px', border:'1px solid #e2e8f0', cursor:'pointer'}} />
             </div>
             <button onClick={updateSettings} style={{width:'100%', padding:'24px', borderRadius:'24px', background:'#3b82f6', color:'#fff', border:'none', fontWeight:'900', fontSize:'1.1rem', cursor:'pointer', boxShadow:'0 20px 40px rgba(59, 130, 246, 0.2)'}}>AYARLARI MÜHÜRLE ✅</button>
          </div>
        )}
      </div>
    </div>
  );
}
