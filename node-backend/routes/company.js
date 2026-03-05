// node-backend/routes/company.js
var express = require('express');

// ✅ Multer opcional: si no está instalado en el hosting, NO revienta el router
var multer = null;
try {
  multer = require('multer');
} catch (e) {
  console.log('⚠️ multer NO disponible. Upload de logo deshabilitado. Detalle:', e && (e.message || e) ? (e.message || e) : e);
}

var db = require('../db');
var auth = require('../auth-mw');

var router = express.Router();
var getPool = db.getPool;
var requireAuth = auth.requireAuth;
var requireRole = auth.requireRole;

console.log('✅ LOADED ROUTE: node-backend/routes/company.js');

// Detecta mime básico por "magic bytes"
function detectMime(buf) {
  if (!buf || !buf.length) return 'application/octet-stream';
  // PNG
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47 &&
    buf[4] === 0x0D && buf[5] === 0x0A && buf[6] === 0x1A && buf[7] === 0x0A
  ) return 'image/png';
  // JPG
  if (buf.length >= 3 && buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'image/jpeg';
  // GIF
  if (buf.length >= 6 && String(buf.slice(0, 6)) === 'GIF89a') return 'image/gif';
  if (buf.length >= 6 && String(buf.slice(0, 6)) === 'GIF87a') return 'image/gif';
  // WEBP (RIFF....WEBP)
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return 'image/webp';

  return 'application/octet-stream';
}

async function ensureEmpresaRow(pool) {
  var chk = await pool.request().query('SELECT TOP 1 id FROM dbo.empresa ORDER BY id ASC');
  if (!chk.recordset || chk.recordset.length === 0) {
    // crea registro mínimo
    await pool.request().query(
      'INSERT INTO dbo.empresa (RFC,Nombre,Calle,Colonia,Ciudad,Estado,cp,Contacto,Correo,Telefono,Logotipo,updated_at) ' +
      "VALUES ('','','','','','',NULL,'','','',NULL,GETDATE())"
    );
    chk = await pool.request().query('SELECT TOP 1 id FROM dbo.empresa ORDER BY id ASC');
  }
  return chk.recordset[0].id;
}

// GET /api/company  (datos, SIN mandar binario)
router.get('/company', requireAuth, async function (_req, res) {
  try {
    var pool = await getPool();
    var r = await pool.request().query(
      'SELECT TOP 1 id, RFC, Nombre, Calle, Colonia, Ciudad, Estado, cp, Contacto, Correo, Telefono, updated_at ' +
      'FROM dbo.empresa ORDER BY id ASC'
    );

    var row = (r.recordset || [])[0];
    if (!row) {
      return res.json({
        id: null, rfc: '', nombre: '', calle: '', colonia: '', ciudad: '',
        estado: '', cp: '', contacto: '', correo: '', telefono: '', updated_at: null,
        hasLogo: false
      });
    }

    // hasLogo: solo bandera (no mandamos el binario en JSON)
    var hasLogoQ = await pool.request().query(
      'SELECT TOP 1 CASE WHEN Logotipo IS NULL THEN 0 ELSE 1 END AS hasLogo FROM dbo.empresa ORDER BY id ASC'
    );
    var hasLogo = !!((hasLogoQ.recordset || [])[0] && (hasLogoQ.recordset || [])[0].hasLogo);

    return res.json({
      id: row.id,
      rfc: row.RFC,
      nombre: row.Nombre,
      calle: row.Calle,
      colonia: row.Colonia,
      ciudad: row.Ciudad,
      estado: row.Estado,
      cp: row.cp,
      contacto: row.Contacto,
      correo: row.Correo,
      telefono: row.Telefono,
      updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : null,
      hasLogo: hasLogo
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || String(e) });
  }
});

// PUT /api/company (solo campos texto/numero, NO Logotipo)
router.put('/company', requireAuth, requireRole('Administrador'), async function (req, res) {
  var b = req.body || {};
  try {
    var pool = await getPool();
    var id = await ensureEmpresaRow(pool);

    await pool.request()
      .input('id', id)
      .input('RFC', (b.rfc || '').toString())
      .input('Nombre', (b.nombre || '').toString())
      .input('Calle', (b.calle || '').toString())
      .input('Colonia', (b.colonia || '').toString())
      .input('Ciudad', (b.ciudad || '').toString())
      .input('Estado', (b.estado || '').toString())
      .input('cp', (b.cp === '' || b.cp == null) ? null : parseInt(b.cp, 10))
      .input('Contacto', (b.contacto || '').toString())
      .input('Correo', (b.correo || '').toString())
      .input('Telefono', (b.telefono || '').toString())
      .query(
        'UPDATE dbo.empresa SET ' +
        'RFC=@RFC, Nombre=@Nombre, Calle=@Calle, Colonia=@Colonia, Ciudad=@Ciudad, Estado=@Estado, cp=@cp, ' +
        'Contacto=@Contacto, Correo=@Correo, Telefono=@Telefono, updated_at=GETDATE() ' +
        'WHERE id=@id'
      );

    return res.json({ ok: true });
  } catch (e) {
    return res.status(400).json({ error: e.message || String(e) });
  }
});

// POST /api/company/logo  (guarda VARBINARY) ✅ solo si multer existe
if (multer) {
  var upload = multer({ storage: multer.memoryStorage() });

  router.post('/company/logo', requireAuth, requireRole('Administrador'), upload.single('file'), async function (req, res) {
    try {
      if (!req.file || !req.file.buffer) return res.status(400).json({ error: 'No file provided' });

      var pool = await getPool();
      var id = await ensureEmpresaRow(pool);

      await pool.request()
        .input('id', id)
        .input('logo', req.file.buffer)
        .query('UPDATE dbo.empresa SET Logotipo=@logo, updated_at=GETDATE() WHERE id=@id');

      return res.status(201).json({ ok: true });
    } catch (e) {
      return res.status(400).json({ error: e.message || String(e) });
    }
  });
} else {
  // Para que la ruta "exista" aunque no haya multer y no rompa tu UI
  router.post('/company/logo', requireAuth, requireRole('Administrador'), function (_req, res) {
    return res.status(501).json({ error: 'Upload de logo deshabilitado: falta dependencia "multer" en el servidor (npm install multer).' });
  });
}

// GET /api/company/logo  (sirve la imagen)
router.get('/company/logo', requireAuth, async function (_req, res) {
  try {
    var pool = await getPool();
    var r = await pool.request().query('SELECT TOP 1 Logotipo FROM dbo.empresa ORDER BY id ASC');
    var row = (r.recordset || [])[0];
    var buf = row && row.Logotipo;
    if (!buf) return res.status(404).end();

    var mime = detectMime(buf);
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'no-store');
    return res.end(buf);
  } catch (e) {
    return res.status(500).json({ error: e.message || String(e) });
  }
});

module.exports = router;
