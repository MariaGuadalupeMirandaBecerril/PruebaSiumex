// Reportes de Inventario (vista de solo lectura, respetando estructura)
(function(){
  // Columnas esperadas según dbo.Inventario (imagen bd1.png)
  const INV_COLS = ['Folio','OP','IdClie','IdProd','Var1','Var2','Var3','Pzas','PxP','Peso','Lote','IdEst','IdUsu','Fecha'];
  // Ocultar temporalmente estas columnas en la vista
  const HIDE_COLS = new Set(['IdEst','IdUsu']);

  // Renderiza la tabla respetando columnas (en el orden indicado)
  async function refreshInventoryReport() {
    let res = { columns: [], rows: [] };
    try {
      const qp = new URLSearchParams({ columns: INV_COLS.join(',') });
      res = await API.apiGet(`/reports/inventory?${qp.toString()}`);
    } catch (e) {
      console.error('Error cargando reporte', e);
    }
    const cols = (Array.isArray(res.columns) && res.columns.length ? res.columns.slice() : INV_COLS);
    const visCols = cols.filter(c => !HIDE_COLS.has(c));
    const rows = Array.isArray(res.rows) ? res.rows : [];

    // Construcción de tabla sin transformar etiquetas ni valores
    const thead = `<thead><tr>${visCols.map(c => `<th data-key=\"${c}\">${c}</th>`).join('')}</tr></thead>`;
    const humanCols = new Set(['IdClie','IdProd','IdEst','IdUsu']);
    const norm = (k, v) => {
      if (v == null) return '';
      if (humanCols.has(k) && typeof v === 'string' && /^AUTO-/i.test(v)) return '';
      return v;
    };
    const esc = (s) => String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
    const tbody = `<tbody>${rows.map(r => `<tr>${visCols.map(c => {
      const val = norm(c, (r ? r[c] : ''));
      const txt = (val == null ? '' : String(val));
      return `<td title=\"${esc(txt)}\">${esc(txt)}</td>`;
    }).join('')}</tr>`).join('')}</tbody>`;
    // Usar estilo "pretty" para mantener celdas en una sola línea y alinear columnas
    const html = `<div class=\"table-wrap pretty readable\"><table>${thead}${tbody}</table></div>`;
    const tableAnchor = document.getElementById('invTable');
    if (tableAnchor) tableAnchor.innerHTML = html;

    return { columns: visCols, rows };
  }

  function exportReport(kind) {
    const qp = new URLSearchParams({ kind: 'inventory', columns: INV_COLS.join(',') });
    try {
      const ths = document.querySelectorAll('#invTable thead tr:first-child th[data-key]');
      const keys = Array.from(ths).map(th => th.getAttribute('data-key')).filter(Boolean);
      if (keys.length) qp.set('columns', keys.join(','));
    } catch(_) {}
    const base = (typeof window !== 'undefined' && window.API_BASE) || '/api';
    const endpoint = (kind === 'xlsx' ? 'export/excel' : 'export/pdf');
    const url = `${base}/${endpoint}?${qp.toString()}`;
    const token = localStorage.getItem('token');
    fetch(url, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
      .then(res => { if (!res.ok) return res.text().then(t=>{throw new Error(t||'Error al exportar')}); return res.blob(); })
      .then(blob => {
        const dlUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = dlUrl;
        a.download = (kind === 'xlsx' ? 'inventory.xlsx' : 'inventory.pdf');
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(dlUrl);
      })
      .catch(err => alert(err.message || 'Error al exportar'));
  }

  async function loadReports() {
    const html = `
      <div class=\"page-header\">
        <div class=\"page-title\">Reportes de Inventario</div>
        <div class=\"page-subtitle\">Vista informativa (solo lectura)</div>
      </div>
      <div class=\"toolbar toolbar-bar\">
        <div class=\"spacer\"></div>
        <div class=\"actions\">
          <button class=\"chip-btn\" id=\"expPdf\">Exportar PDF</button>
          <button class=\"chip-btn success\" id=\"expXlsx\">Exportar Excel</button>
        </div>
      </div>
      <div class=\"table-wrap\" id=\"invTable\"></div>
    `;
    const view = document.getElementById('view');
    view.innerHTML = html;
    const __pdf = document.getElementById('expPdf');
    if (__pdf) __pdf.addEventListener('click', () => exportReport('pdf'));
    const __xlsx = document.getElementById('expXlsx');
    if (__xlsx) __xlsx.addEventListener('click', () => exportReport('xlsx'));
    await refreshInventoryReport();
  }

  // Public API
  window.refreshInventoryReport = refreshInventoryReport;
  window.loadReports = loadReports;
})();
