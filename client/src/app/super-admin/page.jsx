'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SuperAdminDashboard() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    // Super Admin check (Must be logged in to 'thejacob' first or any domain with super-admin role)
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
      if (res.ok) {
        setBusinesses(await res.json());
      } else {
        setError('Yetkisiz erişim veya sunucu hatası.');
      }
    } catch (e) { setError('Sunucuya bağlanılamadı.'); }
    finally { setLoading(false); }
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
        // Seçilen işletmenin bilgilerini sakla
        localStorage.setItem(`token_${data.business.slug}`, data.token);
        localStorage.setItem(`business_${data.business.slug}`, JSON.stringify(data.business));
        
        // Yeni sekmede o işletmenin admin paneline git
        window.open(`/${data.business.slug}/admin`, '_blank');
      }
    } catch (e) { alert('Sızma başarısız!'); }
  };

  if (loading) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#020617', color:'#fff'}}>Veriler Mühürleniyor...</div>;

  return (
    <div style={{minHeight:'100vh', background:'#020617', color:'#f8fafc', padding:'40px', fontFamily:'Inter, sans-serif'}}>
      <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'60px'}}>
        <div>
           <h1 style={{fontSize:'2.5rem', fontWeight:'900', letterSpacing:'-2px', margin:0}}>Super <span style={{color:'#3b82f6'}}>Admin</span></h1>
           <p style={{color:'#64748b', marginTop:'8px'}}>SaaS Platform Üst Düzey Yönetim Paneli</p>
        </div>
        <div style={{display:'flex', gap:'20px'}}>
           <div style={{background:'rgba(255,255,255,0.05)', padding:'12px 24px', borderRadius:'16px', border:'1px solid rgba(255,255,255,0.1)'}}>
              <span style={{color:'#64748b', fontSize:'0.8rem'}}>Aktif İşletmeler:</span>
              <span style={{marginLeft:'10px', fontWeight:'800', fontSize:'1.1rem'}}>{businesses.length}</span>
           </div>
        </div>
      </header>

      {error && <div style={{padding:'24px', background:'#450a0a', border:'1px solid #991b1b', color:'#fca5a5', borderRadius:'20px', marginBottom:'40px'}}>{error}</div>}

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(400px, 1fr))', gap:'24px'}}>
        {businesses.map(biz => (
          <div key={biz.id} style={{background:'#0f172a', padding:'32px', borderRadius:'32px', border:'1px solid rgba(255,255,255,0.05)', transition:'all 0.3s'}} onMouseEnter={e=>e.currentTarget.style.borderColor='#3b82f6'}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'32px'}}>
               <div>
                  <h3 style={{fontSize:'1.6rem', fontWeight:'800', margin:0}}>{biz.name}</h3>
                  <span style={{fontSize:'0.85rem', color:'#3b82f6', fontWeight:'700'}}>/{biz.slug}</span>
               </div>
               <div style={{padding:'8px 16px', background:'rgba(255,255,255,0.05)', borderRadius:'12px', fontSize:'0.8rem', color:'#94a3b8'}}>
                 Kayıt: {new Date(biz.created_at).toLocaleDateString()}
               </div>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'16px', marginBottom:'40px'}}>
               <div style={{textAlign:'center'}}>
                  <p style={{color:'#64748b', fontSize:'0.75rem', marginBottom:'8px'}}>Sipariş</p>
                  <p style={{fontSize:'1.4rem', fontWeight:'900', margin:0}}>{biz.total_orders || 0}</p>
               </div>
               <div style={{textAlign:'center'}}>
                  <p style={{color:'#64748b', fontSize:'0.75rem', marginBottom:'8px'}}>Ürün</p>
                  <p style={{fontSize:'1.4rem', fontWeight:'900', margin:0}}>{biz.total_products || 0}</p>
               </div>
               <div style={{textAlign:'center'}}>
                  <p style={{color:'#64748b', fontSize:'0.75rem', marginBottom:'8px'}}>Kazanç</p>
                  <p style={{fontSize:'1.4rem', fontWeight:'900', margin:0, color:'#10b981'}}>₺{biz.total_revenue || 0}</p>
               </div>
            </div>

            <div style={{display:'flex', gap:'16px'}}>
               <button 
                 onClick={() => loginAsBusiness(biz.id)}
                 style={{flex:1, padding:'16px', borderRadius:'16px', background:'#3b82f6', color:'#fff', border:'none', fontWeight:'800', cursor:'pointer', boxShadow:'0 10px 20px rgba(59, 130, 246, 0.2)'}}
               >
                 Yönetim Paneline Sız 🔥
               </button>
               <button 
                 onClick={() => window.open(`/${biz.slug}/menu`, '_blank')}
                 style={{padding:'16px', borderRadius:'16px', background:'rgba(255,255,255,0.05)', color:'#fff', border:'none', fontWeight:'800', cursor:'pointer'}}
               >
                 Menü
               </button>
            </div>
          </div>
        ))}

        <div style={{border:'2px dashed rgba(255,255,255,0.1)', borderRadius:'32px', display:'flex', justifyContent:'center', alignItems:'center', cursor:'pointer', opacity:0.5, height:'300px'}}>
           <div style={{textAlign:'center'}}>
              <div style={{fontSize:'2rem', marginBottom:'12px'}}>➕</div>
              <p style={{fontWeight:'700'}}>Yakında: Yeni İşletme Ekle</p>
           </div>
        </div>
      </div>
    </div>
  );
}
