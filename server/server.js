const express = require('express');
const cors = require('cors');
const pool = require('./db');
const http = require('http'); // YENİ: Socket için Http sarmalayıcı
const { Server } = require('socket.io'); // YENİ: Socket Sunucu Modülü
require('dotenv').config();

const app = express();
const server = http.createServer(app); // YENİ: Express'i Http ile başlat

// YENİ: Socket İzinleri
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "DELETE"] }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Gelen bağlantıları (Admin girdiğinde) terminalden izlemek için (Log)
io.on('connection', (socket) => {
    console.log("🟢 CANLI: Admin mutfak paneli şu an sisteme bağlandı!");
});

// 1. Tüm ürünleri Listeleme
app.get('/api/products', async (req, res) => {
    try {
        const query = await pool.query('SELECT * FROM products ORDER BY id ASC');
        res.json(query.rows);
    } catch (err) {
        res.status(500).json({ error: 'Ürünleri getirirken hata oluştu' });
    }
});

// 2. Yeni ürün ekleme
app.post('/api/products', async (req, res) => {
    try {
        const { name, description, price, image_url, category } = req.body;
        const newItem = await pool.query(
            'INSERT INTO products (name, description, price, image_url, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, description, price, image_url, category]
        );
        res.status(201).json(newItem.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Ürün eklenirken hata oluştu' });
    }
});

// 3. Ürün Silme
app.delete('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM products WHERE id = $1', [id]);
        res.json({ message: "Ürün başarıyla silindi" });
    } catch (err) {
        res.status(500).json({ error: 'Ürün silinirken hata oluştu' });
    }
});

// 4. Sipariş oluşturma (MÜŞTERİ VURDUĞUNDA)
app.post('/api/orders', async (req, res) => {
    try {
        const { customer_name, items, total_price, note } = req.body;
        const newOrder = await pool.query(
            'INSERT INTO orders (customer_name, items, total_price, note, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [customer_name, JSON.stringify(items), total_price, note || '', 'pending']
        );
        
        const createdOrder = newOrder.rows[0];

        // EN KRİTİK NOKTA: SİPARİŞİ ADMİNE ANINDA GÖNDER
        io.emit('new_order_received', createdOrder);

        res.status(201).json(createdOrder);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Sipariş oluşturulamadı' });
    }
});

// YENİ: Sipariş Onaylama (Admin tıklar)
app.put('/api/orders/:id/accept', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            "UPDATE orders SET status = 'preparing', accepted_at = NOW() WHERE id = $1 RETURNING *",
            [id]
        );
        const updatedOrder = result.rows[0];
        io.emit('order_status_updated', updatedOrder);
        res.json(updatedOrder);
    } catch (err) { res.status(500).json({ error: 'Sipariş onaylanamadı' }); }
});

// YENİ: Müşteri İptali (1 Dakikalık pencere içinde)
app.put('/api/orders/:id/cancel', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            "UPDATE orders SET status = 'cancelled' WHERE id = $1 AND status = 'pending' RETURNING *",
            [id]
        );
        if(result.rows.length > 0) {
            io.emit('order_cancelled', result.rows[0]);
            res.json(result.rows[0]);
        } else res.status(400).json({ error: 'Sipariş artık iptal edilemez' });
    } catch (err) { res.status(500).json({ error: 'İptal işleminde hata' }); }
});

// YENİ: Sipariş Hazırlandı (Admin tıklar)
app.put('/api/orders/:id/ready', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            "UPDATE orders SET status = 'ready' WHERE id = $1 RETURNING *",
            [id]
        );
        const updatedOrder = result.rows[0];
        io.emit('order_status_updated', updatedOrder);
        res.json(updatedOrder);
    } catch (err) { res.status(500).json({ error: 'İşlem hatası' }); }
});

// 5. Stokları Görüntüleme
app.get('/api/stock', async (req, res) => {
    try {
        const query = await pool.query('SELECT * FROM stock_items ORDER BY id DESC');
        res.json(query.rows);
    } catch (err) { res.status(500).json({ error: 'Stok verileri getirilemedi' }); }
});

// 6. Yeni Stok Ürünü Ekleme
app.post('/api/stock', async (req, res) => {
    try {
        const { product_name, quantity, unit, min_stock } = req.body;
        const newItem = await pool.query(
            'INSERT INTO stock_items (product_name, quantity, unit, min_stock) VALUES ($1, $2, $3, $4) RETURNING *',
            [product_name, quantity, unit, min_stock]
        );
        res.status(201).json(newItem.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Stok eklenemedi' }); }
});

// 7. Stok Miktarı Güncelleme (RACE CONDITION GÜVENLİ)
app.put('/api/stock/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity, adjustment } = req.body;
        
        let result;
        if (adjustment !== undefined) {
          // Eğer değişim miktarı geldiyse (+1 veya -1 gibi) direkt DB üzerinde topla
          result = await pool.query(
              'UPDATE stock_items SET quantity = quantity + $1 WHERE id = $2 RETURNING *',
              [adjustment, id]
          );
        } else {
          // Eğer direkt değer geldiyse onu set et
          result = await pool.query(
              'UPDATE stock_items SET quantity = $1 WHERE id = $2 RETURNING *',
              [quantity, id]
          );
        }

        if (result.rows.length === 0) return res.status(404).json({ error: 'Ürün bulunamadı' });
        res.json(result.rows[0]);
    } catch (err) { 
        console.error("Stok hatası:", err.message);
        res.status(500).json({ error: 'Stok güncellenemedi' }); 
    }
});

// 8. Stok Ürünü Silme
app.delete('/api/stock/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM stock_items WHERE id = $1', [id]);
        res.json({ message: "Stok kaydı silindi" });
    } catch (err) { res.status(500).json({ error: 'Stok silinemedi' }); }
});

// 9. Müşteri Listesi Getirme
app.get('/api/customers', async (req, res) => {
    try {
        const query = await pool.query('SELECT * FROM customers ORDER BY last_visit DESC');
        res.json(query.rows);
    } catch (err) { res.status(500).json({ error: 'Müşteri verileri getirilemedi' }); }
});

// 10. Siparişleri görüntüleme (Admin Yenilediğinde)
app.get('/api/orders', async (req, res) => {
    try {
        const query = await pool.query('SELECT * FROM orders ORDER BY id DESC');
        res.json(query.rows);
    } catch (err) { res.status(500).json({ error: 'Siparişleri getirirken hata oluştu' }); }
});

// NORMAL APP YERİNE ARTIK SERVER'I DİNLİYORUZ Kİ SOCKET ÇALIŞSIN
server.listen(PORT, () => {
    console.log(`Server & WebSocket Motoru ${PORT} portunda canlı yayında!`);
});
