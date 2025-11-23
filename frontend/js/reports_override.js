// Reportes de Inventario (override):
// - Filtros por cualquier campo (fecha, MR, descripción, producto, cliente, cantidad min/max)
// - Selección de columnas
// - Exportación PDF / Excel / CSV
// - Gráfica configurable (agrupar por campo y elegir métrica)
// - Sin pestaña de Proceso (según requerimiento)
(function(){
  async function refreshInventoryReport() {
    const from = document.getElementById('fromDate').value;
    const to = document.getElementById('toDate').value;
    const mr = document.getElementById('mrCode').value;
    const qp = new URLSearchParams();
    if (from) qp.set('from', from);
    if (to) qp.set('to', to);
    if (mr) qp.set('mr', mr);
    const colsSel = Array.from(document.querySelectorAll('.colchk')).filter(i => i.checked).map(i => i.value);
    if (colsSel.length) qp.set('columns', colsSel.join(','));

    const res = await API.apiGet(`/reports/inventory?${qp.toString()}`);
    const cols = res.columns || [];
    let rows = res.rows || [];

    // Filtros adicionales en cliente (por cualquier campo + rango cantidad)
    const fDesc = (document.getElementById('f_desc')?.value || '').trim().toLowerCase();
    const fMr2 = (document.getElementById('mrCode')?.value || '').trim().toLowerCase();
    const fProd = (document.getElementById('f_prod')?.value || '').trim().toLowerCase();
    const fCli = (document.getElementById('f_cli')?.value || '').trim().toLowerCase();
    const fQtyMin = parseFloat(document.getElementById('f_qty_min')?.value || '');
    const fQtyMax = parseFloat(document.getElementById('f_qty_max')?.value || '');
    rows = rows.filter(r => {
      const get = (k) => (r[k] ?? '').toString().toLowerCase();
      const okDesc = !fDesc || get('descripcion').includes(fDesc);
      const okMr = !fMr2 || get('codigo_mr').includes(fMr2);
      const okProd = !fProd || get('producto').includes(fProd);
      const okCli = !fCli || get('cliente').includes(fCli);
      const qty = Number(r['cantidad'] ?? '');
      const okMin = isNaN(fQtyMin) || (!isNaN(qty) && qty >= fQtyMin);
      const okMax = isNaN(fQtyMax) || (!isNaN(qty) && qty <= fQtyMax);
      return okDesc && okMr && okProd && okCli && okMin && okMax;
    });

    // Tabla
    const thead = `<thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>`;
    const tbody = `<tbody>${rows.map(r => `<tr>${cols.map(c => `<td>${r[c] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>`;
    const tableHtml = `<div class="table-wrap"><table>${thead}${tbody}</table></div>`;
    const tableAnchor = document.getElementById('invTable');
    if (tableAnchor) tableAnchor.innerHTML = tableHtml;

    // Resumen
    try {
      const cards = document.getElementById('rptCards');
      if (cards) {
        const setP = new Set();
        const setC = new Set();
        rows.forEach(r => { if (r.producto) setP.add(r.producto); if (r.cliente) setC.add(r.cliente); });
        cards.innerHTML = `
          <div class="card"><div class="card-title">Registros</div><div class="card-value">${rows.length}</div></div>
          <div class="card"><div class="card-title">Productos</div><div class="card-value">${setP.size}</div></div>
          <div class="card"><div class="card-title">Clientes</div><div class="card-value">${setC.size}</div></div>`;
      }
    } catch(_) {}

    // Gráfica configurable
    try {
      const grpField = (document.getElementById('chart_group')?.value || 'cliente');
      const metric = (document.getElementById('chart_metric')?.value || 'count');
      const map = new Map();
      rows.forEach(r => {
        const label = (r[grpField] ?? 'N/A') || 'N/A';
        const current = map.get(label) || 0;
        if (metric === 'sum_cantidad') {
          const val = Number(r['cantidad'] || 0) || 0;
          map.set(label, current + val);
        } else {
          map.set(label, current + 1);
        }
      });
      const labels = Array.from(map.keys());
      const values = Array.from(map.values());
      const ctx = document.getElementById('invChart');
      if (ctx && typeof Chart !== 'undefined') {
        if (window.__invChart && typeof window.__invChart.destroy === 'function') window.__invChart.destroy();
        const dsLabel = metric === 'sum_cantidad' ? 'Cantidad' : 'Registros';
        window.__invChart = new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ label: dsLabel, data: values }] } });
      }
    } catch(_) {}
  }

  function exportReport(kind) {
    const from = document.getElementById('fromDate').value;
    const to = document.getElementById('toDate').value;
    const mr = document.getElementById('mrCode').value;
    const qp = new URLSearchParams({ kind: 'inventory' });
    if (from) qp.set('from', from);
    if (to) qp.set('to', to);
    if (mr) qp.set('mr', mr);
    const base = (typeof window !== 'undefined' && window.API_BASE) || '/api';
    const endpoint = kind === 'csv' ? 'export/csv' : (kind === 'xlsx' ? 'export/excel' : 'export/pdf');
    const url = `${base}/${endpoint}?${qp.toString()}`;
    const token = localStorage.getItem('token');
    fetch(url, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
      .then(res => { if (!res.ok) return res.text().then(t=>{throw new Error(t||'Error al exportar')}); return res.blob(); })
      .then(blob => {
        const dlUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = dlUrl;
        a.download = kind === 'csv' ? 'inventory.csv' : (kind === 'xlsx' ? 'inventory.xlsx' : 'inventory.pdf');
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(dlUrl);
      })
      .catch(err => alert(err.message || 'Error al exportar'));
  }

  async function loadReports() {
    const html = `
      <div class="page-header">
        <div class="page-title">Reportes de Inventario</div>
        <div class="page-subtitle">Consulta, filtra y exporta información</div>
      </div>
      <div class="nav-pills">
        <button class="nav-pill active">Inventario</button>
      </div>
      <div class="toolbar toolbar-bar">
        <div class="filters-row">
          <div class="filter"><label>Desde</label><input type="date" id="fromDate"></div>
          <div class="filter"><label>Hasta</label><input type="date" id="toDate"></div>
          <div class="filter"><label>Código MR</label><input type="text" id="mrCode" placeholder="Código MR"></div>
          <div class="filter"><label>Descripción</label><input type="text" id="f_desc" placeholder="Descripción"></div>
          <div class="filter"><label>Producto</label><input type="text" id="f_prod" placeholder="Producto"></div>
          <div class="filter"><label>Cliente</label><input type="text" id="f_cli" placeholder="Cliente"></div>
          <div class="filter"><label>Cantidad</label>
            <div style="display:flex;gap:6px;align-items:center">
              <input type="number" id="f_qty_min" placeholder="Min" style="width:90px">
              <span>-</span>
              <input type="number" id="f_qty_max" placeholder="Max" style="width:90px">
            </div>
          </div>
          <div class="filter">
            <label>Columnas</label>
            <div>
              <label><input type="checkbox" class="colchk" value="fecha" checked> fecha</label>
              <label><input type="checkbox" class="colchk" value="codigo_mr" checked> codigo_mr</label>
              <label><input type="checkbox" class="colchk" value="descripcion" checked> descripcion</label>
              <label><input type="checkbox" class="colchk" value="cantidad" checked> cantidad</label>
              <label><input type="checkbox" class="colchk" value="producto" checked> producto</label>
              <label><input type="checkbox" class="colchk" value="cliente" checked> cliente</label>
            </div>
          </div>
          <div class="filter">
            <label>Gráfica</label>
            <div style="display:flex;gap:6px;align-items:center">
              <select id="chart_group">
                <option value="cliente" selected>cliente</option>
                <option value="producto">producto</option>
                <option value="codigo_mr">codigo_mr</option>
                <option value="fecha">fecha</option>
              </select>
              <select id="chart_metric">
                <option value="count" selected>registros (conteo)</option>
                <option value="sum_cantidad">cantidad (suma)</option>
              </select>
            </div>
          </div>
        </div>
        <div class="spacer"></div>
        <div class="actions">
          <button class="chip-btn" id="runInv">Aplicar filtros</button>
          <button class="chip-btn" id="expPdf">Exportar PDF</button>
          <button class="chip-btn success" id="expXlsx">Exportar Excel</button>
          <button class="chip-btn success" id="expCsv">Exportar CSV</button>
        </div>
      </div>
      <div id="rptCards" class="cards"></div>
      <div class="table-wrap" id="invTable"></div>
      <h3>Gráfica</h3>
      <canvas id="invChart" height="200"></canvas>
    `;
    const view = document.getElementById('view');
    view.innerHTML = html;
    document.getElementById('runInv').addEventListener('click', refreshInventoryReport);
    document.getElementById('expPdf').addEventListener('click', () => exportReport('pdf'));
    document.getElementById('expXlsx').addEventListener('click', () => exportReport('xlsx'));
    document.getElementById('expCsv').addEventListener('click', () => exportReport('csv'));
    await refreshInventoryReport();
  }

  // Public
  window.refreshInventoryReport = refreshInventoryReport;
  window.loadReports = loadReports;
})();

