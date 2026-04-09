'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Rocket, PackageSearch, Users, LineChart, XCircle, CheckCircle, TrendingUp, Clock, MousePointer2, ShieldCheck, Activity, Building2, QrCode, Utensils, ChefHat, ArrowRight, Zap, Smartphone, LayoutDashboard } from 'lucide-react';

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
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-whatsapp {
          0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.5); }
          70% { box-shadow: 0 0 0 20px rgba(37, 99, 235, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
        }
        .whatsapp-btn-pulse {
          animation: pulse-whatsapp 2s infinite;
        }
        @keyframes pulse-badge {
          0% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.08); }
          100% { transform: translateX(-50%) scale(1); }
        }
        .badge-pulse {
          animation: pulse-badge 2s infinite ease-in-out;
        }
      `}} />
      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', zIndex: 1000, borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ color: 'var(--primary)', display: 'flex' }}>
              <svg width="34" height="34" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="10" fill="currentColor" fillOpacity="0.1"/>
                <path d="M10 22V10H16C18.2091 10 20 11.7909 20 14C20 16.2091 18.2091 18 16 18H10M10 18L22 22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="font-bold" style={{ fontSize: '1.5rem', letterSpacing: '-1.2px', color: '#0f172a' }}>RestoPanel</div>
          </div>
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
            <span style={{ background: 'linear-gradient(90deg, rgba(37, 99, 235, 0.1), rgba(147, 51, 234, 0.1))', color: 'var(--primary)', padding: '8px 20px', borderRadius: '30px', fontSize: '0.85rem', fontWeight: '800', letterSpacing: '0.5px', marginBottom: '24px', display: 'inline-block', border: '1px solid rgba(37, 99, 235, 0.2)' }}>🚀 YENİ NESİL RESTORAN YÖNETİMİ</span>
            <h1 className="font-bold" style={{ fontSize: 'clamp(2.8rem, 5vw, 4.5rem)', lineHeight: '1.05', marginBottom: '24px', color: '#0f172a', letterSpacing: '-1.5px' }}>
              Restoranınızın siparişlerini <span style={{ background: 'linear-gradient(to right, #2563eb, #9333ea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>%30 artırın</span>
            </h1>
            <p className="font-secondary" style={{ fontSize: '1.35rem', marginBottom: '48px', lineHeight: '1.6', color: '#475569', fontWeight: '500' }}>
              Garsonsuz sipariş, maksimum kazanç! Personel maliyetlerini %40'a kadar düşürün, sipariş hızınızı ve kârınızı anında katlayın.
            </p>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
              <motion.a 
                href="https://wa.me/905520814796?text=Merhaba,%20sistem%20hakkında%20bilgi%20almak%20istiyorum." 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-primary whatsapp-btn-pulse" 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                style={{ 
                  padding: '20px 48px', 
                  fontSize: '1.25rem', 
                  borderRadius: '16px', 
                  fontWeight: '800', 
                  boxShadow: '0 20px 40px -10px rgba(37, 99, 235, 0.6)', 
                  transition: 'background 0.3s, box-shadow 0.3s', 
                  backgroundImage: 'linear-gradient(to right, #2563eb, #4f46e5)', 
                  textDecoration: 'none', 
                  display: 'inline-block' 
                }}
              >
                Whatsapp'tan Ulaşın
              </motion.a>
              <Link href="/admin" className="btn-outline" style={{ padding: '20px 48px', fontSize: '1.25rem', borderRadius: '16px', fontWeight: '800', background: '#fff', border: '3px solid #e2e8f0', color: '#0f172a', textDecoration: 'none', display: 'inline-block' }}>Paneli İncele →</Link>
            </div>
            
            <div style={{ marginTop: '40px', display: 'flex', gap: '24px', alignItems: 'center' }}>
              <div style={{ display: 'flex', position: 'relative' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#cbd5e1', border: '3px solid #fff', zIndex: 3 }}></div>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#94a3b8', border: '3px solid #fff', marginLeft: '-15px', zIndex: 2 }}></div>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#64748b', border: '3px solid #fff', marginLeft: '-15px', zIndex: 1 }}></div>
              </div>
              <div>
                <div style={{ display: 'flex', gap: '4px', color: '#f59e0b', fontSize: '1.2rem', marginBottom: '4px' }}>★★★★★</div>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>500+ Mutlu Restoran Sahibi</span>
              </div>
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

      {/* Trust Section */}
      <section style={{ padding: '60px 0', background: '#fff', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
         <div className="container" style={{ textAlign: 'center' }}>
            <p className="font-secondary" style={{ fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '32px', fontWeight: 600 }}>TÜRKİYE'NİN EN GÜVENİLİR RESTORAN ALTYAPISI</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '48px', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#0f172a' }}>
                  <div style={{ background: '#eff6ff', padding: '16px', borderRadius: '16px', color: '#2563eb' }}>
                     <Building2 size={32} strokeWidth={1.5} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                     <h4 className="font-bold" style={{ fontSize: '1.5rem', marginBottom: '2px' }}>50+ Restoran</h4>
                     <p className="font-secondary" style={{ fontSize: '0.9rem', color: '#64748b' }}>Aktif olarak kullanıyor</p>
                  </div>
               </div>
               
               <div style={{ width: '1px', height: '60px', background: '#e2e8f0' }} className="hidden-on-mobile"></div>

               <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#0f172a' }}>
                  <div style={{ background: '#ecfdf5', padding: '16px', borderRadius: '16px', color: '#059669' }}>
                     <Activity size={32} strokeWidth={1.5} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                     <h4 className="font-bold" style={{ fontSize: '1.5rem', marginBottom: '2px' }}>%99.9 Uptime</h4>
                     <p className="font-secondary" style={{ fontSize: '0.9rem', color: '#64748b' }}>Kesintisiz sipariş akışı</p>
                  </div>
               </div>

               <div style={{ width: '1px', height: '60px', background: '#e2e8f0' }} className="hidden-on-mobile"></div>

               <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#0f172a' }}>
                  <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '16px', color: '#dc2626' }}>
                     <ShieldCheck size={32} strokeWidth={1.5} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                     <h4 className="font-bold" style={{ fontSize: '1.5rem', marginBottom: '2px' }}>Bulut Güvencesi</h4>
                     <p className="font-secondary" style={{ fontSize: '0.9rem', color: '#64748b' }}>Verileriniz daima güvende</p>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* How It Works Section */}
      <section style={{ padding: '100px 0', background: '#fff' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={containerVariants} className="container" style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '60px' }}>
            <span style={{ fontWeight: '800', color: 'var(--accent)', fontSize: '0.9rem', letterSpacing: '1px', textTransform: 'uppercase' }}>ÇOK BASİT</span>
            <h2 className="font-bold" style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', marginTop: '8px' }}>Sistem Nasıl Çalışır?</h2>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
            {/* Step 1 */}
            <motion.div variants={itemVariants} style={{ flex: '1', minWidth: '250px', maxWidth: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: '0 10px 25px -5px rgba(37,99,235,0.2)' }}>
                 <QrCode size={40} strokeWidth={1.5} />
              </div>
              <h4 className="font-bold" style={{ fontSize: '1.2rem', marginBottom: '8px' }}>1. QR Okut</h4>
              <p className="font-secondary" style={{ fontSize: '0.95rem' }}>Müşteri masadaki QR kodu okutur, saniyeler içinde dijital menüye girer.</p>
            </motion.div>

            <div className="hidden-on-mobile" style={{ color: '#cbd5e1' }}><ArrowRight size={32} strokeWidth={1} /></div>

            {/* Step 2 */}
            <motion.div variants={itemVariants} style={{ flex: '1', minWidth: '250px', maxWidth: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: '0 10px 25px -5px rgba(217,119,6,0.2)' }}>
                 <Utensils size={40} strokeWidth={1.5} />
              </div>
              <h4 className="font-bold" style={{ fontSize: '1.2rem', marginBottom: '8px' }}>2. Sipariş Ver</h4>
              <p className="font-secondary" style={{ fontSize: '0.95rem' }}>Garson beklemeden sepetini oluşturur ve siparişini onaylar.</p>
            </motion.div>

            <div className="hidden-on-mobile" style={{ color: '#cbd5e1' }}><ArrowRight size={32} strokeWidth={1} /></div>

            {/* Step 3 */}
            <motion.div variants={itemVariants} style={{ flex: '1', minWidth: '250px', maxWidth: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: '0 10px 25px -5px rgba(5,150,105,0.2)' }}>
                 <ChefHat size={40} strokeWidth={1.5} />
              </div>
              <h4 className="font-bold" style={{ fontSize: '1.2rem', marginBottom: '8px' }}>3. Mutfağa Düşer</h4>
              <p className="font-secondary" style={{ fontSize: '0.95rem' }}>Sipariş anında masadan mutfak paneline veya kasaya sesli uyarı ile yansır.</p>
            </motion.div>
          </div>
        </motion.div>
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

      {/* Why Us Section */}
      <section style={{ padding: '100px 0', background: 'linear-gradient(to bottom right, #0f172a, #1e293b)', color: '#fff' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={containerVariants} className="container" style={{ textAlign: 'center' }}>
          <h2 className="font-bold" style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', marginBottom: '80px' }}>Neden Biz?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', maxWidth: '1000px', margin: '0 auto' }}>
            {[
              { icon: Zap, t: '1 Günde Kurulum', d: 'Saatler içinde menünüzü yükler, hemen kullanmaya başlarsınız. Beklemek yok.' },
              { icon: Smartphone, t: 'Garsonsuz Sipariş', d: 'Müşteriler tamamen telefondan sipariş verir. İş yükü ve hatalar sıfıra iner.' },
              { icon: LayoutDashboard, t: 'Tek Panel Yönetim', d: 'Sipariş, kasa ve stok aynı ekranda. Tüm süreci hakimiyet altına alın.' }
            ].map((b, i) => (
              <motion.div variants={itemVariants} key={i} style={{ padding: '40px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                 <div style={{ color: '#60a5fa', marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ background: 'rgba(96, 165, 250, 0.2)', padding: '16px', borderRadius: '50%' }}>
                       <b.icon size={48} strokeWidth={1.5} />
                    </div>
                 </div>
                 <h4 className="font-bold" style={{ fontSize: '1.4rem', marginBottom: '16px' }}>{b.t}</h4>
                 <p style={{ opacity: '0.8', fontSize: '1rem', lineHeight: '1.6' }}>{b.d}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '120px 0', background: '#f8f9fb' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={containerVariants} className="container">
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 className="font-bold" style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', marginBottom: '20px', color: '#0f172a' }}>İşletmenize Uygun, Şeffaf Planlar</h2>
            <p className="font-secondary" style={{ fontSize: '1.1rem' }}>Sürpriz ödemeler veya gizli komisyonlar yok. Kazandıkça ödeyin.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', maxWidth: '1000px', margin: '0 auto' }}>
            {/* Plan 1 */}
            <motion.div variants={itemVariants} className="glass-card" style={{ padding: '40px', textAlign: 'center', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
               <h3 className="font-bold" style={{ fontSize: '1.5rem', marginBottom: '8px', color: '#0f172a' }}>Başlangıç</h3>
               <p className="font-secondary" style={{ marginBottom: '32px' }}>Küçük restoran & kafeler için</p>
               <div className="font-bold" style={{ fontSize: '3rem', marginBottom: '8px', color: '#0f172a' }}>₺999</div>
               <div className="font-secondary" style={{ marginBottom: '40px', fontSize: '0.9rem' }}>Aylık Faturalandırılır</div>
               <ul style={{ textAlign: 'left', listStyle: 'none', marginBottom: '40px', flex: 1 }}>
                  <li style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}><CheckCircle size={20} color="var(--accent)" /> <span style={{ fontWeight: 500 }}>Sınırsız Ürün Ekleme</span></li>
                  <li style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}><CheckCircle size={20} color="var(--accent)" /> <span style={{ fontWeight: 500 }}>Temel Stok Takibi</span></li>
                  <li style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}><CheckCircle size={20} color="var(--accent)" /> <span style={{ fontWeight: 500 }}>QR Menü Sistemi</span></li>
                  <li style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}><CheckCircle size={20} color="var(--accent)" /> <span style={{ fontWeight: 500 }}>E-posta Desteği</span></li>
               </ul>
               <button className="btn-outline" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', fontWeight: 600, border: '2px solid #cbd5e1' }}>Hemen Başla</button>
            </motion.div>
            {/* Plan 2 */}
            <motion.div 
               variants={itemVariants} 
               whileInView={{ scale: 1.05 }} 
               viewport={{ once: true }}
               className="glass-card" 
               style={{ 
                  padding: '40px', 
                  textAlign: 'center', 
                  border: '2px solid var(--accent)', 
                  position: 'relative', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  boxShadow: '0 30px 60px -12px rgba(37, 99, 235, 0.25)',
                  zIndex: 2,
                  background: '#fff' 
               }}
            >
               <div className="badge-pulse" style={{ position: 'absolute', top: '-18px', left: '50%', background: 'linear-gradient(to right, #ea580c, #ef4444)', color: '#fff', padding: '8px 24px', borderRadius: '30px', fontSize: '0.9rem', fontWeight: '900', whiteSpace: 'nowrap', boxShadow: '0 8px 20px rgba(234, 88, 12, 0.4)', display: 'flex', alignItems: 'center', gap: '6px' }}>En çok tercih edilen 🔥</div>
               <h3 className="font-bold" style={{ fontSize: '1.5rem', marginBottom: '8px', color: '#0f172a' }}>Standart</h3>
               <p className="font-secondary" style={{ marginBottom: '32px' }}>Büyüyen ve yoğun işletmeler için</p>
               <div className="font-bold" style={{ fontSize: '3.5rem', marginBottom: '8px', color: '#0f172a' }}>₺1.999</div>
               <div className="font-secondary" style={{ marginBottom: '40px', fontSize: '0.9rem' }}>Aylık Faturalandırılır</div>
               <ul style={{ textAlign: 'left', listStyle: 'none', marginBottom: '40px', flex: 1 }}>
                  <li style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}><CheckCircle size={20} color="var(--accent)" /> <span style={{ fontWeight: 600 }}>Gelişmiş Stok Yönetimi</span></li>
                  <li style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}><CheckCircle size={20} color="var(--accent)" /> <span style={{ fontWeight: 600 }}>Günlük Ciro & Kâr Analizleri</span></li>
                  <li style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}><CheckCircle size={20} color="var(--accent)" /> <span style={{ fontWeight: 600 }}>Çoklu Masa Temsili</span></li>
                  <li style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}><CheckCircle size={20} color="var(--accent)" /> <span style={{ fontWeight: 600 }}>7/24 Kesintisiz Teknik Destek</span></li>
               </ul>
               <button className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', fontWeight: 600, background: 'linear-gradient(to right, #2563eb, #3b82f6)' }}>Hemen Başla</button>
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
                  <a href="https://wa.me/905520814796?text=Merhaba,%20sistem%20hakkında%20bilgi%20almak%20istiyorum." target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ background: '#fff', color: 'var(--primary)', padding: '20px 48px', width: 'auto', minWidth: '220px', fontSize: '1.2rem', fontWeight: 800, textDecoration: 'none', borderRadius: '16px' }}>Ücretsiz Başla</a>
                  <Link href="/admin" className="btn-outline" style={{ color: '#fff', border: '2px solid #fff', padding: '20px 48px', width: 'auto', minWidth: '220px', fontSize: '1.2rem', fontWeight: 800, textDecoration: 'none', borderRadius: '16px' }}>Demoyu Gör</Link>
               </div>
            </div>
         </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '64px 20px', borderTop: '1px solid var(--border)' }}>
        <div className="container flex-mobile-col" style={{ display: 'flex', justifyContent: 'space-between', gap: '48px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
               <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 22V10H16C18.2091 10 20 11.7909 20 14C20 16.2091 18.2091 18 16 18H10M10 18L22 22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>
               <h4 className="font-bold" style={{ fontSize: '1.4rem' }}>RestoPanel</h4>
            </div>
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

      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/905520814796?text=Merhaba,%20sistem%20hakkında%20bilgi%20almak%20istiyorum" 
        target="_blank" 
        rel="noopener noreferrer"
        style={{
           position: 'fixed',
           bottom: '24px',
           right: '24px',
           background: '#25D366',
           color: '#fff',
           width: '60px',
           height: '60px',
           borderRadius: '50%',
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
           boxShadow: '0 10px 25px rgba(37, 211, 102, 0.4)',
           zIndex: 5000,
           transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1) translateY(-4px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) translateY(0)'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
           <path d="M21.16 12A9.16 9.16 0 1 0 12 21.16L3 22l.84-9A9.16 9.16 0 0 0 21.16 12z"></path>
           <path d="M16 15.5c-1 2-3 2-4 1s-3-2-4-3 .5-3 2.5-4c0-.5-.5-1-1-1.5s-1-2-1.5-2C7.5 5 7 5 6.5 5c-1.5.5-2.5 1.5-2 3.5 1 3.5 3 6 5 8s6 4 7 3c2-.5 2.5-1.5 2.5-2.5s-2-2-2.5-2.5c-.5-.5-1-1-1-1s-1.5.5-2 1.5z"></path>
        </svg>
      </a>
    </div>
  );
}
