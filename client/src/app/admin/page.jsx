'use client';

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client'; 
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, Building2, LayoutDashboard, ShoppingCart, Utensils, TrendingDown, Users, AlertCircle, AlertTriangle, Clock as ClockIcon, Activity, Medal, X, Menu, Check, Trash2, ChevronRight, ChevronLeft } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [systemEnabled, setSystemEnabled] = useState(false);

  // States for Forms
  const [newStock, setNewStock] = useState({ product_name: '', quantity: 0, unit: 'adet', min_stock: 5 });
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', category: 'Ana Yemek', image_url: '' });

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [alarmActive, setAlarmActive] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); 

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
  const alarmIntervalRef = useRef(null);
  const alarmTimeoutRef = useRef(null);
  const audioRef = useRef(null);
  
  useEffect(() => {
     // High-quality restaurant bell notification
     audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }, []);

  const startAlarmCycle = () => {
     if(!soundEnabled || alarmActive) return;
     
     setAlarmActive(true);
     // Initial play
     audioRef.current?.play().catch(e => console.log("Audio play blocked by browser."));
     
     // Repeat every 30 seconds
     alarmIntervalRef.current = setInterval(() => {
        audioRef.current?.play().catch(e => console.log(e));
     }, 30000);

     // Auto-stop after 5 minutes
     alarmTimeoutRef.current = setTimeout(() => {
        stopAlarm();
     }, 300000);
  };

  const stopAlarm = () => {
     setAlarmActive(false);
     if(alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
     if(alarmTimeoutRef.current) clearTimeout(alarmTimeoutRef.current);
     if(audioRef.current) {
         audioRef.current.pause();
         audioRef.current.currentTime = 0;
     }
  };

   const fetchData = async () => {
    try {
        const [oRes, sRes, cRes, pRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/orders`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/stock`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/customers`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/products`)
        ]);
        
        setOrders(await oRes.json());
        setStockItems(await sRes.json());
        setCustomers(await cRes.json());
        setProducts(await pRes.json());
    } catch (e) { console.error("Veri çekme hatası:", e); } finally { setLoading(false); }
  };

  useEffect(() => {
    if(systemEnabled) {
      fetchData();
      const socket = io((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000')); 
      
      socket.on('order_cancelled', (cancelledOrder) => {
          setOrders(prev => {
              const newList = prev.map(o => o.id === cancelledOrder.id ? cancelledOrder : o);
              if(!newList.some(x => x.status === 'pending')) stopAlarm();
              return newList;
          });
      });

      socket.on('new_order_received', (newOrder) => {
          startAlarmCycle();
          setOrders(prev => [newOrder, ...prev]);
      });

      return () => {
          socket.disconnect();
          stopAlarm();
      };
    }
  }, [systemEnabled, soundEnabled]);

  // Actions
  const handleAddStock = async (e) => {
    e.preventDefault();
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/stock`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newStock)
        });
        if(res.ok) { setNewStock({ product_name: '', quantity: 0, unit: 'adet', min_stock: 5 }); fetchData(); }
    } catch (e) {}
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/products`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newProduct)
        });
        if(res.ok) { setNewProduct({ name: '', description: '', price: '', category: 'Ana Yemek', image_url: '' }); fetchData(); }
    } catch (e) {}
  };

  const updateOrderStatus = async (id, status) => {
    if(!isOnline) return alert("Bağlantı yok!");
    let endpoint = 'accept';
    if(status === 'ready') endpoint = 'ready';
    if(status === 'cancelled') {
        if(!window.confirm("Siparişi iptal etmek istediğinize emin misiniz?")) return;
        endpoint = 'cancel';
    }
    
    setActionLoading(id);
    try {
        const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/orders/${id}/${endpoint}`;
        const res = await fetch(url, { 
           method: status === 'cancelled' ? 'PUT' : 'PUT' 
        });
        if(res.ok) { 
           const remainingPending = orders.filter(o => o.id !== id && o.status === 'pending').length;
           if(remainingPending === 0) stopAlarm();
           fetchData(); 
        }
    } catch (e) { console.error(e); } finally { setActionLoading(null); }
  };

  const handleStockAdjust = async (id, adj) => {
    if(!isOnline) return;
    setActionLoading(`stock-${id}-${adj}`);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/stock/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjustment: adj })
      });
      fetchData();
    } catch(e) {} finally { setActionLoading(null); }
  };

   if (systemEnabled && loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
        {/* Skeleton Sidebar */}
        <div style={{ width: '280px', background: '#fff', borderRight: '1px solid var(--border)', padding: '40px 24px' }}>
          <div className="skeleton" style={{ height: '32px', width: '160px', marginBottom: '40px' }} />
          {[1,2,3,4,5].map(i => (
            <div key={i} className="skeleton" style={{ height: '48px', width: '100%', marginBottom: '12px', borderRadius: '12px' }} />
          ))}
        </div>
        {/* Skeleton Content */}
        <div style={{ flex: 1, padding: '48px 64px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
             <div>
                <div className="skeleton" style={{ height: '20px', width: '120px', marginBottom: '8px' }} />
                <div className="skeleton" style={{ height: '40px', width: '240px' }} />
             </div>
             <div style={{ display: 'flex', gap: '16px' }}>
                <div className="skeleton" style={{ height: '48px', width: '140px', borderRadius: '12px' }} />
                <div className="skeleton" style={{ height: '48px', width: '140px', borderRadius: '12px' }} />
             </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '48px' }}>
             <div className="skeleton" style={{ height: '160px', gridColumn: 'span 2', borderRadius: '24px' }} />
             <div className="skeleton" style={{ height: '160px', borderRadius: '24px' }} />
             <div className="skeleton" style={{ height: '160px', borderRadius: '24px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
             <div className="skeleton" style={{ height: '350px', borderRadius: '24px' }} />
             <div className="skeleton" style={{ height: '350px', borderRadius: '24px' }} />
          </div>
        </div>
      </div>
    );
  }

  if(!systemEnabled) {
    return (
       <div style={{minHeight:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'#f8f9fb', color:'#0f172a', flexDirection:'column', textAlign:'center', padding:'20px'}}>
           <div className="glass-card fade-in" style={{padding:'64px', borderRadius:'32px', boxShadow:'0 20px 40px rgba(0,0,0,0.05)', maxWidth:'600px'}}>
             <div style={{color:'var(--accent)', marginBottom: '32px', display:'flex', justifyContent:'center', alignItems: 'center', gap: '16px'}}>
                <svg width="64" height="64" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                   <rect width="32" height="32" rx="10" fill="currentColor" fillOpacity="0.1"/>
                   <path d="M10 22V10H16C18.2091 10 20 11.7909 20 14C20 16.2091 18.2091 18 16 18H10M10 18L22 22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
             </div>
             <h1 style={{fontSize:'2.5rem', marginBottom:'20px', letterSpacing:'-1px'}} className="font-bold">RestoPanel</h1>
             <p className="font-secondary" style={{marginBottom:'40px', lineHeight:'1.6', fontSize:'1.1rem'}}>
               Canlı sipariş akışı ve mutfak bildirim sistemini aktif etmek için paneli başlatın.
             </p>
             <button onClick={()=>setSystemEnabled(true)} className="btn-primary" style={{padding:'20px 64px', fontSize:'1.2rem', borderRadius:'20px', boxShadow:'0 10px 20px rgba(15, 23, 42, 0.2)'}}>Paneli Başlat 🚀</button>
           </div>
       </div>
    );
  }

  const SidebarItem = ({ id, label, icon }) => (
    <div onClick={() => setActiveTab(id)} style={{
        padding:'14px 20px', margin:'4px 16px', borderRadius:'14px', cursor:'pointer', display:'flex', alignItems:'center', gap:'12px', transition:'all 0.2s',
        background: activeTab === id ? 'var(--primary)' : 'transparent',
        color: activeTab === id ? '#fff' : 'var(--text-muted)',
        boxShadow: activeTab === id ? '0 8px 16px -4px rgba(15, 23, 42, 0.3)' : 'none'
      }} className="font-medium hover:bg-gray-50">
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{icon}</div>
      <span style={{fontSize:'0.95rem'}}>{label}</span>
      {id === 'orders' && orders.filter(o=>o.status==='pending').length > 0 && 
        <span style={{marginLeft:'auto', background:'var(--error)', color:'#fff', fontSize:'0.7rem', padding:'2px 8px', borderRadius:'20px', fontWeight:'900'}}>{orders.filter(o=>o.status==='pending').length}</span>
      }
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-main)', 
      color: 'var(--text-main)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {!isOnline && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: 'var(--error)', color: '#fff', textAlign: 'center', padding: '12px', zIndex: 9999, fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          ⚠️ BAĞLANTI KESİLDİ - Canlı sipariş akışı durdu. Lütfen internetinizi kontrol edin.
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes urgent-shake {
          0%, 100% { transform: translateX(0) scale(1.02); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px) scale(1.02); }
          20%, 40%, 60%, 80% { transform: translateX(4px) scale(1.02); }
        }
        @keyframes red-strobe {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7), 0 0 20px rgba(239, 68, 68, 0.3); border-color: var(--error); }
          50% { box-shadow: 0 0 0 20px rgba(239, 68, 68, 0), 0 0 50px rgba(239, 68, 68, 0.5); border-color: #dc2626; }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0), 0 0 20px rgba(239, 68, 68, 0.3); border-color: var(--error); }
        }
        .pulse-pending {
          animation: red-strobe 1.5s infinite ease-in-out, urgent-shake 0.8s cubic-bezier(.36,.07,.19,.97) both;
          border: 4px solid var(--error) !important;
          background: linear-gradient(to right, #fef2f2, #fff) !important;
          z-index: 10 !important;
        }
        .status-ready-fade {
          opacity: 0.7;
          filter: grayscale(0.5);
          transition: all 0.5s ease;
        }
        .order-card-transition {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .order-card-transition:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        @media (max-width: 1024px) {
          .sidebar-container {
            transform: translateX(${isSidebarOpen ? '0' : '-100%'});
            z-index: 2000;
            width: 280px !important;
          }
          .main-content {
            margin-left: 0 !important;
            padding: 20px !important;
          }
          .stats-grid, .analytics-grid {
            grid-template-columns: 1fr !important;
          }
          .mobile-header {
             display: flex !important;
          }
          .desktop-header-info {
             display: none !important;
          }
          .glass-card {
            padding: 20px !important;
          }
        }
      `}} />

      {/* Mobile Top Header */}
      <header className="mobile-header" style={{ 
        display: 'none', 
        height: '60px', 
        background: '#fff', 
        borderBottom: '1px solid var(--border)', 
        alignItems: 'center', 
        padding: '0 20px',
        position: 'sticky',
        top: 0,
        zIndex: 1500,
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: '10px' }}
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '5px' }}
            title={soundEnabled ? "Sesi Kapat" : "Sesi Aç"}
          >
            {soundEnabled ? <Bell size={20} /> : <BellOff size={20} />}
          </button>
        </div>
        <h2 className="font-bold" style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>RestoPanel</h2>
        <div style={{ width: '40px' }}></div> 
      </header>

      {/* Modern Sidebar */}
      <aside className="sidebar-container" style={{ 
        width: '280px', 
        background: '#fff', 
        borderRight: '1px solid var(--border)', 
        height: '100vh', 
        position: 'fixed', 
        left: 0, 
        top: 0, 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: 'var(--shadow-sm)',
        zIndex: 1800
      }}>
        <div style={{ padding: '30px 32px', borderBottom: '1px solid var(--border)', marginBottom:'10px' }}>
          <h2 className="font-bold" style={{ fontSize: '1.3rem', letterSpacing: '-1px', color:'var(--primary)', display:'flex', alignItems:'center', gap:'10px' }}>
             <div style={{ display: 'flex' }}>
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                   <rect width="32" height="32" rx="8" fill="currentColor" fillOpacity="0.1"/>
                   <path d="M10 22V10H16C18.2091 10 20 11.7909 20 14C20 16.2091 18.2091 18 16 18H10M10 18L22 22" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
             </div>
             RestoPanel <span style={{fontSize:'0.6rem', background:'var(--accent)', color:'#fff', padding:'2px 6px', borderRadius:'6px', letterSpacing:'0', verticalAlign: 'middle'}}>PRO</span>
          </h2>
        </div>
        
        <nav style={{ flex: 1, padding: '10px 0' }}>
          <SidebarItem id="dashboard" label="Genel Bakış" icon={<LayoutDashboard size={20} strokeWidth={1.5} />} />
          <SidebarItem id="orders" label="Canlı Siparişler" icon={<ShoppingCart size={20} strokeWidth={1.5} />} />
          <SidebarItem id="products" label="Ürün Yönetimi" icon={<Utensils size={20} strokeWidth={1.5} />} />
          <SidebarItem id="stock" label="Stok Takibi" icon={<TrendingDown size={20} strokeWidth={1.5} />} />
          <SidebarItem id="customers" label="Müşteri Listesi" icon={<Users size={20} strokeWidth={1.5} />} />
        </nav>

        <div style={{ padding: '24px 32px', borderTop: '1px solid var(--border)' }}>
          <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius:'16px', display:'flex', alignItems:'center', gap:'10px' }}>
             <div style={{width:'36px', height:'36px', background:'var(--primary)', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:'900', fontSize: '0.8rem'}}>A</div>
             <div style={{ flex: 1, minWidth: 0 }}>
                <p className="font-bold" style={{fontSize:'0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>Admin User</p>
                <button onClick={()=>{window.location.reload()}} style={{border:'none', background:'none', color:'var(--accent)', fontSize:'0.7rem', fontWeight:'700', cursor:'pointer', padding:0}}>Çıkış Yap</button>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content" style={{ flex: 1, marginLeft: '280px', padding: '48px 64px', minHeight: '100vh', transition: 'margin-left 0.3s' }}>
        
        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 1700, backdropFilter: 'blur(2px)' }}
          />
        )}

        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'40px' }}>
          <div>
            <p className="font-secondary" style={{fontSize:'0.85rem', marginBottom:'4px'}}>Hoş Geldiniz,</p>
            <h1 className="font-bold" style={{ fontSize: '1.75rem', letterSpacing:'-0.5px' }}>
              {activeTab === 'dashboard' ? 'Panel Özeti' : activeTab === 'orders' ? 'Canlı Mutfak Paneli' : activeTab === 'products' ? 'Menü Düzenle' : activeTab === 'stock' ? 'Envanter Kontrolü' : 'Müşteri Listesi'}
            </h1>
          </div>
          <div className="desktop-header-info" style={{display:'flex', gap:'16px', alignItems: 'center'}}>
             <button 
                onClick={() => setSoundEnabled(!soundEnabled)}
                style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-sm)' }}
             >
                <span style={{ display: 'flex', alignItems: 'center' }}>{soundEnabled ? <Bell size={18} /> : <BellOff size={18} />}</span>
                <span className="font-medium" style={{ fontSize: '0.85rem' }}>{soundEnabled ? 'Ses Açık' : 'Ses Kapalı'}</span>
             </button>
             <div style={{background:'#fff', padding:'10px 18px', borderRadius:'12px', border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)', display:'flex', alignItems:'center', gap:'8px'}}>
                <div style={{width:'8px', height:'8px', background:'#22c55e', borderRadius:'50%'}}></div>
                <span className="font-medium" style={{fontSize:'0.85rem'}}>Sistem Yayında</span>
             </div>
          </div>
        </header>

        {/* --- DASHBOARD TAB --- */}
        {activeTab === 'dashboard' && (() => {
           const today = new Date().toISOString().split('T')[0];
           const todayOrders = orders.filter(o => o && o.created_at && typeof o.created_at === 'string' && o.created_at.startsWith(today));
           const revenueToday = todayOrders.filter(o => o.status === 'ready').reduce((t, o) => t + Number(o.total_price || 0), 0);
           
           // Calculate best seller
           const productCounts = {};
           orders.forEach(o => {
               try {
                   if (!o || !o.items) return;
                   const itemsRaw = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
                   const items = Array.isArray(itemsRaw) ? itemsRaw : [];
                   items.forEach(it => {
                       if (it && it.name) {
                           productCounts[it.name] = (productCounts[it.name] || 0) + (it.quantity || 1);
                       }
                   });
               } catch(e) {}
           });
           const bestSeller = Object.entries(productCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'Henüz Yok';

           return (
            <div className="fade-in">
              {/* Dynamic Alerts & Actions System */}
              <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {todayOrders.length === 0 && (
                   <div style={{ padding: '20px', background: '#fff7ed', border: '1px solid #fdba74', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                         <span style={{ color: '#c2410c' }}><AlertCircle size={28} strokeWidth={1.5} /></span>
                         <div>
                            <p className="font-bold" style={{ color: '#9a3412', marginBottom: '2px' }}>Bugün henüz sipariş gelmedi!</p>
                            <p className="font-secondary" style={{ fontSize: '0.85rem' }}>Satışları artırmak için menüde öne çıkan ürünleri düzenleyebilirsiniz.</p>
                         </div>
                      </div>
                      <button onClick={() => setActiveTab('products')} style={{ padding: '10px 20px', background: '#9a3412', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '0.85rem', cursor: 'pointer' }} className="font-medium">Menüyü Düzenle</button>
                   </div>
                )}

                {stockItems.filter(i => Number(i.quantity) <= Number(i.min_stock)).length > 0 && (
                   <div style={{ padding: '20px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                         <span style={{ color: '#b91c1c' }}><AlertTriangle size={28} strokeWidth={1.5} /></span>
                         <div>
                            <p className="font-bold" style={{ color: '#991b1b', marginBottom: '2px' }}>{stockItems.filter(i => Number(i.quantity) <= Number(i.min_stock)).length} ürün stokta azalıyor!</p>
                            <p className="font-secondary" style={{ fontSize: '0.85rem' }}>Eksik malzemeler mutfak operasyonunu durdurabilir.</p>
                         </div>
                      </div>
                      <button onClick={() => setActiveTab('stock')} style={{ padding: '10px 20px', background: '#991b1b', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '0.85rem', cursor: 'pointer' }} className="font-medium">Stoğu Güncelle</button>
                   </div>
                )}

                {(() => {
                   const hour = new Date().getHours();
                   const isPeak = (hour >= 11 && hour <= 14) || (hour >= 18 && hour <= 21);
                   if (isPeak) return (
                    <div style={{ padding: '20px', background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                       <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <span style={{ color: '#1d4ed8' }}><ClockIcon size={28} strokeWidth={1.5} /></span>
                          <div>
                             <p className="font-bold" style={{ color: '#1e40af', marginBottom: '2px' }}>Yoğun saat yaklaşıyor!</p>
                             <p className="font-secondary" style={{ fontSize: '0.85rem' }}>Mutfak ekibini hazırlayın ve sipariş panelini açık tutun.</p>
                          </div>
                       </div>
                       <button onClick={() => setActiveTab('orders')} style={{ padding: '10px 20px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '0.85rem', cursor: 'pointer' }} className="font-medium">Siparişleri İzle</button>
                    </div>
                   )
                })()}
              </div>

              {/* Statistics Grid */}
              <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '48px' }}>
                
                {/* Highlighted: Günlük Ciro (En Büyük) */}
                <div className="glass-card" style={{ 
                  padding: '32px 24px', 
                  background: 'linear-gradient(135deg, #0f172a, #1e293b)', 
                  color: '#fff', 
                  gridColumn: 'span 2',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  borderRadius: '24px',
                  boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.4)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <Activity size={120} strokeWidth={1} style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1, transform: 'rotate(-10deg)', color: '#fff' }} />
                  <span style={{ fontSize: '1rem', color: '#94a3b8', zIndex: 1 }} className="font-medium">Günlük Ciro</span>
                  <p className="font-bold" style={{ fontSize: '3.5rem', margin: '8px 0', letterSpacing: '-2px', color: '#fff', zIndex: 1 }}>
                    ₺{revenueToday.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#cbd5e1' }}>
                    <span style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', color: '#fff' }}>Bugün</span>
                    <span style={{ fontWeight: 600 }}>Ciro Bekleyen: ₺{todayOrders.filter(o=>o.status!=='ready').reduce((t,o)=>t+Number(o.total_price),0).toFixed(2)}</span>
                  </div>
                </div>

                {/* Sipariş Sayısı */}
                <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }} className="font-medium">Sipariş Sayısı</span>
                     <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '4px 8px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>Aktif</span>
                  </div>
                  <p className="font-bold" style={{ fontSize: '2.5rem', margin: '12px 0 8px 0', color: '#0f172a' }}>{todayOrders.length}</p>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Bugün tamamlanan ve bekleyen.</span>
                </div>

                {/* Ortalama Sipariş */}
                <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }} className="font-medium">Ortalama Sipariş</span>
                     <span style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 8px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>Değer</span>
                  </div>
                  <p className="font-bold" style={{ fontSize: '2.5rem', margin: '12px 0 8px 0', color: '#0f172a' }}>
                     ₺{todayOrders.length > 0 ? (todayOrders.reduce((t, o) => t + Number(o.total_price || 0), 0) / todayOrders.length).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}
                  </p>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Masa / sipariş başına kazanç.</span>
                </div>

                {/* En Çok Satan Ürün (Genişletilmiş) */}
                <div className="glass-card" style={{ padding: '24px', gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '24px', background: 'linear-gradient(to right, #fff, #f8fafc)', border: '1px solid #e2e8f0' }}>
                   <div style={{ width: '80px', height: '80px', background: '#fef3c7', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 10px 15px -3px rgba(251, 191, 36, 0.2)' }}>
                      <Medal size={40} color="#b45309" strokeWidth={1.5} />
                   </div>
                   <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--primary)' }} className="font-bold">ÖNE ÇIKAN</span>
                      <p className="font-bold" style={{ fontSize: '1.8rem', marginTop: '4px', marginBottom: '8px', color: '#0f172a' }}>{bestSeller}</p>
                      <p className="font-secondary" style={{ fontSize: '0.9rem', color: '#64748b' }}>Müşterilerin en çok tercih ettiği, vitrin ürününüz.</p>
                   </div>
                </div>
              </div>

              {/* Ödeme Bekleyen Siparişler (Yeni Hızlı Görünüm Ünitesi) */}
              <div style={{ marginBottom: '48px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ background: '#ecfdf5', color: 'var(--success)', padding: '8px', borderRadius: '10px' }}>
                         <ShoppingCart size={20} />
                      </div>
                      <h3 className="font-bold" style={{ fontSize: '1.25rem' }}>Ödeme Bekleyen Masalar</h3>
                   </div>
                   <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Toplam: {orders.filter(o => o.status === 'ready').length} Aktif Masa</span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                   {orders.filter(o => o.status === 'ready').length === 0 ? (
                      <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 40px', background: '#fff', borderRadius: '24px', border: '1px dashed #cbd5e1' }}>
                         <div style={{ background: '#f8fafc', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: '#94a3b8' }}>
                            <ShoppingCart size={32} />
                         </div>
                         <h4 className="font-bold" style={{ color: '#0f172a', fontSize: '1.1rem', marginBottom: '4px' }}>Ödeme Bekleyen Masa Yok</h4>
                         <p className="font-secondary" style={{ color: '#64748b', fontSize: '0.85rem' }}>Şu an mutfaktan çıkıp ödeme aşamasına gelen aktif bir siparişiniz bulunmuyor.</p>
                      </div>
                   ) : (
                      orders.filter(o => o.status === 'ready').slice(0, 8).map(o => (
                        <div key={o.id} className="glass-card order-card-transition" style={{ padding: '20px', background: '#fff', border: '1px solid #e2e8f0', borderRadius:'20px', position: 'relative' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                              <div>
                                 <p className="font-secondary" style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Masa / No</p>
                                 <h4 className="font-bold" style={{ fontSize: '1.1rem', marginTop: '4px' }}>{o.customer_name}</h4>
                              </div>
                              <span style={{ background: '#dcfce7', color: '#16a34a', padding: '4px 10px', borderRadius: '30px', fontSize: '0.7rem', fontWeight: 900, boxShadow: '0 4px 10px rgba(22, 163, 74, 0.1)' }}>HESAP AÇIK</span>
                           </div>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <p className="font-bold" style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>₺{Number(o.total_price).toFixed(2)}</p>
                              <div style={{ background: 'var(--bg-main)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                                 {o.created_at ? new Date(o.created_at).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) : '...'}
                              </div>
                           </div>
                        </div>
                      ))
                   )}
                </div>
              </div>


              {/* Advanced Analytics & Product Performance Section */}
              <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
                
                {/* 7-Day Revenue Chart (Custom CSS) */}
                <div className="glass-card" style={{ padding: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                      <h3 className="font-bold" style={{ fontSize: '1.1rem' }}>Haftalık Ciro Analizi</h3>
                      <p className="font-secondary" style={{ fontSize: '0.8rem' }}>Son 7 günün performans grafiği</p>
                    </div>
                    <span style={{ fontSize: '0.75rem', background: 'var(--bg-main)', padding: '6px 12px', borderRadius: '10px', color: 'var(--text-muted)' }}>Mevcut Hafta</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '200px', paddingBottom: '20px', position: 'relative' }}>
                    {/* Background Grids */}
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} style={{ position: 'absolute', left: 0, right: 0, bottom: (i * 60) + 20 + 'px', borderTop: '1px dashed var(--border)', zIndex: 0 }}></div>
                    ))}

                    {(() => {
                      const days = [];
                      for(let i=6; i>=0; i--) {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        const dateStr = d.toISOString().split('T')[0];
                        const dayRevenue = orders.filter(o => o.created_at.startsWith(dateStr) && o.status === 'ready').reduce((t, o) => t + Number(o.total_price), 0);
                        days.push({ name: d.toLocaleDateString('tr-TR', { weekday: 'short' }), revenue: dayRevenue });
                      }
                      const maxRecord = Math.max(...days.map(d => d.revenue)) || 1000;
                      
                      return days.map((day, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, gap: '8px' }}>
                          <div style={{ position: 'relative', width: '32px', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                            {day.revenue > 0 && (
                               <div style={{ 
                                 width: '100%', 
                                 height: (day.revenue / maxRecord * 100) + '%', 
                                 background: 'linear-gradient(to top, var(--primary), #a855f7)', 
                                 borderRadius: '6px 6px 4px 4px',
                                 boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                               }}></div>
                            )}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{day.name}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Best Sellers List with Micro-bars */}
                <div className="glass-card" style={{ padding: '32px' }}>
                  <h3 className="font-bold" style={{ marginBottom: '8px', fontSize: '1.1rem' }}>Ürün Performansı</h3>
                  <p className="font-secondary" style={{ fontSize: '0.8rem', marginBottom: '32px' }}>En çok tercih edilen 5 ürün</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {Object.entries(productCounts).sort((a,b) => b[1] - a[1]).slice(0, 5).map(([name, count], i) => {
                       const maxCount = Object.values(productCounts).sort((a,b) => b-a)[0] || 1;
                       return (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                             <span className="font-bold" style={{ fontSize: '0.9rem' }}>{name}</span>
                             <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>{count} Satış</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: 'var(--bg-main)', borderRadius: '10px', overflow: 'hidden' }}>
                             <div style={{ width: (count / maxCount * 100) + '%', height: '100%', background: 'var(--accent)', borderRadius: '10px' }}></div>
                          </div>
                        </div>
                       );
                    })}
                    {Object.keys(productCounts).length === 0 && <p className="font-secondary" style={{textAlign:'center', marginTop:'40px'}}>Henüz satış verisi yok.</p>}
                  </div>
                </div>
              </div>

              {/* Recent Orders Table (Moved Below Analytics) */}
              <div className="glass-card" style={{ padding: '0', marginTop: '32px' }}>
                  <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="font-bold">Son Sipariş Hareketleri</h3>
                    <button onClick={() => setActiveTab('orders')} className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Tümünü Yönet</button>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-main)' }}>
                          <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Masa / No</th>
                          <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Zaman</th>
                          <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tutar</th>
                          <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Durum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 5).map(o => (
                          <tr key={o.id} style={{ borderTop: '1px solid var(--border)' }}>
                            <td style={{ padding: '16px 24px', fontWeight: '600' }}>{o.customer_name}</td>
                            <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                               {o.created_at ? new Date(o.created_at).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) : '...'}
                            </td>
                            <td style={{ padding: '16px 24px', fontWeight: 700 }}>₺{o.total_price || 0}</td>
                            <td style={{ padding: '16px 24px' }}>
                               <span style={{
                                 padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800',
                                 background: o.status === 'ready' ? '#dcfce7' : o.status === 'pending' ? '#fef3c7' : '#dbeafe',
                                 color: o.status === 'ready' ? '#15803d' : o.status === 'pending' ? '#92400e' : '#1e40af'
                               }}>{(o.status || 'pending').toUpperCase()}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              </div>
            </div>
           )
        })()}



        {/* --- ORDERS TAB --- */}
        {activeTab === 'orders' && (
           <div className="fade-in">
              <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '16px 20px', borderRadius: '16px', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                 <div style={{ color: 'var(--primary)', marginTop: '2px' }}><AlertCircle size={24} strokeWidth={1.5} /></div>
                 <div>
                    <h4 className="font-bold" style={{ fontSize: '1rem', color: '#0f172a', marginBottom: '4px' }}>Yeni siparişleri buradan yönetin</h4>
                    <p className="font-secondary" style={{ fontSize: '0.9rem', color: '#475569' }}>Panel açık kaldığı sürece yeni siparişler anında ekrana düşer. Sipariş içeriğini görmek ve mutfak durumunu değiştirmek için <b>masa detayına tıklayın</b> ve butonları kullanın.</p>
                 </div>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(350px, 1fr))', gap:'24px'}}>
               {orders.filter(o => o.status !== 'cancelled').map(o => (
                 <div key={o.id} style={{ position: 'relative', overflow: 'hidden', borderRadius: '24px' }}>
                    {/* Swipe Backgrounds */}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 30px', borderRadius: '24px' }}>
                       <div style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '8px' }}><Trash2 size={32} /><span className="font-bold">İptal</span></div>
                       <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px' }}><span className="font-bold">Hazır</span><Check size={32} /></div>
                    </div>
                    
                    <motion.div 
                      layout
                      initial={{ scale: 0.8, opacity: 0, y: 30 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                      drag="x" 
                      dragConstraints={{ left: 0, right: 0 }}
                      onDragEnd={(e, info) => {
                         if (info.offset.x > 150) updateOrderStatus(o.id, o.status === 'pending' ? 'preparing' : 'ready');
                         if (info.offset.x < -150) updateOrderStatus(o.id, 'cancelled');
                      }}
                      className={`glass-card order-card-transition ${o.status === 'pending' ? 'pulse-pending' : ''} ${o.status === 'ready' ? 'status-ready-fade' : ''}`} 
                      style={{ padding:'24px', zIndex: 1, position: 'relative', cursor: 'grab' }}
                      whileHover={{ y: -8, scale: 1.01, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}
                      whileTap={{ cursor: 'grabbing' }}
                    >
                       <div style={{display:'flex', justifyContent:'space-between', marginBottom:'16px', alignItems:'center'}}>
                          <h4 className="font-bold" style={{fontSize:'1.2rem', display:'flex', alignItems:'center', gap:'8px'}}>
                             {o.status === 'pending' && <span style={{background:'var(--warning)', color:'#fff', fontSize:'0.65rem', padding:'2px 8px', borderRadius:'6px', fontWeight:'900', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'}}>YENİ!</span>}
                             {o.customer_name}
                          </h4>
                          <span style={{fontSize:'0.8rem', color:'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px'}}>
                            <ClockIcon size={14} /> {o.created_at ? new Date(o.created_at).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'}) : '...'}
                          </span>
                       </div>
                       
                       <div style={{marginBottom:'24px', padding:'16px', background:'var(--bg-main)', borderRadius:'12px', border: '1px solid #f1f5f9'}}>
                          {(() => {
                             try {
                                if (!o.items) return null;
                                const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
                                return Array.isArray(items) ? items.map((it, idx) => (
                                   <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                      <p className="font-bold" style={{fontSize:'1rem'}}>
                                         <span style={{color:'var(--primary)', marginRight: '8px'}}>{it.quantity}x</span> {it.name}
                                      </p>
                                      {it.isUpsell && <span style={{fontSize: '0.65rem', background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '10px', height: 'fit-content'}}>AVANTAJLI</span>}
                                   </div>
                                )) : null;
                             } catch(e) { return null; }
                          })()}
                       </div>
                       
                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                          {o.status === 'pending' && (
                             <button disabled={actionLoading === o.id} onClick={()=>updateOrderStatus(o.id, 'preparing')} className="btn-primary" style={{ gridColumn: 'span 2', background:'var(--success)', height: '64px', fontSize: '1.1rem', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <Check size={24} /> SİPARİŞİ ONAYLA
                             </button>
                          )}
                          {o.status === 'preparing' && (
                             <>
                                <button disabled={actionLoading === o.id} onClick={()=>updateOrderStatus(o.id, 'cancelled')} className="btn-outline" style={{ background: '#fef2f2', color: 'var(--error)', borderColor: '#fee2e2', height: '64px', borderRadius: '16px' }}>
                                   <Trash2 size={24} /> İPTAL
                                </button>
                                <button disabled={actionLoading === o.id} onClick={()=>updateOrderStatus(o.id, 'ready')} className="btn-primary" style={{ background:'var(--accent)', height: '64px', fontWeight: '800', borderRadius: '16px' }}>
                                   HAZIR BİLDİR <ChevronRight size={24} />
                                </button>
                             </>
                          )}
                          {o.status === 'ready' && <div style={{gridColumn: 'span 2', textAlign:'center', padding:'16px', color:'var(--success)', fontWeight:'900', background:'#dcfce7', borderRadius:'16px', fontSize:'1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}><Check size={24} /> TESLİM EDİLDİ</div>}
                       </div>
                    </motion.div>
                 </div>
              ))}
               {orders.filter(o => o.status !== 'cancelled').length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px 40px', background: '#fff', borderRadius: '32px', border: '1px dashed #cbd5e1' }}>
                    <div style={{ background: '#f0f9ff', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', color: '#0ea5e9', animation: 'pulse 2s infinite' }}>
                       <ClockIcon size={40} />
                    </div>
                    <h3 className="font-bold" style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '12px' }}>Canlı Akış Bekleniyor</h3>
                    <p className="font-secondary" style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto', fontSize: '1rem', lineHeight: '1.6' }}>
                       Şu an için yeni bir siparişiniz yok. Dijital menünüzden sipariş geldiğinde burası anlık ve sesli uyarılı olarak güncellenecektir.
                    </p>
                  </div>
               )}
            </div>
         </div>
        )}

        {/* --- PRODUCTS TAB --- */}
        {activeTab === 'products' && (
           <div className="fade-in">
              <div className="glass-card" style={{padding:'32px', marginBottom:'32px'}}>
                 <h3 className="font-bold" style={{marginBottom:'24px'}}>Yeni Ürün Ekle</h3>
                 <form onSubmit={handleAddProduct} style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'20px'}}>
                    <input placeholder="Ürün Adı" value={newProduct.name} onChange={e=>setNewProduct({...newProduct, name:e.target.value})} style={{padding:'14px', borderRadius:'12px', border:'1px solid var(--border)', background:'var(--bg-main)'}} />
                    <input placeholder="Fiyat (₺)" value={newProduct.price} onChange={e=>setNewProduct({...newProduct, price:e.target.value})} style={{padding:'14px', borderRadius:'12px', border:'1px solid var(--border)', background:'var(--bg-main)'}} />
                    <select value={newProduct.category} onChange={e=>setNewProduct({...newProduct, category:e.target.value})} style={{padding:'14px', borderRadius:'12px', border:'1px solid var(--border)', background:'var(--bg-main)'}}>
                       <option>Ana Yemek</option><option>Ara Sıcak</option><option>Salata</option><option>Tatlı</option><option>İçecek</option>
                    </select>
                    <input placeholder="Görsel URL (Opsiyonel)" value={newProduct.image_url} onChange={e=>setNewProduct({...newProduct, image_url:e.target.value})} style={{padding:'14px', borderRadius:'12px', border:'1px solid var(--border)', background:'var(--bg-main)'}} />
                    <button type="submit" className="btn-primary" style={{gridColumn:'1/-1', minHeight: '48px'}}>Ürünü Kaydet</button>
                 </form>
              </div>
              <div className="glass-card" style={{padding:'0', overflowX: 'auto'}}>
                 <table style={{width:'100%', minWidth: '600px', borderCollapse:'collapse'}}>
                    <thead>
                       <tr style={{background:'var(--bg-main)'}}>
                          <th style={{padding:'16px 24px', textAlign:'left', fontSize:'0.75rem', color:'var(--text-muted)'}}>ÜRÜN ADI</th>
                          <th style={{padding:'16px 24px', textAlign:'left', fontSize:'0.75rem', color:'var(--text-muted)'}}>KATEGORİ</th>
                          <th style={{padding:'16px 24px', textAlign:'left', fontSize:'0.75rem', color:'var(--text-muted)'}}>FİYAT</th>
                       </tr>
                    </thead>
                    <tbody>
                       {products.map(p => (
                          <tr key={p.id} style={{borderTop:'1px solid var(--border)'}}>
                             <td style={{padding:'16px 24px', fontWeight:'600'}}>{p.name}</td>
                             <td style={{padding:'16px 24px'}}>{p.category}</td>
                             <td style={{padding:'16px 24px', fontWeight:'700'}}>₺{p.price}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {/* --- STOCK TAB --- */}
        {activeTab === 'stock' && (
           <div className="fade-in">
              <div className="glass-card" style={{padding:'24px', marginBottom:'32px'}}>
                 <h3 className="font-bold" style={{marginBottom:'20px'}}>Sarf Malzeme Ekle</h3>
                 <form onSubmit={handleAddStock} style={{display:'flex', gap:'16px', flexWrap:'wrap'}}>
                    <input placeholder="Ürün Adı" value={newStock.product_name} onChange={e=>setNewStock({...newStock, product_name:e.target.value})} style={{padding:'12px', borderRadius:'10px', border:'1px solid var(--border)', flex:2, minHeight: '48px'}} />
                    <input type="number" placeholder="Miktar" value={newStock.quantity} onChange={e=>setNewStock({...newStock, quantity:e.target.value})} style={{padding:'12px', borderRadius:'10px', border:'1px solid var(--border)', width:'100px', minHeight: '48px'}} />
                    <input placeholder="Birim" value={newStock.unit} onChange={e=>setNewStock({...newStock, unit:e.target.value})} style={{padding:'12px', borderRadius:'10px', border:'1px solid var(--border)', width:'100px', minHeight: '48px'}} />
                    <button type="submit" className="btn-primary" style={{minHeight: '48px', flex:1}}>Kaydet</button>
                 </form>
              </div>
              <div className="glass-card" style={{padding:'0', overflowX: 'auto'}}>
                 <table style={{width:'100%', minWidth: '600px', borderCollapse:'collapse'}}>
                    <thead>
                       <tr style={{background:'var(--bg-main)'}}>
                          <th style={{padding:'16px 24px', textAlign:'left', fontSize:'0.75rem', color:'var(--text-muted)'}}>MALZEME</th>
                          <th style={{padding:'16px 24px', textAlign:'left', fontSize:'0.75rem', color:'var(--text-muted)'}}>DURUM</th>
                          <th style={{padding:'16px 24px', textAlign:'left', fontSize:'0.75rem', color:'var(--text-muted)'}}>İşlemler</th>
                       </tr>
                    </thead>
                    <tbody>
                       {stockItems.map(item => {
                          const isLow = Number(item.quantity) <= Number(item.min_stock);
                          return (
                             <tr key={item.id} style={{borderTop:'1px solid var(--border)'}}>
                                <td style={{padding:'16px 24px'}}><p className="font-bold">{item.product_name}</p><span style={{fontSize:'0.7rem', color:'#888'}}>Birim: {item.unit}</span></td>
                                <td style={{padding:'16px 24px'}}>
                                   <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                      <span className="font-bold" style={{fontSize:'1.1rem'}}>{item.quantity}</span>
                                      {isLow ? <span style={{background:'#fee2e2', color:'var(--error)', padding:'2px 10px', borderRadius:'20px', fontSize:'0.7rem', fontWeight:'900'}}>AZALDI</span> : <span style={{background:'#dcfce7', color:'#22c55e', padding:'2px 10px', borderRadius:'20px', fontSize:'0.7rem', fontWeight:'900'}}>YETERLİ</span>}
                                   </div>
                                </td>
                                <td style={{padding:'16px 24px'}}>
                                   <div style={{display:'flex', gap:'8px'}}>
                                      <button disabled={!!actionLoading} onClick={()=>handleStockAdjust(item.id, 1)} style={{padding:'4px 10px', borderRadius:'6px', border:'1px solid var(--border)', cursor:'pointer', minWidth: '40px', minHeight: '48px'}}>+</button>
                                      <button disabled={!!actionLoading} onClick={()=>handleStockAdjust(item.id, -1)} style={{padding:'4px 10px', borderRadius:'6px', border:'1px solid var(--border)', cursor:'pointer', minWidth: '40px', minHeight: '48px'}}>-</button>
                                   </div>
                                </td>
                             </tr>
                          )
                       })}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {/* --- CUSTOMERS TAB --- */}
        {activeTab === 'customers' && (
           <div className="glass-card" style={{padding:'0', overflowX: 'auto'}}>
              <table style={{width:'100%', minWidth: '600px', borderCollapse:'collapse'}}>
                 <thead>
                    <tr style={{background:'var(--bg-main)'}}>
                       <th style={{padding:'16px 24px', textAlign:'left', fontSize:'0.75rem', color:'var(--text-muted)'}}>MÜŞTERİ</th>
                       <th style={{padding:'16px 24px', textAlign:'left', fontSize:'0.75rem', color:'var(--text-muted)'}}>İLETİŞİM</th>
                       <th style={{padding:'16px 24px', textAlign:'left', fontSize:'0.75rem', color:'var(--text-muted)'}}>AKSİYON</th>
                    </tr>
                 </thead>
                 <tbody>
                    {customers.map(c => (
                       <tr key={c.id} style={{borderTop:'1px solid var(--border)'}}>
                          <td style={{padding:'16px 24px'}}><p className="font-bold">{c.name}</p><span style={{fontSize:'0.75rem', color:'#888'}}>Kayıt: {new Date(c.last_visit).toLocaleDateString()}</span></td>
                          <td style={{padding:'16px 24px'}} className="font-medium">{c.phone}</td>
                          <td style={{padding:'16px 24px'}}>
                             <button onClick={() => window.open(`https://wa.me/${c.phone.replace(/\D/g,'')}?text=Kampanya%20var%21`)} className="btn-outline" style={{padding:'8px 16px', fontSize:'0.85rem', color:'var(--accent)', borderColor:'var(--accent)', borderRadius: '10px', minHeight: '48px'}}>Mesaj Gönder</button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        )}

      </main>
    </div>
  );
}
