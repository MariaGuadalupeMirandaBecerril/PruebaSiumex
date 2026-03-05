// node-backend/routes/export.js  (NO DEPENDENCIAS)
var express = require('express');
var db = require('../db');
var auth = require('../auth-mw');

var router = express.Router();
var getPool = db.getPool;
var requireAuth = auth.requireAuth;

console.log('✅ EXPORT ROUTE LOADED (NO-DEPS) - ' + new Date().toISOString());

// Ping para confirmar versión
router.get('/export/ping', requireAuth, function (_req, res) {
  res.json({ ok: true, mode: 'no-deps', ts: new Date().toISOString() });
});

// ✅ Permitir token vía query (?token=...) SOLO para export (porque window.open no manda headers)
function requireAuthExport(req, res, next) {
  try {
    var qtok = (req.query.token || req.query.access_token || '').toString().trim();

    if (qtok) {
      // Variante Bearer
      if (!req.headers.authorization) req.headers.authorization = 'Bearer ' + qtok;

      // Variantes comunes
      if (!req.headers['x-access-token']) req.headers['x-access-token'] = qtok;
      if (!req.headers['token']) req.headers['token'] = qtok;
    }
  } catch (_) {}

  return requireAuth(req, res, next);
}

function parseDate(s) {
  if (!s) return null;
  var ymd = /^\d{4}-\d{2}-\d{2}$/;
  if (ymd.test(String(s))) return String(s);

  var m = String(s).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return m[3] + '-' + m[2] + '-' + m[1];

  return null;
}

