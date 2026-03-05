const jwt = require('jsonwebtoken');
const { getPool } = require('./db');
const DEV_FAKE = process.env.DEV_FAKE_AUTH === '1' || process.env.DEV_FAKE === 'true' || process.env.DEV_FAKE === '1';

async function requireAuth(req, res, next) {
  const auth = req.headers['authorization'] || '';
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  try {
    const token = auth.slice('Bearer '.length);
    const secret = process.env.SECRET_KEY || process.env.JWT_SECRET || 'change-me-secret';
    
    try {
      const payload = jwt.verify(token, secret);
      // DEV: modo sin BD para pruebas locales
      if (DEV_FAKE) {
        if (!payload || !payload.id) throw new Error('invalid');
        req.user = {
          id: payload.id,
          rfid: payload.rfid || null,
          nombre: payload.nombre || (payload.rol === 'Operador' ? 'Operador Demo' : 'Admin Demo'),
          rol: payload.rol || 'Administrador',
        };
        return next();
      }
      // Validamos que el payload tenga el id (que ahora es IdUsu)
      if (!payload || !payload.id) throw new Error('invalid');

      const pool = await getPool();
      
      // CORRECCIÓN: Usamos IdUsu, RfId y Tipo que son los nombres reales de tu tabla
      // Eliminamos correo, created_at y updated_at porque no están en tu BD
      const r = await pool.request()
        .input('id', payload.id)
        .query('SELECT IdUsu, RfId, Nombre, Tipo, Rol FROM dbo.Usuarios WHERE IdUsu = @id');
      
      const row = (r.recordset || [])[0];
      if (!row) throw new Error('notfound');

      // Mapeamos al objeto req.user con los nombres que espera el resto de la app
      req.user = {
        id: row.IdUsu,
        rfid: row.RfId,
        nombre: row.Nombre,
        rol: String(row.Rol || row.Tipo || '').trim(), // normaliza rol
      };
      
      return next();
    } catch (_e) {
      // Si hay error de SQL aquí, lo veremos en el log de iisnode
      return res.status(401).json({ error: 'Token invalido o expirado' });
    }
  } catch (e) {
    return res.status(401).json({ error: 'No autorizado' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    const u = req.user;
    if (!u) return res.status(401).json({ error: 'No autorizado' });
    // Esta parte ya funciona porque mapeamos row.Tipo a u.rol arriba
    if (role && String(u.rol || '').toLowerCase() !== String(role).toLowerCase()) {
      return res.status(403).json({ error: 'Permiso denegado' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
