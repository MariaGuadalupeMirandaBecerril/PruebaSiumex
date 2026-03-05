// node-backend/routes/users.js
const path = require('path');
const fs = require('fs');
const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const { getPool } = require('../db');
const { requireAuth, requireRole } = require('../auth-mw');

const router = express.Router();

// Debug para asegurar que ESTE archivo es el que se está cargando
console.log('🔥 LOADED ROUTE: node-backend/routes/users.js (fixed)');

// Helper: BD -> JSON
function mapUserRow(r) {
  return {
    id: r.IdUsu,            // INT IDENTITY
    rfid: r.Rfid,           // en tu BD es "Rfid"
    nombre: r.Nombre,
    apellido: r.Apellido,
    correo: r.Correo,
    rol: r.Tipo,            // en tu BD es "Tipo"
    estatus: r.Estatus
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /api/users
router.get('/users', requireAuth, async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(
      'SELECT IdUsu, [Rfid], Nombre, Apellido, Correo, Tipo, Estatus FROM dbo.Usuarios'
    );
    return res.json((result.recordset || []).map(mapUserRow));
  } catch (e) {
    return res.status(500).json({ error: 'DB error', detail: e.message });
  }
});

// GET /api/users/:id  (IdUsu es INT)
router.get('/users/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'id invalido' });

  try {
    const pool = await getPool();
    const result = await pool.request().input('id', id).query(
      'SELECT IdUsu, [Rfid], Nombre, Apellido, Correo, Tipo, Estatus FROM dbo.Usuarios WHERE IdUsu = @id'
    );
    const row = (result.recordset || [])[0];
    if (!row) return res.status(404).json({ error: 'No encontrado' });
    return res.json(mapUserRow(row));
  } catch (e) {
    return res.status(500).json({ error: 'DB error', detail: e.message });
  }
});

