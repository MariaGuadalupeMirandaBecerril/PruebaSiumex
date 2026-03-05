// Visual-only theme for Chart.js to match Premium Dark
(function(){
  try{
    if (typeof Chart === 'undefined') return;
    const isLight = document.body.classList.contains('light');
    Chart.defaults.responsive = true;
    Chart.defaults.maintainAspectRatio = false;
    Chart.defaults.color = isLight ? '#0b1220' : '#cbd5e1';
    Chart.defaults.font = Chart.defaults.font || {};
    Chart.defaults.font.family = 'Inter, system-ui, Segoe UI, Roboto, Arial';
    Chart.defaults.plugins = Chart.defaults.plugins || {};
    // Merge without overwriting default legend methods (e.g., generateLabels)
    Chart.defaults.plugins.legend = Chart.defaults.plugins.legend || {};
    Chart.defaults.plugins.legend.labels = Object.assign({}, Chart.defaults.plugins.legend.labels || {}, { color: Chart.defaults.color });
    // Prefer legend at bottom for pies/donuts (XY charts hide legend anyway)
    if (!Chart.defaults.plugins.legend.position) Chart.defaults.plugins.legend.position = 'bottom';
    // Safe default scales (strings only, no scriptables/resolvers)
    Chart.defaults.scale = Chart.defaults.scale || {};
    Chart.defaults.scale.grid = Object.assign({ color: 'rgba(255,255,255,0.06)' }, Chart.defaults.scale.grid||{});
    Chart.defaults.scale.ticks = Object.assign({ color: '#94a3b8' }, Chart.defaults.scale.ticks||{});
    // Merge tooltip defaults (do not replace entire object)
    Chart.defaults.plugins.tooltip = Object.assign({}, Chart.defaults.plugins.tooltip || {}, {
      backgroundColor: isLight ? 'rgba(15,23,42,.92)' : 'rgba(15,23,42,.92)',
      titleColor: '#e5e7eb',
      bodyColor: '#cbd5e1',
      borderWidth: 1,
      borderColor: 'rgba(148,163,184,.22)',
      padding: 10,
      displayColors: false,
    });

    // Reusable theme options (strings only)
    window.optionsTheme = {
      xy: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(15,23,42,.92)',
            titleColor: '#e5e7eb',
            bodyColor: '#cbd5e1',
            borderWidth: 1,
            borderColor: 'rgba(148,163,184,.22)',
            padding: 10,
            displayColors: false
          }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#94a3b8' } },
          y: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#94a3b8' } }
        }
      },
      pie: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#cbd5e1' } },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(15,23,42,.92)',
            titleColor: '#e5e7eb',
            bodyColor: '#cbd5e1',
            borderWidth: 1,
            borderColor: 'rgba(148,163,184,.22)',
            padding: 10,
            displayColors: false
          }
        }
      }
    };

    // Premium styling per chart type
    // Pastel-neon palette (contrasting yet soft)
    const pastelNeon = [
      '#93c5fd', // soft blue
      '#a78bfa', // pastel purple
      '#22d3ee', // neon cyan
      '#34d399', // mint green
      '#f472b6', // pastel pink
      '#fbbf24', // warm amber
      '#60a5fa', // blue
      '#10b981'  // vibrant green
    ];
    const premiumSkin = {
      id: 'premiumSkin',
      beforeUpdate(chart) {
        try{
          const t = chart.config.type;
          const area = chart.chartArea; if (!area) return;
          const ctx = chart.ctx;
          // Do not mutate chart.options here to avoid re-resolve loops
          if (t === 'line') {
            chart.data.datasets.forEach((ds)=>{
              if (ds._styled) return;
              ds.tension = ds.tension ?? 0.35;
              ds.pointRadius = ds.pointRadius ?? 0;
              ds.borderWidth = ds.borderWidth ?? 2;
              ds.borderColor = ds.borderColor || '#60a5fa';
              ds.fill = true;
              const g = ctx.createLinearGradient(0, area.top, 0, area.bottom);
              g.addColorStop(0, 'rgba(96,165,250,.35)');
              g.addColorStop(1, 'rgba(124,58,237,.08)');
              ds.backgroundColor = ds.backgroundColor || g;
              ds._styled = true;
            });
          } else if (t === 'bar') {
            chart.data.datasets.forEach((ds)=>{
              if (ds._styled) return;
              // Wider bars, rounded tops, turquoise→neon-green gradient
              ds.borderRadius = ds.borderRadius ?? 12;
              ds.borderSkipped = ds.borderSkipped ?? 'bottom';
              ds.maxBarThickness = ds.maxBarThickness ?? 46;
              const g = ctx.createLinearGradient(0, area.top, 0, area.bottom);
              g.addColorStop(0, '#06b6d4');   // turquoise
              g.addColorStop(1, '#22c55e');   // neon green
              ds.backgroundColor = ds.backgroundColor || g;
              ds._styled = true;
            });
            // Avoid mutating chart.options here to prevent resolver recursion
          } else if (t === 'pie' || t === 'doughnut') {
            chart.data.datasets.forEach((ds)=>{
              if (ds._styled) return;
              ds.borderWidth = ds.borderWidth ?? 0;
              ds.backgroundColor = ds.backgroundColor || pastelNeon;
              ds.hoverOffset = ds.hoverOffset ?? 6;
              ds._styled = true;
            });
            // Avoid mutating chart.options (cutout/legend) here
          }
        }catch(_){ }
      }
    };

    if (window.usePremiumCharts === true) {
      Chart.register(premiumSkin);
    }
    // Additional visual polish with non-intrusive tweaks
    const luxSkin = {
      id: 'luxSkin',
      beforeUpdate(chart){
        try{
          const t = chart.config && chart.config.type;
          const area = chart.chartArea; if (!area) return;
          const ctx = chart.ctx;
          if (t === 'line'){
            (chart.data.datasets||[]).forEach(function(ds){
              if (ds._styledLux) return;
              ds.tension = ds.tension ?? 0.35;
              ds.pointRadius = 0;
              ds.pointHoverRadius = ds.pointHoverRadius ?? 4;
              ds.pointHitRadius = ds.pointHitRadius ?? 10;
              ds.borderWidth = ds.borderWidth ?? 2;
              ds.borderColor = ds.borderColor || '#60a5fa';
              ds.fill = true;
              const g = ctx.createLinearGradient(0, area.top, 0, area.bottom);
              g.addColorStop(0, 'rgba(96,165,250,.32)');
              g.addColorStop(1, 'rgba(96,165,250,0)');
              ds.backgroundColor = ds.backgroundColor || g;
              ds._styledLux = true;
            });
          } else if (t === 'bar'){
            (chart.data.datasets||[]).forEach(function(ds){
              if (ds._styledLux) return;
              ds.borderRadius = ds.borderRadius ?? 10;
              ds.borderSkipped = ds.borderSkipped ?? 'bottom';
              ds.maxBarThickness = ds.maxBarThickness ?? 46;
              ds.barPercentage = ds.barPercentage ?? 0.82;
              ds.categoryPercentage = ds.categoryPercentage ?? 0.72;
              const g = ctx.createLinearGradient(0, area.top, 0, area.bottom);
              g.addColorStop(0, '#60a5fa');
              g.addColorStop(1, '#1e3a8a');
              ds.backgroundColor = ds.backgroundColor || g;
              ds.borderColor = ds.borderColor || '#1e3a8a';
              ds._styledLux = true;
            });
          } else if (t === 'pie' || t === 'doughnut'){
            (chart.data.datasets||[]).forEach(function(ds){
              if (ds._styledLux) return;
              ds.borderWidth = ds.borderWidth ?? 2;
              ds.borderColor = ds.borderColor || 'rgba(15,23,42,.85)';
              ds._styledLux = true;
            });
          }
        }catch(_){ }
      },
      afterDatasetsDraw(chart){
        try{
          if (!chart || chart.config.type !== 'line') return;
          const ctx = chart.ctx; if (!ctx) return;
          const metas = (chart.data.datasets||[]).map((_,i)=>chart.getDatasetMeta(i)).filter(Boolean);
          ctx.save();
          ctx.shadowColor = 'rgba(96,165,250,.45)';
          ctx.shadowBlur = 8;
          metas.forEach(function(m){ try{ m.dataset && m.dataset.draw && m.dataset.draw(ctx); }catch(_){ } });
          ctx.restore();
        }catch(_){ }
      }
    };
    if (window.usePremiumCharts === true) {
      Chart.register(luxSkin);
    }
  }catch(_){ }
})();

