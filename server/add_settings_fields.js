const pool = require('./db');

async function addSettingsFields() {
  try {
    console.log('⚙️ Isletme ayarlari kolonlari ekleniyor...');
    
    await pool.query(`
      ALTER TABLE businesses 
      ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20),
      ADD COLUMN IF NOT EXISTS welcome_message TEXT,
      ADD COLUMN IF NOT EXISTS footer_text TEXT
    `);

    console.log('✅ WhatsApp, Karşılama Mesajı ve Alt Bilgi kolonları eklendi.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

addSettingsFields();
