const express = require('express');
const cors = require('cors');
const pool = require('./db');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateToken, JWT_SECRET } = require('./auth');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ─── SOCKET.IO ROOMS (Strict Partitioning) ────────────────
io.on('connection', (socket) => {
    socket.on('join_business_room', (businessSlug) => {
        socket.join(`business_${businessSlug}`);
        console.log(`Socket ${socket.id} isletme odasina katildi: ${businessSlug}`);
    });
});

// ─── AUTHENTICATION ──────────────────────────────────────

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) return res.status(401).json({ error: 'Gecersiz bilgiler' });
        
        const user = result.rows[0];
        const validPass = await bcrypt.compare(password, user.password_hash);
        
        if (!validPass) return res.status(401).json({ error: 'Gecersiz bilgiler' });

        // Son giris zamanini GUNCELLE
        await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

        const bizRes = await pool.query('SELECT * FROM businesses WHERE id = $1', [user.business_id]);
        const business = bizRes.rows[0];

        const token = jwt.sign(
            { id: user.id, business_id: user.business_id, slug: business.slug, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, business });
    } catch (err) { res.status(500).json({ error: 'Giris hatasi' }); }
});

// ─── PUBLIC (CUSTOMER) ROUTES ───────────────────────────

app.get('/api/public/business/:slug', async (req, res) => {
    try {
        const result = await pool.query('SELECT name, slug, logo_url, theme_color, whatsapp_number, welcome_message, footer_text FROM businesses WHERE slug = $1', [req.params.slug]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Isletme yok' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Hata' }); }
});

app.get('/api/public/:slug/products', async (req, res) => {
    try {
        const query = await pool.query(`
            SELECT p.id, p.name, p.description, p.price, p.image_url, p.category 
            FROM products p 
            JOIN businesses b ON p.business_id = b.id 
            WHERE b.slug = $1 ORDER BY p.category, p.id ASC
        `, [req.params.slug]);
        res.json(query.rows);
    } catch (err) { res.status(500).json({ error: 'Menu getirilemedi' }); }
});

app.post('/api/public/:slug/orders', async (req, res) => {
    try {
        const { customer_name, items, total_price, note } = req.body;
        const bizRes = await pool.query('SELECT id, slug FROM businesses WHERE slug = $1', [req.params.slug]);
        if (bizRes.rows.length === 0) return res.status(404).json({ error: 'Gecersiz isletme' });
        
        const business = bizRes.rows[0];

        const newOrder = await pool.query(
            'INSERT INTO orders (customer_name, items, total_price, note, status, business_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [customer_name, JSON.stringify(items), total_price, note || '', 'pending', business.id]
        );
        
        io.to(`business_${business.slug}`).emit('new_order', newOrder.rows[0]);

        res.status(201).json(newOrder.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Siparis iletilemedi' }); }
});

// ─── ADMIN (STRICT ISOLATION) ────────────────────────────

app.get('/api/admin/orders', authenticateToken, async (req, res) => {
    try {
        const query = await pool.query('SELECT * FROM orders WHERE business_id = $1 ORDER BY id DESC', [req.user.business_id]);
        res.json(query.rows);
    } catch (err) { res.status(500).json({ error: 'Siparisler getirilemedi' }); }
});

app.put('/api/admin/orders/:id/status', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        const result = await pool.query(
            'UPDATE orders SET status = $1 WHERE id = $2 AND business_id = $3 RETURNING *',
            [status, req.params.id, req.user.business_id]
        );
        
        if (result.rows.length === 0) return res.status(403).json({ error: 'Bu siparis size ait degil veya bulunamadi.' });
        
        const updatedOrder = result.rows[0];
        io.to(`business_${req.user.slug}`).emit('order_status_updated', updatedOrder);
        res.json(updatedOrder);
    } catch (err) { res.status(500).json({ error: 'Guncelleme hatasi' }); }
});

app.get('/api/admin/products', authenticateToken, async (req, res) => {
    try {
        const query = await pool.query('SELECT * FROM products WHERE business_id = $1 ORDER BY id ASC', [req.user.business_id]);
        res.json(query.rows);
    } catch (err) { res.status(500).json({ error: 'Urunler getirilemedi' }); }
});

