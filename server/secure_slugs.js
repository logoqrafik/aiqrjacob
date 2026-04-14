const pool = require('./db');

function generateRandomSuffix(length = 5) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function secureSlugs() {
  try {
    console.log('🛡️ Sluglar zırhlanıyor...');
    
    // Tüm isletmeleri getir
    const res = await pool.query('SELECT id, slug FROM businesses');
    
    for (const biz of res.rows) {
        // Eğer zaten bir takı varsa (- harfi ve sonrası) ekleme yapma veya güncelle
        if (!biz.slug.includes('-')) {
            const newSlug = `${biz.slug}-${generateRandomSuffix()}`;
            await pool.query('UPDATE businesses SET slug = $1 WHERE id = $2', [newSlug, biz.id]);
            console.log(`✅ ${biz.slug} -> ${newSlug}`);
        } else {
            console.log(`ℹ️ ${biz.slug} zaten zırhlı görünüyor.`);
        }
    }

    console.log('🏁 Tüm URLler artık tahmin edilmesi zor hale getirildi!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

secureSlugs();
