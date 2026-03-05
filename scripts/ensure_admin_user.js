// Crea o actualiza un usuario admin con hash compatible Werkzeug
const path = require('path');
const dotenv = require('dotenv');
const crypto = require('crypto');

// Cargar backend/.env
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

function werkzeugHash(pw, iterations = parseInt(process.env.WZK_ITER || '260000', 10)) {
  const saltBytes = crypto.randomBytes(16);
  const hashBytes = crypto.pbkdf2Sync(String(pw), saltBytes, iterations, 32, 'sha256');
  const saltB64 = saltBytes.toString('base64');
  const hashB64 = hashBytes.toString('base64');
  return `pbkdf2:sha256:${iterations}$${saltB64}$${hashB64}`;
}

async function main() {
  const { getPool } = require('../node-backend/db');
  const correo = process.env.ADMIN_CORREO || 'admin@local.com';
  const nombre = process.env.ADMIN_NOMBRE || 'Admin';
  const password = process.env.ADMIN_PASSWORD || 'Admin123';
  const rol = process.env.ADMIN_ROL || 'Administrador';
  const rfid = process.env.ADMIN_RFID || 'RF-ADMIN-0001';

  const pool = await getPool();
  const exists = await pool.request().input('correo', correo).query('SELECT TOP 1 id FROM dbo.usuarios WHERE correo = @correo');
  const password_hash = werkzeugHash(password);
  if ((exists.recordset || []).length > 0) {
    const id = exists.recordset[0].id;
    await pool.request().input('id', id).input('password_hash', password_hash).query('UPDATE dbo.usuarios SET password_hash=@password_hash, updated_at=SYSUTCDATETIME() WHERE id=@id');
    console.log(`Usuario actualizado: ${correo}`);
  } else {
    const ins = await pool
      .request()
      .input('rfid', rfid)
      .input('nombre', nombre)
      .input('correo', correo)
      .input('rol', rol)
      .input('password_hash', password_hash)
      .query("INSERT INTO dbo.usuarios (rfid, nombre, correo, rol, password_hash, created_at, updated_at) VALUES (@rfid, @nombre, @correo, @rol, @password_hash, SYSUTCDATETIME(), SYSUTCDATETIME())");
    console.log(`Usuario creado: ${correo}`);
  }
}

main().catch((e) => { console.error('Error:', e.message); process.exit(1); });

