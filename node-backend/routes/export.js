// node-backend/routes/export.js (NO DEPENDENCIAS)
var express = require('express');
var db = require('../db');
var auth = require('../auth-mw');

var router = express.Router();
var getPool = db.getPool;
var requireAuth = auth.requireAuth;

console.log('✅ EXPORT ROUTE LOADED (NO-DEPS) - ' + new Date().toISOString());

router.get('/export/_alive', function (req, res) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('EXPORT_BACKEND_ALIVE_V1');
});

// Ping para confirmar versión
router.get('/export/ping', requireAuth, function (_req, res) {
  res.json({ ok: true, mode: 'no-deps', ts: new Date().toISOString() });
});

// ✅ Permitir token vía query (?token=...) SOLO para export (porque <a href> no manda headers)
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

  var str = String(s).trim();
  var ymd = /^\d{4}-\d{2}-\d{2}$/;
  if (ymd.test(str)) return str;

  // dd/mm/yyyy
  var m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return m[3] + '-' + m[2] + '-' + m[1];

  return null;
}

// ✅ Formato de fecha para PDF/Excel: YYYY-MM-DD
function formatFechaPdf(v) {
  if (v == null || v === '') return '';
  try {
    if (v instanceof Date && !isNaN(v.getTime())) return v.toISOString().slice(0, 10);

    var s = String(v).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10);

    var d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);

    var m = s.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (m) return m[1];
    return s;
  } catch (_) {
    return String(v);
  }
}

async function getInventoryRows(req) {
  var pool = await getPool();
  var reqst = pool.request();

  var dfrom = parseDate(req.query.from);
  var dto = parseDate(req.query.to);
  var mr = (req.query.mr || '').toString().trim();

  var where = [];
  if (mr) {
    where.push('pr.[op] LIKE @mr');
    reqst.input('mr', '%' + mr + '%');
  }
  if (dfrom) {
    where.push('CAST(pr.[updated_at] AS DATE) >= @dfrom');
    reqst.input('dfrom', dfrom);
  }
  if (dto) {
    where.push('CAST(pr.[updated_at] AS DATE) <= @dto');
    reqst.input('dto', dto);
  }

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
    "  ON p.[nombre] = pr.[producto] " +
    "  OR CONVERT(VARCHAR(100), p.[idprod]) = pr.[producto] " +
    (where.length ? (" WHERE " + where.join(" AND ")) : "") +
    " ORDER BY pr.[id] DESC";

  var r = await reqst.query(sql);
  return r.recordset || [];
}

// ======================================================
// ✅ EXCEL (SpreadsheetML) - SOLO inventory
// ======================================================
router.get('/export/excel', requireAuthExport, async (req, res) => {
  try {
    var kind = (req.query.kind || '').toString();
    if (kind !== 'inventory') return res.status(400).json({ error: 'Unsupported kind: ' + kind });

    var rows = await getInventoryRows(req);

    var headers = (req.query.columns || '')
      .toString()
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (!headers.length) {
      headers = Object.keys(rows[0] || {
        Folio: '', OP: '', IdClie: '', IdProd: '', Var1: '', Var2: '', Var3: '',
        Pzas: '', PxP: '', Peso: '', Lote: '', Fecha: ''
      });
    }

    var xmlEsc = (v) => String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');

    var xml = '';
    xml += '<?xml version="1.0"?>\n';
    xml += '<?mso-application progid="Excel.Sheet"?>\n';
    xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
    xml += ' xmlns:o="urn:schemas-microsoft-com:office:office"\n';
    xml += ' xmlns:x="urn:schemas-microsoft-com:office:excel"\n';
    xml += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\n';
    xml += ' xmlns:html="http://www.w3.org/TR/REC-html40">\n';
    xml += '<Worksheet ss:Name="inventory"><Table>\n';

    // Header
    xml += '<Row>';
    for (var i = 0; i < headers.length; i++) {
      xml += '<Cell><Data ss:Type="String">' + xmlEsc(headers[i]) + '</Data></Cell>';
    }
    xml += '</Row>\n';

    // Rows
    for (var r = 0; r < rows.length; r++) {
      xml += '<Row>';
      for (var c = 0; c < headers.length; c++) {
        var h = headers[c];
        var v = rows[r] ? rows[r][h] : '';

        if (String(h).toLowerCase() === 'fecha') v = formatFechaPdf(v);

        var raw = String(v == null ? '' : v).trim();
        var n = (typeof v === 'number') ? v : Number(raw.replace(',', '.'));
        var isNum = Number.isFinite(n) && raw !== '';
        var t = isNum ? 'Number' : 'String';
        var val = isNum ? String(n) : xmlEsc(v);

        xml += '<Cell><Data ss:Type="' + t + '">' + val + '</Data></Cell>';
      }
      xml += '</Row>\n';
    }

    xml += '</Table></Worksheet></Workbook>';

    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory.xls"');
    return res.send('\uFEFF' + xml);
  } catch (e) {
    console.error('❌ EXPORT EXCEL ERROR:', e && e.stack ? e.stack : e);
    return res.status(500).json({ error: e.message || String(e) });
  }
});

