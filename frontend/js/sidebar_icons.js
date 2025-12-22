// Sidebar icons override to match objetivos.txt
// Mapping based on objetivos.txt (UTF-8 emojis):
// dashboard: 🏠, production: 🏭, catalogs: 📚, tools: 🛠️, reports: 📊
(function(){
  try {
    const map = { dashboard:'🏠', production:'🏭', catalogs:'📚', tools:'🛠️', reports:'📊' };
    const items = document.querySelectorAll('.sidebar nav a[data-view]');
    items.forEach(a => {
      const v = a.getAttribute('data-view') || '';
      const icon = map[v];
      if (!icon) return;
      let iconEl = a.querySelector('.icon');
      let labelEl = a.querySelector('.label');
      const labelText = labelEl ? labelEl.textContent : (a.textContent || '').trim();
      if (!iconEl){
        a.textContent = '';
        iconEl = document.createElement('span');
        iconEl.className = 'icon';
        iconEl.setAttribute('aria-hidden','true');
        labelEl = document.createElement('span');
        labelEl.className = 'label';
        labelEl.textContent = labelText;
        a.appendChild(iconEl);
        a.appendChild(labelEl);
      }
      iconEl.textContent = icon;
    });

    // Footer icons: Help and Logout to match previous design
    const help = document.querySelector('.sidebar-footer .foot-link[data-view="help"] .icon');
    if (help) help.textContent = '❓';
    const logout = document.querySelector('#sidebarLogoutBtn .icon');
    if (logout) logout.textContent = '⏻';
  } catch(_) {}
})();