function escapeCsv(v) {
  if (v == null) return '';
  var s = String(v);
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    s = '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function escapeHtml(v) {
  if (v == null) return '';
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function getInventoryRows(req) {
  var pool = await getPool();
  var reqst = pool.request();

  var dfrom = parseDate(req.query.from);
  var dto = parseDate(req.query.to);
  var mr = (req.query.mr || '').toString().trim();

  var where = [];
  if (mr) { where.push('pr.[op] LIKE @mr'); reqst.input('mr', '%' + mr + '%'); }
  if (dfrom) { where.push('CAST(pr.[updated_at] AS DATE) >= @dfrom'); reqst.input('dfrom', dfrom); }
  if (dto) { where.push('CAST(pr.[updated_at] AS DATE) <= @dto'); reqst.input('dto', dto); }

  var sql =
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
    "  ON p.[nombre] = pr.[producto] " +                       // ✅ FIX: nombre
    "  OR CONVERT(VARCHAR(100), p.[idprod]) = pr.[producto] " +// ✅ por si producto guarda id
    (where.length ? (" WHERE " + where.join(" AND ")) : "") +
    " ORDER BY pr.[id] DESC";

  var r = await reqst.query(sql);
  return r.recordset || [];
}

// GET /api/export/excel
router.get('/export/excel', requireAuthExport, async (req, res) => {
  try {
    const kind = (req.query.kind || '').toString();
    if (kind !== 'inventory') return res.status(400).json({ error: 'Unsupported kind: ' + kind });

    const rows = await getInventoryRows(req);

    let headers = (req.query.columns || '')
      .toString()
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (!headers.length) headers = Object.keys(rows[0] || {});

    const xmlEsc = (v) => String(v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');

    let xml = '';
    xml += '<?xml version="1.0"?>\n';
    xml += '<?mso-application progid="Excel.Sheet"?>\n';
    xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
    xml += ' xmlns:o="urn:schemas-microsoft-com:office:office"\n';
    xml += ' xmlns:x="urn:schemas-microsoft-com:office:excel"\n';
    xml += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\n';
    xml += ' xmlns:html="http://www.w3.org/TR/REC-html40">\n';
    xml += `<Worksheet ss:Name="inventory"><Table>\n`;

    // Header
    xml += '<Row>';
    for (const h of headers) {
      xml += `<Cell><Data ss:Type="String">${xmlEsc(h)}</Data></Cell>`;
    }
    xml += '</Row>\n';

    // Rows
    for (const row of rows) {
      xml += '<Row>';
      for (const h of headers) {
        const v = row[h];
        if (v === null || v === undefined) {
          xml += '<Cell><Data ss:Type="String"></Data></Cell>';
          continue;
        }
        const n = (typeof v === 'number') ? v : Number(String(v).replace(',', '.'));
        const isNum = Number.isFinite(n) && String(v).trim() !== '';
        const t = isNum ? 'Number' : 'String';
        const val = isNum ? String(n) : xmlEsc(v);
        xml += `<Cell><Data ss:Type="${t}">${val}</Data></Cell>`;
      }
      xml += '</Row>\n';
    }

    xml += '</Table></Worksheet></Workbook>';

    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory.xls"');
    return res.send('\uFEFF' + xml);
  } catch (e) {
    return res.status(500).json({ error: e.message || String(e) });
  }
});



function formatFechaPdf(v) {
  if (!v) return '';
  // Si viene como Date real o string parseable
  try {
    var d = new Date(v);
    if (!isNaN(d.getTime())) {
      var yyyy = d.getFullYear();
      var mm = String(d.getMonth() + 1).padStart(2, '0');
      var dd = String(d.getDate()).padStart(2, '0');
      return yyyy + '-' + mm + '-' + dd; // 2026-02-08
    }
  } catch (_) {}

  // Si viene como string raro, recorta y quita saltos
  return String(v).replace(/\s+/g, ' ').trim().slice(0, 10);
}

// /api/export/pdf => HTML imprimible (Imprimir -> Guardar como PDF)
router.get('/export/pdf', requireAuthExport, async function (req, res) {
  try {
    var kind = (req.query.kind || '').toString();
    if (kind !== 'inventory') return res.status(400).json({ error: 'Unsupported kind: ' + kind });

    var rows = await getInventoryRows(req);

    // Si no hay datos, igual devolvemos tabla con encabezados "base"
    var fallbackCols = ['Folio','OP','IdClie','IdProd','Var1','Var2','Var3','Pzas','PxP','Peso','Lote','Fecha'];

    var columns = (req.query.columns || '').toString().split(',').map(s => s.trim()).filter(Boolean);
    if (!columns.length) columns = Object.keys(rows[0] || {});
    if (!columns.length) columns = fallbackCols;

    // Etiquetas "bonitas" (si quieres dejar igual que en pantalla, edítalas aquí)
    var labels = {
      Folio: 'Folio',
      OP: 'OP',
      IdClie: 'Cliente',
      IdProd: 'Producto',
      Var1: 'Var 1',
      Var2: 'Var 2',
      Var3: 'Var 3',
      Pzas: 'Pzas',
      PxP: 'Px/Pza',
      Peso: 'Peso',
      Lote: 'Lote',
      Fecha: 'Fecha'
    };

    // Anchos por columna (A4 landscape). Ajusta si deseas.
    var widths = {
      Folio: '4.5%',
      OP: '7%',
      IdClie: '12%',
      IdProd: '12%',
      Var1: '8%',
      Var2: '8%',
      Var3: '10%',
      Pzas: '6%',
      PxP: '6%',
      Peso: '6%',
      Lote: '7%',
      Fecha: '11.5%'
    };

    function fmtDate(val) {
      if (val == null || val === '') return '';
      // Date object
      try {
        if (val instanceof Date) {
          return val.toISOString().slice(0, 10);
        }
      } catch (_) {}
      var s = String(val).trim();
      // ISO 2026-02-08...
      var m = s.match(/\b(\d{4}-\d{2}-\d{2})\b/);
      if (m) return m[1];
      // DD/MM/YYYY
      var m2 = s.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/);
      if (m2) return (m2[3] + '-' + m2[2] + '-' + m2[1]);
      // JS Date string "Sun Feb 08 2026 ..."
      try {
        var d = new Date(s);
        if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
      } catch (_) {}
      // fallback corto
      return s.length > 20 ? s.slice(0, 20) : s;
    }

    function fmtCell(col, val) {
      if (val == null) return '';
      // formateo robusto de fecha aunque venga como Date o string largo
      var lc = String(col).toLowerCase();
      if (lc === 'fecha' || lc.includes('date') || lc.includes('updated')) return fmtDate(val);
      return String(val);
    }

    var colgroup = '<colgroup>' + columns.map(function(c){
      return '<col style="width:' + (widths[c] || 'auto') + '">';
    }).join('') + '</colgroup>';

    var th = columns.map(function(c){
      var label = labels[c] || c;
      return '<th>' + escapeHtml(label) + '</th>';
    }).join('');

    var trs = (rows || []).map(function(r){
      var tds = columns.map(function(c){
        var v = fmtCell(c, r ? r[c] : '');
        var cls = '';
        if (c === 'Pzas' || c === 'PxP' || c === 'Peso' || c === 'Folio') cls = 'num';
        if (c === 'Fecha' || c === 'OP' || c === 'Lote') cls = (cls ? cls + ' ' : '') + 'nowrap';
        return '<td class="' + cls + '">' + escapeHtml(v) + '</td>';
      }).join('');
      return '<tr>' + tds + '</tr>';
    }).join('');

    var gen = new Date();
    var genStr = gen.toISOString().slice(0, 19).replace('T',' ');

    var html =
`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<title>Reporte Inventario</title>
<style>
  @page { size: A4 landscape; margin: 10mm; }
  * { box-sizing: border-box; }
  body{font-family: Arial, sans-serif; padding:12px; color:#111; -webkit-print-color-adjust: exact; print-color-adjust: exact;}
  h2{margin:0 0 10px 0; font-size:18px;}
  .meta{margin:0 0 10px 0; font-size:10px; color:#555;}
  table{border-collapse:collapse; width:100%; font-size:10px; table-layout:fixed;}
  thead{display: table-header-group;} /* ✅ headers visibles en PDF */
  th,td{border:1px solid #333; padding:4px 6px; text-align:left; vertical-align:top; line-height:1.2; color:#000;}
  th{background:#efefef; font-weight:700; white-space:nowrap;}
  td{overflow:hidden; text-overflow:ellipsis; overflow-wrap:anywhere; word-break:break-word;}
  td.num{text-align:right; font-variant-numeric: tabular-nums;}
  td.nowrap{white-space:nowrap;}
  tr{page-break-inside:avoid;}
  @media print { button { display:none; } }
</style>
</head>
<body>
  <button onclick="window.print()">Imprimir / Guardar como PDF</button>
  <h2>Reporte Inventario</h2>
  <div class="meta">Generado: ${genStr} · Filas: ${(rows||[]).length}</div>
  <table>
    ${colgroup}
    <thead><tr>${th}</tr></thead>
    <tbody>${trs}</tbody>
  </table>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

// DEBUG TEMPORAL: confirma que este archivo está corriendo (quitar después)
router.get('/export/_whoami', function (_req, res) {
  res.json({ ok: true, file: 'export.js', ts: new Date().toISOString() });
});


module.exports = router;
