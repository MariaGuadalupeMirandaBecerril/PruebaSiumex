// Safe, minimal stubs to avoid syntax errors and duplicate logic.
(function(){
  if (typeof window === 'undefined') return;
  // Inventory simple view (fallback)
  if (!window.loadInventoryView) {
    window.loadInventoryView = async function(){
      try {
        const data = await API.apiGet('/inventory');
        const cols = ['fecha','codigo_mr','descripcion','cantidad','producto','cliente'];
        const rows = (Array.isArray(data)?data:[]).map(r => `<tr>${cols.map(c => `<td>${typeof r[c] === 'object' ? (r[c]?.nombre || r[c]?.id || '') : (r[c] ?? '')}</td>`).join('')}</tr>`).join('');
        const view = document.getElementById('view');
        if (view) view.innerHTML = `<h2>Inventario</h2><div class="table-wrap"><table><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
      } catch(_) {}
    };
  }
  // Reports loader (fallback) — real implementation lives in reports_override.js
  if (!window.loadReports) {
    window.loadReports = async function(){
      try {
        const view = document.getElementById('view');
        if (view) view.innerHTML = '<h2>Reportes</h2><p>Cargando…</p>';
      } catch(_) {}
    };
  }
})();

