'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { io } from 'socket.io-client';
import { Zap, CheckCircle2, AlertCircle, Timer, Flame, Gift, Coffee, Utensils } from 'lucide-react';

export default function Home() {
  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);
  const [customerNote, setCustomerNote] = useState('');
  const [customerInfo, setCustomerInfo] = useState('');
  const [submissionError, setSubmissionError] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null); 
  const [cancelRemaining, setCancelRemaining] = useState(45);  
  const [prepareRemaining, setPrepareRemaining] = useState(300); 
  const [suggestedItems, setSuggestedItems] = useState([]);
  const [isOnline, setIsOnline] = useState(true);

  const timerRef = useRef(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const socket = io((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'));
    socket.on('order_status_updated', (updatedOrder) => {
         setActiveOrder(prev => (prev && prev.id === updatedOrder.id) ? updatedOrder : prev);
    });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (!activeOrder) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
        setPrepareRemaining((prev) => prev > 0 ? prev - 1 : 0);
        if (activeOrder.status === 'pending') setCancelRemaining((prev) => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [activeOrder]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/products`);
      const products = await res.json();
      const groupedData = [];
      products.forEach(product => {
          const index = groupedData.findIndex(g => g.name === product.category);
          if (index === -1) groupedData.push({ id: product.category, name: product.category, items: [product] });
          else groupedData[index].items.push(product);
      });
      setMenuData(groupedData);
    } catch (err) {} finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const addToCart = (item) => {
    // Determine suggestions based on added item
    const isMain = item.category === 'Ana Yemek';
    const suggestions = menuData
       .filter(cat => isMain ? (cat.name === 'İçecek' || cat.name === 'Tatlı') : cat.name !== item.category)
       .flatMap(cat => cat.items)
       .sort(() => 0.5 - Math.random())
       .slice(0, 3);
    
    setSuggestedItems(suggestions);
    
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      
      // Open upsell if it's a new item added
      if (suggestions.length > 0 && !item.isUpsell) setShowUpsell(true);
      
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing && existing.quantity === 1) return prev.filter(c => c.id !== item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity - 1 } : c);
      return prev;
    });
  };

  const handleFinalCheckout = async () => {
      if(!customerInfo.trim()) return alert("Lütfen Masa bilginizi girin.");
      if(!isOnline) {
          setSubmissionError("İnternet bağlantınız yok. Lütfen ağınızı kontrol edip tekrar deneyin.");
          return;
      }
      setIsSubmitting(true);
      setSubmissionError(null);
      try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/orders`, {
             method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer_name: customerInfo, items: cart, total_price: cart.reduce((t, i) => t + (Number(i.price) * i.quantity), 0), note: customerNote })
          });
          if (!res.ok) throw new Error("Sunucu siparişi onaylamadı. Lütfen tekrar deneyin.");
          const resultOrder = await res.json();
          setCart([]); setIsCheckoutOpen(false); setCancelRemaining(45); setPrepareRemaining(300); setActiveOrder(resultOrder);
      } catch(e) {
          setSubmissionError(e.message || "Bağlantı hatası oluştu.");
      } finally { setIsSubmitting(false); }
  }

  const cancelOrder = async () => {
    if(!window.confirm("İptal etmek üzeresiniz?")) return;
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/orders/${activeOrder.id}/cancel`, { method:'PUT' });
        if(res.ok) setActiveOrder(null);
    } catch(e){}
  };

  if (loading) {
    return (
      <div className="fade-in" style={{ width: '100vw', minHeight: '100vh', background: 'var(--bg-main)', overflowX: 'hidden' }}>
        <header style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="skeleton" style={{ height: '24px', width: '140px', borderRadius: '4px' }} />
          <div className="skeleton" style={{ height: '36px', width: '80px', borderRadius: '8px' }} />
        </header>

        <div className="skeleton" style={{ height: '40px', width: '100%', marginBottom: '24px' }} />

        <div className="container" style={{ padding: '0 16px 40px 16px' }}>
          <div className="skeleton" style={{ height: '28px', width: '180px', borderRadius: '4px', marginBottom: '20px' }} />
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
             {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                   <div className="skeleton" style={{ height: '180px', width: '100%', borderRadius: '0' }} />
                   <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                         <div className="skeleton" style={{ height: '20px', width: '60%', borderRadius: '4px' }} />
                         <div className="skeleton" style={{ height: '20px', width: '20%', borderRadius: '4px' }} />
                      </div>
                      <div className="skeleton" style={{ height: '12px', width: '100%', borderRadius: '4px' }} />
                      <div className="skeleton" style={{ height: '12px', width: '80%', borderRadius: '4px', marginBottom: '12px' }} />
                      <div className="skeleton" style={{ height: '44px', width: '100%', borderRadius: '12px', marginTop: 'auto' }} />
                   </div>
                </div>
             ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: '100vw', overflowX: 'hidden' }}>
      {!isOnline && (
        <div style={{ background: 'var(--error)', color: '#fff', padding: '8px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 'bold', position: 'sticky', top: 0, zIndex: 1001 }}>
          ⚠️ İnternet Bağlantısı Yok - Sipariş veremezsiniz
        </div>
      )}
      <header style={{ 
        background: '#fff', 
        borderBottom: '1px solid var(--border)', 
        position: 'sticky', 
        top: 0, 
        zIndex: 100, 
        padding: '12px 0',
        width: '100%'
      }}>
        <div className="container" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '0 16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             <svg width="30" height="30" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill="var(--primary)" fillOpacity="0.1"/>
                <path d="M10 22V10H16C18.2091 10 20 11.7909 20 14C20 16.2091 18.2091 18 16 18H10M10 18L22 22" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
             <h1 className="font-bold" style={{ fontSize: '1.25rem', letterSpacing: '-0.5px' }}>Lezzet Durağı</h1>
          </div>
          <button className="btn-outline" style={{ padding: '8px 12px', fontSize: '0.85rem', minHeight: '48px' }}>Giriş Yap</button>
        </div>
      </header>

      {/* FOMO: Yoğun Saat Uyarısı Top Banner */}
      <div style={{ background: '#fef2f2', color: '#991b1b', padding: '10px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderBottom: '1px solid #fecaca' }}>
         <span style={{ display: 'flex', alignItems: 'center', animation: 'pulse 2s infinite', color: '#dc2626' }}><Zap size={20} fill="#dc2626" /></span>
         <span className="font-medium"><b>Yoğun Saat:</b> Bekleme süreleri uzamadan siparişinizi oluşturun.</span>
      </div>

      <main className="container" style={{ 
        padding: '24px 16px 140px 16px',
        maxWidth: '100%',
        margin: '0 auto'
      }}>
        
        {activeOrder && (
          <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', borderLeft: '4px solid var(--accent)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div>
                  <p className="font-secondary" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Sipariş Durumu</p>
                  <h3 className="font-bold" style={{ fontSize: '1rem' }}>
                    {activeOrder.status === 'pending' ? 'Hazırlık Bekleniyor' : activeOrder.status === 'preparing' ? 'Mutfakta Hazırlanıyor' : <span style={{display: 'flex', alignItems: 'center', gap: '4px'}}>Sipariş Hazır <CheckCircle2 size={18} color="var(--success)" /></span>}
                  </h3>
               </div>
               <div style={{ textAlign: 'right' }}>
                  <p className="font-secondary" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Kalan Süre</p>
                  <span className="font-bold" style={{ fontSize: '1.1rem', color: activeOrder.status === 'ready' ? 'var(--accent)' : 'inherit' }}>
                    {Math.floor(prepareRemaining / 60)}:{(prepareRemaining % 60).toString().padStart(2, '0')}
                  </span>
               </div>
             </div>
             {activeOrder.status === 'pending' && cancelRemaining > 0 && (
               <button onClick={cancelOrder} style={{ marginTop: '12px', border: 'none', background: 'transparent', color: '#ff4d4d', cursor: 'pointer', fontSize: '0.85rem' }} className="font-medium">
                  × İptal Et ({cancelRemaining}s)
               </button>
             )}
          </div>
        )}

        {menuData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 20px', background: '#fff', borderRadius: '32px', border: '1px dashed #e2e8f0', marginTop: '40px' }}>
            <div style={{ background: '#f8fafc', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', color: '#94a3b8' }}>
               <Utensils size={40} />
            </div>
            <h3 className="font-bold" style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '12px' }}>Menü Hazırlanıyor</h3>
            <p className="font-secondary" style={{ color: '#64748b', maxWidth: '300px', margin: '0 auto', fontSize: '1rem', lineHeight: '1.6' }}>
               Şeflerimiz en taze lezzetleri hazırlıyor. Menümüz birazdan burada görünecektir.
            </p>
          </div>
        ) : (
          menuData.map((category, index) => (
            <section key={category.id} style={{ marginBottom: '32px' }}>
              <h2 className="font-bold" style={{ fontSize: '1.15rem', marginBottom: '20px', borderLeft: '3px solid var(--primary)', paddingLeft: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 {category.name}
                 {/* FOMO: Kategoriye Özel Badge */}
                 {index === 0 && <span style={{ background: 'var(--error)', color: '#fff', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '8px', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12} strokeWidth={3} /> BUGÜNE ÖZEL KAMPANYA</span>}
              </h2>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                gap: '24px' 
              }}>
                {category.items.map((item, itemIdx) => (
                  <div key={item.id} className="glass-card" style={{ 
                    overflow: 'hidden', 
                    display: 'flex', 
                    flexDirection: 'column',
                    maxWidth: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{ position: 'relative', height: '180px', width: '100%' }}>
                       {(itemIdx === 0) && (
                          <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'linear-gradient(to right, #0f172a, #334155)', color: '#fff', padding: '6px 14px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800, zIndex: 10, boxShadow: '0 8px 16px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
                             <Flame size={14} fill="var(--warning)" color="var(--warning)" /> En Çok Tercih Edilen
                          </div>
                       )}
                       {(itemIdx === 2) && (
                          <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(239, 68, 68, 0.95)', backdropFilter: 'blur(4px)', color: '#fff', padding: '6px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800, zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                             <Timer size={14} /> Son {Math.floor(Math.random() * 3) + 2} Porsiyon
                          </div>
                       )}

                      {item.image_url ? <Image src={item.image_url} alt={item.name} fill style={{ objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: '#f1f5f9' }} />}
                    </div>
                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h4 className="font-bold" style={{ fontSize: '1rem', flex: 1 }}>{item.name}</h4>
                        <span className="font-bold" style={{ marginLeft: '12px' }}>₺{item.price}</span>
                      </div>
                      <p className="font-secondary" style={{ fontSize: '0.85rem', marginBottom: '20px', lineHeight: '1.5', flex: 1 }}>{item.description}</p>
                      
                      {cart.find(c => c.id === item.id) ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', justifyContent: 'center', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '6px', borderRadius: '12px' }}>
                          <button onClick={() => removeFromCart(item)} style={{ border: 'none', background: 'none', color: 'var(--primary)', fontSize: '1.4rem', cursor: 'pointer', width: '44px', height: '44px' }}>-</button>
                          <span className="font-bold" style={{ fontSize: '1rem' }}>{cart.find(c => c.id === item.id).quantity}</span>
                          <button onClick={() => addToCart(item)} style={{ border: 'none', background: 'none', color: 'var(--primary)', fontSize: '1.4rem', cursor: 'pointer', width: '44px', height: '44px' }}>+</button>
                        </div>
                      ) : (
                        <button className="btn-primary" style={{ width: '100%', minHeight: '48px', fontSize: '0.95rem' }} onClick={() => addToCart(item)}>Sepete Ekle</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {/* --- STICKY BOTTOM CART BAR (MOBİL DOSTU) --- */}
      {cart.length > 0 && !isCheckoutOpen && (
        <div style={{ 
          position: 'fixed', 
          bottom: '0', 
          left: '0', 
          right: '0', 
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid var(--border)',
          padding: '12px 20px calc(16px + env(safe-area-inset-bottom))', 
          zIndex: 1500,
          boxShadow: '0 -4px 30px rgba(0,0,0,0.12)'
        }}>
          {!cart.some(i => i.category === 'İçecek') && (
            <div style={{ background: 'linear-gradient(to right, #0f172a, #2563eb)', color: '#fff', padding: '8px 12px', borderRadius: '12px', marginBottom: '12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: 'fadeIn 0.5s ease-out' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Coffee size={16} />
                  <span className="font-medium">Yanına soğuk bir <b>içecek ekle</b>, %10 avantaj yakala!</span>
               </div>
               <span style={{ background: '#fff', color: '#0f172a', padding: '2px 8px', borderRadius: '6px', fontWeight: 900, fontSize: '0.7rem' }}>FIRSAT</span>
            </div>
          )}
          <button className="btn-primary" style={{ 
            width: '100%', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            borderRadius: '16px', 
            padding: '14px 20px',
            minHeight: '56px',
            boxShadow: '0 10px 20px rgba(15, 23, 42, 0.2)'
          }} onClick={() => setIsCheckoutOpen(true)}>
             <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '0.75rem', opacity: 0.8, display: 'block' }}>{cart.reduce((n, i) => n + i.quantity, 0)} Ürün</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>₺{cart.reduce((t, i) => t + (Number(i.price) * i.quantity), 0).toFixed(2)}</span>
             </div>
             <span className="font-bold" style={{ fontSize: '1rem' }}>Siparişi Tamamla →</span>
          </button>
        </div>
      )}

      {/* --- UPSELL MODAL (FIXED FOR MOBILE) --- */}
      {showUpsell && suggestedItems.length > 0 && (
         <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}>
            <div className="fade-in" style={{ background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '24px', textAlign: 'center', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
               <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', color: '#ea580c' }}><Flame size={48} fill="#ea580c" /></div>
               <h3 className="font-bold" style={{ fontSize: '1.25rem', marginBottom: '8px', color: '#0f172a' }}>Bunu alanlar şunu da aldı:</h3>
               
               <div style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', padding: '12px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #fcd34d' }}>
                  <p className="font-bold" style={{ color: '#b45309', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Gift size={16} /> MENÜ YAP KAZAN!</p>
                  <p className="font-secondary" style={{ color: '#92400e', fontSize: '0.75rem', marginTop: '2px' }}>Yanına bir ürün daha ekleyin, sepette anında <b>%10 Avantajlı</b> fiyatlardan yararlanın!</p>
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                  {suggestedItems.map(s => (
                    <div key={s.id} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', textAlign: 'left', border: '1px solid #e2e8f0' }}>
                       <div style={{ width: '44px', height: '44px', position: 'relative', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                          {s.image_url ? <Image src={s.image_url} alt={s.name} fill style={{ objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: '#f1f5f9' }} />}
                       </div>
                       <div style={{ flex: 1 }}>
                          <p className="font-bold" style={{ fontSize: '0.85rem', marginBottom: '0', color: '#0f172a' }}>{s.name}</p>
                          <p className="font-secondary" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>₺{s.price}</p>
                       </div>
                       <button onClick={() => { addToCart({...s, isUpsell: true}); setShowUpsell(false); }} style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', minHeight: '36px' }}>Kampanyaya Ekle</button>
                    </div>
                  ))}
               </div>

               <button onClick={() => setShowUpsell(false)} style={{ width: '100%', padding: '12px', border: 'none', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 500 }}>Gerek Yok, Sadece Seçtiğimi Alacağım</button>
            </div>
         </div>
      )}

      {isCheckoutOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', zIndex: 1600 }}>
           <div className="fade-in" style={{ background: '#fff', width: '100%', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px 20px 48px 20px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
                 <h3 className="font-bold" style={{ fontSize: '1.2rem' }}>Siparişi Tamamla</h3>
                 <button onClick={() => { setIsCheckoutOpen(false); setSubmissionError(null); }} style={{ border: 'none', background: '#f1f5f9', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
              </div>

              {submissionError && (
                 <div className="fade-in" style={{ background: '#fef2f2', border: '1px solid #fee2e2', padding: '16px', borderRadius: '16px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--error)' }}>
                       <AlertCircle size={20} />
                       <p className="font-bold" style={{ fontSize: '0.9rem' }}>Sipariş Gönderilemedi</p>
                    </div>
                    <p className="font-secondary" style={{ fontSize: '0.85rem', color: '#991b1b' }}>{submissionError}</p>
                    <button onClick={handleFinalCheckout} disabled={isSubmitting} className="btn-primary" style={{ background: 'var(--error)', minHeight: '44px', fontSize: '0.85rem', width: 'fit-content', padding: '8px 20px' }}>
                       {isSubmitting ? 'Deneniyor...' : 'Tekrar Dene'}
                    </button>
                 </div>
              )}

              {/* Ekstra Sepet Önerileri (Checkout Upsell) */}
              <div style={{ marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                 <p className="font-bold" style={{ fontSize: '0.85rem', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                   <Coffee size={18} color="var(--primary)" /> Sepetinize Ekleyin, Tam Olsun:
                 </p>
                 <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {menuData.flatMap(c => c.items).filter(i => i.category === 'İçecek' || i.category === 'Tatlı').slice(0,2).map(extra => (
                       <div key={extra.id} style={{ background: '#fff', padding: '8px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #e2e8f0', minWidth: '150px' }}>
                          <div style={{ flex: 1 }}>
                             <p className="font-bold" style={{ fontSize: '0.75rem', margin: 0 }}>{extra.name}</p>
                             <p className="font-secondary" style={{ fontSize: '0.7rem', color: 'var(--primary)', margin: 0, fontWeight: 700 }}>+₺{extra.price}</p>
                          </div>
                          <button onClick={() => { addToCart({...extra, isUpsell: true}); }} style={{ background: '#eff6ff', color: 'var(--primary)', border: 'none', width: '28px', height: '28px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>+</button>
                       </div>
                    ))}
                 </div>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label className="font-medium" style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>Masa No / İsim</label>
                <input value={customerInfo} onChange={e => setCustomerInfo(e.target.value)} placeholder="Örn: Masa 5" style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-main)', fontSize: '0.95rem' }} />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label className="font-medium" style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem' }}>Sipariş Notu</label>
                <textarea value={customerNote} onChange={e => setCustomerNote(e.target.value)} placeholder="Sos istemiyorum..." rows="2" style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-main)', fontSize: '0.95rem', resize: 'none' }} />
              </div>

              <button className="btn-primary" style={{ width: '100%', minHeight: '54px', fontSize: '1.1rem' }} disabled={isSubmitting} onClick={handleFinalCheckout}>
                {isSubmitting ? 'İletiliyor...' : `₺${cart.reduce((t, i) => t + (Number(i.price) * i.quantity), 0).toFixed(2)} - Siparişi Onayla`}
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
