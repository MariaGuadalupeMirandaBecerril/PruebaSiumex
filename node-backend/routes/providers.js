const express = require('express');
const { getPool } = require('../db');
const { requireAuth, requireRole } = require('../auth-mw');

const router = express.Router();

function mapProviderRow(r) {
  return {
    id: r.id,
    idprov: r.idprov,
    nombre: r.nombre,
    observaciones: r.observaciones,
    created_at: r.created_at ? new Date(r.created_at).toISOString() : null,
    updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : null,
  };
}

// GET /api/providers?q=term
router.get('/providers', requireAuth, async (req, res) => {
  const term = (req.query.q || '').toString().trim();
  try {
    const pool = await getPool();
    if (term) {
      const like = `%${term}%`;
      const result = await pool
        .request()
        .input('like', like)
        .query(
          'SELECT id, idprov, nombre, observaciones, created_at, updated_at FROM dbo.proveedores WHERE nombre LIKE @like OR idprov LIKE @like'
        );
      return res.json((result.recordset || []).map(mapProviderRow));
    } else {
      const result = await pool
        .request()
        .query('SELECT id, idprov, nombre, observaciones, created_at, updated_at FROM dbo.proveedores');
      return res.json((result.recordset || []).map(mapProviderRow));
    }
  } catch (e) {
    return res.status(500).json({ error: 'DB error', detail: e.message });
  }
});

// GET /api/providers/:id
router.get('/providers/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'id invalido' });
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', id)
      .query('SELECT id, idprov, nombre, observaciones, created_at, updated_at FROM dbo.proveedores WHERE id = @id');
    const row = (result.recordset || [])[0];
    if (!row) return res.status(404).json({ error: 'No encontrado' });
    return res.json(mapProviderRow(row));
  } catch (e) {
    return res.status(500).json({ error: 'DB error', detail: e.message });
  }
});

// POST /api/providers
router.post('/providers', requireAuth, requireRole('Administrador'), async (req, res) => {
  const b = req.body || {};
  try {
    const pool = await getPool();
    const ins = await pool
      .request()
      .input('idprov', b.idprov)
      .input('nombre', b.nombre)
      .input('observaciones', b.observaciones)
      .query('INSERT INTO dbo.proveedores (idprov, nombre, observaciones) OUTPUT INSERTED.id VALUES (@idprov, @nombre, @observaciones)');
    const newId = (ins.recordset || [])[0]?.id;
    const r2 = await pool
      .request()
      .input('id', newId)
      .query('SELECT id, idprov, nombre, observaciones, created_at, updated_at FROM dbo.proveedores WHERE id = @id');
    return res.status(201).json(mapProviderRow((r2.recordset || [])[0]));
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// PUT /api/providers/:id
router.put('/providers/:id', requireAuth, requireRole('Administrador'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'id invalido' });
  const b = req.body || {};
  const allowed = ['idprov', 'nombre', 'observaciones'];
  const sets = [];
  const reqst = (await getPool()).request().input('id', id);
  for (const f of allowed) {
    if (Object.prototype.hasOwnProperty.call(b, f)) {
      sets.push(`${f} = @${f}`);
      reqst.input(f, b[f]);
    }
  }
  if (!sets.length) return res.status(400).json({ error: 'Sin cambios' });
  try {
    const upd = await reqst.query(`UPDATE dbo.proveedores SET ${sets.join(', ')} WHERE id = @id`);
    if (upd.rowsAffected?.[0] === 0) return res.status(404).json({ error: 'No encontrado' });
    const r2 = await (await getPool())
      .request()
      .input('id', id)
      .query('SELECT id, idprov, nombre, observaciones, created_at, updated_at FROM dbo.proveedores WHERE id = @id');
    return res.json(mapProviderRow((r2.recordset || [])[0]));
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// DELETE /api/providers/:id
router.delete('/providers/:id', requireAuth, requireRole('Administrador'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'id invalido' });
  try {
    const del = await (await getPool())
      .request()
      .input('id', id)
      .query('DELETE FROM dbo.proveedores WHERE id = @id');
    if (del.rowsAffected?.[0] === 0) return res.status(404).json({ error: 'No encontrado' });
    return res.json({ status: 'ok' });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

module.exports = router;
