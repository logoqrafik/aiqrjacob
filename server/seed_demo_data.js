const pool = require('./db');

async function seedData() {
    try {
        console.log("🚀 Veritabanı tohumlama (seeding) başlatıldı...");

        // 1. Müşteriler tablosunu oluştur (Eğer yoksa)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS customers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                total_spent NUMERIC DEFAULT 0,
                last_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Tabloyu temizle (Opsiyonel: Demo için temiz başlıyoruz)
        await pool.query('DELETE FROM orders');
        await pool.query('DELETE FROM stock_items');
        await pool.query('DELETE FROM customers');
        await pool.query('DELETE FROM products');

        // 2. Örnek Ürünler
        const products = [
            ['Adana Kebap', 'Zırh kıyması ile özel hazırlanmış.', 280, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1', 'Ana Yemek'],
            ['Kuzu Şiş', 'Lokum gibi kuzu eti.', 320, 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd', 'Ana Yemek'],
            ['Lahmacun', 'Çıtır çıtır taş fırın lahmacun.', 90, 'https://images.unsplash.com/photo-1628191010210-a59de33e5941', 'Pide & Lahmacun'],
            ['Gavurdağı Salatası', 'Cevizli bol ekşili.', 120, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd', 'Salata'],
            ['Künefe', 'Hatay usulü bol peynirli.', 150, 'https://images.unsplash.com/photo-1541944743827-e04bb645fg12', 'Tatlı']
        ];

        for (const p of products) {
            await pool.query('INSERT INTO products (name, description, price, image_url, category) VALUES ($1, $2, $3, $4, $5)', p);
        }

        // 3. Örnek Müşteriler (10 Adet)
        const customerNames = [
            'Ahmet Yılmaz', 'Mehmet Demir', 'Ayşe Kaya', 'Fatma Çelik', 'Ali Öztürk',
            'Zeynep Aydın', 'Mustafa Arslan', 'Emine Şahin', 'Hüseyin Yıldız', 'Canan Polat'
        ];
        for (const name of customerNames) {
            await pool.query('INSERT INTO customers (name, phone, total_spent) VALUES ($1, $2, $3)', [name, '0544' + Math.floor(Math.random()*9000000+1000000), Math.floor(Math.random()*2000)]);
        }

        // 4. Örnek Stok Ürünleri (10 Adet)
        const stocks = [
            ['Domates', 4, 'kg', 10], ['Biber', 15, 'kg', 5], ['Un', 50, 'kg', 10],
            ['Kıyma', 8, 'kg', 5], ['Soğan', 20, 'kg', 5], ['Yoğurt', 3, 'kg', 5],
            ['Tuz', 10, 'adet', 2], ['Pirinç', 30, 'kg', 10], ['Mercimek', 15, 'kg', 5], ['Su (0.5L)', 100, 'adet', 24]
        ];
        for (const s of stocks) {
            await pool.query('INSERT INTO stock_items (product_name, quantity, unit, min_stock) VALUES ($1, $2, $3, $4)', s);
        }

        // 5. Örnek Siparişler (20 Adet)
        const statuses = ['ready', 'preparing', 'pending', 'cancelled'];
        for (let i = 0; i < 20; i++) {
            const randomCust = customerNames[Math.floor(Math.random() * customerNames.length)];
            const items = [{ name: 'Adana Kebap', quantity: 1, price: 280 }];
            const total = 280;
            const status = statuses[i % 4]; // Karışık durumlar
            await pool.query(
                'INSERT INTO orders (customer_name, items, total_price, status, created_at) VALUES ($1, $2, $3, $4, NOW() - INTERVAL \'' + i + ' hours\')',
                [randomCust, JSON.stringify(items), total, status]
            );
        }

        console.log("✅ Seeding başarıyla tamamlandı!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Seeding Hatası:", err);
        process.exit(1);
    }
}

seedData();
