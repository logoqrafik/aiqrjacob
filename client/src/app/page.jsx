'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lead, setLead] = useState({ name: '', phone: '', business: '' });

  const PLATFORM_WHATSAPP = '905XXXXXXXXX'; // Buraya kendi platform WhatsApp numaranı ekleyebilirsin

  const handleSendRequest = () => {
    if (!lead.name || !lead.phone || !lead.business) return alert('Lütfen tüm alanları doldurun.');
    
    const text = encodeURIComponent(
        `🚀 *BUTA YENİ BAŞVURU*\n\n` +
        `👤 *İsim:* ${lead.name}\n` +
        `📞 *Telefon:* ${lead.phone}\n` +
        `🏢 *İşletme:* ${lead.business}\n\n` +
        `_Bu mesaj BUTA Landing Page üzerinden otomatik oluşturulmuştur._`
    );
    window.open(`https://wa.me/${PLATFORM_WHATSAPP}?text=${text}`, '_blank');
    setIsModalOpen(false);
  };

  return (
    <div style={{fontFamily: 'Inter, sans-serif', color: '#0f172a', background: '#fff', overflowX: 'hidden'}}>
      {/* Navigation */}
      <nav style={{padding: '32px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'fixed', width: '100%', top: 0, zIndex: 1000, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
          <div style={{width: '40px', height: '40px', background: '#3b82f6', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '900', color: '#fff', fontSize: '1.2rem'}}>B</div>
          <span style={{fontSize: '1.5rem', fontWeight: '900', letterSpacing: '-1px'}}>BUTA</span>
        </div>
        <div style={{display: 'flex', gap: '32px', alignItems: 'center'}}>
          <Link href="/thejacob-m2z1v/admin/login" style={{fontWeight: '700', color: '#64748b', textDecoration: 'none'}}>Giriş Yap</Link>
          <button onClick={() => setIsModalOpen(true)} style={{padding: '12px 28px', background: '#0f172a', color: '#fff', borderRadius: '100px', fontWeight: '700', border:'none', cursor:'pointer'}}>Hemen Başla</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{padding: '200px 5% 120px 5%', textAlign: 'center', background: 'radial-gradient(circle at top right, #eff6ff, #fff)'}}>
        <div style={{display: 'inline-block', padding: '8px 20px', background: '#eff6ff', borderRadius: '100px', color: '#3b82f6', fontWeight: '700', fontSize: '0.9rem', marginBottom: '32px'}}>🚀 YENİ NESİL SAAS PLATFORMU</div>
        <h1 style={{fontSize: '4.5rem', fontWeight: '900', letterSpacing: '-3px', maxWidth: '900px', margin: '0 auto 32px auto', lineHeight: '1.1'}}>
          Daha Akıllı İşletmeler İçin <span style={{color: '#3b82f6'}}>BUTA</span> Deneyimi
        </h1>
        <p style={{fontSize: '1.3rem', color: '#64748b', maxWidth: '700px', margin: '0 auto 48px auto', lineHeight: '1.6'}}>
          Dijital menü, anlık sipariş takibi ve kurumsal yönetim artık BUTA asaletinde. İşletmenizi geleceğe taşımaya hazır mısınız?
        </p>
        <div style={{display: 'flex', gap: '16px', justifyContent: 'center'}}>
           <button onClick={() => setIsModalOpen(true)} style={{padding: '20px 48px', background: '#3b82f6', color: '#fff', borderRadius: '16px', fontSize: '1.1rem', fontWeight: '800', border:'none', cursor: 'pointer', boxShadow: '0 20px 40px rgba(59, 130, 246, 0.2)'}}>Sizi Arayalım</button>
           <Link href="/thejacob-m2z1v/menu" style={{padding: '20px 48px', background: '#fff', color: '#0f172a', borderRadius: '16px', fontSize: '1.1rem', fontWeight: '800', border: '1px solid #e2e8f0', textDecoration:'none'}}>Örnek Menü</Link>
        </div>
      </section>

      {/* Leads Form Modal */}
      {isModalOpen && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(10px)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:2000, padding:'20px'}}>
           <div style={{background:'#fff', width:'100%', maxWidth:'450px', borderRadius:'32px', padding:'40px', boxShadow:'0 25px 50px rgba(0,0,0,0.2)'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'32px'}}>
                 <h2 style={{fontSize:'1.8rem', fontWeight:'900', margin:0}}>Başvuru Yap</h2>
                 <button onClick={() => setIsModalOpen(false)} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer'}}>×</button>
              </div>
              <div style={{display:'grid', gap:'20px'}}>
                 <div>
                    <label style={{display:'block', fontSize:'0.8rem', fontWeight:'700', color:'#64748b', marginBottom:'8px'}}>Adınız Soyadınız</label>
                    <input value={lead.name} onChange={e=>setLead({...lead, name:e.target.value})} style={{width:'100%', padding:'16px', borderRadius:'14px', border:'1px solid #e2e8f0', outline:'none'}} placeholder="Örn: Ahmet Yılmaz" />
                 </div>
                 <div>
                    <label style={{display:'block', fontSize:'0.8rem', fontWeight:'700', color:'#64748b', marginBottom:'8px'}}>Telefon Numaranız</label>
                    <input value={lead.phone} onChange={e=>setLead({...lead, phone:e.target.value})} style={{width:'100%', padding:'16px', borderRadius:'14px', border:'1px solid #e2e8f0', outline:'none'}} placeholder="05XX XXX XX XX" />
                 </div>
                 <div>
                    <label style={{display:'block', fontSize:'0.8rem', fontWeight:'700', color:'#64748b', marginBottom:'8px'}}>İşletme Adı</label>
                    <input value={lead.business} onChange={e=>setLead({...lead, business:e.target.value})} style={{width:'100%', padding:'16px', borderRadius:'14px', border:'1px solid #e2e8f0', outline:'none'}} placeholder="Örn: BUTA Cafe" />
                 </div>
                 <button 
                   onClick={handleSendRequest}
                   style={{marginTop:'12px', padding:'20px', background:'#3b82f6', color:'#fff', border:'none', borderRadius:'16px', fontWeight:'900', fontSize:'1rem', cursor:'pointer', boxShadow:'0 10px 20px rgba(59, 130, 246, 0.2)'}}
                 >
                   WhatsApp ile Gönder 🚀
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Brand Footer */}
      <footer style={{padding: '80px 5%', borderTop: '1px solid #f1f5f9', textAlign: 'center'}}>
        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginBottom: '24px'}}>
          <div style={{width: '30px', height: '30px', background: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '900'}}>B</div>
          <span style={{fontWeight: '900', fontSize: '1.2rem'}}>BUTA SYSTEMS</span>
        </div>
        <p style={{color: '#94a3b8', fontSize: '0.9rem'}}>© 2024 BUTA Technology Group. Tüm hakları saklıdır.</p>
      </footer>
    </div>
  );
}
