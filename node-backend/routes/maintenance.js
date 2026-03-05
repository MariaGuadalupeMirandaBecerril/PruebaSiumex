const express = require('express');
const { getPool } = require('../db');
const { requireAuth } = require('../auth-mw');

const router = express.Router();

async function fetchRows(sqlText) {
  const pool = await getPool();
  const r = await pool.request().query(sqlText);
  const rows = r.recordset || [];
  const columns = rows.length ? Object.keys(rows[0]) : [];
  return { columns, rows };
}

// GET /api/maintenance/procesos/peek
router.get('/maintenance/procesos/peek', requireAuth, async (_req, res) => {
  try {
    const out = {};
    out.procesos = await fetchRows('SELECT TOP 5 * FROM dbo.procesos ORDER BY id DESC');
    out.estaciones = await fetchRows('SELECT TOP 5 * FROM dbo.estaciones ORDER BY id DESC');
    out.usuarios = await fetchRows('SELECT TOP 5 * FROM dbo.usuarios ORDER BY id DESC');
    return res.json(out);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// POST /api/maintenance/procesos/ensure-relations
router.post('/maintenance/procesos/ensure-relations', requireAuth, async (_req, res) => {
  const stmts = [
    "IF COL_LENGTH('dbo.procesos','estacion_id') IS NULL ALTER TABLE dbo.procesos ADD estacion_id INT NULL;",
    "IF COL_LENGTH('dbo.procesos','usuario_id') IS NULL ALTER TABLE dbo.procesos ADD usuario_id INT NULL;",
    // FK creation guarded with try/catch blocks to avoid failing if already exist
    "BEGIN TRY ALTER TABLE dbo.procesos ADD CONSTRAINT FK_procesos_estaciones_estacion_id FOREIGN KEY(estacion_id) REFERENCES dbo.estaciones(id); END TRY BEGIN CATCH END CATCH;",
    "BEGIN TRY ALTER TABLE dbo.procesos ADD CONSTRAINT FK_procesos_usuarios_usuario_id FOREIGN KEY(usuario_id) REFERENCES dbo.usuarios(id); END TRY BEGIN CATCH END CATCH;",
    "BEGIN TRY CREATE INDEX IX_procesos_estacion_id ON dbo.procesos(estacion_id); END TRY BEGIN CATCH END CATCH;",
    "BEGIN TRY CREATE INDEX IX_procesos_usuario_id ON dbo.procesos(usuario_id); END TRY BEGIN CATCH END CATCH;",
  ];
  try {
    const pool = await getPool();
    for (const s of stmts) {
      await pool.request().query(s);
    }
    return res.json({ status: 'ok' });
  } catch (e) {
    return res.status(500).json({ status: 'error', error: e.message });
  }
});

// POST /api/maintenance/procesos/seed-relations
router.post('/maintenance/procesos/seed-relations', requireAuth, async (_req, res) => {
  try {
    const pool = await getPool();
    const estQ = await pool.request().query('SELECT TOP 1 id FROM dbo.estaciones ORDER BY id');
    const usuQ = await pool.request().query('SELECT TOP 1 id FROM dbo.usuarios ORDER BY id');
    const estId = estQ.recordset?.[0]?.id;
    const usuId = usuQ.recordset?.[0]?.id;
    if (!estId || !usuId) {
      return res.status(400).json({ status: 'skip', reason: 'Faltan registros en estaciones/usuarios' });
    }
    await pool
      .request()
      .input('est', estId)
      .input('usu', usuId)
      .query(
        `UPDATE p SET p.estacion_id = COALESCE(p.estacion_id, @est), p.usuario_id = COALESCE(p.usuario_id, @usu)
         FROM dbo.procesos p
         WHERE (p.estacion_id IS NULL OR p.usuario_id IS NULL)
         AND p.id IN (SELECT TOP 5 id FROM dbo.procesos ORDER BY id DESC)`
      );
    return res.json({ status: 'ok', estacion_id: estId, usuario_id: usuId });
  } catch (e) {
    return res.status(500).json({ status: 'error', error: e.message });
  }
});

module.exports = router;

