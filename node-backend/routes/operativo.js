const express = require('express');
const { getPool } = require('../db');
const { requireAuth, requireRole } = require('../auth-mw');
const DEV_FAKE = process.env.DEV_FAKE_AUTH === '1' || process.env.DEV_FAKE === 'true' || process.env.DEV_FAKE === '1';

const DEMO_ORDERS = [
  {
    id: 101,
    op: 'OP-001',
    cliente: { id: 1, idclie: 'CL001', nombre: 'Cliente Demo' },
    producto: { id: 10, idprod: 'P001', nombre: 'Producto Demo', variable1: 'Cat A', variable2: 'M', variable3: '', peso_por_pieza: 1.5, imagen: '' },
    lote: 'L-001',
    empaques: 2,
    piezas: 12,
    imagen: ''
  },
  {
    id: 102,
    op: 'OP-002',
    cliente: { id: 2, idclie: 'CL002', nombre: 'Acme' },
    producto: { id: 20, idprod: 'P002', nombre: 'Widget', variable1: 'Cat B', variable2: 'S', variable3: '', peso_por_pieza: 0.75, imagen: '' },
    lote: 'L-XYZ',
    empaques: 1,
    piezas: 6,
    imagen: ''
  }
];

const router = express.Router();

function mapProduct(r) {
  if (!r || r.prod_id == null) return null;
  return {
    id: r.prod_id,
    idprod: r.prod_idprod,
    nombre: r.prod_nombre,
    variable1: r.prod_v1,
    variable2: r.prod_v2,
    variable3: r.prod_v3,
    peso_por_pieza: r.prod_pzp != null ? Number(r.prod_pzp) : null,
    imagen: r.prod_imagen,
  };
}

function mapClient(r) {
  if (!r || r.clie_id == null) return null;
  return {
    id: r.clie_id,
    idclie: r.clie_idclie,
    nombre: r.clie_nombre,
  };
}

function mapProcessRow(r) {
  return {
    id: r.id,
    op: r.op,
    cliente: mapClient(r),
    producto: mapProduct(r),
    lote: r.lote,
    empaques: r.empaques != null ? Number(r.empaques) : null,
    piezas: r.piezas != null ? Number(r.piezas) : null,
    imagen: r.imagen,
  };
}

const SELECT_BASE = `
SELECT TOP 200 p.id, p.op, p.lote, p.empaques, p.piezas, p.imagen,
       c.id AS clie_id, c.idclie AS clie_idclie, c.nombre AS clie_nombre,
       pr.id AS prod_id, pr.idprod AS prod_idprod, pr.nombre AS prod_nombre,
       pr.variable1 AS prod_v1, pr.variable2 AS prod_v2, pr.variable3 AS prod_v3,
       pr.peso_por_pieza AS prod_pzp, pr.imagen AS prod_imagen
FROM dbo.procesos p
LEFT JOIN dbo.clientes c ON c.id = p.cliente_id
LEFT JOIN dbo.productos pr ON pr.id = p.producto_id
ORDER BY p.id DESC`;

// GET /api/operativo/orders
router.get('/operativo/orders', requireAuth, requireRole('Operador'), async (_req, res) => {
  try {
    if (DEV_FAKE) {
      return res.json(DEMO_ORDERS);
    }
    const pool = await getPool();
    const r = await pool.request().query(SELECT_BASE);
    return res.json((r.recordset || []).map(mapProcessRow));
  } catch (e) {
    return res.status(500).json({ error: 'DB error', detail: e.message });
  }
});

// GET /api/operativo/order_by_qr?qr=OP
router.get('/operativo/order_by_qr', requireAuth, requireRole('Operador'), async (req, res) => {
  const qr = (req.query.qr || '').toString().trim();
  if (!qr) return res.status(400).json({ error: 'qr requerido' });
  try {
    if (DEV_FAKE) {
      const row = DEMO_ORDERS.find(o => String(o.op).toLowerCase() === qr.toLowerCase());
      if (!row) return res.status(404).json({ error: 'No encontrado' });
      return res.json(row);
    }
    const pool = await getPool();
    const r = await pool
      .request()
      .input('op', qr)
      .query(`SELECT p.id, p.op, p.lote, p.empaques, p.piezas, p.imagen,
               c.id AS clie_id, c.idclie AS clie_idclie, c.nombre AS clie_nombre,
               pr.id AS prod_id, pr.idprod AS prod_idprod, pr.nombre AS prod_nombre,
               pr.variable1 AS prod_v1, pr.variable2 AS prod_v2, pr.variable3 AS prod_v3,
               pr.peso_por_pieza AS prod_pzp, pr.imagen AS prod_imagen
               FROM dbo.procesos p
               LEFT JOIN dbo.clientes c ON c.id = p.cliente_id
               LEFT JOIN dbo.productos pr ON pr.id = p.producto_id
               WHERE p.op = @op`);
    const row = (r.recordset || [])[0];
    if (!row) return res.status(404).json({ error: 'No encontrado' });
    return res.json(mapProcessRow(row));
  } catch (e) {
    return res.status(500).json({ error: 'DB error', detail: e.message });
  }
});

