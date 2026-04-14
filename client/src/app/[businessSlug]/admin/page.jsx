'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { io } from 'socket.io-client'; 

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const params = useParams();
  const businessSlug = params.businessSlug;
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const audioRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem(`token_${businessSlug}`);
    if (!token) {
      router.push(`/${businessSlug}/admin/login`);
      return;
    }

    const savedBusiness = localStorage.getItem(`business_${businessSlug}`);
    if (savedBusiness) setBusiness(JSON.parse(savedBusiness));

    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    fetchData(token);
    
    // SOCKET ROOMS CONNECTION
    const socket = io(API_URL); 
    
    // Kritik: Isletme odasina katil (Izolasyon!)
    socket.emit('join_business_room', businessSlug);

    socket.on('new_order', (newOrder) => {
        audioRef.current?.play().catch(() => {});
        setOrders(prev => [newOrder, ...prev]);
    });

    socket.on('order_status_updated', (updatedOrder) => {
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    });

    return () => socket.disconnect();
  }, [businessSlug]);

  const fetchData = async (token) => {
    try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const [oRes, sRes, pRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/orders`, { headers }),
          fetch(`${API_URL}/api/admin/stock`, { headers }),
          fetch(`${API_URL}/api/admin/products`, { headers })
        ]);

        if (oRes.status === 401 || oRes.status === 403) {
            handleLogout();
            return;
        }

        setOrders(await oRes.json());
        setStockItems(await sRes.json());
        setProducts(await pRes.json());
        setLoading(false);
    } catch (e) { console.error(e); }
  };

  const updateOrderStatus = async (id, status) => {
    try {
        const token = localStorage.getItem(`token_${businessSlug}`);
        await fetch(`${API_URL}/api/admin/orders/${id}/status`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
    } catch (e) { fetchData(localStorage.getItem(`token_${businessSlug}`)); }
  };

  const handleLogout = () => {
    localStorage.removeItem(`token_${businessSlug}`);
    localStorage.removeItem(`business_${businessSlug}`);
    router.push(`/${businessSlug}/admin/login`);
  };

  if(loading) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center'}}>Yukleniyor...</div>;

  return (
    <div style={{minHeight:'100vh', display:'flex', background:'#f8f9fb', color:'#0f172a', fontFamily:'Inter, sans-serif'}}>
      <div style={{width: '280px', background:'#0f172a', color:'#fff'}}>
         <div style={{padding:'32px 24px'}}>
            <h1 style={{fontSize:'1.4rem', fontWeight:'900', letterSpacing:'-1px'}}>{business?.name || 'RestoPanel'}</h1>
            <span style={{fontSize:'0.7rem', color:'#3b82f6', background:'rgba(59, 130, 246, 0.1)', padding:'4px 8px', borderRadius:'100px'}}>GÜVENLİ OTURUM ✅</span>
         </div>
         <div style={{padding:'10px 0'}}>
            {['dashboard', 'orders', 'products', 'stock'].map(tab => (
              <div key={tab} onClick={() => setActiveTab(tab)} style={{padding:'16px 24px', cursor:'pointer', background: activeTab === tab ? 'rgba(255,255,255,0.1)' : 'transparent', borderLeft: activeTab === tab ? '4px solid #3b82f6' : '4px solid transparent'}}>
                 {tab.toUpperCase()}
              </div>
            ))}
            <div onClick={handleLogout} style={{padding:'16px 24px', cursor:'pointer', color:'#ef4444', marginTop:'40px', fontWeight:'700'}}>GÜVENLİ ÇIKIŞ 🚪</div>
         </div>
      </div>

      <div style={{flex:1, padding:'40px', overflowY:'auto'}}>
        {activeTab === 'orders' && (
           <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(360px, 1fr))', gap:'24px'}}>
              {orders.map(o => (
                <div key={o.id} style={{background:'#fff', padding:'28px', borderRadius:'24px', position:'relative', boxShadow:'0 4px 6px rgba(0,0,0,0.02)'}}>
                   <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
                      <span style={{fontWeight:'800', fontSize:'1.1rem'}}>{o.customer_name}</span>
                      <span style={{fontSize:'0.7rem', color:'#64748b'}}>{new Date(o.created_at).toLocaleTimeString('tr-TR')}</span>
                   </div>
                   <div style={{padding:'16px', background:'#f8f9fb', borderRadius:'16px', marginBottom:'24px'}}>
                      {(() => {
                        const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
                        return items.map((it, idx) => <p key={idx} style={{margin:'6px 0'}}><strong>{it.quantity}x</strong> {it.name}</p>);
                      })()}
                   </div>
                   <div style={{display:'flex', gap:'12px'}}>
                     {o.status === 'pending' && <button onClick={() => updateOrderStatus(o.id, 'preparing')} style={{flex:1, padding:'14px', borderRadius:'12px', background:'#10b981', color:'#fff', border:'none', fontWeight:'700', cursor:'pointer'}}>Mutfaga Gonder</button>}
                     {o.status === 'preparing' && <button onClick={() => updateOrderStatus(o.id, 'ready')} style={{flex:1, padding:'14px', borderRadius:'12px', background:'#3b82f6', color:'#fff', border:'none', fontWeight:'700', cursor:'pointer'}}>Hazir Bildir</button>}
                     {o.status === 'ready' && <button onClick={() => updateOrderStatus(o.id, 'completed')} style={{flex:1, padding:'14px', borderRadius:'12px', background:'#0f172a', color:'#fff', border:'none', fontWeight:'700', cursor:'pointer'}}>Teslim Et</button>}
                   </div>
                </div>
              ))}
           </div>
        )}
      </div>
    </div>
  );
}
