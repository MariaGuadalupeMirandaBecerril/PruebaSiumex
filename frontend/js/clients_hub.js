// Clientes Hub helpers: barra de pestañas persistente (sin título)
function clientsHubHeader(active){
  try {
    const tabs = [
      { key: 'clients', label: 'Clientes' },
      { key: 'users', label: 'Usuarios' },
      { key: 'products', label: 'Productos' },
      { key: 'operators', label: 'Operadores' },
    ];
    const pills = tabs.map(t => `<button class="nav-pill ${active===t.key ? 'active' : ''}" data-tab="${t.key}">${t.label}</button>`).join('');
    return `<div class="nav-pills">${pills}</div>`;
  } catch(_) {
    return '';
  }
}

function bindClientsHubTabs(){
  try {
    const pills = document.querySelectorAll('#view .nav-pills .nav-pill');
    pills.forEach(btn => {
      const tab = btn.getAttribute('data-tab');
      if (!tab) return;
      btn.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); if (typeof loadView === 'function') loadView(tab); });
    });
  } catch(_) {}
}

