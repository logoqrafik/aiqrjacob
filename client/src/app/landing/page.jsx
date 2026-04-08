'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Rocket, PackageSearch, Users, LineChart, XCircle, CheckCircle, TrendingUp, Clock, MousePointer2 } from 'lucide-react';

export default function LandingPage() {

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };
  
  const slideFromLeft = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6 } }
  }

  const slideFromRight = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6 } }
  }

  const FeatureCard = ({ icon: Icon, title, desc }) => (
    <motion.div variants={itemVariants} className="glass-card" style={{ padding: '32px', transition: 'all 0.3s' }}>
      <div style={{ color: 'var(--accent)', marginBottom: '20px' }}><Icon size={40} strokeWidth={1.5} /></div>
      <h3 className="font-bold" style={{ fontSize: '1.25rem', marginBottom: '12px' }}>{title}</h3>
      <p className="font-secondary" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>{desc}</p>
    </motion.div>
  );

  return (
    <div style={{ background: '#fff', overflowX: 'hidden' }}>
      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="font-bold" style={{ fontSize: '1.5rem', letterSpacing: '-1px' }}>RestoPanel</div>
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }} className="hidden md:flex">
            <a href="#features" className="font-medium hidden-on-mobile" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Özellikler</a>
            <a href="#pricing" className="font-medium hidden-on-mobile" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textDecoration: 'none' }}>Fiyatlandırma</a>
            <Link href="/admin" className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.9rem' }}>Demo Paneli Aç</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ padding: '100px 0', background: 'radial-gradient(circle at top right, #f1f5f9 0%, #fff 50%)' }}>
        <div className="container flex-mobile-col" style={{ display: 'flex', alignItems: 'center', gap: '64px', flexWrap: 'wrap-reverse' }}>
          <motion.div initial="hidden" animate="visible" variants={slideFromLeft} style={{ flex: '1', minWidth: '300px' }}>
            <span style={{ background: 'var(--accent-soft)', color: 'var(--accent)', padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700', marginBottom: '24px', display: 'inline-block' }}>RESTORANLAR İÇİN ÖZEL OLARAK GELİŞTİRİLDİ</span>
            <h1 className="font-bold" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: '1.1', marginBottom: '24px', color: 'var(--primary)' }}>Restoranınızı Daha Karlı <span style={{ color: 'var(--accent)' }}>Hale Getirin</span></h1>
            <p className="font-secondary" style={{ fontSize: '1.25rem', marginBottom: '40px', lineHeight: '1.5' }}>Sipariş, stok ve müşteri yönetimini tek panelden yönetin. Daha fazla kazanın, daha az uğraşın.</p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link href="/admin" className="btn-primary" style={{ padding: '18px 40px', fontSize: '1.1rem', width: '100%', textAlign: 'center' }}>Hemen Demo Gör</Link>
              <button className="btn-outline hidden-on-mobile" style={{ padding: '18px 40px', fontSize: '1.1rem' }}>Ücretsiz Dene</button>
            </div>
          </motion.div>
          <motion.div initial="hidden" animate="visible" variants={slideFromRight} style={{ flex: '1.2', minWidth: '300px', width: '100%' }}>
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
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section style={{ padding: '100px 0', background: '#f8f9fb' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={containerVariants} className="container" style={{ textAlign: 'center' }}>
          <h2 className="font-bold" style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', marginBottom: '60px' }}>Restoranlarda En Büyük Sorunlar</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px' }}>
            {[
              { t: 'Siparişler Karışıyor', d: 'Karmaşık notlar ve hatalı siparişler gün sonu kâbusu olmasın.' },
              { t: 'Stok Takibi Zor', d: 'Mutfakta ne kalıp bittiğini hesaplamak her zaman zordur.' },
              { t: 'Müşteri Takibi Yok', d: 'Kimin neyi ne kadar zamanda yediğini bilmiyorsunuz.' },
              { t: 'Gün Sonu Hesap Karmaşık', d: 'Manuel olarak tutulan defterler her zaman yanlış çıkar.' }
            ].map((p, i) => (
              <motion.div variants={itemVariants} key={i} style={{ padding: '40px', background: '#fff', borderRadius: '24px', textAlign: 'left', border: '1px solid #e2e8f0' }}>
                <div style={{ color: '#ef4444', marginBottom: '20px' }}><XCircle size={36} strokeWidth={2} /></div>
                <h4 className="font-bold" style={{ fontSize: '1.25rem', marginBottom: '12px' }}>{p.t}</h4>
                <p className="font-secondary" style={{ fontSize: '0.95rem' }}>{p.d}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Solution Section */}
      <section id="features" style={{ padding: '120px 0' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={containerVariants} className="container">
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 className="font-bold" style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', marginBottom: '20px' }}>Tüm İşletmenizi Tek Panelden Yönetin</h2>
            <p className="font-secondary" style={{ fontSize: '1.1rem' }}>RestoPanel ile karmaşaya veda edin, verimliliğe odaklanın.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px' }}>
            <FeatureCard icon={Rocket} title="Sipariş Yönetimi" desc="Saniyeler içinde sipariş alın, mutfağa anında iletin. Hataları ve bekleme sürelerini sıfıra indirin." />
            <FeatureCard icon={PackageSearch} title="Stok Takibi" desc="Mutfak sarf malzemelerini anlık takip edin. Stok azaldığında otomatik uyarı alın." />
            <FeatureCard icon={Users} title="Müşteri Yönetimi" desc="Müşterilerinizin alışkanlıklarını öğrenin. Gelecekte özel kampanyalar yapabilmek için veri biriktirin." />
            <FeatureCard icon={LineChart} title="Günlük Raporlar" desc="Günün sonunda ne kadar kar ettiğinizi tek tıkla görün. Ciro analizleriyle geleceği planlayın." />
          </div>
        </motion.div>
      </section>

      {/* How it Works */}
      <section style={{ padding: '100px 0', background: 'var(--primary)', color: '#fff' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={containerVariants} className="container" style={{ textAlign: 'center' }}>
          <h2 className="font-bold" style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', marginBottom: '80px' }}>Neden Bu Sistemi Kullanmalısınız?</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '32px' }}>
            {[
              { icon: TrendingUp, t: 'Daha Fazla Satış', d: 'Hızlı servis ve doğru hesapla cironuzu artırın.' },
              { icon: CheckCircle, t: 'Daha Az Hata', d: 'Manuel işlemleri azaltın, hatalara son verin.' },
              { icon: Clock, t: 'Zaman Tasarrufu', d: 'Günde 2 saatten fazla zamanınızı geri kazanın.' },
              { icon: MousePointer2, t: 'Kolay Kullanım', d: 'Herkesin 5 dakikada öğrenebileceği basit arayüz.' }
            ].map((b, i) => (
              <motion.div variants={itemVariants} key={i} style={{ maxWidth: '240px', padding: '20px' }}>
                 <div style={{ color: 'var(--accent)', marginBottom: '20px', display: 'flex', justifyContent: 'center' }}><b.icon size={48} strokeWidth={1.5} /></div>
                 <h4 className="font-bold" style={{ fontSize: '1.3rem', marginBottom: '12px' }}>{b.t}</h4>
                 <p style={{ opacity: '0.8', fontSize: '0.95rem' }}>{b.d}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '120px 0', background: '#f8f9fb' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={containerVariants} className="container">
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 className="font-bold" style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', marginBottom: '20px' }}>Bütçenize Uygun Basit Planlar</h2>
            <p className="font-secondary">Hiçbir gizli ücret yok. İhtiyacınıza göre seçin.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', maxWidth: '1000px', margin: '0 auto' }}>
            {/* Plan 1 */}
            <motion.div variants={itemVariants} className="glass-card" style={{ padding: '40px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
               <h3 className="font-bold" style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Temel</h3>
               <p className="font-secondary" style={{ marginBottom: '32px' }}>Küçük işletmeler için</p>
               <div className="font-bold" style={{ fontSize: '3rem', marginBottom: '40px' }}>₺499 <span style={{ fontSize: '1rem', color: '#888' }}>/ Ay</span></div>
               <ul style={{ textAlign: 'left', listStyle: 'none', marginBottom: '40px' }}>
                  <li style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}><CheckCircle size={18} color="var(--accent)" /> Sınırsız Ürün Ekleme</li>
                  <li style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}><CheckCircle size={18} color="var(--accent)" /> Temel Stok Takibi</li>
                  <li style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}><CheckCircle size={18} color="var(--accent)" /> QR Menü Sistemi</li>
               </ul>
               <button className="btn-outline" style={{ width: '100%' }}>Hemen Başla</button>
            </motion.div>
            {/* Plan 2 */}
            <motion.div variants={itemVariants} className="glass-card" style={{ padding: '40px', textAlign: 'center', border: '2px solid var(--accent)', position: 'relative' }}>
               <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: '#fff', padding: '4px 16px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>EN POPÜLER</div>
               <h3 className="font-bold" style={{ fontSize: '1.25rem', marginBottom: '12px' }}>Profesyonel</h3>
               <p className="font-secondary" style={{ marginBottom: '32px' }}>Büyüyen restoranlar için</p>
               <div className="font-bold" style={{ fontSize: '3.5rem', marginBottom: '40px' }}>₺899 <span style={{ fontSize: '1rem', color: '#888' }}>/ Ay</span></div>
               <ul style={{ textAlign: 'left', listStyle: 'none', marginBottom: '40px' }}>
                  <li style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}><CheckCircle size={18} color="var(--accent)" /> Gelişmiş Stok Yönetimi</li>
                  <li style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}><CheckCircle size={18} color="var(--accent)" /> Günlük Ciro Analizleri</li>
                  <li style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}><CheckCircle size={18} color="var(--accent)" /> Çoklu Masa Bildirimleri</li>
                  <li style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}><CheckCircle size={18} color="var(--accent)" /> 7/24 Teknik Destek</li>
               </ul>
               <button className="btn-primary" style={{ width: '100%' }}>Hemen Başla</button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '80px 20px', textAlign: 'center' }}>
         <motion.div initial={{ scale: 0.9, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} viewport={{ once: true }} className="container">
            <div style={{ background: 'var(--primary)', padding: '60px 20px', borderRadius: '32px', color: '#fff' }}>
               <h2 className="font-bold" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', marginBottom: '24px' }}>Restoranınızı Büyütmeye Hazır mısınız?</h2>
               <p style={{ opacity: '0.8', fontSize: '1.2rem', marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px auto' }}>Hemen ücretsiz hesabınızı oluşturun ve farkı yarın görmeye başlayın.</p>
               <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn-primary" style={{ background: '#fff', color: 'var(--primary)', padding: '18px 40px', width: 'auto', minWidth: '200px' }}>Ücretsiz Başla</button>
                  <Link href="/admin" className="btn-outline" style={{ color: '#fff', border: '1px solid #fff', padding: '18px 40px', width: 'auto', minWidth: '200px' }}>Demo Gör</Link>
               </div>
            </div>
         </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '64px 20px', borderTop: '1px solid var(--border)' }}>
        <div className="container flex-mobile-col" style={{ display: 'flex', justifyContent: 'space-between', gap: '48px' }}>
          <div>
            <h4 className="font-bold" style={{ fontSize: '1.5rem', marginBottom: '16px' }}>RestoPanel</h4>
            <p className="font-secondary" style={{ maxWidth: '300px' }}>Yeni nesil restoran yönetim SaaS platformu. Teknolojiyle karlılığınızı artırın.</p>
          </div>
          <div style={{ display: 'flex', gap: '64px', flexWrap: 'wrap' }}>
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
