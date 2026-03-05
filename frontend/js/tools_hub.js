// Tools Hub helpers: barra de pestaÃ±as para Empresa/Variables/Estaciones/Proceso
function toolsHubHeader(active){
  try {
    const tabs = [
      { key: 'company', label: 'Empresa' },
      { key: 'variables', label: 'Variables' },
      { key: 'stations', label: 'Estaciones' },
          ];
    const pills = tabs.map(t => `<button class="nav-pill ${active===t.key ? 'active' : ''}" data-tab="${t.key}">${t.label}</button>`).join('');
    return `<div class="nav-pills">${pills}</div>`;
  } catch(_) { return ''; }
}

function bindToolsHubTabs(){
  try {
    const pills = document.querySelectorAll('#view .nav-pills .nav-pill');
    pills.forEach(btn => {
      const tab = btn.getAttribute('data-tab');
      btn.addEventListener('click', (e)=>{
        e.preventDefault(); e.stopPropagation();
        if (tab==='company') return loadCompany();
        if (tab==='variables') {
  if (typeof window.loadVariables === 'function') return window.loadVariables();
  return console.error('loadVariables no está disponible. ui.js no cargó o es otra versión.');
}
        if (tab==='stations') return loadView('stations');      });
    });
  } catch(_) {}
}

