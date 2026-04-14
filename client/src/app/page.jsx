'use client';

import Link from 'next/link';

export default function SaaSLanding() {
  return (
    <div style={{minHeight:'100vh', background:'#0f172a', color:'#fff', fontFamily:'Inter, sans-serif'}}>
      {/* Navbar */}
      <nav style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'32px 10%', borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
         <h1 style={{fontSize:'1.5rem', fontWeight:'900', letterSpacing:'-1px'}}>RestoPanel</h1>
         <div style={{display:'flex', gap:'32px', alignItems:'center'}}>
            <Link href="/thejacob/admin/login" style={{color:'#94a3b8', textDecoration:'none', fontWeight:'600'}}>Giriş Yap</Link>
            <Link href="/thejacob/menu" style={{padding:'12px 24px', borderRadius:'12px', background:'#3b82f6', color:'#fff', textDecoration:'none', fontWeight:'700', boxShadow:'0 10px 20px rgba(59, 130, 246, 0.2)'}}>Ücretsiz Başla</Link>
         </div>
      </nav>

      {/* Hero Section */}
      <main style={{textAlign:'center', padding:'120px 20px'}}>
         <div style={{display:'inline-block', padding:'8px 16px', borderRadius:'100px', background:'rgba(59, 130, 246, 0.1)', color:'#3b82f6', fontWeight:'700', fontSize:'0.85rem', marginBottom:'24px', letterSpacing:'1px'}}>YENİ NESİL QR MENÜ SİSTEMİ</div>
         <h2 style={{fontSize:'4.5rem', fontWeight:'900', maxWidth:'900px', margin:'0 auto 32px auto', lineHeight:'1.1', letterSpacing:'-2px'}}>
            Restoranınızı <span style={{color:'#3b82f6'}}>Dijital Dünyaya</span> Saniyeler İçinde Taşıyın.
         </h2>
         <p style={{fontSize:'1.25rem', color:'#94a3b8', maxWidth:'650px', margin:'0 auto 48px auto', lineHeight:'1.6'}}>
            Çoklu dükkan desteği, anlık mutfak ekranı ve gelişmiş admin paneli ile işletmenizi her yerden yönetin.
         </p>
         
         <div style={{display:'flex', gap:'20px', justifyContent:'center'}}>
            <Link href="/thejacob/menu" style={{padding:'20px 48px', borderRadius:'16px', background:'#fff', color:'#0f172a', textDecoration:'none', fontWeight:'800', fontSize:'1.1rem', boxShadow:'0 20px 40px rgba(0,0,0,0.2)'}}>Örnek Menüyü Gör 🍕</Link>
            <Link href="/thejacob/admin/login" style={{padding:'20px 48px', borderRadius:'16px', background:'rgba(255,255,255,0.05)', color:'#fff', textDecoration:'none', fontWeight:'800', fontSize:'1.1rem', border:'1px solid rgba(255,255,255,0.1)'}}>Yönetici Paneli 📊</Link>
         </div>

         {/* Stats */}
         <div style={{marginTop:'100px', display:'flex', justifyContent:'center', gap:'80px'}}>
            <div>
               <h4 style={{fontSize:'2.5rem', fontWeight:'900', margin:'0'}}>500+</h4>
               <p style={{color:'#64748b', fontSize:'0.9rem'}}>Aktif İşletme</p>
            </div>
            <div>
               <h4 style={{fontSize:'2.5rem', fontWeight:'900', margin:'0'}}>100k</h4>
               <p style={{color:'#64748b', fontSize:'0.9rem'}}>Günlük Sipariş</p>
            </div>
            <div>
               <h4 style={{fontSize:'2.5rem', fontWeight:'900', margin:'0'}}>%100</h4>
               <p style={{color:'#64748b', fontSize:'0.9rem'}}>Memnuniyet</p>
            </div>
         </div>
      </main>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        body { margin: 0; background: #0f172a; }
      `}</style>
    </div>
  );
}
