const express = require('express');
const { getPool } = require('../db');
const { requireAuth } = require('../auth-mw');

const router = express.Router();

router.get('/db/ping', requireAuth, async (_req, res) => {
  try {
    const pool = await getPool();
    await pool.request().query('SELECT 1');
    return res.json({ status: 'ok', dialect: 'mssql' });
  } catch (e) {
    return res.status(500).json({ status: 'error', dialect: 'mssql', error: e.message });
  }
});

router.get('/db/tables', requireAuth, async (_req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query("SELECT TABLE_SCHEMA AS schema_name, TABLE_NAME AS table_name FROM INFORMATION_SCHEMA.TABLES ORDER BY TABLE_SCHEMA, TABLE_NAME");
    const lst = (r.recordset || []).map((x) => `${x.schema_name}.${x.table_name}`);
    return res.json(lst);
  } catch (e) {
    return res.status(500).json({ status: 'error', error: e.message });
  }
});

function ident(name) {
  if (!name) throw new Error('Empty identifier');
  if (!/^[A-Za-z0-9_.]+$/.test(name)) throw new Error(`Invalid identifier: ${name}`);
  return name.split('.').map((p) => `[${p}]`).join('.');
}

router.get('/db/peek', requireAuth, async (req, res) => {
  const tbl = (req.query.table || '').toString().trim();
  if (!tbl) return res.status(400).json({ error: "Falta parámetro 'table'" });
  let id;
  try { id = ident(tbl); } catch (e) { return res.status(400).json({ error: e.message }); }
  try {
    const pool = await getPool();
    const r = await pool.request().query(`SELECT TOP 5 * FROM ${id}`);
    const cols = r.recordset && r.recordset[0] ? Object.keys(r.recordset[0]) : [];
    const data = (r.recordset || []).map((row) => row);
    return res.json({ columns: cols, rows: data });
  } catch (e) {
    return res.status(500).json({ status: 'error', error: e.message });
  }
});

router.get('/db/auto-map', requireAuth, async (_req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query("SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS ORDER BY TABLE_SCHEMA, TABLE_NAME");
    const rows = r.recordset || [];
    const tableCols = new Map();
    for (const c of rows) {
      const key = `${c.TABLE_SCHEMA}.${c.TABLE_NAME}`;
      if (!tableCols.has(key)) tableCols.set(key, []);
      tableCols.get(key).push([c.COLUMN_NAME, (c.DATA_TYPE || '').toLowerCase()]);
    }
    const match = (name, ...tokens) => {
      const n = name.toLowerCase();
      return tokens.every((t) => n.includes(String(t).toLowerCase()));
    };
    let cardsTable = null, numCol = null, actCol = null, balInitCol = null, balCurrCol = null;
    let movsTable = null, dateCol = null, typeCol = null;
    for (const [t, cl] of tableCols.entries()) {
      const names = cl.map((x) => x[0]);
      if (names.some((c) => match(c,'tarjeta') || match(c,'card')) && names.some((c) => match(c,'saldo'))) {
        cardsTable = cardsTable || t;
        for (const [c, dt] of cl) {
          if (!numCol && (match(c,'tarjeta') || match(c,'card'))) numCol = c;
          if (!actCol && (match(c,'activa') || match(c,'activo') || match(c,'estado'))) actCol = c;
          if (!balInitCol && (match(c,'saldo','inicial') || match(c,'saldo','ini'))) balInitCol = c;
          if (!balCurrCol && (match(c,'saldo','actual') || match(c,'saldo'))) balCurrCol = c;
        }
      }
      if (names.some((c) => match(c,'mov') || match(c,'entrada') || match(c,'salida'))) {
        movsTable = movsTable || t;
        for (const [c, dt] of cl) {
          if (!dateCol && (match(c,'fecha') || (dt || '').includes('date'))) dateCol = c;
          if (!typeCol && (match(c,'tipo') || match(c,'mov'))) typeCol = c;
        }
      }
    }
    if (!cardsTable && !movsTable) return res.status(404).json({ status: 'no-match', hint: 'No se detectaron tablas candidatas' });
    const mapping = {};
    if (cardsTable) Object.assign(mapping, { MSSQL_TBL_CARDS: cardsTable, MSSQL_COL_CARD_NUMBER: numCol, MSSQL_COL_CARD_ACTIVE: actCol, MSSQL_COL_BAL_INIT: balInitCol, MSSQL_COL_BAL_CURR: balCurrCol });
    if (movsTable) Object.assign(mapping, { MSSQL_TBL_MOVS: movsTable, MSSQL_COL_MOV_DATE: dateCol, MSSQL_COL_MOV_TYPE: typeCol });
    return res.json({ status: 'ok', mapping });
  } catch (e) {
    return res.status(500).json({ status: 'error', error: e.message });
  }
});

module.exports = router;

