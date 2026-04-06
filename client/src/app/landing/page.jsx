'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const FeatureCard = ({ icon, title, desc }) => (
    <div className="glass-card fade-in" style={{ padding: '32px', transition: 'all 0.3s' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '20px' }}>{icon}</div>
      <h3 className="font-bold" style={{ fontSize: '1.25rem', marginBottom: '12px' }}>{title}</h3>
      <p className="font-secondary" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>{desc}</p>
    </div>
  );

  const BenefitItem = ({ title, desc }) => (
    <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
      <div style={{ width: '24px', height: '24px', background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem', marginTop: '4px' }}>✓</div>
      <div>
        <h4 className="font-bold" style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{title}</h4>
        <p className="font-secondary" style={{ fontSize: '0.9rem' }}>{desc}</p>
      </div>
    </div>
  );

  return (
    <div style={{ background: '#fff' }}>
      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="font-bold" style={{ fontSize: '1.5rem', letterSpacing: '-1px' }}>RestoPanel</div>
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }} className="hidden md:flex">
            <a href="#features" className="font-medium" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Özellikler</a>
            <a href="#pricing" className="font-medium" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Fiyatlandırma</a>
            <Link href="/admin" className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.9rem' }}>Demo Paneli Aç</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ padding: '100px 0', background: 'radial-gradient(circle at top right, #f1f5f9 0%, #fff 50%)' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '64px', flexWrap: 'wrap-reverse' }}>
          <div style={{ flex: '1', minWidth: '350px' }}>
            <span style={{ background: 'var(--accent-soft)', color: 'var(--accent)', padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700', marginBottom: '24px', display: 'inline-block' }}>RESTORANLAR İÇİN ÖZEL OLARAK GELİŞTİRİLDİ</span>
            <h1 className="font-bold" style={{ fontSize: '3.5rem', lineHeight: '1.1', marginBottom: '24px', color: 'var(--primary)' }}>Restoranınızı Daha Karlı <span style={{ color: 'var(--accent)' }}>Hale Getirin</span></h1>
            <p className="font-secondary" style={{ fontSize: '1.25rem', marginBottom: '40px', lineHeight: '1.5' }}>Sipariş, stok ve müşteri yönetimini tek panelden yönetin. Daha fazla kazanın, daha az uğraşın.</p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <Link href="/admin" className="btn-primary" style={{ padding: '18px 40px', fontSize: '1.1rem' }}>Hemen Demo Gör</Link>
              <button className="btn-outline" style={{ padding: '18px 40px', fontSize: '1.1rem' }}>Ücretsiz Dene</button>
            </div>
          </div>
          <div style={{ flex: '1.2', minWidth: '350px' }}>
            <div className="glass-card" style={{ padding: '10px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', transform: 'perspective(1000px) rotateY(-5deg) rotateX(2deg)' }}>
               <div style={{ width: '100%', height: '400px', background: '#f8f9fb', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                  {/* Mockup elements */}
                  <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '15px' }}>
                     <div style={{ width: '100px', height: '10px', background: '#e2e8f0', borderRadius: '4px' }}></div>
                  </div>
                  <div style={{ padding: '20px' }}>
                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                        <div style={{ height: '80px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}></div>
                        <div style={{ height: '80px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}></div>
                     </div>
                     <div style={{ marginTop: '20px', height: '120px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}></div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section style={{ padding: '100px 0', background: '#f8f9fb' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="font-bold" style={{ fontSize: '2.5rem', marginBottom: '60px' }}>Restoranlarda En Büyük Sorunlar</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px' }}>
            {[
              { t: 'Siparişler Karışıyor', d: 'Karmaşık notlar ve hatalı siparişler gün sonu kâbusu olmasın.' },
              { t: 'Stok Takibi Zor', d: 'Mutfakta ne kalıp bittiğini hesaplamak her zaman zordur.' },
              { t: 'Müşteri Takibi Yok', d: 'Kimin neyi ne kadar zamanda yediğini bilmiyorsunuz.' },
              { t: 'Gün Sonu Hesap Karmaşık', d: 'Manuel olarak tutulan defterler her zaman yanlış çıkar.' }
            ].map((p, i) => (
              <div key={i} style={{ padding: '40px', background: '#fff', borderRadius: '24px', textAlign: 'left', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '2rem', marginBottom: '20px' }}>❌</div>
                <h4 className="font-bold" style={{ fontSize: '1.25rem', marginBottom: '12px' }}>{p.t}</h4>
                <p className="font-secondary" style={{ fontSize: '0.95rem' }}>{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="features" style={{ padding: '120px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 className="font-bold" style={{ fontSize: '2.5rem', marginBottom: '20px' }}>Tüm İşletmenizi Tek Panelden Yönetin</h2>
            <p className="font-secondary" style={{ fontSize: '1.1rem' }}>RestoPanel ile karmaşaya veda edin, verimliliğe odaklanın.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
            <FeatureCard icon="🚀" title="Sipariş Yönetimi" desc="Saniyeler içinde sipariş alın, mutfağa anında iletin. Hataları ve bekleme sürelerini sıfıra indirin." />
            <FeatureCard icon="📊" title="Stok Takibi" desc="Mutfak sarf malzemelerini anlık takip edin. Stok azaldığında otomatik uyarı alın." />
            <FeatureCard icon="👥" title="Müşteri Yönetimi" desc="Müşterilerinizin alışkanlıklarını öğrenin. Gelecekte özel kampanyalar yapabilmek için veri biriktirin." />
            <FeatureCard icon="📈" title="Günlük Raporlar" desc="Günün sonunda ne kadar kar ettiğinizi tek tıkla görün. Ciro analizleriyle geleceği planlayın." />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section style={{ padding: '100px 0', background: 'var(--primary)', color: '#fff' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="font-bold" style={{ fontSize: '2.5rem', marginBottom: '80px' }}>Neden Bu Sistemi Kullanmalısınız?</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '64px' }}>
            {[
              { n: '01', t: 'Daha Fazla Satış', d: 'Hızlı servis ve doğru hesapla cironuzu artırın.' },
              { n: '02', t: 'Daha Az Hata', d: 'Manuel işlemleri azaltın, sipariş yanlışlarına veda edin.' },
              { n: '03', t: 'Zaman Tasarrufu', d: 'Günde 2 saatten fazla zamanınızı geri kazanın.' },
              { n: '04', t: 'Kolay Kullanım', d: 'Herkesin 5 dakikada öğrenebileceği basit arayüz.' }
            ].map((b, i) => (
              <div key={i} style={{ maxWidth: '240px' }}>
                 <div style={{ fontSize: '3rem', fontWeight: '900', opacity: '0.2', marginBottom: '20px' }}>{b.n}</div>
                 <h4 className="font-bold" style={{ fontSize: '1.4rem', marginBottom: '12px' }}>{b.t}</h4>
                 <p style={{ opacity: '0.8', fontSize: '0.95rem' }}>{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '120px 0', background: '#f8f9fb' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 className="font-bold" style={{ fontSize: '2.5rem', marginBottom: '20px' }}>Bütçenize Uygun Basit Planlar</h2>
            <p className="font-secondary">Hiçbir gizli ücret yok. İhtiyacınıza göre seçin.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', maxWidth: '1000px', margin: '0 auto' }}>
            {/* Plan 1 */}
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
               <h3 className="font-bold" style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Temel</h3>
               <p className="font-secondary" style={{ marginBottom: '32px' }}>Küçük işletmeler için</p>
               <div className="font-bold" style={{ fontSize: '3rem', marginBottom: '40px' }}>₺499 <span style={{ fontSize: '1rem', color: '#888' }}>/ Ay</span></div>
               <ul style={{ textAlign: 'left', listStyle: 'none', marginBottom: '40px' }}>
                  <li style={{ marginBottom: '12px' }}>✓ Sınırsız Ürün Ekleme</li>
                  <li style={{ marginBottom: '12px' }}>✓ Temel Stok Takibi</li>
                  <li style={{ marginBottom: '12px' }}>✓ QR Menü Sistemi</li>
               </ul>
               <button className="btn-outline" style={{ width: '100%' }}>Hemen Başla</button>
            </div>
            {/* Plan 2 */}
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', border: '2px solid var(--accent)', position: 'relative' }}>
               <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: '#fff', padding: '4px 16px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>EN POPÜLER</div>
               <h3 className="font-bold" style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Profesyonel</h3>
               <p className="font-secondary" style={{ marginBottom: '32px' }}>Büyüyen restoranlar için</p>
               <div className="font-bold" style={{ fontSize: '3.5rem', marginBottom: '40px' }}>₺899 <span style={{ fontSize: '1rem', color: '#888' }}>/ Ay</span></div>
               <ul style={{ textAlign: 'left', listStyle: 'none', marginBottom: '40px' }}>
                  <li style={{ marginBottom: '12px' }}>✓ Gelişmiş Stok Yönetimi</li>
                  <li style={{ marginBottom: '12px' }}>✓ Günlük Ciro Analizleri</li>
                  <li style={{ marginBottom: '12px' }}>✓ Çoklu Masa Bildirimleri</li>
                  <li style={{ marginBottom: '12px' }}>✓ 7/24 Teknik Destek</li>
               </ul>
               <button className="btn-primary" style={{ width: '100%' }}>Hemen Başla</button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '120px 0', textAlign: 'center' }}>
         <div className="container">
            <div style={{ background: 'var(--primary)', padding: '80px 40px', borderRadius: '40px', color: '#fff' }}>
               <h2 className="font-bold" style={{ fontSize: '3rem', marginBottom: '24px' }}>Restoranınızı Büyütmeye Hazır mısınız?</h2>
               <p style={{ opacity: '0.8', fontSize: '1.2rem', marginBottom: '48px' }}>Hemen ücretsiz hesabınızı oluşturun ve farkı yarın görmeye başlayın.</p>
               <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn-primary" style={{ background: '#fff', color: 'var(--primary)', padding: '18px 40px' }}>Ücretsiz Başla</button>
                  <Link href="/admin" className="btn-outline" style={{ color: '#fff', border: '1px solid #fff', padding: '18px 40px' }}>Demo Gör</Link>
               </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '64px 0', borderTop: '1px solid var(--border)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '32px' }}>
          <div>
            <h4 className="font-bold" style={{ fontSize: '1.5rem', marginBottom: '16px' }}>RestoPanel</h4>
            <p className="font-secondary" style={{ maxWidth: '300px' }}>Yeni nesil restoran yönetim SaaS platformu. Teknolojiyle karlılığınızı artırın.</p>
          </div>
          <div style={{ display: 'flex', gap: '64px' }}>
            <div>
               <h5 className="font-bold" style={{ marginBottom: '20px' }}>Ürün</h5>
               <p className="font-secondary" style={{ marginBottom: '12px', cursor: 'pointer' }}>Özellikler</p>
               <p className="font-secondary" style={{ marginBottom: '12px', cursor: 'pointer' }}>QR Menü</p>
               <p className="font-secondary" style={{ cursor: 'pointer' }}>Fiyatlandırma</p>
            </div>
            <div>
               <h5 className="font-bold" style={{ marginBottom: '20px' }}>Destek</h5>
               <p className="font-secondary" style={{ marginBottom: '12px', cursor: 'pointer' }}>Hakkımızda</p>
               <p className="font-secondary" style={{ marginBottom: '12px', cursor: 'pointer' }}>İletişim</p>
               <p className="font-secondary" style={{ cursor: 'pointer' }}>Blog</p>
            </div>
          </div>
        </div>
        <div className="container" style={{ borderTop: '1px solid var(--border)', marginTop: '48px', paddingTop: '32px', textAlign: 'center' }}>
           <p className="font-secondary" style={{ fontSize: '0.85rem' }}>© 2024 RestoPanel. Tüm Hakları Saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}
