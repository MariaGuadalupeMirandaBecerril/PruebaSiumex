// Force dashboard charts to render in a single row (three side-by-side)
(function(){
  if (typeof window === 'undefined') return;

  const original = window.loadDashboard;
  window.loadDashboard = async function(){
    if (typeof original === 'function') {
      await original();
    }
    try {
      const view = document.getElementById('view');
      if (!view) return;
      const grid = view.querySelector('.charts-grid');
      if (grid) {
        grid.className = 'charts-grid one-row';
      }
      // Ensure no spanning remains
      view.querySelectorAll('.charts-grid .card').forEach(function(card){
        card.classList.remove('span-2');
      });

      // Recolor each chart so every graph has a distinct theme
      try {
        const getChart = (id) => {
          const el = document.getElementById(id);
          if (!el) return null;
          if (typeof Chart !== 'undefined' && Chart.getChart) {
            return Chart.getChart(el) || Chart.getChart(id) || null;
          }
          return null;
        };

        // Line chart: cyan/blue gradient
        const l = getChart('chart_line');
        if (l && l.data && l.data.datasets && l.data.datasets[0]) {
          const ctx = l.canvas && l.canvas.getContext ? l.canvas.getContext('2d') : null;
          let bg = '#06b6d433';
          try {
            if (ctx) {
              const g = ctx.createLinearGradient(0,0,0,400);
              g.addColorStop(0,'rgba(14,165,233,0.35)'); // sky-500 ~ #0ea5e9
              g.addColorStop(1,'rgba(14,165,233,0)');
              bg = g;
            }
          } catch(_){}
          l.data.datasets[0].borderColor = '#0ea5e9';
          l.data.datasets[0].backgroundColor = bg;
          l.update('none');
        }

        // Pie chart: purple palette
        const p = getChart('chart_pie');
        if (p && p.data && p.data.datasets && p.data.datasets[0]) {
          const n = (p.data.labels || []).length || (p.data.datasets[0].data || []).length || 5;
          const palette = ['#a78bfa','#8b5cf6','#7c3aed','#6d28d9','#581c87'];
          const colors = Array.from({length:n}, (_,i)=> palette[i % palette.length]);
          p.data.datasets[0].backgroundColor = colors;
          p.update('none');
        }

        // Bar chart: green palette
        const b = getChart('chart_bar');
        if (b && b.data && b.data.datasets && b.data.datasets[0]) {
          const dataLen = (b.data.datasets[0].data || []).length || (b.data.labels || []).length || 5;
          const base = ['#34d399','#10b981','#059669','#047857','#065f46'];
          const colors = Array.from({length:dataLen}, (_,i)=> base[i % base.length]);
          b.data.datasets[0].backgroundColor = colors;
          b.data.datasets[0].borderColor = '#065f46';
          b.update('none');
        }
      } catch(_) { /* ignore recolor failures */ }

      // Habilitar click para ampliar cualquier gráfica
      try {
        ensureChartOverlay();
        const cards = view.querySelectorAll('.charts-grid .card');
        cards.forEach(function(card){
          const canvas = card.querySelector('canvas');
          if (!canvas) return;
          canvas.style.cursor = 'zoom-in';
          canvas.addEventListener('click', function(){ openChartOverlay(card); });
        });
      } catch(_) {}
    } catch(_) { /* no-op */ }
  };

  let overlayEl = null;
  let overlayDialog = null;
  let currentCard = null;
  const originalPlace = new Map();

  function ensureChartOverlay(){
    if (overlayEl) return;
    overlayEl = document.createElement('div');
    overlayEl.className = 'chart-overlay';
    overlayEl.innerHTML = '<div class="chart-backdrop" data-close></div><div class="chart-dialog"><button class="chart-close" title="Cerrar" aria-label="Cerrar" data-close>×</button></div>';
    document.body.appendChild(overlayEl);
    overlayDialog = overlayEl.querySelector('.chart-dialog');
    overlayEl.addEventListener('click', function(ev){ if (ev.target && ev.target.hasAttribute('data-close')) closeChartOverlay(); });
    document.addEventListener('keydown', function(ev){ if (overlayEl.classList.contains('show') && ev.key === 'Escape'){ closeChartOverlay(); }});
  }

  function openChartOverlay(card){
    if (!overlayEl || !overlayDialog) return;
    if (currentCard) restoreCard();
    const parent = card.parentElement;
    const marker = document.createComment('chart-card-marker');
    originalPlace.set(card, { parent, marker });
    parent.insertBefore(marker, card);
    overlayDialog.appendChild(card);
    overlayEl.classList.add('show');
    currentCard = card;
    try {
      const canvas = card.querySelector('canvas');
      if (canvas && typeof Chart !== 'undefined' && Chart.getChart){
        const ch = Chart.getChart(canvas) || Chart.getChart(canvas.id);
        if (ch && ch.resize) ch.resize();
      }
    } catch(_){}
  }

  function restoreCard(){
    if (!currentCard) return;
    const info = originalPlace.get(currentCard);
    if (info && info.parent && info.marker){
      info.parent.insertBefore(currentCard, info.marker);
      info.parent.removeChild(info.marker);
    }
    try {
      const canvas = currentCard.querySelector('canvas');
      if (canvas && typeof Chart !== 'undefined' && Chart.getChart){
        const ch = Chart.getChart(canvas) || Chart.getChart(canvas.id);
        if (ch && ch.resize) ch.resize();
      }
    } catch(_){}
    originalPlace.delete(currentCard);
    currentCard = null;
  }

  function closeChartOverlay(){
    restoreCard();
    if (overlayEl) overlayEl.classList.remove('show');
  }

})();