function toInt(x) { try { return x !== undefined && x !== null && x !== '' ? parseInt(x, 10) : null; } catch { return null; } }
function toFloat(x) { if (x === undefined || x === null || x === '') return null; const s = String(x).replace(',', '.'); const n = Number(s); return Number.isFinite(n) ? n : null; }

// POST /api/operativo/registrar
router.post('/operativo/registrar', requireAuth, requireRole('Operador'), async (req, res) => {
  const b = req.body || {};
  const op = (b.op || '').toString().trim();
  if (!op) return res.status(400).json({ error: 'OP requerida' });
  if (DEV_FAKE) {
    return res.status(201).json({ status: 'ok', op, process_id: 999, created: true });
  }
  const pool = await getPool();
  try {
    // Find process by op
    const existing = await pool.request().input('op', op).query('SELECT id FROM dbo.procesos WHERE op = @op');
    let pid = (existing.recordset || [])[0]?.id;
    let created = false;
    if (!pid) {
      const pidVal = toInt(b.producto_id || (b.producto || {}).id);
      const cidVal = toInt(b.cliente_id || (b.cliente || {}).id);
      if (!pidVal || !cidVal) return res.status(400).json({ error: 'Producto y Cliente requeridos para nueva OP' });
      const ins = await pool.request()
        .input('op', op)
        .input('cliente_id', cidVal)
        .input('producto_id', pidVal)
        .query('INSERT INTO dbo.procesos (op, cliente_id, producto_id) OUTPUT INSERTED.id VALUES (@op, @cliente_id, @producto_id)');
      pid = (ins.recordset || [])[0]?.id;
      created = true;
    }

    // Update fields
    const reqst = pool.request().input('id', pid);
    const sets = [];
    if (Object.prototype.hasOwnProperty.call(b, 'empaques')) { sets.push('empaques = @empaques'); reqst.input('empaques', toInt(b.empaques)); }
    if (Object.prototype.hasOwnProperty.call(b, 'piezas')) { sets.push('piezas = @piezas'); reqst.input('piezas', toFloat(b.piezas)); }
    if (Object.prototype.hasOwnProperty.call(b, 'lote')) { sets.push('lote = @lote'); reqst.input('lote', (b.lote || '').toString().trim()); }
    if (Object.prototype.hasOwnProperty.call(b, 'imagen') && b.imagen) { sets.push('imagen = @imagen'); reqst.input('imagen', b.imagen); }
    if (sets.length) await reqst.query(`UPDATE dbo.procesos SET ${sets.join(', ')} WHERE id = @id`);

    // Optional inserts into pesos/empaques/etiquetas if tables exist
    const bruto = toFloat(b.peso_bruto);
    const tara = toFloat(b.peso_tara);
    const neto = toFloat(b.peso_neto);
    const emp = toInt(b.empaques);
    const label = b.label != null ? String(b.label) : null;
    try {
      await pool.request()
        .input('op', op)
        .input('bruto', bruto)
        .input('tara', tara)
        .input('neto', neto)
        .query("IF OBJECT_ID('dbo.pesos','U') IS NOT NULL INSERT INTO dbo.pesos(op, peso_bruto, peso_tara, peso_neto) VALUES (@op, @bruto, @tara, @neto)");
      await pool.request()
        .input('op', op)
        .input('cant', emp)
        .query("IF OBJECT_ID('dbo.empaques','U') IS NOT NULL INSERT INTO dbo.empaques(op, cantidad) VALUES (@op, @cant)");
      if (label) {
        await pool.request()
          .input('op', op)
          .input('cont', label)
          .query("IF OBJECT_ID('dbo.etiquetas','U') IS NOT NULL INSERT INTO dbo.etiquetas(op, contenido) VALUES (@op, @cont)");
      }
    } catch (_) {
      // ignore optional failures
    }

    return res.status(201).json({ status: 'ok', op, process_id: pid, created });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// POST /api/operativo/print
router.post('/operativo/print', requireAuth, requireRole('Operador'), (req, res) => {
  const b = req.body || {};
  const op = (b.op || '').toString().trim();
  if (!op) return res.status(400).json({ error: 'OP requerida' });
  const producto = (b.producto || {}).nombre || '';
  const cliente = (b.cliente || {}).nombre || '';
  const lote = b.lote || '';
  const piezas = b.piezas;
  const pzp = b.pzp;
  const neto = b.peso_neto;
  const html = `<!doctype html>
<html><head><meta charset='utf-8'><title>Etiqueta ${op}</title>
<style>
body{margin:0;padding:12px;font-family:Arial,Helvetica,sans-serif;}
.lbl{width:72mm;min-height:48mm;border:1px dashed #999;padding:8px;}
.row{margin:4px 0;}
.big{font-size:18px;font-weight:700;}
.sm{font-size:12px;}
</style></head>
<body onload="window.print();setTimeout(()=>window.close(),300);">
  <div class='lbl'>
    <div class='row big'>OP: ${op}</div>
    <div class='row sm'>Cliente: ${cliente}</div>
    <div class='row sm'>Producto: ${producto}</div>
    <div class='row sm'>Lote: ${lote}</div>
    <div class='row sm'>Piezas: ${piezas} (PxP: ${pzp})</div>
    <div class='row sm'>Neto: ${neto}</div>
  </div>
</body></html>`;
  return res.json({ html });
});

module.exports = router;
