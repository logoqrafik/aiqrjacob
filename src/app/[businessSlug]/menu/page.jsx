'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function MenuPage() {
  const [business, setBusiness] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [orderSent, setOrderSent] = useState(false);

  const params = useParams();
  const businessSlug = params.businessSlug;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchBusinessData();
  }, [businessSlug]);

  const fetchBusinessData = async () => {
    try {
      const [bRes, pRes] = await Promise.all([
        fetch(`${API_URL}/api/public/business/${businessSlug}`),
        fetch(`${API_URL}/api/public/${businessSlug}/products`)
      ]);
      
      if (bRes.ok) setBusiness(await bRes.json());
      if (pRes.ok) setProducts(await pRes.json());
      setLoading(false);
    } catch (e) { console.error(e); }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const submitOrder = async () => {
    if (!customerName || cart.length === 0) return alert('Lütfen isim girin ve sepeti doldurun.');
    
    try {
      const res = await fetch(`${API_URL}/api/public/${businessSlug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          items: cart,
          total_price: cart.reduce((acc, item) => acc + (item.price * item.quantity), 0),
          note: orderNote
        })
      });
      if (res.ok) setOrderSent(true);
    } catch (e) { alert('Hata oluştu!'); }
  };

  const openWhatsApp = () => {
    if (!business?.whatsapp_number) return;
    const text = encodeURIComponent(`Merhaba ${business.name}, menünüzden sipariş vermek istiyorum.`);
    window.open(`https://wa.me/${business.whatsapp_number}?text=${text}`, '_blank');
  };

  if (loading) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center'}}>Yükleniyor...</div>;

  const themeColor = business?.theme_color || '#3b82f6';

  return (
    <div style={{minHeight:'100vh', background:'#f8fafc', color:'#0f172a', paddingBottom:'100px', fontFamily:'Inter, sans-serif'}}>
      {/* Header */}
      <div style={{background: themeColor, color:'#fff', padding:'40px 20px', textAlign:'center', borderRadius:'0 0 40px 40px', boxShadow:`0 10px 30px ${themeColor}33`}}>
        {business?.logo_url && <img src={business.logo_url} style={{width:'80px', height:'80px', borderRadius:'50%', objectFit:'cover', marginBottom:'16px', border:'4px solid rgba(255,255,255,0.2)'}} />}
        <h1 style={{fontSize:'2rem', fontWeight:'900', margin:0}}>{business?.name}</h1>
        <p style={{marginTop:'12px', opacity:0.9, fontSize:'0.9rem', maxWidth:'300px', margin:'12px auto 0 auto'}}>{business?.welcome_message || 'Menümüze Hoşgeldiniz'}</p>
      </div>

      {/* Categories & Products */}
      <div style={{padding:'24px', maxWidth:'600px', margin:'0 auto'}}>
        {products.map(product => (
          <div key={product.id} style={{background:'#fff', padding:'20px', borderRadius:'24px', marginBottom:'16px', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 4px 6px rgba(0,0,0,0.02)'}}>
            <div style={{flex:1}}>
              <h3 style={{fontSize:'1.1rem', fontWeight:'800', margin:0}}>{product.name}</h3>
              <p style={{fontSize:'0.8rem', color:'#64748b', margin:'4px 0'}}>{product.description}</p>
              <p style={{fontSize:'1.1rem', fontWeight:'900', margin:'8px 0 0 0', color: themeColor}}>₺{product.price}</p>
            </div>
            {product.image_url && <img src={product.image_url} style={{width:'70px', height:'70px', borderRadius:'16px', objectFit:'cover', marginLeft:'16px'}} />}
            <button 
              onClick={() => addToCart(product)}
              style={{marginLeft:'16px', background: themeColor, color:'#fff', border:'none', width:'40px', height:'40px', borderRadius:'12px', cursor:'pointer', fontSize:'1.2rem', fontWeight:'bold'}}
            >
              +
            </button>
          </div>
        ))}
      </div>

      {/* WHATSAPP FLOAT BUTTON */}
      {business?.whatsapp_number && (
        <button 
          onClick={openWhatsApp}
          style={{position:'fixed', bottom:'100px', right:'24px', background:'#25d366', color:'#fff', border:'none', padding:'12px 24px', borderRadius:'100px', fontWeight:'800', display:'flex', alignItems:'center', gap:'10px', boxShadow:'0 10px 20px rgba(37, 211, 102, 0.3)', cursor:'pointer', zIndex:100}}
        >
          <span>WhatsApp Destek</span>
        </button>
      )}

      {/* Cart (Fixed Bottom) */}
      {cart.length > 0 && !orderSent && (
        <div style={{position:'fixed', bottom:0, left:0, right:0, background:'#fff', padding:'20px', borderTop:'1px solid #e2e8f0', boxShadow:'0 -10px 30px rgba(0,0,0,0.05)', zIndex:1000}}>
          <div style={{maxWidth:'600px', margin:'0 auto'}}>
             <div style={{marginBottom:'16px'}}>
                <input 
                  placeholder="İsminiz (Sipariş için)" 
                  value={customerName} 
                  onChange={e=>setCustomerName(e.target.value)}
                  style={{width:'100%', padding:'12px', borderRadius:'12px', border:'1px solid #e2e8f0', outline:'none', marginBottom:'8px'}}
                />
             </div>
             <button 
               onClick={submitOrder}
               style={{width:'100%', background: themeColor, color:'#fff', padding:'18px', borderRadius:'16px', border:'none', fontWeight:'900', fontSize:'1rem', cursor:'pointer'}}
             >
               Siparişi Tamamla (₺{cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)})
             </button>
          </div>
        </div>
      )}

      {orderSent && (
        <div style={{position:'fixed', inset:0, background:'rgba(255,255,255,0.9)', backdropFilter:'blur(10px)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:2000, textAlign:'center', padding:'40px'}}>
           <div>
              <div style={{fontSize:'4rem', marginBottom:'20px'}}>✅</div>
              <h2 style={{fontSize:'2rem', fontWeight:'900'}}>Siparişiniz Alındı!</h2>
              <p style={{color:'#64748b', marginTop:'12px'}}>Şefimiz hemen hazırlamaya başlıyor.</p>
              <button onClick={() => setOrderSent(false)} style={{marginTop:'32px', background:'#0f172a', color:'#fff', padding:'14px 40px', borderRadius:'100px', border:'none', cursor:'pointer'}}>Anladım</button>
           </div>
        </div>
      )}
    </div>
  );
}
