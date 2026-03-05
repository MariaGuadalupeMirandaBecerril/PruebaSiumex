// Sidebar icons override (back to previous emoji/iconify approach)
(function(){
  try {
    const map = { dashboard:'📊', operativo:'⚙️', production:'🏭', catalogs:'📚', tools:'🧰', reports:'📈' };
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

    // Footer icons: Help and Logout (emoji)
    const help = document.querySelector('.sidebar__footer .foot-link[data-view="help"] .icon')
              || document.querySelector('.sidebar-footer .foot-link[data-view="help"] .icon');
    if (help) help.textContent = '❓';
    const logout = document.querySelector('#sidebarLogoutBtn .icon');
    if (logout) logout.textContent = '🚪';
  } catch(_) {}
})();
