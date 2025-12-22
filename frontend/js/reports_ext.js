// Extensión no intrusiva: agrega gráfica al reporte de inventario
(function(){
  if (!window.Chart) return;
  let invChart;
  const ensureCanvas = () => {
    const view = document.getElementById('view');
    if (!view) return null;
    let canvas = document.getElementById('invChart');
    if (!canvas) {
      const wrap = document.createElement('div');
      const h3 = document.createElement('h3');
      h3.textContent = 'Inventario filtrado';
      canvas = document.createElement('canvas');
      canvas.id = 'invChart';
      canvas.height = 200;
      wrap.appendChild(h3);
      wrap.appendChild(canvas);
      const anchor = document.getElementById('invTable');
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(wrap, anchor.nextSibling);
      else view.appendChild(wrap);
    }
    return canvas;
  };

  const drawFromTable = () => {
    const anchor = document.getElementById('invTable');
    if (!anchor) return;
    const tbl = anchor.querySelector('table');
    if (!tbl) return;
    const ths = Array.from(tbl.querySelectorAll('thead th')).map(th => (th.textContent||'').toLowerCase());
    const trs = Array.from(tbl.querySelectorAll('tbody tr'));
    if (!ths.length || !trs.length) return;
    const idxProd = ths.indexOf('producto');
    const idxQty = ths.indexOf('cantidad');
    if (idxQty === -1) return;
    const map = new Map();
    trs.forEach(tr => {
      const tds = Array.from(tr.querySelectorAll('td'));
      const tdProd = (idxProd >= 0) ? tds[idxProd] : tds[0];
      const tdQty = tds[idxQty];
      const label = (tdProd && tdProd.textContent) ? tdProd.textContent : 'N/A';
      const qtyText = (tdQty && tdQty.textContent) ? tdQty.textContent : '0';
      const val = parseFloat(String(qtyText).replace(',', '.')) || 0;
      map.set(label, (map.get(label) || 0) + val);
    });
    const labels = Array.from(map.keys());
    const values = Array.from(map.values());
    const canvas = ensureCanvas();
    if (!canvas) return;
    if (invChart && typeof invChart.destroy === 'function') invChart.destroy();
    invChart = new Chart(canvas, { type: 'bar', data: { labels, datasets: [{ label: 'Cantidad', data: values }] } });
  };

  const wrapRefresh = () => {
    const orig = window.refreshInventoryReport;
    if (typeof orig !== 'function') return;
    window.refreshInventoryReport = async function(){
      const r = await orig.apply(this, arguments);
      try { drawFromTable(); } catch (_) {}
      return r;
    };
  };

  // Intento inicial por si ya hay tabla pintada
  try { drawFromTable(); } catch (_) {}
  // Envolver cuando charts.js registre la función
  setTimeout(wrapRefresh, 0);
})();
