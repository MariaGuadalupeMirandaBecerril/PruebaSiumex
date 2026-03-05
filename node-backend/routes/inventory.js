const express = require('express');
const { getPool } = require('../db');
const { requireAuth, requireRole } = require('../auth-mw');

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
    created_at: r.prod_created_at ? new Date(r.prod_created_at).toISOString() : null,
    updated_at: r.prod_updated_at ? new Date(r.prod_updated_at).toISOString() : null,
  };
}

function mapClient(r) {
  if (!r || r.clie_id == null) return null;
  return {
    id: r.clie_id,
    idclie: r.clie_idclie,
    nombre: r.clie_nombre,
    observaciones: r.clie_observaciones,
    calle: r.clie_calle,
    num_interior: r.clie_num_interior,
    num_exterior: r.clie_num_exterior,
    colonia: r.clie_colonia,
    ciudad: r.clie_ciudad,
    estado: r.clie_estado,
    cp: r.clie_cp,
    created_at: r.clie_created_at ? new Date(r.clie_created_at).toISOString() : null,
    updated_at: r.clie_updated_at ? new Date(r.clie_updated_at).toISOString() : null,
  };
}

function mapInventoryRow(r) {
  return {
    id: r.id,
    fecha: r.fecha ? new Date(r.fecha).toISOString().slice(0, 10) : null,
    codigo_mr: r.codigo_mr,
    descripcion: r.descripcion,
    cantidad: r.cantidad != null ? Number(r.cantidad) : null,
    producto: mapProduct(r),
    cliente: mapClient(r),
  };
}

function parseDateParam(s) {
  if (!s) return null;
  const str = String(s).trim();
  // Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // Try DD/MM/YYYY -> return YYYY-MM-DD
  const m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return null;
}

const SELECT_BASE = `
SELECT i.id, i.fecha, i.codigo_mr, i.descripcion, i.cantidad,
       c.id AS clie_id, c.idclie AS clie_idclie, c.nombre AS clie_nombre, c.observaciones AS clie_observaciones,
       c.calle AS clie_calle, c.num_interior AS clie_num_interior, c.num_exterior AS clie_num_exterior,
       c.colonia AS clie_colonia, c.ciudad AS clie_ciudad, c.estado AS clie_estado, c.cp AS clie_cp,
       c.created_at AS clie_created_at, c.updated_at AS clie_updated_at,
       p.id AS prod_id, p.idprod AS prod_idprod, p.nombre AS prod_nombre, p.variable1 AS prod_v1,
       p.variable2 AS prod_v2, p.variable3 AS prod_v3, p.peso_por_pieza AS prod_pzp, p.imagen AS prod_imagen,
       p.created_at AS prod_created_at, p.updated_at AS prod_updated_at
FROM dbo.inventario i
LEFT JOIN dbo.clientes c ON c.id = i.cliente_id
LEFT JOIN dbo.productos p ON p.id = i.producto_id`;

// GET /api/inventory
router.get('/inventory', requireAuth, async (req, res) => {
  const dfrom = parseDateParam(req.query.from);
  const dto = parseDateParam(req.query.to);
  const mr = (req.query.mr || '').toString().trim();
  const term = (req.query.q || '').toString().trim();
  try {
    const pool = await getPool();
    const reqst = pool.request();
    const where = [];
    if (dfrom) { where.push('i.fecha >= @dfrom'); reqst.input('dfrom', dfrom); }
    if (dto) { where.push('i.fecha <= @dto'); reqst.input('dto', dto); }
    if (mr) { where.push('i.codigo_mr LIKE @mr'); reqst.input('mr', `%${mr}%`); }
    if (term) { where.push('i.descripcion LIKE @term'); reqst.input('term', `%${term}%`); }
    const sqlq = `${SELECT_BASE}${where.length ? ' WHERE ' + where.join(' AND ') : ''} ORDER BY i.fecha DESC`;
    const result = await reqst.query(sqlq);
    return res.json((result.recordset || []).map(mapInventoryRow));
  } catch (e) {
    return res.status(500).json({ error: 'DB error', detail: e.message });
  }
});