// Ensure dashboard chart cards use internal container structure
(function(){
  try{
    // Patch loadDashboard to restructure DOM after render without changing layout
    var orig = window.loadDashboard;
    window.loadDashboard = async function(){
      if (typeof orig === 'function') await orig();
      try{
        var view = document.getElementById('view');
        if (!view) return;
        var cards = view.querySelectorAll('.charts-grid .card');
        cards.forEach(function(card){
          // tag the card
          card.classList.add('chartCard');
          // header wrapper
          var title = card.querySelector(':scope > .card-title');
          if (title && !card.querySelector(':scope > .chartHeader')){
            var header = document.createElement('div');
            header.className = 'chartHeader';
            card.insertBefore(header, title);
            header.appendChild(title);
          }
          // container wrapper
          var canvas = card.querySelector(':scope > canvas');
          if (canvas && !card.querySelector(':scope > .chartContainer')){
            var container = document.createElement('div');
            container.className = 'chartContainer';
            card.appendChild(container);
            container.appendChild(canvas);
            // If a chart already exists on this canvas, trigger a resize after DOM move
            try {
              if (typeof Chart !== 'undefined' && Chart.getChart) {
                var ch = Chart.getChart(canvas) || Chart.getChart(canvas.id);
                if (ch && typeof ch.resize === 'function') ch.resize();
              }
            } catch(_){}
          }
          // Do not add the 'Monthly' header chip (match 2223.png)
        });

        // Apply reusable optionsTheme to charts if available (disabled to avoid conflicts)
        // try{
        //   if (typeof Chart !== 'undefined' && Chart.getChart && window.optionsTheme){
        //     function applyXY(ch){ if(!ch) return; ch.options = ch.options || {}; Object.assign(ch.options, window.optionsTheme.xy); ch.update('none'); }
        //     function applyPie(ch){ if(!ch) return; ch.options = ch.options || {}; Object.assign(ch.options, window.optionsTheme.pie); ch.update('none'); }
        //     var l = Chart.getChart('chart_line') || Chart.getChart(document.getElementById('chart_line'));
        //     var b = Chart.getChart('chart_bar') || Chart.getChart(document.getElementById('chart_bar'));
        //     var p = Chart.getChart('chart_pie') || Chart.getChart(document.getElementById('chart_pie'));
        //     applyXY(l); applyXY(b); applyPie(p);
        //   }
        // }catch(_){ }

        // Inject bottom row with two mini tables if not present
        if (false && !document.getElementById('dashTables')){
          var row = document.createElement('div');
          row.className = 'dash-row-2';
          row.id = 'dashTables';
          row.innerHTML = `
            <div class="card">
              <div class="card-title">Últimas órdenes</div>
              <div class="table-wrap"><table class="table-mini" id="tblLastOrders">
                <thead><tr><th>ID</th><th>Cliente</th><th>Fecha</th><th>Estado</th></tr></thead>
                <tbody></tbody>
              </table></div>
            </div>
            <div class="card">
              <div class="card-title">Tótas órdenes</div>
              <div class="table-wrap"><table class="table-mini" id="tblTotals">
                <thead><tr><th>Cliente</th><th>Órdenes</th><th>Estado</th></tr></thead>
                <tbody></tbody>
              </table></div>
            </div>`;
          view.appendChild(row);

          // Populate from /production (visual-only)
          try {
            (async function(){
              let procs = [];
              try { procs = await API.apiGet('/production'); } catch(_){ procs = []; }
              procs = Array.isArray(procs) ? procs : [];

              // Last orders: take last 5 by any date-like or by array tail
              const fmtDate = (v)=>{ try{ const d = new Date(v); if(!isNaN(d)) return d.toISOString().slice(0,10); }catch(_){ } return (v||'').toString().slice(0,10); };
              const items = procs.slice(-5).reverse();
              const rows1 = items.map((p,i)=>{
                const id = p.op || p.id || ('#'+(i+1));
                const cli = (p.cliente && (p.cliente.nombre||p.cliente.idclie)) || '—';
                const fecha = fmtDate(p.fecha || p.created_at || p.updated_at || '');
                const estado = (p.estado || p.status || '—').toString();
                return `<tr><td>${id}</td><td>${cli}</td><td>${fecha}</td><td><span class="badge dot info">${estado}</span></td></tr>`;
              }).join('');
              document.querySelector('#tblLastOrders tbody').innerHTML = rows1 || '<tr><td colspan="4">Sin datos</td></tr>';

              // Totals by client (top 5)
              const cMap = new Map();
              procs.forEach(p=>{ const c=(p&&p.cliente&&(p.cliente.nombre||p.cliente.idclie))||'N/A'; cMap.set(c,(cMap.get(c)||0)+1); });
              const top = Array.from(cMap.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5);
              const rows2 = top.map(([c,v])=>`<tr><td>${c}</td><td>${v}</td><td><span class="badge dot success">Activo</span></td></tr>`).join('');
              document.querySelector('#tblTotals tbody').innerHTML = rows2 || '<tr><td colspan="3">Sin datos</td></tr>';
            })();
          } catch(_){ }
        }

        // Build small legend below pie chart similar to mock
        try{
          const pie = (typeof Chart!=='undefined' && Chart.getChart) ? (Chart.getChart('chart_pie')||Chart.getChart(document.getElementById('chart_pie'))) : null;
          if (false && pie){
            const card = document.getElementById('chart_pie')?.closest('.card');
            if (card && !card.querySelector('.mini-legend')){
              const wrap = document.createElement('div');
              wrap.className = 'mini-legend';
              wrap.style.cssText = 'display:flex;gap:12px;align-items:center;margin-top:8px;font-size:12px;color:#aab2c3;flex-wrap:wrap;';
              const labels = pie.data.labels||[];
              const colors = (pie.data.datasets&&pie.data.datasets[0]&&pie.data.datasets[0].backgroundColor)||[];
              labels.forEach(function(l,i){
                const item = document.createElement('span');
                item.innerHTML = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${colors[i%colors.length]};margin-right:6px"></span>${l}`;
                wrap.appendChild(item);
              });
              card.appendChild(wrap);
            }
          }
        }catch(_){ }
      }catch(_){ }
    };
  }catch(_){ }
})();
