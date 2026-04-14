import Link from 'next/link';

export const metadata = {
  title: 'BUTA | Yeni Nesil Dijital Menü ve Yönetim Sistemi',
  description: 'İşletmenizi dijitalleştirin, siparişlerinizi BUTA kalitesiyle yönetin.',
};

export default function LandingPage() {
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
          <Link href="/super-admin" style={{padding: '12px 28px', background: '#0f172a', color: '#fff', borderRadius: '100px', fontWeight: '700', textDecoration: 'none'}}>Patron Paneli</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{padding: '200px 5% 120px 5%', textAlign: 'center', background: 'radial-gradient(circle at top right, #eff6ff, #fff)'}}>
        <div style={{display: 'inline-block', padding: '8px 20px', background: '#eff6ff', borderRadius: '100px', color: '#3b82f6', fontWeight: '700', fontSize: '0.9rem', marginBottom: '32px'}}>🚀 YENİ NESİL SAAS PLATFORMU</div>
        <h1 style={{fontSize: '4.5rem', fontWeight: '900', letterSpacing: '-3px', maxWidth: '900px', margin: '0 auto 32px auto', lineHeight: '1.1'}}>
          Daha Akıllı İşletmeler İçin <span style={{color: '#3b82f6'}}>BUTA</span> Deneyimi
        </h1>
        <p style={{fontSize: '1.3rem', color: '#64748b', maxWidth: '700px', margin: '0 auto 48px auto', lineHeight: '1.6'}}>
          Dijital menü, anlık sipariş takibi ve kurumsal yönetim artık tek bir asil çatı altında. BUTA ile işletmenizi geleceğe taşıyın.
        </p>
        <div style={{display: 'flex', gap: '16px', justifyContent: 'center'}}>
           <Link href="/thejacob-m2z1v/menu" style={{padding: '20px 48px', background: '#3b82f6', color: '#fff', borderRadius: '16px', fontSize: '1.1rem', fontWeight: '800', textDecoration: 'none', boxShadow: '0 20px 40px rgba(59, 130, 246, 0.2)'}}>Örnek Menüyü Gör</Link>
           <button style={{padding: '20px 48px', background: '#fff', color: '#0f172a', borderRadius: '16px', fontSize: '1.1rem', fontWeight: '800', border: '1px solid #e2e8f0', cursor: 'pointer'}}>Sizi Arayalım</button>
        </div>
      </section>

      {/* Features */}
      <section style={{padding: '120px 5%', background: '#fff'}}>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px'}}>
           {[
             { title: 'Sınırsız İşletme', desc: 'Tek bir altyapı ile binlerce işletmeyi aynı anda yönetin.' },
             { title: 'Hız & Performans', desc: 'BUTA teknolojisi ile yükleme sürelerini sıfıra indirin.' },
             { title: 'Tam İzolasyon', desc: 'En yüksek güvenlik standartlarında veri izolasyonu sağlayın.' }
           ].map((f, i) => (
             <div key={i} style={{padding: '48px', borderRadius: '32px', border: '1px solid #f1f5f9', transition: 'all 0.3s'}} onMouseEnter={e=>e.currentTarget.style.borderColor='#3b82f6'}>
                <div style={{width: '50px', height: '50px', background: '#eff6ff', borderRadius: '16px', marginBottom: '24px', display:'flex', justifyContent:'center', alignItems:'center', color:'#3b82f6', fontWeight:'900'}}>0{i+1}</div>
                <h3 style={{fontSize: '1.5rem', fontWeight: '900', marginBottom: '16px'}}>{f.title}</h3>
                <p style={{color: '#64748b', lineHeight: '1.6'}}>{f.desc}</p>
             </div>
           ))}
        </div>
      </section>

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
