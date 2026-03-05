const express = require('express');
const { getPool } = require('../db');
const { requireAuth, requireRole } = require('../auth-mw');

const router = express.Router();

function toPermRow(r) {
  let cfg = {};
  try { cfg = JSON.parse(r.config || '{}'); } catch (_) { cfg = {}; }
  return { id: r.id, nombre: r.nombre, config: cfg };
}

// GET /api/perms (Admin)
router.get('/perms', requireAuth, requireRole('Administrador'), async (_req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query('SELECT id, nombre, config FROM dbo.permarekel');
    return res.json((r.recordset || []).map(toPermRow));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// POST /api/perms (Admin)
router.post('/perms', requireAuth, requireRole('Administrador'), async (req, res) => {
  const b = req.body || {};
  const configStr = JSON.stringify(b.config || {}, null, 0);
  try {
    const pool = await getPool();
    const ins = await pool.request().input('nombre', b.nombre).input('config', configStr)
      .query('INSERT INTO dbo.permarekel (nombre, config) OUTPUT INSERTED.id, INSERTED.nombre, INSERTED.config VALUES (@nombre, @config)');
    const row = (ins.recordset || [])[0];
    return res.status(201).json(toPermRow(row));
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// GET /api/perms/:id (Admin)
router.get('/perms/:id', requireAuth, requireRole('Administrador'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'id invalido' });
  try {
    const pool = await getPool();
    const r = await pool.request().input('id', id).query('SELECT id, nombre, config FROM dbo.permarekel WHERE id = @id');
    const row = (r.recordset || [])[0];
    if (!row) return res.status(404).json({ error: 'No encontrado' });
    return res.json(toPermRow(row));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// PUT /api/perms/:id (Admin)
router.put('/perms/:id', requireAuth, requireRole('Administrador'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'id invalido' });
  const b = req.body || {};
  const reqst = (await getPool()).request().input('id', id);
  const sets = [];
  if (Object.prototype.hasOwnProperty.call(b, 'nombre')) { sets.push('nombre = @nombre'); reqst.input('nombre', b.nombre); }
  if (Object.prototype.hasOwnProperty.call(b, 'config')) { sets.push('config = @config'); reqst.input('config', JSON.stringify(b.config || {}, null, 0)); }
  if (!sets.length) return res.status(400).json({ error: 'Sin cambios' });
  try {
    const upd = await reqst.query(`UPDATE dbo.permarekel SET ${sets.join(', ')} WHERE id = @id`);
    if (upd.rowsAffected?.[0] === 0) return res.status(404).json({ error: 'No encontrado' });
    const r = await (await getPool()).request().input('id', id).query('SELECT id, nombre, config FROM dbo.permarekel WHERE id = @id');
    return res.json(toPermRow((r.recordset || [])[0]));
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// DELETE /api/perms/:id (Admin)
router.delete('/perms/:id', requireAuth, requireRole('Administrador'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'id invalido' });
  try {
    const del = await (await getPool()).request().input('id', id).query('DELETE FROM dbo.permarekel WHERE id = @id');
    if (del.rowsAffected?.[0] === 0) return res.status(404).json({ error: 'No encontrado' });
    return res.json({ status: 'ok' });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

module.exports = router;

