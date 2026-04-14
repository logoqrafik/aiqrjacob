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
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
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
    <div className="fade-in">
      <header style={{background:'#fff', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:100, padding:'16px 0'}}>
        <div className="container" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h1 className="font-bold" style={{fontSize:'1.5rem', letterSpacing:'-0.5px'}}>Lezzet Durağı</h1>
          <button className="btn-outline" style={{padding:'8px 16px', fontSize:'0.9rem'}}>Masa Onayı</button>
        </div>
      </header>

      <main className="container" style={{padding:'32px 20px 120px 20px'}}>
        
        {activeOrder && (
          <div className="glass-card" style={{padding:'20px', marginBottom:'32px', borderLeft:'4px solid var(--accent)'}}>
             <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
               <div>
                  <p className="font-secondary" style={{fontSize:'0.85rem', marginBottom:'4px'}}>Sipariş Durumu</p>
                  <h3 className="font-bold" style={{fontSize:'1.1rem'}}>
                    {activeOrder.status === 'pending' ? 'Hazırlık Bekleniyor' : activeOrder.status === 'preparing' ? 'Mutfakta Hazırlanıyor' : 'Sipariş Hazır ✨'}
                  </h3>
               </div>
               <div style={{textAlign:'right'}}>
                  <p className="font-secondary" style={{fontSize:'0.85rem', marginBottom:'4px'}}>Kalan Süre</p>
                  <span className="font-bold" style={{fontSize:'1.2rem', color: activeOrder.status === 'ready' ? 'var(--accent)' : 'inherit'}}>
                    {Math.floor(prepareRemaining / 60)}:{(prepareRemaining % 60).toString().padStart(2, '0')}
                  </span>
               </div>
             </div>
             {activeOrder.status === 'pending' && cancelRemaining > 0 && (
               <button onClick={cancelOrder} style={{marginTop:'16px', border:'none', background:'transparent', color:'#ff4d4d', cursor:'pointer', fontSize:'0.9rem'}} className="font-medium">
                  × İptal Et ({cancelRemaining}s)
               </button>
             )}
          </div>
        )}

        {menuData.length === 0 ? (
          <div style={{textAlign:'center', padding:'80px 0'}}>
            <p className="font-secondary">Henüz ürün bulunmamaktadır.</p>
          </div>
        ) : (
          menuData.map(category => (
            <section key={category.id} style={{marginBottom:'48px'}}>
              <h2 className="font-bold" style={{fontSize:'1.25rem', marginBottom:'24px', borderLeft:'3px solid var(--primary)', paddingLeft:'12px'}}>{category.name}</h2>
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'32px'}}>
                {category.items.map(item => (
                  <div key={item.id} className="glass-card" style={{overflow:'hidden', transition:'transform 0.2s'}} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-4px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                    <div style={{position:'relative', height:'220px'}}>
                      {item.image_url ? <Image src={item.image_url} alt={item.name} fill style={{objectFit:'cover'}} /> : <div style={{width:'100%', height:'100%', background:'#f1f5f9'}} />}
                    </div>
                    <div style={{padding:'24px'}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px'}}>
                        <h4 className="font-bold" style={{fontSize:'1.1rem'}}>{item.name}</h4>
                        <span className="font-bold">₺{item.price}</span>
                      </div>
                      <p className="font-secondary" style={{fontSize:'0.9rem', marginBottom:'24px', lineHeight:'1.6'}}>{item.description}</p>
                      
                      {cart.find(c => c.id === item.id) ? (
                        <div style={{display:'flex', alignItems:'center', gap:'16px', justifyContent:'center', background:'var(--bg-main)', padding:'4px', borderRadius:'10px'}}>
                          <button onClick={()=>removeFromCart(item)} style={{border:'none', background:'none', color:'var(--primary)', fontSize:'1.5rem', cursor:'pointer', width:'32px'}}>-</button>
                          <span className="font-bold">{cart.find(c=>c.id === item.id).quantity}</span>
                          <button onClick={()=>addToCart(item)} style={{border:'none', background:'none', color:'var(--primary)', fontSize:'1.5rem', cursor:'pointer', width:'32px'}}>+</button>
                        </div>
                      ) : (
                        <button className="btn-primary" style={{width:'100%', padding:'10px'}} onClick={()=>addToCart(item)}>Sepete Ekle</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {cart.length > 0 && !isCheckoutOpen && (
        <div style={{position:'fixed', bottom:'24px', left:'50%', transform:'translateX(-50%)', width:'calc(100% - 40px)', maxWidth:'600px', zIndex:1000}}>
          <button className="btn-primary" style={{width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 10px 25px -5px rgba(15, 23, 42, 0.4)', borderRadius:'16px', padding:'18px 24px'}} onClick={()=>setIsCheckoutOpen(true)}>
             <span className="font-medium">Sepeti Onayla ({cart.reduce((n,i)=>n+i.quantity,0)})</span>
             <span className="font-bold" style={{fontSize:'1.1rem'}}>₺{cart.reduce((t,i)=>t+(Number(i.price)*i.quantity),0).toFixed(2)}</span>
          </button>
        </div>
      )}

      {isCheckoutOpen && (
        <div style={{position:'fixed', inset:0, background:'rgba(15, 23, 42, 0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'flex-end', zIndex:1001}}>
           <div className="fade-in" style={{background:'#fff', width:'100%', borderTopLeftRadius:'24px', borderTopRightRadius:'24px', padding:'32px 24px 48px 24px', maxHeight:'90vh', overflowY:'auto'}}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'32px'}}>
                 <h3 className="font-bold" style={{fontSize:'1.4rem'}}>Siparişi Tamamla</h3>
                 <button onClick={()=>setIsCheckoutOpen(false)} style={{border:'none', background:'none', fontSize:'1.5rem', cursor:'pointer'}}>&times;</button>
              </div>
              
              <div style={{marginBottom:'32px'}}>
                <label className="font-medium" style={{display:'block', marginBottom:'8px', fontSize:'0.9rem'}}>Masa No / İsim</label>
                <input value={customerInfo} onChange={e=>setCustomerInfo(e.target.value)} placeholder="Örn: Masa 5" style={{width:'100%', padding:'16px', borderRadius:'12px', border:'1px solid var(--border)', background:'var(--bg-main)', fontSize:'1rem'}} />
              </div>

              <div style={{marginBottom:'32px'}}>
                <label className="font-medium" style={{display:'block', marginBottom:'8px', fontSize:'0.9rem'}}>Özel Not (Opsiyonel)</label>
                <textarea value={customerNote} onChange={e=>setCustomerNote(e.target.value)} placeholder="Sos istemiyorum, pişkin olsun..." rows="3" style={{width:'100%', padding:'16px', borderRadius:'12px', border:'1px solid var(--border)', background:'var(--bg-main)', fontSize:'1rem', resize:'none'}} />
              </div>

              <button className="btn-primary" style={{width:'100%', padding:'18px'}} disabled={isSubmitting} onClick={handleFinalCheckout}>
                {isSubmitting ? 'İletiliyor...' : 'Siparişi Gönder'}
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
