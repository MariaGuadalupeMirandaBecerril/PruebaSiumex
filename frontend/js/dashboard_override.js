// Dashboard premium: 3 KPIs + 3 graficas + 2 tablas (robusto)
(function(){
  if (typeof window === 'undefined') return;

  let __seq = 0;
  let lineChart = null, pieChart = null, barChart = null;
  let __timer = null, __onDataChanged = null;

  function toDateKey(v){ if(!v) return 'N/A'; try{ const d=new Date(v); if(!isNaN(d)) return d.toISOString().slice(0,10);}catch(_){ } return String(v).slice(0,10); }
  function toDateTime(v){ if(!v) return ''; try{ const d=new Date(v); if(!isNaN(d)) return d.toISOString().slice(0,10);}catch(_){ } return String(v).slice(0,10); }
  function num(v){ const n=Number(v); return Number.isFinite(n)?n:0; }
  function safeStr(v,f='N/A'){ if(v===null||v===undefined) return f; const s=String(v).trim(); return s||f; }
  function destroyChart(c){ try{ if(!c) return; if(typeof Chart!=='undefined' && Chart.getChart && c instanceof HTMLCanvasElement){ const ex=Chart.getChart(c); if(ex&&ex.destroy) ex.destroy(); return; } if(c&&c.destroy) c.destroy(); }catch(_){}}
  function destroyAll(){ try{ ['chart_line','chart_pie','chart_bar'].forEach(id=>{ const c=document.getElementById(id); if(c) destroyChart(c);}); destroyChart(lineChart); destroyChart(pieChart); destroyChart(barChart); lineChart=pieChart=barChart=null; }catch(_){}}

  async function fetchDashboardData(){
    const inv = await API.apiGet('/reports/inventory');
    const rows = Array.isArray(inv?.rows)? inv.rows: [];
    const byDate = new Map();
    rows.forEach(r=>{ const k=toDateKey(r?.Fecha||r?.fecha); const v=Math.max(0, num(r?.Peso ?? 0)); byDate.set(k, (byDate.get(k)||0)+v); });
    const dates=Array.from(byDate.keys()).sort(); const dateVals=dates.map(k=>byDate.get(k));
    if(!dates.length){ const now=new Date(); for(let i=6;i>=0;i--){ const d=new Date(now); d.setDate(now.getDate()-i); const k=d.toISOString().slice(0,10); dates.push(k); dateVals.push(0);} }

    const cli = await API.apiGet('/clients').catch(()=>[]);
    const pro = await API.apiGet('/products').catch(()=>[]);
    const cliCount = Array.isArray(cli)? cli.length:0;
    const prodCount = Array.isArray(pro)? pro.length:0;

    const prod = await API.apiGet('/production').catch(()=>[]);
    const list = Array.isArray(prod)? prod:[];
    const cMap=new Map(), pMap=new Map();
    list.forEach(p=>{ const c=(p?.cliente&&(p.cliente.nombre||p.cliente.idclie))||p?.IdClie||'N/A'; const pr=(p?.producto&&(p.producto.nombre||p.producto.idprod))||p?.IdProd||'N/A'; cMap.set(c,(cMap.get(c)||0)+1); pMap.set(pr,(pMap.get(pr)||0)+1); });
    const cTop = Array.from(cMap.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const pTop = Array.from(pMap.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const cliLabels=cTop.map(x=>safeStr(x[0])); const cliValues=cTop.map(x=>x[1]);
    const prodLabels=pTop.map(x=>safeStr(x[0])); const prodValues=pTop.map(x=>x[1]);

    const recentRows = list.slice().sort((a,b)=>{ const da=new Date(a?.Fecha||a?.fecha||a?.createdAt||a?.CreatedAt||0).getTime()||0; const db=new Date(b?.Fecha||b?.fecha||b?.createdAt||b?.CreatedAt||0).getTime()||0; return db-da; }).slice(0,5).map(p=>({
      fecha: toDateTime(p?.Fecha||p?.fecha||p?.createdAt||p?.CreatedAt),
      cliente: (p?.cliente&&(p.cliente.nombre||p.cliente.idclie))||p?.IdClie||'N/A',
      producto: (p?.producto&&(p.producto.nombre||p.producto.idprod))||p?.IdProd||'N/A',
      cantidad: p?.Cantidad ?? p?.cantidad ?? p?.Peso ?? p?.peso ?? ''
    }));

    return { dates, dateVals, cliCount, prodCount, cliLabels, cliValues, prodLabels, prodValues, recentRows };
  }

  window.loadDashboard = async function(){
    const my = ++__seq; const guard=()=> my===__seq;
    const el = document.getElementById('view'); if(!el) return;

    try{ if(__timer) clearInterval(__timer); }catch(_){ } __timer=null;
    try{ if(__onDataChanged) window.removeEventListener('data:changed', __onDataChanged); }catch(_){ } __onDataChanged=null;
    destroyAll();

    el.dataset.view='dashboard';
    el.innerHTML = `
      <div class="dashboard">
        <div class="page-header dash-topbar">
          <div>
            <div class="page-title">Panel</div>
            <div class="page-subtitle">Resumen visual de la producción</div>
          </div>
        </div>
        <div class="dashboard-grid" id="dashGrid">
          <div class="card kpi area-kpi1" id="kpi1"><div class="card-title">Registros (hoy)</div><div class="card-value">0</div></div>
          <div class="card kpi area-kpi2" id="kpi2"><div class="card-title">Clientes</div><div class="card-value">0 <span class="badge info">Activos</span></div></div>
          <div class="card kpi area-kpi3" id="kpi3"><div class="card-title">Productos</div><div class="card-value">0 <span class="badge warning">Catálogo</span></div></div>
          <div class="card chartCard area-chartA"><div class="chartHeader"><div class="card-title">Productos pesados por día</div><span class="chart-chip">Monthly</span></div><div class="chartContainer"><canvas id="chart_line"></canvas></div></div>
          <div class="card chartCard area-chartB"><div class="chartHeader"><div class="card-title">Top 5 clientes por órdenes</div></div><div class="chartContainer"><canvas id="chart_pie"></canvas></div></div>
          <div class="card chartCard area-chartC"><div class="chartHeader"><div class="card-title">Top 5 productos más utilizados</div></div><div class="chartContainer"><canvas id="chart_bar"></canvas></div></div>
          <div class="card area-tableB"><div class="card-title">Resumen general</div><div class="table-wrap" style="margin-top:10px; max-height:220px;"><table class="table-mini" id="tblSummary"><thead><tr><th>INDICADOR</th><th>VALOR</th><th>TENDENCIA</th></tr></thead><tbody><tr><td colspan="3" style="text-align:center; color: var(--muted); padding:18px;">Sin datos para mostrar</td></tr></tbody></table></div></div>
        </div>
      </div>`;

    try{
      const data = await fetchDashboardData(); if(!guard()) return;
      const { dates, dateVals, cliCount, prodCount, cliLabels, cliValues, prodLabels, prodValues, recentRows } = data;

      // KPIs
      try{
        const last = dateVals[dateVals.length-1]||0; const prev = dateVals[dateVals.length-2]||0; const trend = prev ? ((last-prev)/prev)*100 : 0;
        document.querySelector('#kpi1 .card-value').innerHTML = `${last||0} <span class="badge ${trend>=0?'success':'danger'}">${trend>=0?'+':''}${trend.toFixed(1)}%</span>`;
        document.querySelector('#kpi2 .card-value').innerHTML = `${cliCount} <span class="badge info">Activos</span>`;
        document.querySelector('#kpi3 .card-value').innerHTML = `${prodCount} <span class="badge warning">Catálogo</span>`;
      }catch(_){ }

      try{
        const tb = document.querySelector('#tblSummary tbody');
        const totalPeso = dateVals.reduce((a,b)=>a+(num(b)||0),0);
        const totalDias = dateVals.length||0; const promDia = totalDias? totalPeso/totalDias:0;
        const ultimoDia = dateVals[dateVals.length-1]||0; const prevDia = dateVals[dateVals.length-2]||0; const tend = prevDia? ((ultimoDia-prevDia)/prevDia)*100:0;
        tb.innerHTML = `<tr><td>Peso total (histórico)</td><td>${totalPeso.toFixed(2)}</td><td><span class="badge info">Acumulado</span></td></tr><tr><td>Promedio por día</td><td>${promDia.toFixed(2)}</td><td><span class="badge warning">Media</span></td></tr><tr><td>Peso último día</td><td>${num(ultimoDia).toFixed(2)}</td><td><span class="badge ${tend>=0?'success':'danger'}">${tend>=0?'+':''}${tend.toFixed(1)}%</span></td></tr>`;
      }catch(_){ }

      // Charts
      const cL=document.getElementById('chart_line'); const cP=document.getElementById('chart_pie'); const cB=document.getElementById('chart_bar');
      if (typeof Chart!=='undefined'){
        [cL,cP,cB].forEach(c=>destroyChart(c)); destroyChart(lineChart); destroyChart(pieChart); destroyChart(barChart); lineChart=pieChart=barChart=null;
        const commonXY = { responsive:true, maintainAspectRatio:false, plugins:{ legend:{display:false}, tooltip:{enabled:true} }, scales:{ x:{ grid:{ color:'rgba(148,163,184,.10)'}}, y:{ beginAtZero:true, suggestedMin:0, suggestedMax: Math.max(1, Math.ceil(Math.max(...dateVals,1)*1.15)), grid:{ color:'rgba(148,163,184,.08)'}} } };
        const pieOptions = { responsive:true, maintainAspectRatio:false, layout:{padding:0}, plugins:{ legend:{ display:true, position:'bottom' }, tooltip:{enabled:true} } };
        if (cL) lineChart = new Chart(cL, { type:'line', data:{ labels:dates, datasets:[{ label:'Peso total', data:dateVals, tension:.35, fill:true, borderColor:'#6aa5ff', backgroundColor:'rgba(106,165,255,.20)', pointRadius:0, pointHoverRadius:3 }]}, options: commonXY });
        if (cP) pieChart = new Chart(cP, { type:'pie', data:{ labels:cliLabels, datasets:[{ label:'Órdenes', data:cliValues, backgroundColor:['#60a5fa','#a78bfa','#34d399','#f59e0b','#f87171'], borderWidth:0, hoverOffset:6 }]}, options: pieOptions });
        if (cB) barChart = new Chart(cB, { type:'bar', data:{ labels:prodLabels, datasets:[{ label:'Órdenes', data:prodValues }]}, options: commonXY });
      }

      async function refresh(){ if(!guard()) return; try{ const d=await fetchDashboardData(); if(!guard()) return; const {dates,dateVals,cliLabels,cliValues,prodLabels,prodValues,recentRows}=d; if(lineChart){ lineChart.data.labels=dates; lineChart.data.datasets[0].data=dateVals; lineChart.options.scales.y.suggestedMax = Math.max(1, Math.ceil(Math.max(...dateVals,1)*1.15)); lineChart.update('none'); } if(pieChart){ pieChart.data.labels=cliLabels; pieChart.data.datasets[0].data=cliValues; pieChart.update('none'); } if(barChart){ barChart.data.labels=prodLabels; barChart.data.datasets[0].data=prodValues; barChart.update('none'); } const tbR=document.querySelector('#tblRecent tbody'); if(tbR) tbR.innerHTML = recentRows.length ? recentRows.map(r=>`<tr><td>${safeStr(r.fecha,'N/A')}</td><td>${safeStr(r.cliente)}</td><td>${safeStr(r.producto)}</td><td>${safeStr(r.cantidad,'')}</td></tr>`).join('') : `<tr><td colspan="4" style="text-align:center; color: var(--muted); padding:18px;">Sin datos para mostrar</td></tr>`; }catch(e){ console.error(e); } }
      document.getElementById('btnDashRefresh')?.addEventListener('click', ()=> refresh());
      __onDataChanged = ()=> refresh(); window.addEventListener('data:changed', __onDataChanged);
      __timer = setInterval(()=> refresh(), 30000);

    }catch(e){ console.error(e); destroyAll(); el.innerHTML = '<h2>Panel</h2><p>No fue posible cargar el panel.</p>'; }
  }
})();

