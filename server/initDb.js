const pool = require('./db');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'new_schema.sql')).toString();
        console.log("Neon Bulut Sistemine bağlanılıyor, Tablolar oluşturuluyor...");
        await pool.query(sql);
        console.log("Veritabanı harika bir şekilde kuruldu ve menüler hazırlandı!");
    } catch (err) {
        console.error("Hata:", err.message);
    } finally {
        process.exit();
    }
}
initializeDatabase();
