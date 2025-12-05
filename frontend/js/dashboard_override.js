// Dashboard con 3 gráficas: línea (tiempo), pastel (Top 5 clientes), barras (Top 5 productos)
(function(){
  if (typeof window === 'undefined') return;

  let lineChart, pieChart, barChart;

  function destroyIfAny(inst){ try { if (inst && typeof inst.destroy === 'function') inst.destroy(); } catch(_){} }

  function toDateKey(v){
    if (!v) return 'N/A';
    try { const d = new Date(v); if (!isNaN(d)) return d.toISOString().slice(0,10); } catch(_){}
    return String(v).slice(0,10);
  }

  window.loadDashboard = async function loadDashboard() {
    const el = document.getElementById('view');
    if (!el) return;

    el.innerHTML = `
      <div class="page-header">
        <div class="page-title">Panel</div>
        <div class="page-subtitle">Resumen visual de la producción</div>
      </div>
      <div class="cards kpis" id="dashCards"></div>
      <div class="grid-3 charts-grid">
        <div class="card">
          <div class="card-title">Producción en el tiempo</div>
          <canvas id="chart_line"></canvas>
        </div>
        <div class="card">
          <div class="card-title">Top 5 clientes por producción</div>
          <canvas id="chart_pie"></canvas>
        </div>
        <div class="card">
          <div class="card-title">Top 5 productos por uso</div>
          <canvas id="chart_bar"></canvas>
        </div>
      </div>`;

    // Permitir deep-linking a secciones del panel vía hash o query (?panel=)
    let targetSection = null;
    try {
      const url = new URL(window.location.href);
      targetSection = (url.searchParams.get('panel') || (window.location.hash || '').replace('#','') || '').toLowerCase();
      // Normalizar posibles claves
      if (targetSection.startsWith('panel-')) targetSection = targetSection.slice(6);
      if (!['cards','line','pie','bar'].includes(targetSection)) targetSection = null;
    } catch(_) {}

    try {
      const res = await API.apiGet('/reports/inventory');
      const rows = (res && Array.isArray(res.rows)) ? res.rows : [];

      // Tarjetas simples
      try {
        const cards = document.getElementById('dashCards');
        if (cards){
          const setP = new Set(); const setC = new Set(); let sum = 0;
          rows.forEach(r => { if (r.producto) setP.add(r.producto); if (r.cliente) setC.add(r.cliente); const q = Number(r.cantidad||0); if (!isNaN(q)) sum += q; });
          cards.innerHTML = `
            <div class="card"><div class="card-title">Registros</div><div class="card-value">${rows.length}</div></div>
            <div class="card"><div class="card-title">Clientes</div><div class="card-value">${setC.size}</div></div>
            <div class="card"><div class="card-title">Productos</div><div class="card-value">${setP.size}</div></div>
            <div class="card"><div class="card-title">Cantidad total</div><div class="card-value">${sum}</div></div>`;
        }
      } catch(_){}

      // Serie por fecha (conteo de registros por día)
      const byDate = new Map();
      rows.forEach(r => { const k = toDateKey(r.fecha); byDate.set(k, (byDate.get(k)||0) + 1); });
      const dates = Array.from(byDate.keys()).sort();
      const dateVals = dates.map(k => byDate.get(k));

      // Top 5 clientes (suma de cantidad)
      const byClient = new Map();
      rows.forEach(r => { const k = r.cliente || 'N/A'; const v = Number(r.cantidad||0) || 0; byClient.set(k, (byClient.get(k)||0)+v); });
      const topClients = Array.from(byClient.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5);
      const cliLabels = topClients.map(x=>String(x[0]));
      const cliValues = topClients.map(x=>x[1]);

      // Top 5 productos (suma de cantidad)
      const byProd = new Map();
      rows.forEach(r => { const k = r.producto || 'N/A'; const v = Number(r.cantidad||0) || 0; byProd.set(k, (byProd.get(k)||0)+v); });
      const topProds = Array.from(byProd.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5);
      const prodLabels = topProds.map(x=>String(x[0]));
      const prodValues = topProds.map(x=>x[1]);

      // Pintar charts
      const ctxL = document.getElementById('chart_line');
      const ctxP = document.getElementById('chart_pie');
      const ctxB = document.getElementById('chart_bar');
      if (typeof Chart !== 'undefined'){
        destroyIfAny(lineChart); destroyIfAny(pieChart); destroyIfAny(barChart);
        const common = { responsive:true, maintainAspectRatio:false, layout:{ padding:0 } };
        lineChart = new Chart(ctxL, { type:'line', data:{ labels: dates, datasets:[{ label:'Registros', data: dateVals, tension:.2, fill:false }] }, options: common });
        pieChart  = new Chart(ctxP, { type:'pie',  data:{ labels: cliLabels, datasets:[{ label:'Cantidad', data: cliValues }] }, options: common });
        barChart  = new Chart(ctxB, { type:'bar',  data:{ labels: prodLabels, datasets:[{ label:'Cantidad', data: prodValues }] }, options: common });
      }

      // Si se solicitó una sección, hacer scroll y resaltar brevemente
      try {
        const idMap = { cards: 'dashCards', line: 'chart_line', pie: 'chart_pie', bar: 'chart_bar' };
        const elId = targetSection ? idMap[targetSection] : null;
        const target = elId ? document.getElementById(elId) : null;
        if (target && typeof target.scrollIntoView === 'function'){
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          const card = target.closest('.card') || target;
          const prev = card.style.boxShadow;
          card.style.boxShadow = '0 0 0 3px #3b82f6';
          setTimeout(()=>{ card.style.boxShadow = prev; }, 1200);
        }
      } catch(_) {}
    } catch(e){
      console.error(e);
      el.innerHTML = '<h2>Panel</h2><p>No fue posible cargar las gráficas.</p>';
    }
  };
})();