// GET /api/inventory/:id
router.get('/inventory/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'id invalido' });
  try {
    const pool = await getPool();
    const r = await pool.request().input('id', id).query(`${SELECT_BASE} WHERE i.id = @id`);
    const row = (r.recordset || [])[0];
    if (!row) return res.status(404).json({ error: 'No encontrado' });
    return res.json(mapInventoryRow(row));
  } catch (e) {
    return res.status(500).json({ error: 'DB error', detail: e.message });
  }
});

// POST /api/inventory
router.post('/inventory', requireAuth, requireRole('Administrador'), async (req, res) => {
  const b = req.body || {};
  function toFloat(x) { if (x === undefined || x === null || x === '') return null; const s = String(x).replace(',', '.'); const n = Number(s); return Number.isFinite(n) ? n : null; }
  function parseDateBody(s) { return parseDateParam(s); }
  try {
    const pool = await getPool();
    const ins = await pool.request()
      .input('fecha', parseDateBody(b.fecha))
      .input('codigo_mr', b.codigo_mr)
      .input('descripcion', b.descripcion)
      .input('cantidad', toFloat(b.cantidad))
      .input('producto_id', b.producto_id)
      .input('cliente_id', b.cliente_id)
      .query('INSERT INTO dbo.inventario (fecha, codigo_mr, descripcion, cantidad, producto_id, cliente_id) OUTPUT INSERTED.id VALUES (@fecha, @codigo_mr, @descripcion, @cantidad, @producto_id, @cliente_id)');
    const newId = (ins.recordset || [])[0]?.id;
    const r = await pool.request().input('id', newId).query(`${SELECT_BASE} WHERE i.id = @id`);
    return res.status(201).json(mapInventoryRow((r.recordset || [])[0]));
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// PUT /api/inventory/:id
router.put('/inventory/:id', requireAuth, requireRole('Administrador'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'id invalido' });
  const b = req.body || {};
  const reqst = (await getPool()).request().input('id', id);
  const sets = [];
  if (Object.prototype.hasOwnProperty.call(b, 'fecha')) { sets.push('fecha = @fecha'); reqst.input('fecha', parseDateParam(b.fecha)); }
  for (const f of ['codigo_mr','descripcion','producto_id','cliente_id']) {
    if (Object.prototype.hasOwnProperty.call(b, f)) { sets.push(`${f} = @${f}`); reqst.input(f, b[f]); }
  }
  if (Object.prototype.hasOwnProperty.call(b, 'cantidad')) {
    const s = String(b.cantidad ?? '');
    const n = s ? Number(s.replace(',', '.')) : null;
    sets.push('cantidad = @cantidad');
    reqst.input('cantidad', Number.isFinite(n) ? n : null);
  }
  if (!sets.length) return res.status(400).json({ error: 'Sin cambios' });
  try {
    const upd = await reqst.query(`UPDATE dbo.inventario SET ${sets.join(', ')} WHERE id = @id`);
    if (upd.rowsAffected?.[0] === 0) return res.status(404).json({ error: 'No encontrado' });
    const r = await (await getPool()).request().input('id', id).query(`${SELECT_BASE} WHERE i.id = @id`);
    return res.json(mapInventoryRow((r.recordset || [])[0]));
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// DELETE /api/inventory/:id
router.delete('/inventory/:id', requireAuth, requireRole('Administrador'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'id invalido' });
  try {
    const del = await (await getPool()).request().input('id', id).query('DELETE FROM dbo.inventario WHERE id = @id');
    if (del.rowsAffected?.[0] === 0) return res.status(404).json({ error: 'No encontrado' });
    return res.json({ status: 'ok' });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

module.exports = router;
