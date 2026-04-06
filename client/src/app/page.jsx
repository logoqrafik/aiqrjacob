'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { io } from 'socket.io-client';

export default function Home() {
  const [menuData, setMenuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerNote, setCustomerNote] = useState('');
  const [customerInfo, setCustomerInfo] = useState('');
  const [activeOrder, setActiveOrder] = useState(null); 
  const [cancelRemaining, setCancelRemaining] = useState(45);  
  const [prepareRemaining, setPrepareRemaining] = useState(300); 
  const [showUpsell, setShowUpsell] = useState(false);
  const [suggestedItems, setSuggestedItems] = useState([]);

  const timerRef = useRef(null);

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
      if (suggestions.length > 0) setShowUpsell(true);
      
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
      setIsSubmitting(true);
      try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/orders`, {
             method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer_name: customerInfo, items: cart, total_price: cart.reduce((t, i) => t + (Number(i.price) * i.quantity), 0), note: customerNote })
          });
          const resultOrder = await res.json();
          setCart([]); setIsCheckoutOpen(false); setCancelRemaining(45); setPrepareRemaining(300); setActiveOrder(resultOrder);
      } catch(e) {} finally { setIsSubmitting(false); }
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
      <div className="container" style={{paddingTop:'50px'}}>
        <div className="skeleton" style={{height:'40px', width:'200px', marginBottom:'40px'}} />
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'24px'}}>
           {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{height:'300px', borderRadius:'16px'}} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: '100vw', overflowX: 'hidden' }}>
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
          <h1 className="font-bold" style={{ fontSize: '1.25rem', letterSpacing: '-0.5px' }}>Lezzet Durağı</h1>
          <button className="btn-outline" style={{ padding: '8px 12px', fontSize: '0.85rem', minHeight: '40px' }}>Giriş Yap</button>
        </div>
      </header>

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
                    {activeOrder.status === 'pending' ? 'Hazırlık Bekleniyor' : activeOrder.status === 'preparing' ? 'Mutfakta Hazırlanıyor' : 'Sipariş Hazır ✨'}
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
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p className="font-secondary">Henüz ürün bulunmamaktadır.</p>
          </div>
        ) : (
          menuData.map(category => (
            <section key={category.id} style={{ marginBottom: '32px' }}>
              <h2 className="font-bold" style={{ fontSize: '1.15rem', marginBottom: '20px', borderLeft: '3px solid var(--primary)', paddingLeft: '12px' }}>{category.name}</h2>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                gap: '24px' 
              }}>
                {category.items.map(item => (
                  <div key={item.id} className="glass-card" style={{ 
                    overflow: 'hidden', 
                    display: 'flex', 
                    flexDirection: 'column',
                    maxWidth: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{ position: 'relative', height: '180px', width: '100%' }}>
                      {item.image_url ? <Image src={item.image_url} alt={item.name} fill style={{ objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: '#f1f5f9' }} />}
                    </div>
                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h4 className="font-bold" style={{ fontSize: '1rem', flex: 1 }}>{item.name}</h4>
                        <span className="font-bold" style={{ marginLeft: '12px' }}>₺{item.price}</span>
                      </div>
                      <p className="font-secondary" style={{ fontSize: '0.85rem', marginBottom: '20px', lineHeight: '1.5', flex: 1 }}>{item.description}</p>
                      
                      {cart.find(c => c.id === item.id) ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', justifyContent: 'center', background: 'var(--bg-main)', padding: '6px', borderRadius: '12px' }}>
                          <button onClick={() => removeFromCart(item)} style={{ border: 'none', background: 'none', color: 'var(--primary)', fontSize: '1.4rem', cursor: 'pointer', width: '44px', height: '44px' }}>-</button>
                          <span className="font-bold" style={{ fontSize: '1rem' }}>{cart.find(c => c.id === item.id).quantity}</span>
                          <button onClick={() => addToCart(item)} style={{ border: 'none', background: 'none', color: 'var(--primary)', fontSize: '1.4rem', cursor: 'pointer', width: '44px', height: '44px' }}>+</button>
                        </div>
                      ) : (
                        <button className="btn-primary" style={{ width: '100%', minHeight: '44px', fontSize: '0.95rem' }} onClick={() => addToCart(item)}>Sepete Ekle</button>
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
          padding: '16px 20px env(safe-area-inset-bottom)', 
          zIndex: 1500,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)'
        }}>
          <button className="btn-primary" style={{ 
            width: '100%', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            borderRadius: '14px', 
            padding: '14px 20px',
            minHeight: '54px'
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
            <div className="fade-in" style={{ background: '#fff', width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '24px', textAlign: 'center', maxHeight: '90vh', overflowY: 'auto' }}>
               <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🍱</div>
               <h3 className="font-bold" style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Yanına ister misiniz?</h3>
               
               <div style={{ background: '#fffbeb', padding: '10px', borderRadius: '12px', marginBottom: '20px' }}>
                  <p className="font-bold" style={{ color: '#92400e', fontSize: '0.8rem' }}>✨ Menü yapınca %10 avantaj!</p>
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                  {suggestedItems.map(s => (
                    <div key={s.id} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', textAlign: 'left' }}>
                       <div style={{ width: '44px', height: '44px', position: 'relative', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                          {s.image_url ? <Image src={s.image_url} alt={s.name} fill style={{ objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: '#f1f5f9' }} />}
                       </div>
                       <div style={{ flex: 1 }}>
                          <p className="font-bold" style={{ fontSize: '0.85rem', marginBottom: '0' }}>{s.name}</p>
                          <p className="font-secondary" style={{ fontSize: '0.8rem' }}>₺{s.price}</p>
                       </div>
                       <button onClick={() => { addToCart(s); setShowUpsell(false); }} style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '10px', fontSize: '0.75rem', cursor: 'pointer', minHeight: '36px' }}>Ekle</button>
                    </div>
                  ))}
               </div>

               <button onClick={() => setShowUpsell(false)} style={{ width: '100%', padding: '12px', border: 'none', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer' }}>Gerek Yok, Devam Et</button>
            </div>
         </div>
      )}

      {isCheckoutOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', zIndex: 1600 }}>
           <div className="fade-in" style={{ background: '#fff', width: '100%', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px 20px 48px 20px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                 <h3 className="font-bold" style={{ fontSize: '1.2rem' }}>Siparişi Tamamla</h3>
                 <button onClick={() => setIsCheckoutOpen(false)} style={{ border: 'none', background: 'none', fontSize: '1.8rem', cursor: 'pointer', padding: '8px' }}>&times;</button>
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


