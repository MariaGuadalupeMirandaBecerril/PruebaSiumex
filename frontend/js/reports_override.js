// Reportes de Inventario (vista solo consulta, sin extras)
(function(){
  // Column ordering and labels per objetivos.txt
  // Columnas canonicas segun objetivos.txt (orden fijo)
  const CANON_COLS = ['folio','ope','producto_id','cliente_id','piezas','peso_bruto','tara','peso_neto'];

  function pickColumns(){
    return CANON_COLS.slice(); // siempre las mismas, sin extras
  }

  function valueFor(row, col){
    const lc = String(col).toLowerCase();
    const get = (k) => row?.[k];

    // util: intenta varias claves equivalentes
    const firstOf = (keys) => {
      for (const k of keys){
        const v = get(k); if (v !== undefined && v !== null && v !== '') return v;
      }
      return undefined;
    };

    if (lc === 'folio'){
      return firstOf(['folio','id','idfolio','folio_id','folio_op']);
    }
    if (lc === 'ope'){
      return firstOf(['ope','op','orden','orden_produccion','ordenproduccion','codigo_mr','mr','ordenprod']);
    }
    if (lc === 'producto_id'){
      const v = firstOf(['producto_id','id_producto','productoId','idprod']);
      if (v !== undefined) return v;
      // Si viene objeto o nombre, extraer id si existe
      const obj = firstOf(['producto']);
      if (obj && typeof obj === 'object') return obj.id ?? obj.idprod ?? '';
      return '';
    }
    if (lc === 'cliente_id'){
      const v = firstOf(['cliente_id','id_cliente','clienteId','idclie']);
      if (v !== undefined) return v;
      const obj = firstOf(['cliente']);
      if (obj && typeof obj === 'object') return obj.id ?? obj.idclie ?? '';
      return '';
    }
    if (lc === 'piezas'){
      return firstOf(['piezas','cantidad_piezas','cantidad','qty']);
    }
    if (lc === 'peso_bruto'){
      return firstOf(['peso_bruto','pesobruto','bruto','pesoBruto']);
    }
    if (lc === 'tara'){
      return firstOf(['tara','peso_tara']);
    }
    if (lc === 'peso_neto'){
      const direct = firstOf(['peso_neto','pesoneto','neto','pesoNeto']);
      if (direct !== undefined) return direct;
      // Derivar si es posible: neto = bruto - tara
      const bruto = parseFloat(firstOf(['peso_bruto','pesobruto','bruto']) || '');
      const tara = parseFloat(firstOf(['tara','peso_tara']) || '');
      if (!isNaN(bruto) && !isNaN(tara)) return (bruto - tara).toFixed(2);
      return '';
    }
    return row?.[col] ?? '';
  }

  function labelFor(col){
    const lc = String(col).toLowerCase();
    const base = lc.includes('.') ? lc.split('.').pop() : lc;
    const pretty = {
      folio: 'Folio', id: 'Folio', idfolio: 'Folio',
      ope: 'OPE', op: 'OPE', orden: 'OPE', orden_produccion: 'OPE', ordenproduccion: 'OPE',
      producto_id: 'ID Producto', id_producto: 'ID Producto', idprod: 'ID Producto', id_producto_fk: 'ID Producto',
      cliente_id: 'ID Cliente', id_cliente: 'ID Cliente', idclie: 'ID Cliente', id_cliente_fk: 'ID Cliente',
      piezas: 'Piezas', cantidad_piezas: 'Piezas',
      peso_bruto: 'Peso Bruto', pesobruto: 'Peso Bruto', bruto: 'Peso Bruto',
      tara: 'Tara',
      peso_neto: 'Peso Neto', pesoneto: 'Peso Neto', neto: 'Peso Neto',
    };
    return pretty[base] || col;
  }

  async function refreshInventoryReport() {
    const from = document.getElementById('fromDate')?.value || '';
    const to = document.getElementById('toDate')?.value || '';
    const qp = new URLSearchParams();
    if (from) qp.set('from', from);
    if (to) qp.set('to', to);

    let res = { columns: [], rows: [] };
    try {
      res = await API.apiGet(`/reports/inventory?${qp.toString()}`);
    } catch (e) {
      // Aunque falle el backend, mostrar tabla vacía con encabezados
      console.error('Error cargando reporte', e);
    }
    let rows = Array.isArray(res.rows) ? res.rows : [];
    const cols = pickColumns();

    // Filtro global (buscar por cualquier campo)
    const fAny = (document.getElementById('f_any')?.value || '').trim().toLowerCase();
    if (fAny) {
      rows = rows.filter(r => Object.values(r).some(v => ((v ?? '') + '').toLowerCase().includes(fAny)));
    }

    // Se removieron los filtros por encabezado (solo vista de tabla)

    // Ordenar por Folio ascendente (si existe), en su defecto por OPE ascendente
    try {
      const toNum = (v) => {
        if (v === undefined || v === null) return NaN;
        const m = String(v).match(/(\d+(?:\.\d+)?)/);
        return m ? parseFloat(m[1]) : (parseFloat(v) || NaN);
      };
      rows = rows.slice().sort((a,b) => {
        const fa = toNum(valueFor(a,'folio'));
        const fb = toNum(valueFor(b,'folio'));
        if (!isNaN(fa) && !isNaN(fb)) return fa - fb;
        const oa = toNum(valueFor(a,'ope'));
        const ob = toNum(valueFor(b,'ope'));
        if (!isNaN(oa) && !isNaN(ob)) return oa - ob;
        const sa = String(valueFor(a,'folio') ?? '').toLowerCase();
        const sb = String(valueFor(b,'folio') ?? '').toLowerCase();
        return sa.localeCompare(sb);
      });
    } catch(_) {}

    // Render tabla (solo encabezado)
    const thead = `<thead><tr>${cols.map(c => `<th data-key=\"${c}\">${labelFor(c)}</th>`).join('')}</tr></thead>`;
    const tbody = `<tbody>${rows.map(r => `<tr>${cols.map(c => `<td>${valueFor(r,c) ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>`;
    const html = `<div class="table-wrap"><table>${thead}${tbody}</table></div>`;
    const tableAnchor = document.getElementById('invTable');
    if (tableAnchor) tableAnchor.innerHTML = html;

    // Sin filtros por columna

    return { columns: cols, rows };
  }

  function exportReport(kind) {
    const from = document.getElementById('fromDate')?.value || '';
    const to = document.getElementById('toDate')?.value || '';
    const qp = new URLSearchParams({ kind: 'inventory' });
    if (from) qp.set('from', from);
    if (to) qp.set('to', to);
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
      <div class="page-header">
        <div class="page-title">Reportes de Inventario</div>
        <div class="page-subtitle">Vista de consulta con filtros</div>
      </div>
      <div class="toolbar toolbar-bar">
        <div class="filters-row">
          <div class="filter"><label>Desde</label><input type="date" id="fromDate"></div>
          <div class="filter"><label>Hasta</label><input type="date" id="toDate"></div>
          <div class="filter"><label>Buscar</label><input type="text" id="f_any" placeholder="Cualquier campo"></div>
        </div>
        <div class="spacer"></div>
        <div class="actions">
          <button class="chip-btn" id="expPdf">Exportar PDF</button>
          <button class="chip-btn success" id="expXlsx">Exportar Excel</button>
        </div>
      </div>
      <div class="table-wrap" id="invTable"></div>
    `;
    const view = document.getElementById('view');
    view.innerHTML = html;
    // Botones de exportación
    document.getElementById('expPdf')?.addEventListener('click', () => exportReport('pdf'));
    document.getElementById('expXlsx')?.addEventListener('click', () => exportReport('xlsx'));
    // Filtros: ejecutar al cambiar fecha o escribir búsqueda
    document.getElementById('fromDate')?.addEventListener('change', refreshInventoryReport);
    document.getElementById('toDate')?.addEventListener('change', refreshInventoryReport);
    document.getElementById('f_any')?.addEventListener('input', refreshInventoryReport);
    // Cargar tabla inicial
    await refreshInventoryReport();
  }

  // Public
  window.refreshInventoryReport = refreshInventoryReport;
  window.loadReports = loadReports;
})();
