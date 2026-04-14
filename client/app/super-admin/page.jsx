'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SuperAdminDashboard() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedBiz, setSelectedBiz] = useState(null);
  const [bizProducts, setBizProducts] = useState([]);
  const [editTab, setEditTab] = useState('settings');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const token = localStorage.getItem(`token_thejacob-m2z1v`); 
    if (!token) {
      router.push('/thejacob-m2z1v/admin/login');
      return;
    }
    fetchBusinesses(token);
  }, []);

  const fetchBusinesses = async (token) => {
    try {
      const res = await fetch(`${API_URL}/api/super-admin/businesses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setBusinesses(await res.json());
      else setError('Yetkisiz erişim.');
    } catch (e) { setError('Sunucu hatası.'); }
    finally { setLoading(false); }
  };

  const openEditModal = async (biz) => {
    setSelectedBiz(biz);
    setIsModalOpen(true);
    setEditTab('settings');
    const token = localStorage.getItem(`token_thejacob-m2z1v`);
    try {
      const res = await fetch(`${API_URL}/api/super-admin/businesses/${biz.id}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setBizProducts(await res.json());
    } catch (e) { console.error('Urunler çekilemedi'); }
  };

  const updateBusiness = async () => {
    const token = localStorage.getItem(`token_thejacob-m2z1v`);
    try {
      const res = await fetch(`${API_URL}/api/super-admin/businesses/${selectedBiz.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(selectedBiz)
      });
      if (res.ok) {
        alert('BUTA Sistem: İşletme güncellendi! ✅');
        fetchBusinesses(token);
      }
    } catch (e) { alert('Hata oluştu.'); }
  };

  const updateProduct = async (product) => {
    const token = localStorage.getItem(`token_thejacob-m2z1v`);
    try {
      const res = await fetch(`${API_URL}/api/super-admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(product)
      });
    } catch (e) { alert('Hata oluştu.'); }
  };

  const loginAsBusiness = async (bizId) => {
    const token = localStorage.getItem(`token_thejacob-m2z1v`);
    try {
      const res = await fetch(`${API_URL}/api/super-admin/login-as/${bizId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem(`token_${data.business.slug}`, data.token);
        localStorage.setItem(`business_${data.business.slug}`, JSON.stringify(data.business));
        window.open(`/${data.business.slug}/admin`, '_blank');
      }
    } catch (e) { alert('Sızma başarısız!'); }
  };

  const getStatus = (lastLogin) => {
    if (!lastLogin) return { label: 'YENİ', color: '#c4b5fd' };
    const now = new Date();
    const loginDate = new Date(lastLogin);
    const diffHours = (now - loginDate) / (1000 * 60 * 60);

    if (diffHours < 24) return { label: 'BUTA AKTİF ✅', color: '#10b981' };
    if (diffHours < 72) return { label: 'SESSİZ ⏳', color: '#f59e0b' };
    return { label: 'PASİF 🔴', color: '#ef4444' };
  };

  if (loading) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#020617', color:'#fff'}}>BUTA Verileri Mühürleniyor...</div>;

  return (
    <div style={{minHeight:'100vh', background:'#020617', color:'#f8fafc', padding:'40px', fontFamily:'Inter, sans-serif'}}>
      <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'60px'}}>
        <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
           <div style={{width:'50px', height:'50px', background:'#3b82f6', borderRadius:'14px', display:'flex', justifyContent:'center', alignItems:'center', fontWeight:'900', fontSize:'1.5rem'}}>B</div>
           <div>
              <h1 style={{fontSize:'2.2rem', fontWeight:'900', letterSpacing:'-2px', margin:0}}>BUTA <span style={{color:'#3b82f6'}}>Master Control</span></h1>
              <p style={{color:'#64748b', fontSize:'0.85rem'}}>SaaS Altyapı ve Performans Paneli</p>
           </div>
        </div>
      </header>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(420px, 1fr))', gap:'32px'}}>
        {businesses.map(biz => {
          const status = getStatus(biz.last_login_at);
          return (
            <div key={biz.id} style={{background:'#0f172a', padding:'36px', borderRadius:'32px', border:'1px solid rgba(255,255,255,0.05)', position:'relative', transition:'all 0.3s'}}>
              <div style={{position:'absolute', top:'24px', right:'24px', fontSize:'0.7rem', fontWeight:'900', color: status.color, background:`${status.color}15`, padding:'6px 16px', borderRadius:'100px', border:`1px solid ${status.color}30`}}>
                 {status.label}
              </div>
              <div style={{marginBottom:'32px'}}>
                  <h3 style={{fontSize:'1.8rem', fontWeight:'800', margin:0}}>{biz.name}</h3>
                  <p style={{margin:'4px 0', color:'#3b82f6', fontSize:'0.85rem', fontWeight:'700'}}>/{biz.slug}</p>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'32px'}}>
                 <div style={{background:'rgba(255,255,255,0.02)', padding:'20px', borderRadius:'24px', textAlign:'center', border:'1px solid rgba(255,255,255,0.05)'}}>
                    <p style={{fontSize:'0.7rem', color:'#64748b', marginBottom:'8px'}}>BUGÜN SİPARİŞ</p>
                    <p style={{fontSize:'1.8rem', fontWeight:'900', margin:0}}>{biz.daily_orders || 0}</p>
                 </div>
                 <div style={{background:'rgba(255,255,255,0.02)', padding:'20px', borderRadius:'24px', textAlign:'center', border:'1px solid rgba(255,255,255,0.05)'}}>
                    <p style={{fontSize:'0.7rem', color:'#64748b', marginBottom:'8px'}}>KAZANÇ</p>
                    <p style={{fontSize:'1.8rem', fontWeight:'900', margin:0, color:'#10b981'}}>₺{biz.total_revenue || 0}</p>
                 </div>
              </div>
              <div style={{display:'flex', gap:'16px'}}>
                 <button onClick={() => loginAsBusiness(biz.id)} style={{flex:1, padding:'18px', borderRadius:'18px', background:'#3b82f6', color:'#fff', border:'none', fontWeight:'800', cursor:'pointer'}}>Yönet 🛰️</button>
                 <button onClick={() => openEditModal(biz)} style={{padding:'18px', borderRadius:'18px', background:'rgba(255,255,255,0.05)', color:'#fff', border:'none', cursor:'pointer'}}>⚙️</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* REMOTE EDIT MODAL */}
      {isModalOpen && selectedBiz && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', backdropFilter:'blur(20px)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000, padding:'20px'}}>
           <div style={{background:'#0f172a', width:'100%', maxWidth:'850px', borderRadius:'40px', padding:'48px', maxHeight:'90vh', overflowY:'auto', border:'1px solid rgba(255,255,255,0.1)'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'40px'}}>
                 <h2 style={{fontSize:'2rem', fontWeight:'900', margin:0}}>BUTA Uzaktan Kontrol: {selectedBiz.name}</h2>
                 <button onClick={() => setIsModalOpen(false)} style={{background:'none', border:'none', color:'#fff', fontSize:'2rem', cursor:'pointer'}}>×</button>
              </div>
              <div style={{display:'flex', gap:'32px', borderBottom:'1px solid rgba(255,255,255,0.1)', marginBottom:'40px'}}>
                 <button onClick={() => setEditTab('settings')} style={{padding:'20px 0', background:'none', color: editTab === 'settings' ? '#3b82f6' : '#64748b', border:'none', borderBottom: editTab === 'settings' ? '4px solid #3b82f6' : 'none', fontWeight:'800', cursor:'pointer'}}>AYARLAR</button>
                 <button onClick={() => setEditTab('products')} style={{padding:'20px 0', background:'none', color: editTab === 'products' ? '#3b82f6' : '#64748b', border:'none', borderBottom: editTab === 'products' ? '4px solid #3b82f6' : 'none', fontWeight:'800', cursor:'pointer'}}>MENÜ & FİYATLAR</button>
              </div>
              {editTab === 'settings' && (
                <div style={{display:'grid', gap:'24px'}}>
                  <input value={selectedBiz.name} onChange={e=>setSelectedBiz({...selectedBiz, name:e.target.value})} style={{width:'100%', padding:'20px', borderRadius:'18px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff'}} placeholder="Isletme Adi" />
                  <input type="color" value={selectedBiz.theme_color || '#3b82f6'} onChange={e=>setSelectedBiz({...selectedBiz, theme_color:e.target.value})} style={{width:'100%', height:'60px', borderRadius:'18px', cursor:'pointer', background:'none', border:'1px solid rgba(255,255,255,0.1)'}} />
                  <button onClick={updateBusiness} style={{width:'100%', padding:'20px', borderRadius:'20px', background:'#3b82f6', color:'#fff', border:'none', fontWeight:'900', fontSize:'1.1rem', cursor:'pointer'}}>GÜNCELLEMELERİ MÜHÜRLE 🚀</button>
                </div>
              )}
              {editTab === 'products' && (
                <div style={{display:'grid', gap:'16px'}}>
                   {bizProducts.map(p => (
                     <div key={p.id} style={{display:'flex', gap:'16px', background:'rgba(255,255,255,0.03)', padding:'16px', borderRadius:'20px', alignItems:'center', border:'1px solid rgba(255,255,255,0.05)'}}>
                        <input value={p.name} onChange={e => {
                           const newP = [...bizProducts];
                           newP.find(x=>x.id===p.id).name = e.target.value;
                           setBizProducts(newP);
                        }} style={{flex:2, background:'none', border:'none', borderBottom:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'8px', fontWeight:'700'}} />
                        <div style={{flex:1, display:'flex', alignItems:'center', background:'rgba(255,255,255,0.05)', borderRadius:'14px', padding:'0 16px'}}>
                           <span style={{color:'#64748b'}}>₺</span>
                           <input value={p.price} onChange={e => {
                              const newP = [...bizProducts];
                              newP.find(x=>x.id===p.id).price = e.target.value;
                              setBizProducts(newP);
                           }} style={{width:'100%', background:'none', border:'none', color:'#fff', padding:'12px', fontWeight:'900', fontSize:'1.1rem'}} />
                        </div>
                        <button onClick={() => updateProduct(p)} style={{background:'#10b981', color:'#fff', border:'none', width:'50px', height:'50px', borderRadius:'16px', cursor:'pointer'}}>✓</button>
                     </div>
                   ))}
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}
