'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function CustomerMenu() {
  const [products, setProducts] = useState([]);
  const [business, setBusiness] = useState(null);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
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
        fetch(`${API_URL}/api/businesses/${businessSlug}`),
        fetch(`${API_URL}/api/${businessSlug}/products`)
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
      const res = await fetch(`${API_URL}/api/${businessSlug}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          items: cart,
          total_price: cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0),
          note: note
        })
      });

      if (res.ok) {
        setOrderSent(true);
        setCart([]);
      }
    } catch (e) { alert('Sipariş gönderilemedi.'); }
  };

  if (loading) return <div style={{textAlign:'center', padding:'100px'}}>Menü Yükleniyor...</div>;
  if (!business) return <div style={{textAlign:'center', padding:'100px'}}>İşletme Bulunamadı.</div>;

  return (
    <div style={{minHeight:'100vh', background:'#f8f9fb', fontFamily:'Inter, sans-serif'}}>
      {/* Header */}
      <div style={{background: business.theme_color || '#0f172a', color:'#fff', padding:'40px 20px', textAlign:'center'}}>
         {business.logo_url && <img src={business.logo_url} style={{width:'80px', height:'80px', borderRadius:'50%', marginBottom:'16px'}} />}
         <h1 style={{fontSize:'2.2rem', fontWeight:'900', margin:0}}>{business.name}</h1>
         <p style={{opacity:0.8, marginTop:'8px'}}>Online Sipariş Menüsü</p>
      </div>

      <div style={{maxWidth:'600px', margin:'0 auto', padding:'20px'}}>
         {orderSent ? (
           <div style={{textAlign:'center', padding:'60px 20px', background:'#fff', borderRadius:'24px', boxShadow:'0 10px 30px rgba(0,0,0,0.05)'}}>
              <div style={{fontSize:'4rem', marginBottom:'20px'}}>✅</div>
              <h2 style={{fontSize:'1.8rem', fontWeight:'800'}}>Siparişiniz Alındı!</h2>
              <p style={{color:'#64748b', marginTop:'12px'}}>Şeflerimiz hazırlamaya başladı. Afiyet olsun!</p>
              <button onClick={() => setOrderSent(false)} style={{marginTop:'32px', padding:'16px 40px', borderRadius:'14px', border:'none', background:'#0f172a', color:'#fff', fontWeight:'700'}}>Yeni Sipariş Ver</button>
           </div>
         ) : (
           <>
              <h3 style={{fontSize:'1.4rem', fontWeight:'800', marginBottom:'24px', marginTop:'20px'}}>Menü</h3>
              <div style={{display:'grid', gap:'16px', marginBottom:'40px'}}>
                {products.map(p => (
                  <div key={p.id} style={{background:'#fff', padding:'16px', borderRadius:'20px', display:'flex', gap:'16px', alignItems:'center', boxShadow:'0 4px 6px rgba(0,0,0,0.02)'}}>
                     {p.image_url && <img src={p.image_url} style={{width:'80px', height:'80px', borderRadius:'16px', objectFit:'cover'}} />}
                     <div style={{flex:1}}>
                        <h4 style={{margin:0, fontWeight:'700'}}>{p.name}</h4>
                        <p style={{margin:'4px 0', fontSize:'0.85rem', color:'#64748b'}}>{p.description}</p>
                        <p style={{margin:0, fontWeight:'800', color: business.theme_color || '#0f172a'}}>{p.price} TL</p>
                     </div>
                     <button onClick={() => addToCart(p)} style={{padding:'10px 20px', borderRadius:'12px', border:'none', background: business.theme_color || '#0f172a', color:'#fff', fontWeight:'700'}}>+</button>
                  </div>
                ))}
              </div>

              {cart.length > 0 && (
                <div style={{background:'#fff', padding:'28px', borderRadius:'24px', boxShadow:'0 -10px 20px rgba(0,0,0,0.05)', position:'sticky', bottom:'20px', border:'1px solid #e2e8f0'}}>
                   <h3 style={{fontWeight:'800', marginBottom:'20px'}}>Sepetiniz</h3>
                   <input 
                     placeholder="Masa No / İsminiz" 
                     value={customerName}
                     onChange={(e) => setCustomerName(e.target.value)}
                     style={{width:'100%', padding:'16px', borderRadius:'12px', border:'1px solid #e2e8f0', marginBottom:'12px', boxSizing:'border-box'}}
                   />
                   <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px', fontWeight:'800', fontSize:'1.2rem'}}>
                      <span>Toplam</span>
                      <span>{cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0)} TL</span>
                   </div>
                   <button onClick={submitOrder} style={{width:'100%', padding:'20px', borderRadius:'16px', background:'#10b981', color:'#fff', border:'none', fontWeight:'800', fontSize:'1.1rem'}}>Siparişi Gönder 🚀</button>
                </div>
              )}
           </>
         )}
      </div>
    </div>
  );
}
