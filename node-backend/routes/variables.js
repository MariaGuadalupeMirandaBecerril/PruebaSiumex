const express = require('express');
const { getPool } = require('../db');
const { requireAuth, requireRole } = require('../auth-mw');

const router = express.Router();

// GET /api/variables (Administrador)
router.get('/variables', requireAuth, requireRole('Administrador'), async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .query('SELECT TOP 1 id, variable_prov1, variable_prov2, variable_prov3, variable_clie1, variable_clie2, variable_clie3 FROM dbo.variables ORDER BY id');
    const row = (result.recordset || [])[0];
    return res.json(row || {});
  } catch (e) {
    return res.status(500).json({ error: 'DB error', detail: e.message });
  }
});

module.exports = router;

// PUT /api/variables (Administrador)
router.put('/variables', requireAuth, requireRole('Administrador'), async (req, res) => {
  const b = req.body || {};
  const fields = [
    'variable_prov1',
    'variable_prov2',
    'variable_prov3',
    'variable_clie1',
    'variable_clie2',
    'variable_clie3',
  ];
  try {
    const pool = await getPool();
    // ensure one row exists
    const chk = await pool.request().query('SELECT TOP 1 id FROM dbo.variables ORDER BY id');
    if (!chk.recordset || chk.recordset.length === 0) {
      // insert empty row first
      await pool.request().query('INSERT INTO dbo.variables (variable_prov1, variable_prov2, variable_prov3, variable_clie1, variable_clie2, variable_clie3) VALUES (NULL, NULL, NULL, NULL, NULL, NULL)');
    }
    // update first row
    const setClauses = [];
    const reqst = pool.request();
    for (const f of fields) {
      if (Object.prototype.hasOwnProperty.call(b, f)) {
        setClauses.push(`${f} = @${f}`);
        reqst.input(f, b[f]);
      }
    }
    if (setClauses.length) {
      await reqst.query(`UPDATE TOP (1) dbo.variables SET ${setClauses.join(', ')}`);
    }
    const out = await pool
      .request()
      .query('SELECT TOP 1 id, variable_prov1, variable_prov2, variable_prov3, variable_clie1, variable_clie2, variable_clie3 FROM dbo.variables ORDER BY id');
    return res.json(out.recordset[0] || {});
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});
