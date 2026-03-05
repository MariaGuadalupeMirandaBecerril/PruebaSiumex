const express = require('express');
const { getPool } = require('../db');
const { requireAuth } = require('../auth-mw');
const DEV_FAKE = process.env.DEV_FAKE_AUTH === '1' || process.env.DEV_FAKE === 'true' || process.env.DEV_FAKE === '1';

const router = express.Router();

router.get('/dashboard/summary', requireAuth, async (_req, res) => {
  try {
    if (DEV_FAKE) {
      return res.json({
        cards: {
          procesos_totales: 42,
          piezas_totales: 1234,
          productos_registrados: 7,
          clientes_registrados: 3,
        },
        series_piezas_por_producto: [
          { producto_id: 10, piezas: 400 },
          { producto_id: 20, piezas: 300 },
          { producto_id: 30, piezas: 534 },
        ],
      });
    }
    const pool = await getPool();
    const [totalProcesses, totalPieces, totalProducts, totalClients, series] = await Promise.all([
      pool.request().query('SELECT COUNT(*) AS n FROM dbo.procesos'),
      pool.request().query('SELECT COALESCE(SUM(CAST(piezas AS FLOAT)), 0) AS s FROM dbo.procesos'),
      pool.request().query('SELECT COUNT(*) AS n FROM dbo.productos'),
      pool.request().query('SELECT COUNT(*) AS n FROM dbo.clientes'),
      pool.request().query('SELECT producto_id, COALESCE(SUM(CAST(piezas AS FLOAT)),0) AS piezas FROM dbo.procesos GROUP BY producto_id'),
    ]);
    const cards = {
      procesos_totales: Number(totalProcesses.recordset[0].n || 0),
      piezas_totales: Number(totalPieces.recordset[0].s || 0),
      productos_registrados: Number(totalProducts.recordset[0].n || 0),
      clientes_registrados: Number(totalClients.recordset[0].n || 0),
    };
    const s = (series.recordset || []).map((r) => ({ producto_id: r.producto_id, piezas: Number(r.piezas || 0) }));
    return res.json({ cards, series_piezas_por_producto: s });
  } catch (e) {
    return res.status(500).json({ error: 'DB error', detail: e.message });
  }
});

module.exports = router;
