const pool = require('./db');

async function promote() {
  try {
    const res = await pool.query(
      "UPDATE users SET role = 'super-admin' WHERE email = 'admin@thejacob.com' RETURNING *"
    );
    if (res.rows.length > 0) {
      console.log('👑 BASARI: admin@thejacob.com artik bir SUPER ADMIN!');
    } else {
      console.log('⚠️ HATA: Kullanici bulunamadi.');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

promote();
