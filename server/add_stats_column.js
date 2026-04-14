const pool = require('./db');

async function addStats() {
  try {
    console.log('📊 Istatistik kolonlari ekleniyor...');
    
    // 1. Son giris zamanini takip etmek icin kolon ekle
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);

    console.log('✅ last_login_at kolonu eklendi.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

addStats();