// POST /api/users (Admin crea usuario)
// IMPORTANTÍSIMO: NO insertar IdUsu. SQL lo genera (IDENTITY).
router.post('/users', requireAuth, requireRole('Administrador'), async (req, res) => {
  const b = req.body || {};

  const correo = (b.correo || '').toString().trim();
  const nombre = (b.nombre || '').toString().trim();
  const apellido = (b.apellido || '').toString().trim();
  const password = (b.password || '').toString();
  const rol = (b.rol || 'Operador').toString().trim();

  // RFID opcional: tu columna Rfid es nvarchar, puedes guardar RF-XXXX
  const rfid =
    (b.rfid || '').toString().trim() ||
    ('RF-' + crypto.randomBytes(4).toString('hex').toUpperCase());

  if (!nombre || !password) return res.status(400).json({ error: 'Nombre y password requeridos' });
  if (correo && !EMAIL_RE.test(correo)) return res.status(400).json({ error: 'correo invalido' });

  try {
    const pool = await getPool();

    // Correo único (si aplica)
    if (correo) {
      const exists = await pool.request().input('correo', correo).query(
        'SELECT COUNT(1) AS c FROM dbo.Usuarios WHERE Correo = @correo'
      );
      if ((exists.recordset || [])[0]?.c > 0) {
        return res.status(400).json({ error: 'Correo ya registrado' });
      }
    }

    // Tu BD guarda Contraseña en nvarchar (si fuera corta, recortamos)
    const passToSave = password.substring(0, 30);

    const ins = await pool.request()
      .input('rfid', rfid)
      .input('nombre', nombre)
      .input('apellido', apellido)
      .input('correo', correo || null)
      .input('tipo', rol)
      .input('pass', passToSave)
      .query(`
        INSERT INTO dbo.Usuarios ([Rfid], Nombre, Apellido, Correo, Tipo, [Contraseña], Estatus)
        OUTPUT INSERTED.IdUsu
        VALUES (@rfid, @nombre, @apellido, @correo, @tipo, @pass, 1)
      `);

    const newId = (ins.recordset || [])[0]?.IdUsu;

    const r = await pool.request().input('id', newId).query(
      'SELECT IdUsu, [Rfid], Nombre, Apellido, Correo, Tipo, Estatus FROM dbo.Usuarios WHERE IdUsu = @id'
    );

    return res.status(201).json(mapUserRow((r.recordset || [])[0]));
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// PUT /api/users/:id (Admin edita)
router.put('/users/:id', requireAuth, requireRole('Administrador'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'id invalido' });

  const b = req.body || {};
  if (b.correo && !EMAIL_RE.test(String(b.correo))) return res.status(400).json({ error: 'correo invalido' });

  try {
    const pool = await getPool();

    const ex = await pool.request().input('id', id).query('SELECT IdUsu FROM dbo.Usuarios WHERE IdUsu = @id');
    if (!(ex.recordset || [])[0]) return res.status(404).json({ error: 'No encontrado' });

    const sets = [];
    const reqst = pool.request().input('id', id);

    // JSON -> Columnas reales
    if (b.rfid !== undefined) { sets.push('[Rfid] = @rfid'); reqst.input('rfid', b.rfid); }
    if (b.nombre !== undefined) { sets.push('Nombre = @nombre'); reqst.input('nombre', b.nombre); }
    if (b.apellido !== undefined) { sets.push('Apellido = @apellido'); reqst.input('apellido', b.apellido); }
    if (b.correo !== undefined) { sets.push('Correo = @correo'); reqst.input('correo', b.correo || null); }
    if (b.rol !== undefined) { sets.push('Tipo = @tipo'); reqst.input('tipo', b.rol); }
    if (b.estatus !== undefined) { sets.push('Estatus = @estatus'); reqst.input('estatus', b.estatus); }

    if (b.password) {
      sets.push('[Contraseña] = @pass');
      reqst.input('pass', String(b.password).substring(0, 30));
    }

    if (!sets.length) return res.status(400).json({ error: 'Sin cambios' });

    await reqst.query(`UPDATE dbo.Usuarios SET ${sets.join(', ')} WHERE IdUsu = @id`);

    const r = await pool.request().input('id', id).query(
      'SELECT IdUsu, [Rfid], Nombre, Apellido, Correo, Tipo, Estatus FROM dbo.Usuarios WHERE IdUsu = @id'
    );
    return res.json(mapUserRow((r.recordset || [])[0]));
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// DELETE /api/users/:id
router.delete('/users/:id', requireAuth, requireRole('Administrador'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'id invalido' });

  try {
    const del = await (await getPool()).request().input('id', id).query(
      'DELETE FROM dbo.Usuarios WHERE IdUsu = @id'
    );
    if (del.rowsAffected?.[0] === 0) return res.status(404).json({ error: 'No encontrado' });
    return res.json({ status: 'ok' });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// PUT /api/profile (self)
router.put('/profile', requireAuth, async (req, res) => {
  const u = req.user || {};
  const id = parseInt(u.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Token invalido: id' });

  const b = req.body || {};
  if (b.correo && !EMAIL_RE.test(String(b.correo))) return res.status(400).json({ error: 'correo invalido' });

  try {
    const pool = await getPool();
    const sets = [];
    const reqst = pool.request().input('id', id);

    if (b.nombre !== undefined) { sets.push('Nombre = @nombre'); reqst.input('nombre', b.nombre); }
    if (b.apellido !== undefined) { sets.push('Apellido = @apellido'); reqst.input('apellido', b.apellido); }
    if (b.correo !== undefined) { sets.push('Correo = @correo'); reqst.input('correo', b.correo || null); }
    if (b.password) { sets.push('[Contraseña] = @pass'); reqst.input('pass', String(b.password).substring(0, 30)); }

    if (!sets.length) {
      const r0 = await pool.request().input('id', id).query(
        'SELECT IdUsu, [Rfid], Nombre, Apellido, Correo, Tipo, Estatus FROM dbo.Usuarios WHERE IdUsu = @id'
      );
      return res.json(mapUserRow((r0.recordset || [])[0]));
    }

    await reqst.query(`UPDATE dbo.Usuarios SET ${sets.join(', ')} WHERE IdUsu = @id`);

    const r = await pool.request().input('id', id).query(
      'SELECT IdUsu, [Rfid], Nombre, Apellido, Correo, Tipo, Estatus FROM dbo.Usuarios WHERE IdUsu = @id'
    );
    return res.json(mapUserRow((r.recordset || [])[0]));
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// GET /api/profile
router.get('/profile', requireAuth, (req, res) => {
  return res.json(req.user || {});
});

// -------------- FOTO PERFIL (uploads locales) --------------
const UPLOAD_DIR = path.resolve(__dirname, '..', 'uploads');
try { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); } catch (_) {}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const u = req.user || {};
    const safeId = String(u.id || '').replace(/[^a-zA-Z0-9]/g, '_');
    const ext = path.extname(file.originalname || '').toLowerCase() || '.png';

    // borrar previa
    try {
      const files = fs.readdirSync(UPLOAD_DIR);
      for (const f of files) {
        if (f.startsWith(`profile_${safeId}.`)) fs.unlinkSync(path.join(UPLOAD_DIR, f));
      }
    } catch (_) {}

    cb(null, `profile_${safeId}${ext}`);
  },
});

const upload = multer({ storage });

router.get('/profile/photo', requireAuth, (req, res) => {
  const u = req.user || {};
  const safeId = String(u.id || '').replace(/[^a-zA-Z0-9]/g, '_');
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    const match = files.find((f) => f.startsWith(`profile_${safeId}.`));
    if (!match) return res.json({ foto: null });
    return res.json({ foto: `/uploads/${match}` });
  } catch (_e) {
    return res.json({ foto: null });
  }
});

router.post('/profile/photo', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });
  return res.status(201).json({ foto: `/uploads/${req.file.filename}` });
});

module.exports = router;
