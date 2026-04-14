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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const params = useParams();
  const businessSlug = params.businessSlug;
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const audioRef = useRef(null);

  useEffect(() => {
    // Auth Check
    const token = localStorage.getItem(`token_${businessSlug}`);
    if (!token) {
      router.push(`/${businessSlug}/admin/login`);
      return;
    }

    const savedBusiness = localStorage.getItem(`business_${businessSlug}`);
    if (savedBusiness) setBusiness(JSON.parse(savedBusiness));

    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    
    fetchData(token);
    
    const socket = io(API_URL); 
    // Isletmeye ozel siparis kanalini dinle
    socket.on(`new_order_${businessSlug}`, (newOrder) => {
        playBell();
        setOrders(prev => [newOrder, ...prev]);
    });

    socket.on('order_status_updated', (updatedOrder) => {
        setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    });

    return () => socket.disconnect();
  }, [businessSlug]);

  const playBell = () => {
    audioRef.current?.play().catch(() => {});
  };

  const fetchData = async (token) => {
    try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const [oRes, sRes, pRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/orders`, { headers }),
          fetch(`${API_URL}/api/admin/stock`, { headers }),
          fetch(`${API_URL}/api/admin/products`, { headers })
        ]);

        if (oRes.status === 401) {
            localStorage.removeItem(`token_${businessSlug}`);
            router.push(`/${businessSlug}/admin/login`);
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
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
        
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
    router.push(`/${businessSlug}/admin/login`);
  };

  if(loading) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center'}}>Yükleniyor...</div>;

  return (
    <div style={{minHeight:'100vh', display:'flex', background:'#f8f9fb', color:'#0f172a', fontFamily:'Inter, sans-serif'}}>
      {/* Sidebar */}
      <div style={{width: isSidebarOpen ? '280px' : '0', overflow:'hidden', background:'#0f172a', color:'#fff', transition:'all 0.3s'}}>
         <div style={{padding:'32px 24px'}}>
            <h1 style={{fontSize:'1.4rem', fontWeight:'900', letterSpacing:'-1px'}}>{business?.name || 'Yönetim Paneli'}</h1>
            <p style={{fontSize:'0.8rem', color:'#64748b', marginTop:'4px'}}>RestoPanel SaaS v2.0</p>
         </div>
         <div style={{padding:'10px 0'}}>
            {['dashboard', 'orders', 'products', 'stock'].map(tab => (
              <div key={tab} onClick={() => setActiveTab(tab)} style={{padding:'16px 24px', cursor:'pointer', background: activeTab === tab ? 'rgba(255,255,255,0.1)' : 'transparent', borderLeft: activeTab === tab ? '4px solid #3b82f6' : '4px solid transparent'}}>
                 {tab.toUpperCase()}
              </div>
            ))}
            <div onClick={handleLogout} style={{padding:'16px 24px', cursor:'pointer', color:'#ef4444', marginTop:'40px'}}>ÇIKIŞ YAP 🚪</div>
         </div>
      </div>

      <div style={{flex:1, padding:'40px', overflowY:'auto'}}>
        {activeTab === 'dashboard' && (
           <div>
              <h2 style={{fontSize:'2rem', fontWeight:'900', marginBottom:'32px'}}>Genel Bakış</h2>
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:'24px'}}>
                 <div style={{background:'#fff', padding:'32px', borderRadius:'24px', boxShadow:'0 4px 6px rgba(0,0,0,0.02)'}}>
                    <p style={{color:'#64748b', fontWeight:'600'}}>Aktif Siparişler</p>
                    <h3 style={{fontSize:'2.5rem', margin:'12px 0'}}>{orders.filter(o=>o.status !== 'completed').length}</h3>
                 </div>
                 <div style={{background:'#fff', padding:'32px', borderRadius:'24px', boxShadow:'0 4px 6px rgba(0,0,0,0.02)'}}>
                    <p style={{color:'#64748b', fontWeight:'600'}}>Bekleyenler</p>
                    <h3 style={{fontSize:'2.5rem', margin:'12px 0', color:'#f59e0b'}}>{orders.filter(o=>o.status === 'pending').length}</h3>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'orders' && (
           <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(360px, 1fr))', gap:'24px'}}>
              {orders.map(o => (
                <div key={o.id} style={{background:'#fff', padding:'28px', borderRadius:'24px', border: o.status === 'pending' ? '2px solid #fde68a' : '1px solid #e2e8f0'}}>
                   <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
                      <span style={{fontWeight:'800', fontSize:'1.1rem'}}>{o.customer_name}</span>
                      <span style={{fontSize:'0.8rem', color:'#64748b'}}>{new Date(o.created_at).toLocaleTimeString('tr-TR')}</span>
                   </div>
                   <div style={{padding:'16px', background:'#f8f9fb', borderRadius:'16px', marginBottom:'24px'}}>
                      {(() => {
                        const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
                        return items.map((it, idx) => <p key={idx} style={{margin:'6px 0'}}><strong style={{color:'#3b82f6'}}>{it.quantity}x</strong> {it.name}</p>);
                      })()}
                   </div>
                   <div style={{display:'flex', gap:'12px'}}>
                     {o.status === 'pending' && <button onClick={() => updateOrderStatus(o.id, 'preparing')} style={{flex:1, padding:'14px', borderRadius:'12px', background:'#10b981', color:'#fff', border:'none', fontWeight:'700', cursor:'pointer'}}>Mutfakça Başla</button>}
                     {o.status === 'preparing' && <button onClick={() => updateOrderStatus(o.id, 'ready')} style={{flex:1, padding:'14px', borderRadius:'12px', background:'#3b82f6', color:'#fff', border:'none', fontWeight:'700', cursor:'pointer'}}>Hazır Bildir</button>}
                     {o.status === 'ready' && <button onClick={() => updateOrderStatus(o.id, 'completed')} style={{flex:1, padding:'14px', borderRadius:'12px', background:'#0f172a', color:'#fff', border:'none', fontWeight:'700', cursor:'pointer'}}>Teslim Edildi</button>}
                   </div>
                </div>
              ))}
           </div>
        )}
      </div>
    </div>
  );
}
