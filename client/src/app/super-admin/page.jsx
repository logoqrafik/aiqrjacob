'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SuperAdminDashboard() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Remote Edit States
  const [selectedBiz, setSelectedBiz] = useState(null);
  const [bizProducts, setBizProducts] = useState([]);
  const [editTab, setEditTab] = useState('settings'); // 'settings' or 'products'
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const token = localStorage.getItem(`token_thejacob`); 
    if (!token) {
      router.push('/thejacob/admin/login');
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
    
    // Fetch products for this business
    const token = localStorage.getItem(`token_thejacob`);
    try {
      const res = await fetch(`${API_URL}/api/super-admin/businesses/${biz.id}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setBizProducts(await res.json());
    } catch (e) { console.error('Urunler çekilemedi'); }
  };

  const updateBusiness = async () => {
    const token = localStorage.getItem(`token_thejacob`);
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
        alert('İşletme ayarları güncellendi!');
        fetchBusinesses(token);
      }
    } catch (e) { alert('Hata oluştu.'); }
  };

  const updateProduct = async (product) => {
    const token = localStorage.getItem(`token_thejacob`);
    try {
      const res = await fetch(`${API_URL}/api/super-admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(product)
      });
      if (res.ok) {
        // Optimistic update or refresh
        console.log('Urun guncellendi');
      }
    } catch (e) { alert('Hata oluştu.'); }
  };

  const loginAsBusiness = async (bizId) => {
    const token = localStorage.getItem(`token_thejacob`);
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

  if (loading) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#020617', color:'#fff'}}>Yükleniyor...</div>;

  return (
    <div style={{minHeight:'100vh', background:'#020617', color:'#f8fafc', padding:'40px', fontFamily:'Inter, sans-serif'}}>
      <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'60px'}}>
        <h1 style={{fontSize:'2.5rem', fontWeight:'900', letterSpacing:'-2px'}}>Patron <span style={{color:'#3b82f6'}}>Kontrol Merkezi</span></h1>
      </header>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(420px, 1fr))', gap:'32px'}}>
        {businesses.map(biz => (
          <div key={biz.id} style={{background:'#0f172a', padding:'32px', borderRadius:'32px', border:'1px solid rgba(255,255,255,0.05)'}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'32px'}}>
               <h3 style={{fontSize:'1.8rem', fontWeight:'800', margin:0}}>{biz.name}</h3>
               <button onClick={() => openEditModal(biz)} style={{background:'rgba(59, 130, 246, 0.1)', color:'#3b82f6', border:'none', padding:'8px 16px', borderRadius:'10px', fontWeight:'700', cursor:'pointer'}}>Düzenle ⚙️</button>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px', marginBottom:'32px'}}>
               <div style={{textAlign:'center', background:'rgba(255,255,255,0.02)', padding:'12px', borderRadius:'16px'}}>
                  <p style={{fontSize:'0.7rem', color:'#64748b', margin:'0 0 4px 0'}}>BUGÜN</p>
                  <p style={{fontSize:'1.2rem', fontWeight:'900', margin:0}}>{biz.daily_orders}</p>
               </div>
               <div style={{textAlign:'center', background:'rgba(255,255,255,0.02)', padding:'12px', borderRadius:'16px'}}>
                  <p style={{fontSize:'0.7rem', color:'#64748b', margin:'0 0 4px 0'}}>KAZANÇ</p>
                  <p style={{fontSize:'1.2rem', fontWeight:'900', margin:0, color:'#10b981'}}>₺{biz.total_revenue || 0}</p>
               </div>
               <div style={{textAlign:'center', background:'rgba(255,255,255,0.02)', padding:'12px', borderRadius:'16px'}}>
                  <p style={{fontSize:'0.7rem', color:'#64748b', margin:'0 0 4px 0'}}>ÜRÜN</p>
                  <p style={{fontSize:'1.2rem', fontWeight:'900', margin:0}}>{biz.total_products}</p>
               </div>
            </div>

            <div style={{display:'flex', gap:'16px'}}>
               <button onClick={() => loginAsBusiness(biz.id)} style={{flex:1, padding:'16px', borderRadius:'16px', background:'#3b82f6', color:'#fff', border:'none', fontWeight:'800', cursor:'pointer'}}>Sız 🔥</button>
               <button onClick={() => window.open(`/${biz.slug}/menu`, '_blank')} style={{padding:'16px', borderRadius:'16px', background:'rgba(255,255,255,0.05)', color:'#fff', border:'none', fontWeight:'800'}}>👁️</button>
            </div>
          </div>
        ))}
      </div>

      {/* REMOTE EDIT MODAL */}
      {isModalOpen && selectedBiz && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(10px)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000, padding:'20px'}}>
           <div style={{background:'#0f172a', width:'100%', maxWidth:'800px', borderRadius:'32px', padding:'40px', maxHeight:'90vh', overflowY:'auto', border:'1px solid rgba(255,255,255,0.1)'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'40px'}}>
                 <h2 style={{fontSize:'1.8rem', fontWeight:'800', margin:0}}>Uzaktan Yönetim: {selectedBiz.name}</h2>
                 <button onClick={() => setIsModalOpen(false)} style={{background:'none', border:'none', color:'#fff', fontSize:'1.5rem', cursor:'pointer'}}>×</button>
              </div>

              <div style={{display:'flex', gap:'32px', borderBottom:'1px solid rgba(255,255,255,0.1)', marginBottom:'32px'}}>
                 <button onClick={() => setEditTab('settings')} style={{padding:'16px 0', background:'none', color: editTab === 'settings' ? '#3b82f6' : '#64748b', border:'none', borderBottom: editTab === 'settings' ? '3px solid #3b82f6' : 'none', fontWeight:'700', cursor:'pointer'}}>İşletme Ayarları</button>
                 <button onClick={() => setEditTab('products')} style={{padding:'16px 0', background:'none', color: editTab === 'products' ? '#3b82f6' : '#64748b', border:'none', borderBottom: editTab === 'products' ? '3px solid #3b82f6' : 'none', fontWeight:'700', cursor:'pointer'}}>Menü & Fiyatlar</button>
              </div>

              {editTab === 'settings' && (
                <div>
                   <div style={{marginBottom:'24px'}}>
                      <label style={{display:'block', color:'#64748b', marginBottom:'8px', fontSize:'0.9rem'}}>İşletme Adı</label>
                      <input value={selectedBiz.name} onChange={e=>setSelectedBiz({...selectedBiz, name:e.target.value})} style={{width:'100%', padding:'16px', borderRadius:'14px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', outline:'none'}} />
                   </div>
                   <div style={{marginBottom:'32px'}}>
                      <label style={{display:'block', color:'#64748b', marginBottom:'8px', fontSize:'0.9rem'}}>Tema Rengi</label>
                      <input type="color" value={selectedBiz.theme_color || '#0f172a'} onChange={e=>setSelectedBiz({...selectedBiz, theme_color:e.target.value})} style={{width:'100%', height:'50px', borderRadius:'14px', background:'none', border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer'}} />
                   </div>
                   <button onClick={updateBusiness} style={{width:'100%', padding:'18px', borderRadius:'16px', background:'#3b82f6', color:'#fff', border:'none', fontWeight:'800', cursor:'pointer'}}>Ayarları Kaydet</button>
                </div>
              )}

              {editTab === 'products' && (
                <div style={{display:'grid', gap:'12px'}}>
                   {bizProducts.map(p => (
                     <div key={p.id} style={{display:'flex', gap:'12px', background:'rgba(255,255,255,0.03)', padding:'12px', borderRadius:'16px', alignItems:'center'}}>
                        <input value={p.name} onChange={e => {
                           const newP = [...bizProducts];
                           newP.find(x=>x.id===p.id).name = e.target.value;
                           setBizProducts(newP);
                        }} style={{flex:2, background:'none', border:'none', borderBottom:'1px solid rgba(255,255,255,0.1)', color:'#fff', padding:'8px'}} />
                        
                        <div style={{flex:1, display:'flex', alignItems:'center', background:'rgba(255,255,255,0.05)', borderRadius:'10px', padding:'0 12px'}}>
                           <span style={{color:'#64748b'}}>₺</span>
                           <input value={p.price} onChange={e => {
                              const newP = [...bizProducts];
                              newP.find(x=>x.id===p.id).price = e.target.value;
                              setBizProducts(newP);
                           }} style={{width:'100%', background:'none', border:'none', color:'#fff', padding:'8px', fontWeight:'800'}} />
                        </div>

                        <button onClick={() => updateProduct(p)} style={{background:'#10b981', color:'#fff', border:'none', padding:'10px 16px', borderRadius:'10px', fontWeight:'700', cursor:'pointer'}}>✓</button>
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
