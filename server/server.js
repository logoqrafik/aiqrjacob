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

// ─── AUTHENTICATION ──────────────────────────────────────

// Login Endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) return res.status(401).json({ error: 'Hatali e-posta veya sifre' });
        
        const user = result.rows[0];
        const validPass = await bcrypt.compare(password, user.password_hash);
        
        if (!validPass) return res.status(401).json({ error: 'Hatali e-posta veya sifre' });

        // Isletme bilgilerini de alalim
        const bizRes = await pool.query('SELECT * FROM businesses WHERE id = $1', [user.business_id]);
        const business = bizRes.rows[0];

        const token = jwt.sign(
            { id: user.id, business_id: user.business_id, email: user.email, role: user.role, slug: business.slug },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, business });
    } catch (err) { res.status(500).json({ error: 'Giris islemi basarisiz' }); }
});

// ─── PUBLIC (CUSTOMER) ROUTES ───────────────────────────

// Get business info by slug
app.get('/api/businesses/:slug', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, slug, logo_url, theme_color FROM businesses WHERE slug = $1', [req.params.slug]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Isletme bulunamadi' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: 'Sunucu hatasi' }); }
});

// Get products for a specific business slug
app.get('/api/:slug/products', async (req, res) => {
    try {
        const query = await pool.query(`
            SELECT p.* FROM products p 
            JOIN businesses b ON p.business_id = b.id 
            WHERE b.slug = $1 ORDER BY p.id ASC
        `, [req.params.slug]);
        res.json(query.rows);
    } catch (err) { res.status(500).json({ error: 'Urunler getirilemedi' }); }
});

// Create order for a specific business
app.post('/api/:slug/orders', async (req, res) => {
    try {
        const { customer_name, items, total_price, note } = req.body;
        const bizRes = await pool.query('SELECT id FROM businesses WHERE slug = $1', [req.params.slug]);
        if (bizRes.rows.length === 0) return res.status(404).json({ error: 'Isletme bulunamadi' });
        
        const business_id = bizRes.rows[0].id;

        const newOrder = await pool.query(
            'INSERT INTO orders (customer_name, items, total_price, note, status, business_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [customer_name, JSON.stringify(items), total_price, note || '', 'pending', business_id]
        );
        const createdOrder = newOrder.rows[0];
        
        // Notify specific business socket
        io.emit(`new_order_${req.params.slug}`, createdOrder);
        io.emit('new_order_received', createdOrder); // global fallback

        res.status(201).json(createdOrder);
    } catch (err) { res.status(500).json({ error: 'Siparis olusturulamadi' }); }
});

// ─── ADMIN (PROTECTED) ROUTES ────────────────────────────
// All routes below require authenticateToken and filter by req.user.business_id

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
        if (result.rows.length === 0) return res.status(404).json({ error: 'Siparis bulunamadi veya yetkiniz yok' });
        
        const updatedOrder = result.rows[0];
        io.emit('order_status_updated', updatedOrder);
        res.json(updatedOrder);
    } catch (err) { res.status(500).json({ error: 'Guncelleme hatasi' }); }
});

// Products Management
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

// Stock Management
app.get('/api/admin/stock', authenticateToken, async (req, res) => {
    try {
        const query = await pool.query('SELECT * FROM stock_items WHERE business_id = $1 ORDER BY id DESC', [req.user.business_id]);
        res.json(query.rows);
    } catch (err) { res.status(500).json({ error: 'Stok verileri getirilemedi' }); }
});

// ─── START ───────────────────────────────────────────────
server.listen(PORT, () => {
    console.log(`Server + WebSocket ${PORT} portunda calisiyor`);
});
