const express = require('express');
const { getPool, sql } = require('../db');
const { requireAuth, requireRole } = require('../auth-mw');

const router = express.Router();

const SELECT_COLS = `
  id, idprod, nombre, variable1, variable2, variable3,
  peso_por_pieza, imagen, estatus, created_at, updated_at
`;

function mapProductRow(r) {
  return {
    id: r.id,
    idprod: r.idprod,
    nombre: r.nombre,
    variable1: r.variable1,
    variable2: r.variable2,
    variable3: r.variable3,
    peso_por_pieza: r.peso_por_pieza != null ? Number(r.peso_por_pieza) : null,
    imagen: r.imagen,
    estatus: r.estatus != null ? Boolean(r.estatus) : null,
    created_at: r.created_at ? new Date(r.created_at).toISOString() : null,
    updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : null,
  };
}

function toNumberOrNull(v) {
  const t = v === undefined || v === null ? '' : String(v).trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

function toBit(v) {
  return (v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'true') ? 1 : 0;
}

// GET /api/products?q=term
router.get('/products', requireAuth, async (req, res) => {
  const term = (req.query.q || '').toString().trim();
  try {
    const pool = await getPool();

    if (term) {
      // OJO: "%term%" no usa índice bien; esto es normal que sea más lento con muchos registros
      const like = `%${term}%`;
      const result = await pool
        .request()
        .input('like', sql.NVarChar(200), like)
        .query(`
          SELECT ${SELECT_COLS}
          FROM dbo.Productos
          WHERE nombre LIKE @like OR idprod LIKE @like
          ORDER BY id DESC
        `);

      return res.json((result.recordset || []).map(mapProductRow));
    }

    const result = await pool
      .request()
      .query(`
        SELECT ${SELECT_COLS}
        FROM dbo.Productos
        ORDER BY id DESC
      `);

    return res.json((result.recordset || []).map(mapProductRow));
  } catch (e) {
    return res.status(500).json({ error: 'DB error', detail: e.message });
  }
});

// GET /api/products/:id
router.get('/products/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'id invalido' });

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT ${SELECT_COLS}
        FROM dbo.Productos
        WHERE id = @id
      `);

    const row = (result.recordset || [])[0];
    if (!row) return res.status(404).json({ error: 'No encontrado' });
    return res.json(mapProductRow(row));
  } catch (e) {
    return res.status(500).json({ error: 'DB error', detail: e.message });
  }
});

// POST /api/products  (✅ 1 sola query: INSERT + OUTPUT del registro completo)
router.post('/products', requireAuth, requireRole('Administrador'), async (req, res) => {
  const b = req.body || {};

  const pesoVal = toNumberOrNull(b.peso_por_pieza);
  if (Number.isNaN(pesoVal)) return res.status(400).json({ error: 'peso_por_pieza inválido' });

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('idprod', sql.NVarChar(100), b.idprod ?? null)
      .input('nombre', sql.NVarChar(200), b.nombre ?? null)
      .input('variable1', sql.NVarChar(200), b.variable1 ?? null)
      .input('variable2', sql.NVarChar(200), b.variable2 ?? null)
      .input('variable3', sql.NVarChar(200), b.variable3 ?? null)
      .input('peso_por_pieza', sql.Decimal(18, 6), pesoVal)
      .input('imagen', sql.NVarChar(sql.MAX), b.imagen ?? null)
      .query(`
        INSERT INTO dbo.Productos (idprod, nombre, variable1, variable2, variable3, peso_por_pieza, imagen)
        OUTPUT INSERTED.${SELECT_COLS.replace(/\s+/g, ' ').trim().split(', ').join(', INSERTED.')}
        VALUES (@idprod, @nombre, @variable1, @variable2, @variable3, @peso_por_pieza, @imagen);
      `);

    const row = (result.recordset || [])[0];
    if (!row) return res.status(500).json({ error: 'No se pudo crear' });

    return res.status(201).json(mapProductRow(row));
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// PUT /api/products/:id  (✅ 1 sola query: UPDATE + OUTPUT del registro actualizado)
router.put('/products/:id', requireAuth, requireRole('Administrador'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'id invalido' });

  const b = req.body || {};
  const allowed = ['idprod', 'nombre', 'variable1', 'variable2', 'variable3', 'peso_por_pieza', 'imagen', 'estatus'];

  const sets = [];
  try {
    const pool = await getPool();
    const request = pool.request().input('id', sql.Int, id);

    for (const f of allowed) {
      if (!Object.prototype.hasOwnProperty.call(b, f)) continue;

      if (f === 'peso_por_pieza') {
        const nv = toNumberOrNull(b[f]);
        if (Number.isNaN(nv)) return res.status(400).json({ error: 'peso_por_pieza inválido' });
        sets.push(`${f} = @${f}`);
        request.input(f, sql.Decimal(18, 6), nv);
        continue;
      }

      if (f === 'estatus') {
        sets.push(`${f} = @${f}`);
        request.input(f, sql.Bit, toBit(b[f]));
        continue;
      }

      sets.push(`${f} = @${f}`);
      request.input(f, sql.NVarChar(sql.MAX), b[f] ?? null);
    }

    // Nada que actualizar → devolver actual
    if (!sets.length) {
      const r = await pool
        .request()
        .input('id', sql.Int, id)
        .query(`SELECT ${SELECT_COLS} FROM dbo.Productos WHERE id = @id`);
      const row = (r.recordset || [])[0];
      if (!row) return res.status(404).json({ error: 'No encontrado' });
      return res.json(mapProductRow(row));
    }

    // ✅ update + output en una sola query
    const result = await request.query(`
      UPDATE dbo.Productos
      SET ${sets.join(', ')}
      OUTPUT INSERTED.${SELECT_COLS.replace(/\s+/g, ' ').trim().split(', ').join(', INSERTED.')}
      WHERE id = @id;
    `);

    const row = (result.recordset || [])[0];
    if (!row) return res.status(404).json({ error: 'No encontrado' });

    return res.json(mapProductRow(row));
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// DELETE /api/products/:id
router.delete('/products/:id', requireAuth, requireRole('Administrador'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'id invalido' });

  try {
    const pool = await getPool();
    const del = await pool
      .request()
      .input('id', sql.Int, id)
      .query('DELETE FROM dbo.Productos WHERE id = @id');

    if (del.rowsAffected?.[0] === 0) return res.status(404).json({ error: 'No encontrado' });
    return res.json({ status: 'ok' });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

module.exports = router;
