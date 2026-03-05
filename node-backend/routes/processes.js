// node-backend/routes/processes.js
var express = require('express');
var db = require('../db');
var auth = require('../auth-mw');

var router = express.Router();
var getPool = db.getPool;
var sql = db.sql;
var requireAuth = auth.requireAuth;
var requireRole = auth.requireRole;

console.log('🔥 LOADED ROUTE: node-backend/routes/processes.js (JOIN clientes/productos)');

// ✅ SELECT con JOIN para traer NOMBRES aunque procesos guarde CODIGOS
// - procesos.cliente  suele guardar idclie (ej: "CLI-01")
// - procesos.producto suele guardar idprod (ej: "12")
var SELECT_BASE =
  "SELECT " +
  "  p.[id], p.[op], p.[cliente]  AS cliente_idclie, p.[producto] AS producto_idprod, " +
  "  p.[color], p.[tamaño], p.[material], p.[empaques], p.[piezas], p.[lote], p.[imagen], p.[updated_at], " +
  "  c.[nombre] AS cliente_nombre, " +
  "  pr.[nombre] AS producto_nombre " +
  "FROM dbo.procesos p " +
  "LEFT JOIN dbo.Clientes  c  ON c.[idclie] = p.[cliente] " +
  // por seguridad: a veces producto se guarda como id o como idprod, intentamos ambos como texto
  "LEFT JOIN dbo.Productos pr ON (CAST(pr.[id] AS NVARCHAR(50)) = CAST(p.[producto] AS NVARCHAR(50)) " +
  "                            OR CAST(pr.[idprod] AS NVARCHAR(50)) = CAST(p.[producto] AS NVARCHAR(50))) ";

function mapProcessRow(r) {
  var cliCode = r.cliente_idclie != null ? String(r.cliente_idclie) : null;
  var prodCode = r.producto_idprod != null ? String(r.producto_idprod) : null;

  return {
    id: r.id,
    op: r.op,

    // ✅ ahora SIEMPRE vendrá nombre si existe en join
    cliente: cliCode
      ? { id: null, idclie: cliCode, nombre: r.cliente_nombre || cliCode }
      : null,

    producto: prodCode
      ? { id: null, idprod: prodCode, nombre: r.producto_nombre || prodCode, peso_por_pieza: null, imagen: null }
      : null,

    variable1: r.color || null,
    variable2: (r['tamaño'] !== undefined ? r['tamaño'] : null),
    variable3: r.material || null,

    empaques: r.empaques != null ? Number(r.empaques) : null,
    piezas: r.piezas != null ? Number(r.piezas) : null,
    lote: r.lote || null,

    imagen: r.imagen || null,
    created_at: null,
    updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : null
  };
}

// GET /api/processes y alias /api/production
router.get(['/processes', '/production'], requireAuth, function (_req, res) {
  getPool()
    .then(function (pool) {
      return pool.request().query(SELECT_BASE + " ORDER BY p.[updated_at] DESC");
    })
    .then(function (r) {
      res.json((r.recordset || []).map(mapProcessRow));
    })
    .catch(function (e) {
      res.status(500).json({ error: 'DB error', detail: (e && e.message) ? e.message : String(e) });
    });
});

// GET /api/processes/:id y alias
router.get(['/processes/:id', '/production/:id'], requireAuth, function (req, res) {
  var id = parseInt(req.params.id, 10);
  if (!isFinite(id)) return res.status(400).json({ error: 'id invalido' });

  getPool()
    .then(function (pool) {
      return pool.request().input('id', id).query(SELECT_BASE + " WHERE p.[id] = @id");
    })
    .then(function (r) {
      var row = (r.recordset || [])[0];
      if (!row) return res.status(404).json({ error: 'No encontrado' });
      res.json(mapProcessRow(row));
    })
    .catch(function (e) {
      res.status(500).json({ error: 'DB error', detail: (e && e.message) ? e.message : String(e) });
    });
});

// POST /api/processes y alias /api/production
router.post(['/processes', '/production'], requireAuth, requireRole('Administrador'), function (req, res) {
  var b = req.body || {};

  // ✅ la UI manda cliente_id/producto_id (pero ahora serán idclie / idprod)
  var clienteCode =
    (b.cliente_id != null && String(b.cliente_id).trim() !== '' ? String(b.cliente_id).trim() : null) ||
    b.IdClie || b.idclie || (b.cliente && b.cliente.idclie) || null;

  var productoCode =
    (b.producto_id != null && String(b.producto_id).trim() !== '' ? String(b.producto_id).trim() : null) ||
    b.IdProd || b.idprod || (b.producto && b.producto.idprod) || null;

  var color = (b.variable1 !== undefined ? b.variable1 : b.color) || null;
  var tamano = (b.variable2 !== undefined ? b.variable2 : (b['tamaño'] !== undefined ? b['tamaño'] : b.tamano)) || null;
  var material = (b.variable3 !== undefined ? b.variable3 : b.material) || null;

  var empaques = (b.empaques !== undefined && b.empaques !== '' && b.empaques !== null) ? Number(b.empaques) : null;
  var piezas = (b.piezas !== undefined && b.piezas !== '' && b.piezas !== null) ? Number(String(b.piezas).replace(',', '.')) : null;

  var imagen = (b.imagen !== undefined ? b.imagen : null);

  getPool()
    .then(function (pool) {
      return pool.request()
        .input('op', b.op || null)
        .input('cliente', clienteCode)
        .input('producto', productoCode)
        .input('color', color)
        .input('tamano', tamano)
        .input('material', material)
        .input('empaques', empaques)
        .input('piezas', piezas)
        .input('lote', b.lote || null)
        .input('imagen', imagen)
        .query(
          "INSERT INTO dbo.procesos ([op],[cliente],[producto],[color],[tamaño],[material],[empaques],[piezas],[lote],[imagen],[updated_at]) " +
          "OUTPUT INSERTED.[id] " +
          "VALUES (@op,@cliente,@producto,@color,@tamano,@material,@empaques,@piezas,@lote,@imagen,GETDATE())"
        );
    })
    .then(function (ins) {
      var newId = (ins.recordset || [])[0] && (ins.recordset || [])[0].id;
      return getPool().then(function (pool) {
        return pool.request().input('id', newId).query(SELECT_BASE + " WHERE p.[id]=@id");
      });
    })
    .then(function (r) {
      res.status(201).json(mapProcessRow((r.recordset || [])[0]));
    })
    .catch(function (e) {
      res.status(400).json({ error: (e && e.message) ? e.message : String(e) });
    });
});

