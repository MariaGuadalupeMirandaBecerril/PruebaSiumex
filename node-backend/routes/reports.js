// node-backend/routes/reports.js
// Dashboard endpoints: /api/reports/*
//
// ✅ FIX PRINCIPAL: rutas de require correctas (../db, ../auth-mw)
// porque este archivo vive en node-backend/routes/

const express = require('express');
const { getPool } = require('../db');
const { requireAuth } = require('../auth-mw');

const router = express.Router();

// Marca para verificar que ESTE archivo es el que está corriendo
const REPORTS_VERSION = 'REPORTS_FIXED_V5_2026-02-16';

// Util: parse fechas (YYYY-MM-DD o DD/MM/YYYY)
function parseDate(s) {
  if (!s) return null;
  const str = String(s).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return null;
}

// ✅ Endpoint para verificar en caliente que ya quedó montado
// GET /api/reports/version
router.get('/reports/version', (_req, res) => {
  res.json({ ok: true, version: REPORTS_VERSION, ts: new Date().toISOString() });
});

// GET /api/reports/summary  (agrupa por producto y suma piezas)
router.get('/reports/summary', requireAuth, async (_req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query(
      "SELECT [producto] AS producto, COALESCE(SUM(CAST([piezas] AS FLOAT)),0) AS piezas " +
      "FROM dbo.procesos GROUP BY [producto] ORDER BY piezas DESC"
    );
    res.json((r.recordset || []).map(x => ({ producto: x.producto, piezas: Number(x.piezas || 0) })));
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

// ✅ Lo que usa tu dashboard_override.js
// GET /api/reports/inventory?mr=&from=&to=
router.get('/reports/inventory', requireAuth, async (req, res) => {
  try {
    const pool = await getPool();
    const reqst = pool.request();
    const where = [];

    const mr = (req.query.mr || '').toString().trim();
    const dfrom = parseDate(req.query.from);
    const dto = parseDate(req.query.to);

    if (mr) { where.push("pr.[op] LIKE @mr"); reqst.input('mr', `%${mr}%`); }
    if (dfrom) { where.push("CAST(pr.[updated_at] AS DATE) >= @dfrom"); reqst.input('dfrom', dfrom); }
    if (dto) { where.push("CAST(pr.[updated_at] AS DATE) <= @dto"); reqst.input('dto', dto); }

    const sql =
      "SELECT " +
      " pr.[id] AS [Folio], " +
      " pr.[op] AS [OP], " +
      " pr.[cliente] AS [IdClie], " +
      " pr.[producto] AS [IdProd], " +
      " pr.[color] AS [Var1], " +
      " pr.[tamaño] AS [Var2], " +
      " pr.[material] AS [Var3], " +
      " pr.[piezas] AS [Pzas], " +
      " COALESCE(p.[peso_por_pieza],0) AS [PxP], " +
      " ROUND(COALESCE(pr.[piezas],0) * COALESCE(p.[peso_por_pieza],0), 2) AS [Peso], " +
      " pr.[lote] AS [Lote], " +
      " CAST(pr.[updated_at] AS DATE) AS [Fecha] " +
      "FROM dbo.procesos pr " +
      "LEFT JOIN dbo.productos p " +
      "  ON p.[nombre] = pr.[producto] " +
      "  OR CONVERT(VARCHAR(100), p.[idprod]) = pr.[producto] " +
      (where.length ? (" WHERE " + where.join(" AND ")) : "") +
      " ORDER BY pr.[updated_at] DESC";

    const r = await reqst.query(sql);
    const rows = r.recordset || [];
    res.json({ columns: (rows[0] ? Object.keys(rows[0]) : []), rows });
  } catch (e) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

module.exports = router;