// ======================================================
// ✅ PDF REAL (pdfkit) - SOLO inventory
// ======================================================
var PDFDocument = require('pdfkit');

router.get('/export/pdf', requireAuthExport, async function (req, res) {
  try {
    var kind = (req.query.kind || '').toString();
    if (kind !== 'inventory') return res.status(400).json({ error: 'Unsupported kind: ' + kind });

    var rows = await getInventoryRows(req);

    // Orden fijo = como en pantalla
    var defaultCols = ['Folio','OP','IdClie','IdProd','Var1','Var2','Var3','Pzas','PxP','Peso','Lote','Fecha'];

    var columns = (req.query.columns || '')
      .toString()
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (!columns.length) columns = defaultCols;

    var filename = 'reporte_inventario_' + Date.now() + '.pdf';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
    res.setHeader('Cache-Control', 'no-store');

    // ✅ Landscape para que quepa la tabla
    var doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 24 });
    doc.pipe(res);

    // Título
    doc.font('Helvetica-Bold').fontSize(16).text('Reporte Inventario', { align: 'left' });
    doc.moveDown(0.6);

    var pageW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    var x0 = doc.page.margins.left;
    var y = doc.y;

    // ✅ Anchos por columna (aprox, estable)
    var colPct = {
      Folio: 0.05,
      OP: 0.06,
      IdClie: 0.10,
      IdProd: 0.10,
      Var1: 0.07,
      Var2: 0.07,
      Var3: 0.10,
      Pzas: 0.06,
      PxP: 0.06,
      Peso: 0.06,
      Lote: 0.07,
      Fecha: 0.10
    };

    function computeWidths(cols) {
      var widths = [];
      var used = 0;
      for (var i = 0; i < cols.length; i++) used += (colPct[cols[i]] || 0);

      var remaining = Math.max(0, 1 - used);
      var autoCols = cols.filter(c => !colPct[c]).length;
      var autoW = autoCols ? (remaining / autoCols) : 0;

      for (var j = 0; j < cols.length; j++) {
        var pct = colPct[cols[j]];
        widths.push(pageW * (pct != null ? pct : autoW));
      }

      var sum = widths.reduce((a,b)=>a+b,0);
      if (sum > 0) {
        var k = pageW / sum;
        widths = widths.map(w => w*k);
      }
      return widths;
    }

    var colW = computeWidths(columns);

    var fontSize = columns.length > 10 ? 7 : 8;
    var headerSize = columns.length > 10 ? 8 : 9;
    var rowH = columns.length > 10 ? 16 : 18;

    function drawHeader() {
      doc.font('Helvetica-Bold').fontSize(headerSize);
      var x = x0;

      for (var i = 0; i < columns.length; i++) {
        doc.rect(x, y, colW[i], rowH).stroke();
        doc.text(String(columns[i]), x + 3, y + 4, {
          width: colW[i] - 6,
          lineBreak: false,
          ellipsis: true
        });
        x += colW[i];
      }

      y += rowH;
      doc.font('Helvetica').fontSize(fontSize);
    }

    function cellText(key, rawVal) {
      var v = rawVal;
      if (String(key).toLowerCase() === 'fecha') v = formatFechaPdf(v);
      if (v == null) return '';
      return String(v);
    }

    drawHeader();

    var maxY = doc.page.height - doc.page.margins.bottom - rowH;

    for (var rr = 0; rr < rows.length; rr++) {
      if (y > maxY) {
        doc.addPage();
        y = doc.page.margins.top;
        drawHeader();
      }

      var x = x0;

      for (var cc = 0; cc < columns.length; cc++) {
        var key = columns[cc];
        var val = cellText(key, rows[rr] ? rows[rr][key] : '');

        doc.rect(x, y, colW[cc], rowH).stroke();

        doc.text(val, x + 3, y + 4, {
          width: colW[cc] - 6,
          lineBreak: false,
          ellipsis: true
        });

        x += colW[cc];
      }

      y += rowH;
    }

    doc.end();
  } catch (e) {
    console.error('❌ EXPORT PDF ERROR:', e && e.stack ? e.stack : e);
    if (!res.headersSent) return res.status(500).json({ error: e.message || String(e) });
    try { res.end(); } catch (_) {}
  }
});

// DEBUG TEMPORAL: confirma que este archivo está corriendo (quitar después)
router.get('/export/_whoami', function (_req, res) {
  res.json({ ok: true, file: 'export.js', ts: new Date().toISOString() });
});

router.get('/export/version', function (_req, res) {
  res.json({ ok: true, file: 'export.js', stamp: 'EXPORT_FIXED_PDF_EXCEL_V2' });
});

module.exports = router;
