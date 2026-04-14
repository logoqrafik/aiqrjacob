const pool = require('./db');
const bcrypt = require('bcryptjs');

async function migrate() {
  try {
    console.log('🏗️ Veritabani yukseltme baslatildi...');

    // 1. ISLETMELER TABLOSU
    await pool.query(`
      CREATE TABLE IF NOT EXISTS businesses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        logo_url TEXT,
        theme_color VARCHAR(50) DEFAULT '#0f172a',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. KULLANICILAR TABLOSU (Auth)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. MEVCUT TABLOLARA business_id EKLEME
    const tables = ['products', 'orders', 'stock_items', 'customers'];
    for (const table of tables) {
      // Tablonun var oldugundan emin olalim (Hata almamak icin)
      try {
        const checkCol = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = '${table}' AND column_name = 'business_id'
        `);
        
        if (checkCol.rows.length === 0) {
          await pool.query(`ALTER TABLE ${table} ADD COLUMN business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE`);
          console.log(`✅ ${table} tablosuna isletme destegi eklendi.`);
        }
      } catch (e) {
        console.log(`⚠️ ${table} tablosu bulunamadigi icin atlandi.`);
      }
    }

    // 4. VARSAYILAN ISLETME VE KULLANICI OLUSTURMA
    const bizCheck = await pool.query('SELECT * FROM businesses WHERE slug = $1', ['thejacob']);
    if (bizCheck.rows.length === 0) {
      const newBiz = await pool.query(
        'INSERT INTO businesses (name, slug) VALUES ($1, $2) RETURNING id',
        ['The Jacob', 'thejacob']
      );
      const bizId = newBiz.rows[0].id;

      // Varsayilan Admin Hesabi: admin@thejacob.com | admin123
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(
        'INSERT INTO users (business_id, email, password_hash) VALUES ($1, $2, $3)',
        [bizId, 'admin@thejacob.com', hashedPassword]
      );
      
      // Mevcut verileri bu isletmeye bagla
      for (const table of tables) {
        try {
          await pool.query(`UPDATE ${table} SET business_id = $1 WHERE business_id IS NULL`, [bizId]);
        } catch(e) {}
      }
      
      console.log('💎 Varsayilan isletme ve admin hesabi olusturuldu!');
      console.log('📧 E-posta: admin@thejacob.com | 🔑 Sifre: admin123');
    }

    console.log('🏁 Tum sehir SaaS mimarisine yukseltildi!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Yukseltme basarisiz:', err);
    process.exit(1);
  }
}

migrate();
