// node-backend/routes/operators.js
const express = require('express');
const { getPool } = require('../db');
const { requireAuth, requireRole } = require('../auth-mw');

const router = express.Router();

console.log('🔥 LOADED ROUTE: node-backend/routes/operators.js (PLAIN Password + GET detail)');

function mapOperatorRow(r) {
  return {
    id: r.id,
    rfid: r.Rfid,
    nombre: r.Nombre,
    estacion: r.estacion,
    estatus: r.Estatus,
    created_at: r.created_at ? new Date(r.created_at).toISOString() : null,
    updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : null,
  };
}

// GET /api/operators (lista - sin password)
router.get('/operators', requireAuth, async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT id, [Rfid], [Nombre], estacion, Estatus, created_at, updated_at
      FROM dbo.operadores
      ORDER BY id DESC
    `);
    return res.json((result.recordset || []).map(mapOperatorRow));
  } catch (e) {
    console.error('GET /operators error:', e);
    return res.status(500).json({ error: 'DB error', detail: e.message });
  }
});

// GET /api/operators/:id (detalle - SÍ password para precargar modal)
router.get('/operators/:id', requireAuth, requireRole('Administrador'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'id invalido' });

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', id)
      .query(`
        SELECT id, [Rfid], [Nombre], estacion, Estatus, created_at, updated_at, [Password]
        FROM dbo.operadores
        WHERE id = @id
      `);

    const row = (result.recordset || [])[0];
    if (!row) return res.status(404).json({ error: 'No encontrado' });

    return res.json({
      ...mapOperatorRow(row),
      password: row.Password ?? ''
    });
  } catch (e) {
    console.error('GET /operators/:id error:', e);
    return res.status(500).json({ error: 'DB error', detail: e.message });
  }
});

// POST /api/operators (crear - guarda password plano)
router.post('/operators', requireAuth, requireRole('Administrador'), async (req, res) => {
  const b = req.body || {};
  const rfid = (b.rfid || '').toString().trim();
  const nombre = (b.nombre || '').toString().trim();
  const estacion = (b.estacion || '').toString().trim();
  const password = (b.password || '').toString(); // plano

  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  if (!password) return res.status(400).json({ error: 'Contraseña requerida' });

  try {
    const pool = await getPool();
    const ins = await pool.request()
      .input('rfid', rfid || null)
      .input('nombre', nombre)
      .input('estacion', estacion || null)
      .input('password', password)
      .query(`
        INSERT INTO dbo.operadores ([Rfid], [Nombre], estacion, [Password], Estatus)
        OUTPUT
          INSERTED.id,
          INSERTED.[Rfid],
          INSERTED.[Nombre],
          INSERTED.estacion,
          INSERTED.Estatus,
          INSERTED.created_at,
          INSERTED.updated_at
        VALUES (@rfid, @nombre, @estacion, @password, 1)
      `);

    return res.status(201).json(mapOperatorRow((ins.recordset || [])[0]));
  } catch (e) {
    console.error('POST /operators error:', e);
    return res.status(400).json({ error: e.message });
  }
});

// PUT /api/operators/:id (editar - si password viene, lo actualiza; si no, lo deja)
router.put('/operators/:id', requireAuth, requireRole('Administrador'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'id invalido' });

  const b = req.body || {};

  try {
    const pool = await getPool();

    const ex = await pool.request()
      .input('id', id)
      .query('SELECT id FROM dbo.operadores WHERE id = @id');

    if (!(ex.recordset || [])[0]) return res.status(404).json({ error: 'No encontrado' });

    const sets = [];
    const reqst = pool.request().input('id', id);

    if (b.rfid !== undefined) { sets.push('[Rfid] = @rfid'); reqst.input('rfid', b.rfid || null); }
    if (b.nombre !== undefined) { sets.push('[Nombre] = @nombre'); reqst.input('nombre', b.nombre); }
    if (b.estacion !== undefined) { sets.push('estacion = @estacion'); reqst.input('estacion', b.estacion || null); }
    if (b.estatus !== undefined) { sets.push('Estatus = @estatus'); reqst.input('estatus', b.estatus); }

    // password plano solo si viene en body
    if (b.password !== undefined) {
      sets.push('[Password] = @password');
      reqst.input('password', (b.password || '').toString());
    }

    if (!sets.length) return res.status(400).json({ error: 'Sin cambios' });

    await reqst.query(`UPDATE dbo.operadores SET ${sets.join(', ')} WHERE id = @id`);

    const r = await pool.request()
      .input('id', id)
      .query(`
        SELECT id, [Rfid], [Nombre], estacion, Estatus, created_at, updated_at
        FROM dbo.operadores
        WHERE id = @id
      `);

    return res.json(mapOperatorRow((r.recordset || [])[0]));
  } catch (e) {
    console.error('PUT /operators/:id error:', e);
    return res.status(400).json({ error: e.message });
  }
});

// DELETE /api/operators/:id
router.delete('/operators/:id', requireAuth, requireRole('Administrador'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'id invalido' });

  try {
    const del = await (await getPool()).request()
      .input('id', id)
      .query('DELETE FROM dbo.operadores WHERE id = @id');

    if (del.rowsAffected?.[0] === 0) return res.status(404).json({ error: 'No encontrado' });
    return res.json({ status: 'ok' });
  } catch (e) {
    console.error('DELETE /operators/:id error:', e);
    return res.status(400).json({ error: e.message });
  }
});

module.exports = router;
