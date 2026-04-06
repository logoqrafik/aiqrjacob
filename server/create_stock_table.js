const pool = require('./db');

async function upgradeDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS stock_items (
                id SERIAL PRIMARY KEY,
                product_name VARCHAR(255) NOT NULL,
                quantity NUMERIC NOT NULL DEFAULT 0,
                unit VARCHAR(50),
                min_stock NUMERIC DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("✅ 'stock_items' tablosu başarıyla oluşturuldu.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Hata:", err);
        process.exit(1);
    }
}

upgradeDB();
