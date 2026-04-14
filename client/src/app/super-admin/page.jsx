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
        localStorage.setItem(`token_${data.business.slug}`, data.token);
        localStorage.setItem(`business_${data.business.slug}`, JSON.stringify(data.business));
        window.open(`/${data.business.slug}/admin`, '_blank');
      }
    } catch (e) { alert('Sızma başarısız!'); }
  };

  const getStatus = (lastLogin) => {
    if (!lastLogin) return { label: 'YENİ', color: '#3b82f6' };
    const now = new Date();
    const loginDate = new Date(lastLogin);
    const diffHours = (now - loginDate) / (1000 * 60 * 60);

    if (diffHours < 24) return { label: 'AKTİF ✅', color: '#10b981' };
    if (diffHours < 72) return { label: 'BEKLEMEDA ⏳', color: '#f59e0b' };
    return { label: 'PASİF 🔴', color: '#ef4444' };
  };

  if (loading) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#020617', color:'#fff'}}>Veriler Mühürleniyor...</div>;

  return (
    <div style={{minHeight:'100vh', background:'#020617', color:'#f8fafc', padding:'40px', fontFamily:'Inter, sans-serif'}}>
      <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'60px'}}>
        <div>
           <h1 style={{fontSize:'2.5rem', fontWeight:'900', letterSpacing:'-2px', margin:0}}>Patron <span style={{color:'#3b82f6'}}>Paneli</span></h1>
           <p style={{color:'#64748b', marginTop:'8px'}}>İşletme takip ve performans monitörü</p>
        </div>
      </header>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(400px, 1fr))', gap:'32px'}}>
        {businesses.map(biz => {
          const status = getStatus(biz.last_login_at);
          return (
            <div key={biz.id} style={{background:'#0f172a', padding:'32px', borderRadius:'32px', border:'1px solid rgba(255,255,255,0.05)', position:'relative', transition:'all 0.3s'}}>
              
              <div style={{position:'absolute', top:'20px', right:'24px', fontSize:'0.75rem', fontWeight:'900', color: status.color, background:`${status.color}15`, padding:'6px 14px', borderRadius:'100px', border:`1px solid ${status.color}30`}}>
                 {status.label}
              </div>

              <div style={{marginBottom:'32px'}}>
                  <h3 style={{fontSize:'1.8rem', fontWeight:'800', margin:0}}>{biz.name}</h3>
                  <p style={{margin:'4px 0', color:'#3b82f6', fontSize:'0.85rem', fontWeight:'700'}}>/{biz.slug}</p>
              </div>

              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'32px'}}>
                 <div style={{background:'rgba(255,255,255,0.02)', padding:'16px', borderRadius:'20px', textAlign:'center', border:'1px solid rgba(255,255,255,0.05)'}}>
                    <p style={{fontSize:'0.75rem', color:'#64748b', marginBottom:'8px'}}>BUGÜN SİPARİŞ</p>
                    <p style={{fontSize:'1.6rem', fontWeight:'900', margin:0, color:'#3b82f6'}}>{biz.daily_orders || 0}</p>
                 </div>
                 <div style={{background:'rgba(255,255,255,0.02)', padding:'16px', borderRadius:'20px', textAlign:'center', border:'1px solid rgba(255,255,255,0.05)'}}>
                    <p style={{fontSize:'0.75rem', color:'#64748b', marginBottom:'8px'}}>TOPLAM KAZANÇ</p>
                    <p style={{fontSize:'1.6rem', fontWeight:'900', margin:0, color:'#10b981'}}>₺{biz.total_revenue || 0}</p>
                 </div>
              </div>

              <div style={{marginBottom:'32px'}}>
                 <p style={{fontSize:'0.75rem', color:'#64748b', marginBottom:'8px'}}>SON AKTİVİTE</p>
                 <p style={{fontSize:'0.95rem', fontWeight:'600'}}>
                    {biz.last_login_at ? new Date(biz.last_login_at).toLocaleString('tr-TR') : 'Henüz giriş yapmadı'}
                 </p>
              </div>

              <div style={{display:'flex', gap:'16px'}}>
                 <button 
                   onClick={() => loginAsBusiness(biz.id)}
                   style={{flex:1, padding:'18px', borderRadius:'18px', background:'#3b82f6', color:'#fff', border:'none', fontWeight:'800', cursor:'pointer', boxShadow:'0 10px 20px rgba(59, 130, 246, 0.2)'}}
                 >
                   Kontrole Sız 🔥
                 </button>
                 <button 
                   onClick={() => window.open(`/${biz.slug}/menu`, '_blank')}
                   style={{padding:'18px', borderRadius:'18px', background:'rgba(255,255,255,0.05)', color:'#fff', border:'none', fontWeight:'800', cursor:'pointer'}}
                 >
                   👁️
                 </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
