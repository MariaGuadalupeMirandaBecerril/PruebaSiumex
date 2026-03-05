const express = require('express');
const { getPool } = require('../db');
const { requireAuth, requireRole } = require('../auth-mw');

const router = express.Router();

// Mapeamos solo los datos reales que existen en la BD y en la UI
function mapClientRow(r) {
  return {
    id: r.IdClie,          // El Frontend usa 'id', lo llenamos con 'IdClie'
    idclie: r.IdClie,      // Mantenemos idclie original
    nombre: r.Nombre,
    observaciones: r.Observaciones || 'Sin observaciones', // Valor por defecto si es null
    // Eliminamos calle, cp, colonia, created_at, etc. porque no existen.
  };
}

// GET /api/clients?q=term
router.get('/clients', requireAuth, async (req, res) => {
  const term = (req.query.q || '').toString().trim();
  try {
    const pool = await getPool();
    // Seleccionamos SOLO las columnas que existen
    if (term) {
      const like = `%${term}%`;
      const result = await pool
        .request()
        .input('like', like)
        .query(
          'SELECT IdClie, Nombre, Observaciones FROM dbo.Clientes WHERE Nombre LIKE @like OR IdClie LIKE @like'
        );
      return res.json((result.recordset || []).map(mapClientRow));
    } else {
      const result = await pool
        .request()
        .query(
          'SELECT IdClie, Nombre, Observaciones FROM dbo.Clientes'
        );
      return res.json((result.recordset || []).map(mapClientRow));
    }
  } catch (e) {
    return res.status(500).json({ error: 'DB error', detail: e.message });
  }
});

// GET /api/clients/:id
router.get('/clients/:id', requireAuth, async (req, res) => {
  const id = req.params.id; // NO usar parseInt, el ID puede ser texto (ej. C-003)
  
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('id', id)
      .query(
        'SELECT IdClie, Nombre, Observaciones FROM dbo.Clientes WHERE IdClie = @id'
      );
    const row = (result.recordset || [])[0];
    if (!row) return res.status(404).json({ error: 'No encontrado' });
    return res.json(mapClientRow(row));
  } catch (e) {
    return res.status(500).json({ error: 'DB error', detail: e.message });
  }
});

// POST /api/clients
router.post('/clients', requireAuth, requireRole('Administrador'), async (req, res) => {
  const b = req.body || {};
  
  // Validamos que venga el ID y el Nombre
  if (!b.idclie || !b.nombre) {
    return res.status(400).json({ error: 'Faltan datos (IdClie o Nombre)' });
  }

  try {
    const pool = await getPool();
    // Insertamos solo las 3 columnas reales
    const ins = await pool
      .request()
      .input('idclie', b.idclie)
      .input('nombre', b.nombre)
      .input('observaciones', b.observaciones || '')
      .query(
        'INSERT INTO dbo.Clientes (IdClie, Nombre, Observaciones) OUTPUT INSERTED.IdClie VALUES (@idclie, @nombre, @observaciones)'
      );
      
    // Recuperamos lo insertado para confirmar
    const newId = (ins.recordset || [])[0]?.IdClie;
    const r2 = await pool
      .request()
      .input('id', newId)
      .query(
        'SELECT IdClie, Nombre, Observaciones FROM dbo.Clientes WHERE IdClie = @id'
      );
      
    return res.status(201).json(mapClientRow((r2.recordset || [])[0]));
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// PUT /api/clients/:id
router.put('/clients/:id', requireAuth, requireRole('Administrador'), async (req, res) => {
  const id = req.params.id;
  const b = req.body || {};
  
  // Solo permitimos editar Nombre y Observaciones (el ID usualmente no se cambia)
  const allowed = ['nombre', 'observaciones'];
  const fieldMap = { 'nombre': 'Nombre', 'observaciones': 'Observaciones' };
  
  const sets = [];
  const reqst = (await getPool()).request().input('id', id);
  
  for (const f of allowed) {
    if (b[f] !== undefined) {
      sets.push(`${fieldMap[f]} = @${f}`);
      reqst.input(f, b[f]);
    }
  }
  
  if (!sets.length) return res.status(400).json({ error: 'Sin cambios' });
  
  try {
    const upd = await reqst.query(`UPDATE dbo.Clientes SET ${sets.join(', ')} WHERE IdClie = @id`);
    
    if (upd.rowsAffected?.[0] === 0) return res.status(404).json({ error: 'No encontrado' });
    
    const r2 = await (await getPool())
      .request()
      .input('id', id)
      .query('SELECT IdClie, Nombre, Observaciones FROM dbo.Clientes WHERE IdClie = @id');
      
    return res.json(mapClientRow((r2.recordset || [])[0]));
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// DELETE /api/clients/:id
router.delete('/clients/:id', requireAuth, requireRole('Administrador'), async (req, res) => {
  const id = req.params.id;
  try {
    const del = await (await getPool())
      .request()
      .input('id', id)
      .query('DELETE FROM dbo.Clientes WHERE IdClie = @id');
      
    if (del.rowsAffected?.[0] === 0) return res.status(404).json({ error: 'No encontrado' });
    return res.json({ status: 'ok' });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

module.exports = router;