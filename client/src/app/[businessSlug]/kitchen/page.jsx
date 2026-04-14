'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { io } from 'socket.io-client';

export default function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const [isStarted, setIsStarted] = useState(false);
  
  const params = useParams();
  const businessSlug = params.businessSlug;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (isStarted) {
      fetchOrders();
      const socket = io(API_URL);

      // İZOLASYON: İşletme odasına katıl
      socket.emit('join_business_room', businessSlug);

      socket.on('new_order', (newOrder) => {
        setOrders(prev => [newOrder, ...prev]);
        playNotification();
      });

      socket.on('order_status_updated', (updatedOrder) => {
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      });

      return () => socket.disconnect();
    }
  }, [isStarted, businessSlug]);

  const fetchOrders = async () => {
    try {
      // Mutfak verisi de artık sadece bu dükkana özel çekilmeli (Geçici olarak public filtered endpoint kullanıyoruz)
      const res = await fetch(`${API_URL}/api/public/${businessSlug}/orders`); 
      const data = await res.json();
      setOrders(Array.isArray(data) ? data.filter(o => o.status !== 'completed') : []);
    } catch (e) { console.error(e); }
  };

  const playNotification = () => {
     const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
     audio.play().catch(() => {});
  };

  const updateStatus = async (id, status) => {
    try {
      // Mutfak ekrani genelde admin yetkisiyle calisir, token gerekebilir.
      const res = await fetch(`${API_URL}/api/admin/orders/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem(`token_${businessSlug}`)}`
        },
        body: JSON.stringify({ status })
      });
      
      if (res.ok) {
        if (status === 'completed' || status === 'ready') {
           setOrders(prev => prev.filter(o => o.id !== id));
        }
      }
    } catch (e) { console.error(e); }
  };

  if (!isStarted) {
    return (
      <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#0f172a', color:'#fff', textAlign:'center'}}>
        <div style={{padding:'40px'}}>
          <h1 style={{fontSize:'3rem', fontWeight:'900'}}>{businessSlug.toUpperCase()} MUTFAK</h1>
          <button onClick={() => setIsStarted(true)} style={{padding:'20px 60px', borderRadius:'16px', background:'#3b82f6', color:'#fff', border:'none', fontSize:'1.2rem', fontWeight:'bold', marginTop:'30px'}}>EKRANI AÇ 🚀</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:'100vh', background:'#0f172a', color:'#fff', padding:'20px', fontFamily:'Inter, sans-serif'}}>
       <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
          <h1 style={{fontSize:'1.8rem', fontWeight:'900'}}>{businessSlug.toUpperCase()} | CANLI MUTFAK</h1>
          <div style={{background:'#10b981', padding:'10px 20px', borderRadius:'10px'}}>Aktif: {orders.length}</div>
       </div>

       <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'20px'}}>
         {orders.map(o => (
           <div key={o.id} style={{background:'#1e293b', padding:'24px', borderRadius:'24px', border:'1px solid #334155'}}>
              <div style={{fontSize:'1.3rem', fontWeight:'800', marginBottom:'16px'}}>{o.customer_name}</div>
              <div style={{background:'rgba(0,0,0,0.2)', padding:'16px', borderRadius:'16px', marginBottom:'20px'}}>
                 {(() => {
                   const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
                   return items.map((it, idx) => <p key={idx} style={{margin:'4px 0'}}><strong>{it.quantity}x</strong> {it.name}</p>);
                 })()}
              </div>
              <button onClick={() => updateStatus(o.id, 'ready')} style={{width:'100%', padding:'16px', borderRadius:'12px', background:'#10b981', color:'#fff', border:'none', fontWeight:'800'}}>HAZIR ✅</button>
           </div>
         ))}
       </div>
    </div>
  );
}
