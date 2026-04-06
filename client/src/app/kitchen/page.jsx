'use client';

import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

export default function KitchenDisplay() {
  const [isStarted, setIsStarted] = useState(false);
  const [orders, setOrders] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [swipingId, setSwipingId] = useState(null);
  const [swipeX, setSwipeX] = useState(0);
  const startX = useRef(0);
  const audioRef = useRef(null);

  useEffect(() => {
    fetchOrders();
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');

    socket.on('new_order_received', (newOrder) => {
      setOrders(prev => [newOrder, ...prev]);
      if(isStarted) {
        audioRef.current?.play().catch(e => console.log("Audio play blocked"));
      }
    });

    socket.on('order_cancelled', (cancelledOrder) => {
      setOrders(prev => prev.filter(o => o.id !== cancelledOrder.id));
    });

    socket.on('order_status_updated', (updated) => {
       if(updated.status === 'ready' || updated.status === 'completed') {
          setOrders(prev => prev.filter(o => o.id !== updated.id));
       }
    });

    const timer = setInterval(() => setCurrentTime(new Date()), 60000);

    return () => {
      socket.disconnect();
      clearInterval(timer);
    };
  }, [isStarted]);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }, []);

  const handleStart = () => {
    setIsStarted(true);
    audioRef.current?.play().catch(e => console.log("Init audio"));
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/orders`);
      const data = await res.json();
      setOrders(data.filter(o => o.status === 'pending' || o.status === 'preparing'));
    } catch (e) { console.error("Error fetching kitchen orders:", e); }
  };

  const markAsReady = async (id) => {
    try {
      // Optimistic UI update
      setOrders(prev => prev.filter(o => o.id !== id));
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/orders/${id}/ready`, {
        method: 'PUT'
      });
    } catch (e) { 
        console.error("Error updating status:", e);
        fetchOrders(); // Fallback on error
    }
  };

  const cancelOrder = async (id) => {
     try {
        setOrders(prev => prev.filter(o => o.id !== id));
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/orders/${id}`, {
            method: 'DELETE'
        });
     } catch(e) { fetchOrders(); }
  };

  const getWaitTime = (createdAt) => {
    const start = new Date(createdAt || new Date());
    const diff = Math.floor((currentTime - start) / 60000);
    return diff > 0 ? diff : 0;
  };

  // Touch Handlers
  const onTouchStart = (e, id) => {
     startX.current = e.touches[0].clientX;
     setSwipingId(id);
  };

  const onTouchMove = (e) => {
     if(!swipingId) return;
     const deltaX = e.touches[0].clientX - startX.current;
     setSwipeX(deltaX);
  };

  const onTouchEnd = () => {
     if(swipeX > 150) {
        markAsReady(swipingId);
     } else if(swipeX < -150) {
        cancelOrder(swipingId);
     }
     setSwipingId(null);
     setSwipeX(0);
  };

  return (
    <div className="kitchen-ultra" style={{ 
      minHeight: '100vh', 
      background: '#f1f5f9', 
      fontFamily: '"Inter", sans-serif',
      color: '#1e293b',
      overflowX: 'hidden'
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --primary: #1e1b4b;
          --accent: #6366f1;
          --success: #10b981;
          --danger: #ef4444;
          --warning: #f59e0b;
        }
        @keyframes pulse-border {
          0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); }
          100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }
        .order-card {
          background: #fff;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          transition: transform 0.1s;
        }
        .order-card.ready-bg { background: rgba(16, 185, 129, 0.1); }
        .order-card.cancel-bg { background: rgba(239, 68, 68, 0.1); }
        
        .swipe-hint {
           position: absolute; top:0; height:100%; width:80px;
           display:flex; align-items:center; justify-content:center;
           color:#fff; font-weight:900; font-size:1.5rem;
           opacity:0; transition: opacity 0.2s; pointer-events:none;
        }
        .swipe-right { left: -85px; background: var(--success); border-radius: 20px 0 0 20px; }
        .swipe-left { right: -85px; background: var(--danger); border-radius: 0 20px 20px 0; }

        .btn-ready {
          background: var(--success);
          color: #fff;
          border: none;
          min-height: 54px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 1.1rem;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .btn-ready:active { transform: scale(0.97); }
        
        .fade-exit { 
           animation: slideOut 0.3s forwards;
        }
        @keyframes slideOut {
           to { transform: translateX(100%); opacity: 0; }
        }
      `}} />

      {!isStarted && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.95)', 
          zIndex: 9999, display: 'flex', flexDirection: 'column', 
          alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)'
        }}>
           <div style={{ fontSize: '5rem', marginBottom: '10px' }}>🥘</div>
           <h2 style={{ fontSize: '2.5rem', marginBottom: '32px', fontWeight:'900', color:'#fff', textAlign:'center' }}>MUTFAK<br/>DOKUNMATİK PANEL</h2>
           <button 
             onClick={handleStart}
             style={{
               padding: '24px 60px', fontSize: '1.4rem', fontWeight: '900',
               background: '#6366f1', color: '#fff', border: 'none',
               borderRadius: '20px', cursor: 'pointer', boxShadow: '0 20px 40px rgba(99, 102, 243, 0.3)'
             }}
           >
             Hemen Başlat
           </button>
        </div>
      )}

      <header style={{ 
        padding: '24px 40px', background:'#fff', borderBottom:'1px solid #e2e8f0', 
        display:'flex', justifyContent:'space-between', alignItems:'center',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
           <div style={{fontSize:'1.8rem'}}>🔥</div>
           <h1 style={{fontSize:'1.5rem', fontWeight:'900', margin:0}}>CANLI MUTFAK</h1>
        </div>
        <div style={{display:'flex', gap:'20px', alignItems:'center'}}>
           <div style={{textAlign:'right'}}>
              <p style={{margin:0, fontSize:'0.7rem', color:'#64748b', fontWeight:'800'}}>BEKLEYEN</p>
              <p style={{margin:0, fontSize:'1.4rem', fontWeight:'900'}}>{orders.length}</p>
           </div>
           <button onClick={() => window.location.reload()} style={{border:'none', background:'#f1f5f9', padding:'10px', borderRadius:'10px', cursor:'pointer'}}>🔄</button>
        </div>
      </header>

      <main style={{ padding: '24px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'20px' }}>
        {orders.map(o => {
          const waitTime = getWaitTime(o.created_at);
          const isDelayed = waitTime >= 10;
          const isCurrentSwiping = swipingId === o.id;
          const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;

          return (
            <div 
              key={o.id} 
              className={`order-card ${o.status === 'pending' ? 'pulse-pending' : ''}`}
              onTouchStart={(e) => onTouchStart(e, o.id)}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              style={{
                position:'relative',
                transform: isCurrentSwiping ? `translateX(${swipeX}px)` : 'none',
                opacity: isCurrentSwiping && Math.abs(swipeX) > 100 ? 0.8 : 1,
                overflow: 'hidden'
              }}
            >
              {/* Swipe Hints */}
              <div className="swipe-hint swipe-right" style={{ opacity: isCurrentSwiping && swipeX > 50 ? 1 : 0 }}>✓</div>
              <div className="swipe-hint swipe-left" style={{ opacity: isCurrentSwiping && swipeX < -50 ? 1 : 0 }}>✕</div>

              <div style={{ padding: '24px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px' }}>
                   <div>
                      <h4 style={{fontSize:'1.6rem', fontWeight:'900', margin:0}}>MASA {o.customer_name.replace(/\D/g,'') || o.customer_name}</h4>
                      <p style={{fontSize:'0.8rem', color:'#64748b', margin:0}}>{new Date(o.created_at).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</p>
                   </div>
                   <div style={{
                      background: isDelayed ? 'var(--danger)' : '#f1f5f9',
                      color: isDelayed ? '#fff' : '#1e293b',
                      padding: '6px 12px', borderRadius: '10px', fontSize:'0.9rem', fontWeight:'900'
                   }}>
                      {waitTime} dk
                   </div>
                </div>

                <div style={{ marginBottom:'24px', background:'#f8fafc', borderRadius:'14px', padding:'16px' }}>
                   {Array.isArray(items) && items.map((it, idx) => (
                      <div key={idx} style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px' }}>
                         <span style={{color:'var(--accent)', fontWeight:'900', fontSize:'1.1rem'}}>{it.quantity}x</span>
                         <span style={{fontWeight:'700', fontSize:'1.05rem', color:'#334155'}}>{it.name}</span>
                      </div>
                   ))}
                </div>

                <button 
                  onClick={() => markAsReady(o.id)}
                  className="btn-ready"
                  style={{ width:'100%', background: isDelayed ? 'var(--danger)' : 'var(--success)' }}
                >
                  HAZIRLANDI
                </button>
              </div>
            </div>
          );
        })}

        {orders.length === 0 && (
          <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'100px 0', opacity:0.5 }}>
             <p style={{fontSize:'5rem', margin:0}}>✨</p>
             <p style={{fontSize:'1.2rem', fontWeight:'800'}}>Tüm siparişler teslim edildi!</p>
          </div>
        )}
      </main>

      <style jsx global>{`
        body { background: #f1f5f9; margin:0; }
        * { user-select: none; -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
}