// PUT /api/processes/:id y alias
router.put(['/processes/:id', '/production/:id'], requireAuth, requireRole('Administrador'), function (req, res) {
  var id = parseInt(req.params.id, 10);
  if (!isFinite(id)) return res.status(400).json({ error: 'id invalido' });

  var b = req.body || {};
  var sets = [];
  var values = {};

  function add(col, param, val) {
    sets.push("[" + col + "]=@" + param);
    values[param] = val;
  }

  if (Object.prototype.hasOwnProperty.call(b, 'op')) add('op', 'op', b.op);

  // ✅ aceptar cliente_id/producto_id (idclie/idprod)
  if (Object.prototype.hasOwnProperty.call(b, 'cliente_id')) {
    var cli = (b.cliente_id == null || String(b.cliente_id).trim() === '') ? null : String(b.cliente_id).trim();
    add('cliente', 'cliente', cli);
  }
  if (Object.prototype.hasOwnProperty.call(b, 'producto_id')) {
    var prod = (b.producto_id == null || String(b.producto_id).trim() === '') ? null : String(b.producto_id).trim();
    add('producto', 'producto', prod);
  }

  if (Object.prototype.hasOwnProperty.call(b, 'variable1') || Object.prototype.hasOwnProperty.call(b, 'color')) {
    add('color', 'color', (b.variable1 !== undefined ? b.variable1 : b.color) || null);
  }

  if (Object.prototype.hasOwnProperty.call(b, 'variable2') || Object.prototype.hasOwnProperty.call(b, 'tamaño') || Object.prototype.hasOwnProperty.call(b, 'tamano')) {
    add('tamaño', 'tamano', (b.variable2 !== undefined ? b.variable2 : (b['tamaño'] !== undefined ? b['tamaño'] : b.tamano)) || null);
  }

  if (Object.prototype.hasOwnProperty.call(b, 'variable3') || Object.prototype.hasOwnProperty.call(b, 'material')) {
    add('material', 'material', (b.variable3 !== undefined ? b.variable3 : b.material) || null);
  }

  if (Object.prototype.hasOwnProperty.call(b, 'empaques')) add('empaques', 'empaques', (b.empaques === '' || b.empaques == null) ? null : Number(b.empaques));
  if (Object.prototype.hasOwnProperty.call(b, 'piezas')) add('piezas', 'piezas', (b.piezas === '' || b.piezas == null) ? null : Number(String(b.piezas).replace(',', '.')));
  if (Object.prototype.hasOwnProperty.call(b, 'lote')) add('lote', 'lote', b.lote);

  if (Object.prototype.hasOwnProperty.call(b, 'imagen')) add('imagen', 'imagen', b.imagen || null);

  add('updated_at', 'upd', new Date());

  if (!sets.length) return res.status(400).json({ error: 'Sin cambios' });

  getPool()
    .then(function (pool) {
      var reqst = pool.request().input('id', id);
      Object.keys(values).forEach(function (k) { reqst.input(k, values[k]); });

      var q =
        "UPDATE dbo.procesos SET " +
        sets.map(function (s) { return s === "[updated_at]=@upd" ? "[updated_at]=GETDATE()" : s; }).join(", ") +
        " WHERE [id]=@id; SELECT @@ROWCOUNT AS affected;";

      return reqst.query(q);
    })
    .then(function (u) {
      var aff = (u.recordset || [])[0] ? (u.recordset || [])[0].affected : 0;
      if (!aff) return res.status(404).json({ error: 'No encontrado' });

      return getPool().then(function (pool) {
        return pool.request().input('id', id).query(SELECT_BASE + " WHERE p.[id]=@id");
      }).then(function (r) {
        res.json(mapProcessRow((r.recordset || [])[0]));
      });
    })
    .catch(function (e) {
      res.status(400).json({ error: (e && e.message) ? e.message : String(e) });
    });
});

// DELETE
router.delete(['/processes/:id', '/production/:id'], requireAuth, requireRole('Administrador'), function (req, res) {
  var id = parseInt(req.params.id, 10);
  if (!isFinite(id)) return res.status(400).json({ error: 'id invalido' });

  getPool()
    .then(function (pool) {
      return pool.request().input('id', id).query(
        "DELETE FROM dbo.procesos WHERE [id]=@id; SELECT @@ROWCOUNT AS affected;"
      );
    })
    .then(function (r) {
      var aff = (r.recordset || [])[0] ? (r.recordset || [])[0].affected : 0;
      if (!aff) return res.status(404).json({ error: 'No encontrado' });
      res.json({ status: 'ok' });
    })
    .catch(function (e) {
      res.status(400).json({ error: (e && e.message) ? e.message : String(e) });
    });
});

module.exports = router;
