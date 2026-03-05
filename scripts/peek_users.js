const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

(async () => {
  try {
    const { getPool } = require('../node-backend/db');
    const pool = await getPool();
    const r = await pool.request().query('SELECT TOP 10 id, correo, rol, password_hash FROM dbo.usuarios ORDER BY id');
    for (const row of r.recordset || []) {
      const ph = String(row.password_hash || '');
      console.log(`${row.id}\t${row.correo}\t${row.rol}\t${ph.slice(0, 32)}...`);
    }
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();

