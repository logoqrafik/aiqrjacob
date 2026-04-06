const pool = require('./db');

async function upgradeDB() {
    try {
        console.log("Veritabanı güncelleniyor (Not, Durum ve Süre için alanlar ekleniyor)...");
        await pool.query(`
            ALTER TABLE orders 
            ADD COLUMN IF NOT EXISTS note TEXT,
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
            ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP;
        `);
        console.log("Veritabanı başarıyla yeni Ticari Sürüme güncellendi!");
    } catch (err) {
        console.error("Hata:", err.message);
    } finally {
        process.exit();
    }
}
upgradeDB();
