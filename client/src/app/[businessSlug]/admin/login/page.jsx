'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const params = useParams();
  const businessSlug = params.businessSlug;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        // Token ve isletme bilgisini sakla
        localStorage.setItem(`token_${businessSlug}`, data.token);
        localStorage.setItem(`business_${businessSlug}`, JSON.stringify(data.business));
        
        // Admin paneline yonlendir
        router.push(`/${businessSlug}/admin`);
      } else {
        setError(data.error || 'Giriş yapılamadı.');
      }
    } catch (err) {
      setError('Sunucu bağlantı hatası.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#f8f9fb', fontFamily:'Inter, sans-serif'}}>
      <div style={{padding:'48px', background:'#fff', borderRadius:'32px', boxShadow:'0 20px 40px rgba(0,0,0,0.05)', width:'100%', maxWidth:'450px'}}>
        <div style={{textAlign:'center', marginBottom:'40px'}}>
           <div style={{fontSize:'3rem', marginBottom:'16px'}}>🔐</div>
           <h1 style={{fontSize:'1.8rem', fontWeight:'900', color:'#0f172a'}}>Yönetici Girişi</h1>
           <p style={{color:'#64748b', marginTop:'8px'}}>İşletme: <strong style={{color:'#3b82f6'}}>{businessSlug.toUpperCase()}</strong></p>
        </div>

        {error && <div style={{padding:'16px', background:'#fee2e2', color:'#ef4444', borderRadius:'14px', marginBottom:'24px', fontSize:'0.9rem', textAlign:'center', fontWeight:'600'}}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div style={{marginBottom:'24px'}}>
            <label style={{display:'block', marginBottom:'8px', fontSize:'0.9rem', fontWeight:'600', color:'#475569'}}>E-posta Adresi</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{width:'100%', padding:'16px', borderRadius:'14px', border:'1px solid #e2e8f0', outline:'none', fontSize:'1rem', boxSizing:'border-box'}}
              placeholder="admin@isletme.com"
            />
          </div>

          <div style={{marginBottom:'32px'}}>
            <label style={{display:'block', marginBottom:'8px', fontSize:'0.9rem', fontWeight:'600', color:'#475569'}}>Şifre</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{width:'100%', padding:'16px', borderRadius:'14px', border:'1px solid #e2e8f0', outline:'none', fontSize:'1rem', boxSizing:'border-box'}}
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              width:'100%', 
              padding:'18px', 
              borderRadius:'16px', 
              border:'none', 
              background:'#0f172a', 
              color:'#fff', 
              fontWeight:'700', 
              fontSize:'1.1rem', 
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 10px 20px rgba(15, 23, 42, 0.15)',
              transition: 'all 0.2s'
            }}
          >
            {loading ? 'Giriş Yapılıyor...' : 'Panele Eriş 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}
