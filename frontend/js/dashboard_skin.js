// UI-only refinements layered on top of dashboard_override.js
(function(){
  try{
    function enhance(){
      const root = document.getElementById('view');
      if (!root || root.dataset.view !== 'dashboard') return;

      // KPI icons
      root.querySelectorAll('.cards.kpis .card.kpi').forEach((card, i)=>{
        if (!card.querySelector('.kpi-icon')){
          const icon = document.createElement('div');
          icon.className = 'kpi-icon';
          icon.innerHTML = '<span class="iconify" data-icon="lucide:activity"></span>';
          if (i===1) icon.innerHTML = '<span class="iconify" data-icon="lucide:users"></span>';
          if (i===2) icon.innerHTML = '<span class="iconify" data-icon="lucide:box"></span>';
          card.appendChild(icon);
        }
      });

      // Ensure 4 KPI slots on desktop with placeholders (UI only)
      try{
        const kpiWrap = root.querySelector('.cards.kpis');
        if (kpiWrap){
          const existing = Array.from(kpiWrap.querySelectorAll('.card.kpi'));
          const current = existing.length;
          const needed = Math.max(0, 4 - current);
          // Avoid duplicating placeholders
          const placeholders = kpiWrap.querySelectorAll('.card.kpi.placeholder').length;
          if (placeholders < needed){
            for (let i=0; i<needed - placeholders; i++){
              const ph = document.createElement('div');
              ph.className = 'card kpi placeholder';
              ph.setAttribute('aria-hidden', 'true');
              ph.innerHTML = '<div class="card-title">&nbsp;</div><div class="card-value">&nbsp;</div>';
              kpiWrap.appendChild(ph);
            }
          }
        }
      }catch(_){ }

      // Remove any previously injected "Monthly" pill to match 2223.png
      const t = root.querySelector('#dashCharts .card .card-title');
      try{ const existing = t && t.querySelector('.pill'); if (existing) existing.remove(); }catch(_){ }

      // Wrap canvases into fixed-height containers
      root.querySelectorAll('#dashCharts .card').forEach((card)=>{
        const canvas = card.querySelector('canvas');
        if (!canvas) return;
        if (canvas.parentElement && canvas.parentElement.classList.contains('chart-container')) return;
        const wrap = document.createElement('div');
        wrap.className = 'chart-container';
        canvas.replaceWith(wrap);
        wrap.appendChild(canvas);
      });

      // Layout refactor: group KPIs, charts and add bottom tables (placeholders)
      try{
        const cards = root.querySelector('#dashCards');
        const charts = root.querySelector('#dashCharts');
        let dash = root.querySelector('section.dashboard');

        // Create wrapper section if missing and move blocks inside
        if (!dash && (cards || charts)){
          dash = document.createElement('section');
          dash.className = 'dashboard';
          const header = root.querySelector('.page-header');
          if (header && header.nextSibling){
            header.parentNode.insertBefore(dash, header.nextSibling);
          } else {
            root.appendChild(dash);
          }
          if (cards) dash.appendChild(cards);
          if (charts) dash.appendChild(charts);
        }

        // Add bottom tables row if not present (UI-only placeholders)
        if (dash && !dash.querySelector('.dash-tables')){
          const tables = document.createElement('div');
          tables.className = 'dash-row-2 dash-tables';
          tables.innerHTML = `
            <div class="card">
              <div class="card-title">Movimientos recientes</div>
              <div class="table-wrap pretty">
                <table class="table-mini" aria-label="Movimientos recientes">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Cliente</th>
                      <th>Producto</th>
                      <th>Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colspan="4" style="color: var(--muted); text-align:center;">Sin datos para mostrar</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="card">
              <div class="card-title">Resumen general</div>
              <div class="table-wrap pretty">
                <table class="table-mini" aria-label="Resumen general">
                  <thead>
                    <tr>
                      <th>Indicador</th>
                      <th>Valor</th>
                      <th>Tendencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colspan="3" style="color: var(--muted); text-align:center;">Sin datos para mostrar</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          `;
          dash.appendChild(tables);
        }

        // Build a single CSS Grid with named areas and move existing components
        let grid = dash && dash.querySelector('#dashGrid');
        if (dash && !grid){
          grid = document.createElement('div');
          grid.id = 'dashGrid';
          grid.className = 'dashboard-grid';
          // Create area containers
          const areas = ['kpi1','kpi2','kpi3','kpi4','chartA','chartB','chartC','tableA','tableB'];
          areas.forEach(a=>{
            const holder = document.createElement('div');
            holder.className = 'area-' + a;
            grid.appendChild(holder);
          });
          dash.appendChild(grid);

          // Move KPI cards (first 4) into kpi1..kpi4
          try{
            const kpiWrap = dash.querySelector('.cards.kpis');
            if (kpiWrap){
              const kpis = Array.from(kpiWrap.querySelectorAll('.card.kpi'));
              const map = ['kpi1','kpi2','kpi3','kpi4'];
              map.forEach((name, idx)=>{
                const it = kpis[idx];
                if (it){ grid.querySelector('.area-'+name)?.appendChild(it); }
              });
              // remove empty wrapper
              if (!kpiWrap.querySelector('.card.kpi')){ try{ kpiWrap.remove(); }catch(_){}}
            }
          }catch(_){ }

          // Move charts: line -> chartA, pie -> chartB, bar -> chartC
          try{
            const chartCards = Array.from(dash.querySelectorAll('#dashCharts .card'));
            const byId = (id)=> chartCards.find(c=> c.querySelector('#'+id));
            const cLine = byId('chart_line');
            const cPie  = byId('chart_pie');
            const cBar  = byId('chart_bar');
            if (cLine) grid.querySelector('.area-chartA')?.appendChild(cLine);
            if (cPie)  grid.querySelector('.area-chartB')?.appendChild(cPie);
            if (cBar)  grid.querySelector('.area-chartC')?.appendChild(cBar);
            const chartsWrap = dash.querySelector('#dashCharts');
            if (chartsWrap){ try{ chartsWrap.remove(); }catch(_){ } }
          }catch(_){ }

          // Move tables: first -> tableA, second -> tableB
          try{
            const tblWrap = dash.querySelector('.dash-tables');
            const tables = tblWrap ? Array.from(tblWrap.querySelectorAll('.card')) : [];
            if (tables[0]) grid.querySelector('.area-tableA')?.appendChild(tables[0]);
            if (tables[1]) grid.querySelector('.area-tableB')?.appendChild(tables[1]);
            if (tblWrap){ try{ tblWrap.remove(); }catch(_){ } }
          }catch(_){ }
        }
      }catch(_){ }
    }

    // Run after loadDashboard paints
    const mo = new MutationObserver(()=> enhance());
    const view = document.getElementById('view');
    if (view) mo.observe(view, { childList:true, subtree:true });
    window.addEventListener('load', enhance);
    setTimeout(enhance, 400);
  }catch(_){ }
})();