app.post('/api/admin/products', authenticateToken, async (req, res) => {
    try {
        const { name, description, price, image_url, category } = req.body;
        const newItem = await pool.query(
            'INSERT INTO products (name, description, price, image_url, category, business_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, description, price, image_url, category, req.user.business_id]
        );
        res.status(201).json(newItem.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Urun eklenemedi' }); }
});

app.get('/api/admin/stock', authenticateToken, async (req, res) => {
    try {
        const query = await pool.query('SELECT * FROM stock_items WHERE business_id = $1 ORDER BY id DESC', [req.user.business_id]);
        res.json(query.rows);
    } catch (err) { res.status(500).json({ error: 'Stok verileri getirilemedi' }); }
});

app.get('/api/admin/customers', authenticateToken, async (req, res) => {
    try {
        const query = await pool.query('SELECT * FROM customers WHERE business_id = $1 ORDER BY last_visit DESC', [req.user.business_id]);
        res.json(query.rows);
    } catch (err) { res.status(500).json({ error: 'Musteriler getirilemedi' }); }
});

// Settings Management
app.get('/api/admin/settings', authenticateToken, async (req, res) => {
    try {
        const query = await pool.query('SELECT name, logo_url, theme_color, whatsapp_number, welcome_message, footer_text FROM businesses WHERE id = $1', [req.user.business_id]);
        res.json(query.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Ayarlar getirilemedi' }); }
});

app.put('/api/admin/settings', authenticateToken, async (req, res) => {
    try {
        const { name, logo_url, theme_color, whatsapp_number, welcome_message, footer_text } = req.body;
        const result = await pool.query(
            'UPDATE businesses SET name = $1, logo_url = $2, theme_color = $3, whatsapp_number = $4, welcome_message = $5, footer_text = $6 WHERE id = $7 RETURNING *',
            [name, logo_url, theme_color, whatsapp_number, welcome_message, footer_text, req.user.business_id]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Ayarlar guncellenemedi' }); }
});

// ─── SUPER ADMIN (MASTER CONTROL) ─────────────────────────

const authenticateSuperAdmin = (req, res, next) => {
    authenticateToken(req, res, () => {
        if (req.user.role !== 'super-admin') return res.status(403).json({ error: 'Bu islem icin Super Admin yetkisi gerekiyor.' });
        next();
    });
};

app.get('/api/super-admin/businesses', authenticateSuperAdmin, async (req, res) => {
    try {
        const query = await pool.query(`
            SELECT 
                b.*, 
                (SELECT COUNT(*) FROM orders WHERE business_id = b.id) as total_orders,
                (SELECT COUNT(*) FROM orders WHERE business_id = b.id AND created_at >= CURRENT_DATE) as daily_orders,
                (SELECT COUNT(*) FROM products WHERE business_id = b.id) as total_products,
                (SELECT SUM(total_price) FROM orders WHERE business_id = b.id AND status = 'completed') as total_revenue,
                (SELECT MAX(last_login_at) FROM users WHERE business_id = b.id) as last_login_at
            FROM businesses b
            ORDER BY last_login_at DESC NULLS LAST
        `);
        res.json(query.rows);
    } catch (err) { res.status(500).json({ error: 'Isletmeler getirilemedi' }); }
});

// Get products for a specific business (Remote Manage)
app.get('/api/super-admin/businesses/:id/products', authenticateSuperAdmin, async (req, res) => {
    try {
        const query = await pool.query('SELECT * FROM products WHERE business_id = $1 ORDER BY category, id ASC', [req.params.id]);
        res.json(query.rows);
    } catch (err) { res.status(500).json({ error: 'Urunler getirilemedi' }); }
});

// Update a specific product (Remote Manage)
app.put('/api/super-admin/products/:id', authenticateSuperAdmin, async (req, res) => {
    try {
        const { name, price, category } = req.body;
        const result = await pool.query(
            'UPDATE products SET name = $1, price = $2, category = $3 WHERE id = $4 RETURNING *',
            [name, price, category, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Urun guncellenemedi' }); }
});

// Update business settings (Remote Manage)
app.put('/api/super-admin/businesses/:id', authenticateSuperAdmin, async (req, res) => {
    try {
        const { name, theme_color, logo_url } = req.body;
        const result = await pool.query(
            'UPDATE businesses SET name = $1, theme_color = $2, logo_url = $3 WHERE id = $4 RETURNING *',
            [name, theme_color, logo_url, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Isletme guncellenemedi' }); }
});

app.post('/api/super-admin/login-as/:id', authenticateSuperAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const bizRes = await pool.query('SELECT * FROM businesses WHERE id = $1', [id]);
        if (bizRes.rows.length === 0) return res.status(404).json({ error: 'Isletme bulunamadi' });
        
        const business = bizRes.rows[0];

        const token = jwt.sign(
            { id: req.user.id, business_id: business.id, slug: business.slug, role: 'admin' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token, business });
    } catch (err) { res.status(500).json({ error: 'Giris saglanamadi' }); }
});

// ─── START ───────────────────────────────────────────────
server.listen(PORT, () => {
    console.log(`PATRON SaaS Server ${PORT} portunda calisiyor 👑`);
});
