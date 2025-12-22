// ---- Setup ----
const view = document.getElementById('view');
const navLinks = document.querySelectorAll('.sidebar a[data-view]');

// Simplificar menú de usuario (solo Perfil)
try {
  document.querySelector('#userMenu .menu-item[data-go="users"]')?.remove();
  // Puede existir separador antes de cerrar sesión
  const um = document.getElementById('userMenu');
  if (um){
    // Remueve el primer <hr> si sobra tras eliminar Usuarios
    um.querySelector('hr')?.remove();
  }
  document.getElementById('logoutBtn')?.remove();
} catch(_) {}

// --- Enhance sidebar nav with icons and labels ---
try {
  const nav = document.querySelectorAll('.sidebar nav a[data-view]');
  if (nav && nav.length) {
    const icons = {
      dashboard: '??',
      production: '??',
      catalogs: '??',
      tools: '???',
      reports: '??'
    };
    nav.forEach(a => {
      if (a.querySelector('.icon')) return; // already enhanced
      const view = a.getAttribute('data-view') || '';
      const ico = icons[view] || '•';
      const labelText = (a.textContent || '').trim();
      a.textContent = '';
      const sIcon = document.createElement('span');
      sIcon.className = 'icon';
      sIcon.setAttribute('aria-hidden','true');
      sIcon.textContent = ico;
      const sLabel = document.createElement('span');
      sLabel.className = 'label';
      sLabel.textContent = labelText;
      a.appendChild(sIcon);
      a.appendChild(sLabel);
    });
  }
} catch(_) { }
// Override sidebar icons to match latest design (emoji)
try {
  const map = { dashboard:'??', production:'??', catalogs:'???', tools:'???', reports:'??' };
  document.querySelectorAll('.sidebar nav a[data-view]').forEach(a => {
    const v = a.getAttribute('data-view') || '';
    const labelText = (a.querySelector('.label')?.textContent || (a.textContent || '').trim());
    let iconEl = a.querySelector('.icon');
    if (!iconEl) {
      iconEl = document.createElement('span');
      iconEl.className = 'icon';
      iconEl.setAttribute('aria-hidden','true');
      a.innerHTML = '';
      const lbl = document.createElement('span');
      lbl.className = 'label';
      lbl.textContent = labelText;
      a.appendChild(iconEl);
      a.appendChild(lbl);
    }
    iconEl.textContent = map[v] || '';
  });
} catch(_) {}
let __currentView = 'dashboard';
try { window.__currentView = __currentView; } catch(_) {}

// Global light theme refinements (inspired by I1.png)
try {
  if (!document.getElementById('light-theme-refine')){
    const st = document.createElement('style');
    st.id = 'light-theme-refine';
    st.textContent = `
      body.light .sidebar{ background:#ffffff; border-right:1px solid #e5e7eb; }
      body.light .sidebar nav a:hover{ background:#f3f4f6; }
      body.light .sidebar .group{ border-top-color:#e5e7eb; }
      body.light .topbar{ background:#ffffff; border-bottom:1px solid #e5e7eb; }
      body.light .table-wrap{ background:#ffffff; border-color:#e5e7eb; }
      body.light th{ background:#f3f4f6; border-bottom-color:#e5e7eb; }
      body.light td{ border-bottom-color:#e5e7eb; }
      body.light table tbody tr:nth-child(even){ background:#fafafa; }
      body.light table tbody tr:hover{ background:#f5f7ff; }
      body.light input,
      body.light select,
      body.light textarea{ background:#ffffff; color:#111111; border-color:#d1d5db; }
      body.light input:focus,
      body.light select:focus,
      body.light textarea:focus{ border-color:#335bff; box-shadow:0 0 0 2px rgba(47,129,247,.25); outline:none; }
      body.light .tabs{ background:#ffffff; border-color:#e5e7eb; }
      body.light .tab.active{ background:#e8eefb; }
      body.light .card{ background:#ffffff; border-color:#e5e7eb; box-shadow: 0 8px 18px rgba(0,0,0,.06); }
    `;
    document.head.appendChild(st);
  }
} catch(_){ }

// Theme V2: colores y componentes mÃ¡s limpios (aplica a todo)
try {
  if (!document.getElementById('theme-v2')){
    const st = document.createElement('style');
    st.id = 'theme-v2';
    st.textContent = `
      /* Variables claras modernizadas */
      body.light{ --bg:#f8fafc; --panel:#ffffff; --text:#0b1220; --muted:#6b7280; --accent:#2563eb; }

      /* Sidebar, topbar y contenedores */
      body.light .sidebar{ background:#ffffff; border-right:1px solid #e5e7eb; }
      body.light .topbar{ background:#ffffff; border-bottom:1px solid #e5e7eb; }
      body.light .content{ background:#f8fafc; }

      /* Toolbar, tabs y bÃºsqueda */
      body.light .toolbar-bar{ background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; padding:10px; }
      body.light .nav-pills{ background:#ffffff; border-color:#e5e7eb; }
      body.light .nav-pill{ color:#0b1220; }
      body.light .nav-pill.active{ background:#e8eefb; color:#1e3a8a; }
      body.light .search input{ background:#ffffff; color:#0b1220; border:1px solid #d1d5db; border-radius:10px; padding:10px 14px; }

      /* Botones */
      .btn-primary{ background: var(--accent); color:#fff; border:none; border-radius:10px; padding:10px 16px; }
      .btn-secondary{ background:transparent; color:var(--text); border:1px solid #cbd5e1; border-radius:10px; padding:10px 14px; }
      .btn-secondary[disabled]{ opacity:.5; }

      /* Tabla y celdas */
      body.light .table-wrap{ background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; }
      body.light th{ background:#f3f4f6; border-bottom-color:#e5e7eb; }
      body.light td{ border-bottom-color:#e5e7eb; }
      body.light table tbody tr:nth-child(even){ background:#fafafa; }
      body.light table tbody tr:hover{ background:#f5f7ff; }

      /* Chips/Pills (variables, roles) */
      .pill{ display:inline-block; padding:4px 10px; border-radius:999px; border:1px solid #2b3440; font-size:12px; }
      body.light .pill{ background:#eef2ff; color:#1e3a8a; border-color:#dbeafe; }
      body.light .pill.role{ background:#eef6ff; color:#0b4db8; border-color:#dbeafe; }
      body.light .pill.success{ background:#ecfdf5; color:#047857; border-color:#bef0d5; }

      /* Inputs en formularios */
      body.light input, body.light select, body.light textarea{ background:#ffffff; color:#0b1220; border:1px solid #d1d5db; border-radius:10px; }
      body.light input:focus, body.light select:focus, body.light textarea:focus{ border-color:#2563eb; box-shadow:0 0 0 2px rgba(37,99,235,.15); outline:none; }

      /* Cards */
      body.light .card{ background:#ffffff; border:1px solid #e5e7eb; box-shadow:0 8px 18px rgba(0,0,0,.06); }
    `;
    document.head.appendChild(st);
  }
} catch(_){ }

// BotÃ³n de archivo mÃ¡s visible/estÃ©tico en formularios
try {
  if (!document.getElementById('file-input-aesthetic')){
    const st = document.createElement('style');
    st.id = 'file-input-aesthetic';
    st.textContent = `
      /* Contenedor imagen: botÃ³n a la izquierda y PictureBox a la derecha */
      /* (revert) sin layout personalizado de fila para imagen */
      .form-grid input[type="file"]::file-selector-button{
        background: var(--accent);
        color:#fff;
        border:none;
        border-radius:10px;
        padding:10px 14px;
        cursor:pointer;
        font-weight:600;
        box-shadow: 0 6px 14px rgba(0,0,0,.15);
        transition: filter .15s ease, transform .05s ease;
      }
      .form-grid input[type="file"]:hover::file-selector-button{ filter:brightness(0.95); }
      .form-grid input[type="file"]:active::file-selector-button{ transform: translateY(1px); }
      /* Compatibilidad bÃ¡sica (algunos navegadores) */
      .form-grid input[type="file"]::-webkit-file-upload-button{ background: var(--accent); color:#fff; border:none; border-radius:10px; padding:10px 14px; cursor:pointer; }
    `;
    document.head.appendChild(st);
  }
} catch(_){ }

document.getElementById('logoutBtn')?.addEventListener('click', () => {
  try { localStorage.removeItem('token'); localStorage.removeItem('usuario'); } catch(_) {}
  window.location.href = 'index.html';
});

// Logout desde barra lateral (siempre visible incluso colapsada)
document.getElementById('sidebarLogoutBtn')?.addEventListener('click', async (e) => {
  e.preventDefault();
  let ok = false;
  try {
    if (typeof window.showConfirm === 'function') {
      ok = await window.showConfirm('¿Estas seguro de salir?', { okText: 'Salir', cancelText: 'Cancelar' });
    } else {
      ok = typeof confirm === 'function' ? confirm('¿Estas seguro de salir?') : true;
    }
  } catch(_) {
    try { ok = confirm('¿Estas seguro de salir?'); } catch(__) { ok = false; }
  }
  if (!ok) return;
  try { localStorage.removeItem('token'); localStorage.removeItem('usuario'); } catch(_) {}
  window.location.href = 'index.html';
});

navLinks.forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  const v = a.getAttribute('data-view');
  loadView(v);
}));

document.getElementById('toggleSidebar')?.addEventListener('click', () => {
  const sb = document.getElementById('sidebar');
  if (window.matchMedia('(max-width:1024px)').matches) sb?.classList.toggle('open');
  else sb?.classList.toggle('collapsed');
});

// ---- Router ----
async function loadView(name) {
  __currentView = name || __currentView || 'dashboard';
  try { window.__currentView = __currentView; } catch(_) {}
  // Limpieza defensiva: cerrar overlays/modales que puedan bloquear la UI
  try {
    document.querySelectorAll('.x-modal')?.forEach(w => { try { w.remove(); } catch(_){} });
    const modal = document.getElementById('modal');
    if (modal){
      modal.classList.remove('show');
      modal.classList.remove('image-only');
      modal.setAttribute('aria-hidden','true');
      // restaurar visibilidad del submit y habilitar campos
      const submitBtn = modal.querySelector('button[type="submit"][form="modalForm"]');
      if (submitBtn) submitBtn.style.display = '';
      const form = document.getElementById('modalForm');
      form?.querySelectorAll('input,textarea,select,button')?.forEach(el => el.removeAttribute('disabled'));
      // limpiar overlays internos de imagen si quedaron
      modal.querySelector('.image-only-wrap')?.remove();
      modal.querySelector('.image-close')?.remove();
    }
  } catch(_) {}
  if (name === 'dashboard') return (typeof loadDashboard === 'function') ? loadDashboard() : null;
  if (name === 'help') return (typeof loadHelp === 'function') ? loadHelp() : null;
  if (name === 'reports' || name === 'reports_inventory') return typeof loadReports === 'function' ? loadReports() : null;
  if (name === 'reports_process') return typeof loadReportsProcess === 'function' ? loadReportsProcess() : null;
  if (name === 'company') return loadCompany();
  if (name === 'variables') return loadVariables();
  if (name === 'tools') return loadCompany();
  if (name === 'catalogs') return loadClients();
  if (name === 'users') return loadUsers();
  if (name === 'profile') return loadProfile();
  if (name === 'products') return loadProducts();
  if (name === 'clients') return loadClients();
  if (name === 'operators') return loadOperators();
  if (name === 'inventory') return loadInventory();
  if (name === 'production' || name === 'process') return loadProduction();
  if (name === 'stations') return loadStations();

  const cfg = ({
    products: { path: '/products', cols: ['idprod','nombre','variable1','variable2','variable3','peso_por_pieza'], form: ['idprod','nombre','variable1','variable2','variable3','peso_por_pieza','imagen'] },
    clients: { path: '/clients', cols: ['idclie','nombre','observaciones'], form: ['idclie','nombre','observaciones'] },
    providers: { path: '/providers', cols: ['idprov','nombre','observaciones'], form: ['idprov','nombre','observaciones'] },
    production: { path: '/production', cols: ['op','cliente','producto','piezas','lote'], form: ['op','cliente_id','producto_id','empaques','piezas','lote','imagen'] },
    inventory: { path: '/inventory', cols: ['fecha','codigo_mr','descripcion','cantidad','producto','cliente'], form: ['fecha','codigo_mr','descripcion','cantidad','producto_id','cliente_id'] },
  })[name];
  if (!cfg) return;

  const data = await API.apiGet(cfg.path);
  const rows = (Array.isArray(data) ? data : []).map((r) =>
    `<tr>${cfg.cols.map(c => {
      const v = typeof r[c] === 'object' ? (r[c]?.nombre || r[c]?.id || '') : (r[c] ?? '');
      return `<td>${v}</td>`;
    }).join('')}${cfg.form ? `<td><button class="op-btn" data-act="edit" data-id="${r.id}" title="Editar" aria-label="Editar">✏️</button> <button class="op-btn danger" data-act="del" data-id="${r.id}" title="Borrar" aria-label="Borrar">🗑️</button></td>` : ''}</tr>`
  ).join('');

  view.innerHTML = `
    <h2>${name}</h2>
    ${cfg.form ? `<div><button id="btnNew">Nuevo</button></div>` : ''}
    <div class="table-wrap">
      <table>
        <thead><tr>${cfg.cols.map(c => `<th>${c}</th>`).join('')}${cfg.form ? '<th>Acciones</th>' : ''}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;

  if (cfg.form) {
    document.getElementById('btnNew')?.addEventListener('click', async () => {
      openFormModal(`Registrar ${name}`, cfg.form, {}, async (obj) => {
        await API.apiPost(cfg.path, obj);
        try { if (window.showAlert) await window.showAlert('Registrado exitosamente'); } catch(_) {}
        loadView(name);
      });
    });
    document.querySelectorAll('button[data-act="view"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const current = await API.apiGet(`${cfg.path}/${id}`);
        openFormModal(`Detalle de ${name}`, cfg.form, current, null);
        try {
          const modal = document.getElementById('modal');
          const form = document.getElementById('modalForm');
          // Ocultar enviar y deshabilitar campos en modo "ver"
          modal?.querySelector('button[type="submit"]')?.setAttribute('style','display:none');
          form?.querySelectorAll('input,textarea,select,button')?.forEach(el => {
            if (el.getAttribute('data-close') === null) el.setAttribute('disabled','disabled');
          });
        } catch(_) {}
      });
    });

    document.querySelectorAll('button[data-act="edit"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const current = await API.apiGet(`${cfg.path}/${id}`);
        openFormModal(`Editar ${name}`, cfg.form, current, async (obj) => {
          await API.apiPut(`${cfg.path}/${id}`, obj);
          loadView(name);
        });
      });
    });
    document.querySelectorAll('button[data-act="del"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!(await showConfirm('Eliminar registro',{ okText:'Eliminar', cancelText:'Cancelar' }))) return;
        await API.apiDelete(`${cfg.path}/${id}`);
        loadView(name);
      });
    });
  }
}

// ---- Users (Gestión) ----
async function loadUsers() {
  try {
    const data = await API.apiGet('/users');
    let q = '';
    let page = 1;
    let pageSize = 10;

    function avatarFor(name){
      const letter = (name || '?').toString().trim().slice(0,1).toUpperCase();
      return `<span class="avatar-chip">${letter}</span>`;
    }
    function pill(text, kind){
      const cls = kind === 'role' ? 'pill role' : (kind === 'active' ? 'pill success' : 'pill');
      return `<span class="${cls}">${text}</span>`;
    }

    function render(){
      const search = q.trim().toLowerCase();
// Construir columnas dinámicas (alfabéticas) con todos los campos presentes
const allKeysSet = new Set();
(data||[]).forEach(r => { Object.keys(r||{}).forEach(k => allKeysSet.add(k)); });
const cols = Array.from(allKeysSet).sort((a,b)=> a.localeCompare(b,'es',{sensitivity:'base'}));
const valTxt = (v) => { if (v && typeof v === 'object') return (v.nombre || v.id || '').toString(); return (v ?? '').toString(); };
const rowsAll = (data||[]).filter(r => { if (!search) return true; const line = cols.map(k => valTxt(r[k])).join(' ').toLowerCase(); return line.includes(search); });const pages = Math.max(1, Math.ceil(rowsAll.length / pageSize));
      if (page > pages) page = pages;
      const start = (page - 1) * pageSize;
      const slice = rowsAll.slice(start, start + pageSize);

      const body = slice.map(r => {
        const rolTxt = (r.rol || '').toString().toUpperCase();
        return `<tr>
          <td class="user-cell">
            <span class="avatar-chip">${(r.nombre||'?').toString().slice(0,1).toUpperCase()}</span>
            <div>
              <div><strong>${r.nombre ?? ''}</strong></div>
              <div class="muted">${r.rfid ?? ''}</div>
            </div>
          </td>
          <td>${r.correo ?? ''}</td>
          <td>${pill(rolTxt || 'USUARIO', 'role')}</td>
          <td class="ops">
            <button class="op-btn" data-act="edit" data-id="${r.id}" title="Editar" aria-label="Editar">✏️</button>
            <button class="op-btn danger" data-act="del" data-id="${r.id}" title="Borrar" aria-label="Borrar">🗑️</button>
          </td>
        </tr>`;
      }).join('');

      const header = `
        <tr>
          <th>Nombre</th>
          <th>Correo</th>

          <th>Rol</th>
          <th>Operaciones</th>
        </tr>`;

      const showPagerUsers = true;
      view.innerHTML = clientsHubHeader('users') + `
        <h2>Gestión de Usuarios</h2>
        <div class="muted">Administra y monitorea los usuarios del sistema</div>
        <div class="toolbar toolbar-bar">
          <div class="left tools-left">
            <div class="search"><input type="text" id="userSearch" placeholder="Buscar usuario" value="${q}" /></div>
            <button class="btn-primary" id="btnNewUser">+ Registrar Usuario</button>
          </div>
          <div class="spacer"></div>
          <div class="right tools-right"></div>
        </div>
        <div class="table-wrap pretty">
          <table>
            <thead>${header}</thead>
            <tbody>${body}</tbody>
          </table>
        </div>
        ${showPagerUsers ? `<div class="pager">
          <div class="left">Mostrando ${rowsAll.length ? (start+1) : 0}-${Math.min(start+slice.length, rowsAll.length)} de ${rowsAll.length} usuarios</div>
          <div class="right">
            <span style=\"margin:0 8px\">Pagina ${page} / ${pages}</span>
            <button class=\"btn-secondary\" id=\"prevPg\" ${page<=1?'disabled':''}>Atrás</button>
            <button class=\"btn-secondary\" id=\"nextPg\" ${page>=pages?'disabled':''}>Siguiente</button>
          </div>
        </div>` : ''}`;

      // Marcar vista para aplicar estilos especÃ­ficos
      try { view.classList.remove('operators-view'); } catch(_){ }

      // Handlers
      bindClientsHubTabs();
      try { const h=view.querySelector('h2'); if (h) h.textContent='Gestión de Usuarios'; } catch(_){ }
      document.getElementById('userSearch')?.addEventListener('input', (e)=>{ const el=e.target; const s=el.selectionStart, t=el.selectionEnd; q = el.value; page = 1; render(); try{ const inp=document.getElementById('userSearch'); if(inp){ inp.focus({preventScroll:true}); if(typeof s==='number'&&typeof t==='number') inp.setSelectionRange(s,t); } }catch(_){} });
      // paginaciÃ³n fija 10 por Pagina
      document.getElementById('prevPg')?.addEventListener('click', ()=>{ if (page>1){ page--; render(); } });
      document.getElementById('nextPg')?.addEventListener('click', ()=>{ page++; render(); });

      document.getElementById('btnNewUser')?.addEventListener('click', async () => {
        const userFields = [
          { name: 'rfid', label: 'RFID' },
          { name: 'nombre', label: 'Nombre' },
          { name: 'rol', label: 'Rol', type: 'select', options: ['Administrador','Operador'] },
          { name: 'correo', label: 'Correo', type: 'email' },
          { name: 'password', label: 'Contraseña', type: 'password' },
          { name: 'confirm_password', label: 'Confirmar Contraseña', type: 'password' },
        ];
        openFormModal('Registrar Usuario', userFields, {}, async (obj) => {
          const email = (obj.correo || '').trim();
          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            try { if (window.showCenterAlert) await window.showCenterAlert('El correo ingresado no es válido', 'Aviso'); else alert('Formato de correo invalido'); } catch(_) {}
            return false;
          }
          if ((obj.password || '') !== (obj.confirm_password || '')) {
            alert('Las contraseñas no coinciden');
            return false;
          }
          delete obj.confirm_password;
          await API.apiPost('/users', obj);
          try { if (window.showCenterAlert) await window.showCenterAlert('Registro exitoso', 'Usuarios'); else if (window.showAlert) await window.showAlert('Registrado exitosamente'); } catch(_) {}
          loadUsers();
        });
        // Forzar diseÃ±o en lista (una columna) y modal compacto
        try {
          const modal = document.getElementById('modal');
          const form = document.getElementById('modalForm');
          form?.classList.add('onecol');
          const dialog = modal?.querySelector('.modal-dialog');
          dialog?.classList.add('small');
        } catch(_) {}
        // Forzar diseÃ±o en lista (una columna) y modal compacto
        try {
          const modal = document.getElementById('modal');
          const form = document.getElementById('modalForm');
          form?.classList.add('onecol');
          const dialog = modal?.querySelector('.modal-dialog');
          dialog?.classList.add('small');
        } catch(_) {}
      });
      document.querySelectorAll('button[data-act="edit"]').forEach((btn) => btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const current = await API.apiGet(`/users/${id}`);
        const userFields = [
          { name: 'rfid', label: 'RFID' },
          { name: 'nombre', label: 'Nombre' },
          { name: 'rol', label: 'Rol', type: 'select', options: ['Administrador','Operador'] },
          { name: 'correo', label: 'Correo', type: 'email' },
          { name: 'password', label: 'Nueva Contraseña', type: 'password', placeholder: '' },
          { name: 'confirm_password', label: 'Confirmar Contraseña', type: 'password' },
        ];
        openFormModal('Editar Usuario', userFields, current, async (obj) => {
          const email = (obj.correo || '').trim();
          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert('Formato de correo invalido');
            return false;
          }
          if (obj.password && obj.password !== (obj.confirm_password || '')) {
            alert('Las contraseñas no coinciden');
            return false;
          }
          delete obj.confirm_password;
          await API.apiPut(`/users/${id}`, obj);
          loadUsers();
        });
        // Forzar diseÃ±o en lista (una columna) y modal compacto para Editar
        try {
          const modal = document.getElementById('modal');
          const form = document.getElementById('modalForm');
          form?.classList.add('onecol');
          const dialog = modal?.querySelector('.modal-dialog');
          dialog?.classList.add('small');
        } catch(_) {}
      }));
      document.querySelectorAll('button[data-act="del"]').forEach((btn) => btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!(await showConfirm('Eliminar usuario',{ okText:'Eliminar', cancelText:'Cancelar' }))) return;
        await API.apiDelete(`/users/${id}`); loadUsers();
      }));
      document.querySelectorAll('button[data-act="view"]').forEach((btn) => btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const current = await API.apiGet(`/users/${id}`);
        const fields = [
          { name: 'rfid', label: 'RFID' },
          { name: 'nombre', label: 'Nombre' },
          { name: 'correo', label: 'Correo', type: 'email' },
          { name: 'rol', label: 'Rol' },
          { name: 'password', label: 'Contraseña', type: 'password' },
        ];
        openFormModal('Detalle de Usuario', fields, current, null);
        try {
          const modal = document.getElementById('modal');
          const form = document.getElementById('modalForm');
          modal?.querySelector('button[type="submit"]')?.setAttribute('style','display:none');
          form?.querySelectorAll('input,textarea,select')?.forEach(el => el.setAttribute('disabled','disabled'));
        } catch(_) {}
      }));
    }

    render();
  } catch (e) {
    console.error(e);
    view.innerHTML = '<p>Sin permisos para ver usuarios.</p>';
  }
}

// ---- Products (DiseÃ±o tipo Usuarios) ----
async function loadProducts() {
  try {
    const data = await API.apiGet('/products');
    let q = '';
    let page = 1;
    let pageSize = 10;
    // Productos: formulario siempre en una columna (lista)

    function pill(text){ return `<span class="pill">${text}</span>`; }

    function render(){
      const search = q.trim().toLowerCase();
      const rowsAll = (data||[]).filter(r => !search || `${r.idprod||''} ${r.nombre||''} ${r.variable1||''} ${r.variable2||''} ${r.variable3||''}`.toLowerCase().includes(search));
      const pages = Math.max(1, Math.ceil(rowsAll.length / pageSize));
      if (page > pages) page = pages;
      const start = (page - 1) * pageSize;
      const slice = rowsAll.slice(start, start + pageSize);

      const rows = slice.map(r => `
        <tr>
          <td class="user-cell">
            <span class="avatar-chip">${(r.nombre||'?').toString().slice(0,1).toUpperCase()}</span>
            <div>
              <div><strong>${r.nombre ?? ''}</strong></div>
              <div class="muted">${r.idprod ?? ''}</div>
          </div>
          </td>
          <td class="var-col">${r.variable1 ? pill(r.variable1) : ''}</td>
          <td class="var-col">${r.variable2 ? pill(r.variable2) : ''}</td>
          <td class="var-col">${r.variable3 ? pill(r.variable3) : ''}</td>
          <td>${r.peso_por_pieza ?? ''}</td>
          <td>${r.imagen ? `<img class="prod-img-thumb" data-img="${r.imagen}" src="${r.imagen}" alt="img" style="width:48px;height:48px;object-fit:cover;border-radius:6px;border:1px solid #2b3440;cursor:zoom-in;"/>` : ''}</td>
          <td class="ops">
            <button class="op-btn" data-act="edit" data-id="${r.id}" title="Editar" aria-label="Editar">✏️</button>
            <button class="op-btn danger" data-act="del" data-id="${r.id}" title="Borrar" aria-label="Borrar">🗑️</button>
          </td>
        </tr>`).join('');

      const showPager = true;
      view.innerHTML = clientsHubHeader('products') + `
        <h2>Productos</h2>
        <div class="toolbar toolbar-bar">
          <div class="left tools-left">
            <div class="search"><input id="prodSearch" type="text" placeholder="Buscar productos..." value="${q}"></div>
            <button class="btn-primary" id="btnNewProd">+ Registrar Producto</button>
          </div>
          <div class="spacer"></div>
          <div class="right tools-right"></div>
        </div>
        <div class="table-wrap products-only">
          <table class="products-table">
            <colgroup>
              <col><col><col><col><col><col><col>
            </colgroup>
            <thead>
              <tr>
                <th>Producto</th>
                <th class="var-col">Variable1<br><small>Color</small></th>
                <th class="var-col">Variable2<br><small>Tamaño</small></th>
                <th class="var-col">Variable3<br><small>Material</small></th>
                <th>Peso por pieza</th>
                <th>Imagen</th>
                <th>Acciones</th>
              </tr>
            </thead>
          <tbody>${rows}</tbody>
          </table>
        </div>
        ${showPager ? `<div class="pager">
          <div class="left">Mostrando ${rowsAll.length ? (start+1) : 0}-${Math.min(start+slice.length, rowsAll.length)} de ${rowsAll.length} productos</div>
          <div class="right">
            <span style="margin:0 8px">Pagina ${page} / ${pages}</span>
            <button class="btn-secondary" id="prevPg" ${page<=1?'disabled':''}>Atrás</button>
            <button class="btn-secondary" id="nextPg" ${page>=pages?'disabled':''}>Siguiente</button>
          </div>
        </div>` : ''}`;

      // Inyectar estilos SOLO para CatÃ¡logos -> Productos (columna Variables)
      try {
        if (!document.getElementById('prod-vars-list-styles')){
          const st = document.createElement('style');
          st.id = 'prod-vars-list-styles';
          st.textContent = `
            .products-only .products-table { table-layout: fixed; }
            /* Anchos proporcionados por columna */
            .products-only .products-table thead th:nth-child(1){ width:32%; }
            .products-only .products-table thead th:nth-child(2){ width:14%; }
            .products-only .products-table thead th:nth-child(3){ width:14%; }
            .products-only .products-table thead th:nth-child(4){ width:14%; }
            .products-only .products-table thead th:nth-child(5){ width:10%; }
            .products-only .products-table thead th:nth-child(6){ width:8%; }
            .products-only .products-table thead th:nth-child(7){ width:8%; }
            /* Respiro entre Variable3 y Peso por pieza */
            .products-only .products-table th.var-col, .products-only .products-table td.var-col { padding-right: 16px; }
            @media (max-width: 1100px){ .products-only .products-table { table-layout:auto; } }
          `;
          document.head.appendChild(st);
        }
        if (!document.getElementById('prod-table-aesthetic')) {
          const st2 = document.createElement('style');
          st2.id = 'prod-table-aesthetic';
          st2.textContent = `
            .products-only { border:1px solid rgba(0,0,0,.2); border-radius:12px; overflow:hidden; box-shadow: 0 10px 24px rgba(0,0,0,.22); background: var(--panel); }
            body.light .products-only { border-color: #e5e7eb; box-shadow: 0 8px 18px rgba(0,0,0,.06); background: #fff; }
            .products-only .products-table { width:100%; border-collapse: separate; border-spacing:0; table-layout: fixed; }
            .products-only .products-table col { width: calc(100% / 7) !important; }
            .products-only .products-table th, .products-only .products-table td { padding: 12px 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .products-only .products-table thead th { font-weight:700; color: var(--text); background: rgba(255,255,255,.03); border-bottom:1px solid rgba(0,0,0,.25); }
            body.light .products-only .products-table thead th { background:#f3f4f6; border-bottom-color:#e5e7eb; }
            .products-only .products-table thead th small { display:block; margin-top:2px; font-weight:600; color: var(--muted); opacity:.9; }
            .products-only .products-table thead th:nth-child(6),
            .products-only .products-table thead th:nth-child(7),
            .products-only .products-table tbody td:nth-child(6),
            .products-only .products-table tbody td:nth-child(7){ text-align:center; }
            .products-only .products-table tbody tr { border-bottom:1px solid rgba(0,0,0,.18); }
            .products-only .products-table tbody tr { height: 56px; }
            .products-only .products-table tbody td { vertical-align: middle; }
            .products-only .products-table tbody tr:nth-child(even) { background: rgba(255,255,255,.02); }
            body.light .products-only .products-table tbody tr:nth-child(even) { background:#fafafa; }
            .products-only .products-table tbody tr:hover { background: rgba(255,255,255,.06); }
            body.light .products-only .products-table tbody tr:hover { background:#f5f7ff; }
          `;
          document.head.appendChild(st2);
        }
      } catch(_) {}

      // Handlers
      bindClientsHubTabs();
      try { const h=view.querySelector('h2'); if (h) h.textContent='Gestión de Productos'; } catch(_){ }
      document.getElementById('prodSearch')?.addEventListener('input', (e)=>{ const el=e.target; const s=el.selectionStart, t=el.selectionEnd; q = el.value; page = 1; render(); try{ const inp=document.getElementById('prodSearch'); if(inp){ inp.focus({preventScroll:true}); if(typeof s==='number'&&typeof t==='number') inp.setSelectionRange(s,t); } }catch(_){} });
      // PaginaciÃ³n fija de 10 por Pagina
      document.getElementById('prevPg')?.addEventListener('click', ()=>{ if (page>1){ page--; render(); } });
      document.getElementById('nextPg')?.addEventListener('click', ()=>{ page++; render(); });

      document.getElementById('btnNewProd')?.addEventListener('click', async () => {
        const fields = [
          { name: 'idprod', label: 'IDProduto' },
          { name: 'nombre', label: 'Nombre' },
          { name: 'variable1', label: 'Color' },
          { name: 'variable2', label: 'Tamaño' },
          { name: 'variable3', label: 'Material' },
          { name: 'peso_por_pieza', label: 'Peso por pieza', type: 'number', step: '0.01' },
          { name: 'imagen', label: 'Imagen' },
        ];
        openFormModal('Registrar Producto', fields, {}, async (obj) => { await API.apiPost('/products', obj); try { if (window.showCenterAlert) await window.showCenterAlert('Registro exitoso', 'Productos'); else if (window.showAlert) await window.showAlert('Registro exitoso'); } catch(_) {} loadProducts(); });
        // Restablecer layout del modal para Productos (sin forzar una columna)
        try {
          const modal = document.getElementById('modal');
          const form = document.getElementById('modalForm');
          form?.classList.remove('onecol');
          const dialog = modal?.querySelector('.modal-dialog');
          dialog?.classList.remove('small');
        } catch(_) {}
        // Imagen: contenedor ocupa todo el espacio y la imagen centrada
        try {
          const form = document.getElementById('modalForm');
          const imgInput = form?.querySelector('input[name="imagen"], select[name="imagen"]');
          const imgLabel = imgInput?.closest('label');
          // DiseÃ±o actualizado maneja la preview con .image-row, no forzar clases legacy
          const imgPrev = form?.querySelector('img.img-preview[data-preview-for="imagen"]');
          if (imgPrev && imgPrev.getAttribute('src')) imgLabel?.classList.add('has-preview');
        } catch(_) {}
      });
      // Ampliar imagen al hacer clic
      Array.from(document.querySelectorAll('.prod-img-thumb')).forEach(img => {
        img.addEventListener('click', () => {
          const src = img.getAttribute('data-img');
          if (src) openImageModal(src, 'Imagen de Producto');
        });
      });
      document.querySelectorAll('button[data-act="edit"]').forEach((btn) => btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const current = await API.apiGet(`/products/${id}`);
        const fields = [
          { name: 'idprod', label: 'IDProduto' },
          { name: 'nombre', label: 'Nombre' },
          { name: 'variable1', label: 'Color' },
          { name: 'variable2', label: 'Tamaño' },
          { name: 'variable3', label: 'Material' },
          { name: 'peso_por_pieza', label: 'Peso por pieza', type: 'number', step: '0.01' },
          { name: 'imagen', label: 'Imagen' },
        ];
        openFormModal('Editar Producto', fields, current, async (obj) => { await API.apiPut(`/products/${id}`, obj); loadProducts(); });
        // Restablecer layout del modal para Productos (sin forzar una columna)
        try {
          const modal = document.getElementById('modal');
          const form = document.getElementById('modalForm');
          form?.classList.remove('onecol');
          const dialog = modal?.querySelector('.modal-dialog');
          dialog?.classList.remove('small');
        } catch(_) {}
        // Mantener disposiciÃ³n por defecto del formulario de Producto (editar)
        try {
          const form = document.getElementById('modalForm');
          const imgInput = form?.querySelector('input[name="imagen"], select[name="imagen"]');
          const imgLabel = imgInput?.closest('label');
          if (imgLabel) imgLabel.classList.add('image-full');
          const imgPrev = form?.querySelector('img.img-preview[data-preview-for="imagen"]');
          if (imgPrev && imgPrev.getAttribute('src')) imgLabel?.classList.add('has-preview');
        } catch(_) {}
      }));
      document.querySelectorAll('button[data-act="del"]').forEach((btn) => btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!(await showConfirm('Eliminar producto',{ okText:'Eliminar', cancelText:'Cancelar' }))) return; await API.apiDelete(`/products/${id}`); loadProducts();
      }));
      document.querySelectorAll('button[data-act="view"]').forEach((btn) => btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const current = await API.apiGet(`/products/${id}`);
        const fields = [
          { name: 'idprod', label: 'IDProduto' },
          { name: 'nombre', label: 'Nombre' },
          { name: 'variable1', label: 'Color' },
          { name: 'variable2', label: 'Tamaño' },
          { name: 'variable3', label: 'Material' },
          { name: 'peso_por_pieza', label: 'Peso por pieza' },
          { name: 'imagen', label: 'Imagen' },
        ];
        openFormModal('Detalle de Producto', fields, current, null);
        // Restablecer layout del modal para Productos (sin forzar una columna)
        try {
          const modal = document.getElementById('modal');
          const form = document.getElementById('modalForm');
          form?.classList.remove('onecol');
          const dialog = modal?.querySelector('.modal-dialog');
          dialog?.classList.remove('small');
        } catch(_) {}
        // Mantener disposiciÃ³n por defecto del formulario de Producto (detalle)
        try {
          const form = document.getElementById('modalForm');
          const imgInput = form?.querySelector('input[name="imagen"], select[name="imagen"]');
          const imgLabel = imgInput?.closest('label');
          if (imgLabel) imgLabel.classList.add('image-full');
          const imgPrev = form?.querySelector('img.img-preview[data-preview-for="imagen"]');
          if (imgPrev && imgPrev.getAttribute('src')) imgLabel?.classList.add('has-preview');
        } catch(_) {}
      }));
    }

    render();
  } catch (e) {
    console.error(e);
    view.innerHTML = '<p>Sin permisos para ver productos.</p>';
  }
}

// ---- Clients (DiseÃ±o tipo Usuarios) ----
async function loadClients() {
  try {
    const data = await API.apiGet('/clients');
    let q = '';
    let page = 1;
    let pageSize = 10;

    function render(){
      const search = q.trim().toLowerCase();
      const rowsAll = (data||[]).filter(r => !search || `${r.idclie||''} ${r.nombre||''} ${r.observaciones||''}`.toLowerCase().includes(search));
      const pages = Math.max(1, Math.ceil(rowsAll.length / pageSize));
      if (page > pages) page = pages;
      const start = (page - 1) * pageSize;
      const slice = rowsAll.slice(start, start + pageSize);

      const rows = slice.map(r => `
        <tr>
          <td class="user-cell">
            <span class="avatar-chip">${(r.nombre||'?').toString().slice(0,1).toUpperCase()}</span>
            <div>
              <div><strong>${r.nombre ?? ''}</strong></div>
              <div class="muted">${r.idclie ?? ''}</div>
            </div>
          </td>
          <td>${r.observaciones ?? ''}</td>
          <td class="ops">
            <button class="op-btn" data-act="edit" data-id="${r.id}" title="Editar" aria-label="Editar">✏️</button>
            <button class="op-btn danger" data-act="del" data-id="${r.id}" title="Borrar" aria-label="Borrar">🗑️</button>
          </td>
        </tr>`).join('');

      view.innerHTML = `
        <div class="page-header">
          <div class="page-title">Gestión de Clientes</div>
          <div class="page-subtitle">Administra y organiza la información de los clientes</div>
        </div>

        <div class="nav-pills">
          <button class="nav-pill active">?? Clientes</button>
          <button class="nav-pill">??? Tipo de Basura</button>
          <button class="nav-pill">?? Reporte Entradas</button>
          <button class="nav-pill">?? Reporte Entradas y salidas</button>
        </div>

        <div class="toolbar toolbar-bar">
          <div class="right tools-right">
            <div class="search"><input id="clieSearch" type="text" placeholder="Buscar Cliente" value="${q}"></div>
            <button class="btn-primary" id="btnNewClie">+ Registrar Cliente</button>
          </div>
        </div>

        <div class="table-wrap pretty">
          <table>
            <thead>
              <tr><th>Cliente</th><th>Observaciones</th><th>Acciones</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="pager">
          <div class="left">Mostrando ${rowsAll.length ? (start+1) : 0}-${Math.min(start+slice.length, rowsAll.length)} de ${rowsAll.length} clientes</div>
          <div class="right">
            <span style="margin:0 8px">Pagina ${page} / ${pages}</span>
            <button class="btn-secondary" id="prevPg" ${page<=1?'disabled':''}>Atrás</button>
            <button class="btn-secondary" id="nextPg" ${page>=pages?'disabled':''}>Siguiente</button>
          </div>
        </div>`;

      // Sustituir encabezado estÃ¡tico por barra de pestaÃ±as + tÃ­tulo contextual
      try {
        const header = view.querySelector('.page-header');
        if (header) header.remove();
        const oldPills = view.querySelector('.nav-pills');
        if (oldPills) oldPills.outerHTML = clientsHubHeader('clients');
        bindClientsHubTabs();
        const pills = view.querySelector('.nav-pills');
        if (pills) {
          const h2 = document.createElement('h2');
          h2.textContent = 'Gestión de Clientes';
          pills.insertAdjacentElement('afterend', h2);
        }
      } catch(_) {}

      // Handlers
      document.getElementById('clieSearch')?.addEventListener('input', (e)=>{ const el=e.target; const s=el.selectionStart, t=el.selectionEnd; q = el.value; page = 1; render(); try{ const inp=document.getElementById('clieSearch'); if(inp){ inp.focus({preventScroll:true}); if(typeof s==='number'&&typeof t==='number') inp.setSelectionRange(s,t); } }catch(_){} });
      document.getElementById('reloadClients')?.addEventListener('click', ()=>{ render(); });

      // Enlazar pÃ­ldoras de navegaciÃ³n (Clientes)
      try {
        const pills = view.querySelectorAll('.nav-pills .nav-pill');
        // 0 = Clientes (activa), 1 = Tipo de Basura, 2 = Reporte Entradas, 3 = Reporte Entradas y salidas
        pills[1]?.addEventListener('click', () => loadView('variables'));
        pills[2]?.addEventListener('click', () => { if (typeof loadReports === 'function') loadReports(); });
        pills[3]?.addEventListener('click', () => { if (typeof loadReports === 'function') loadReports(); });
      } catch(_) {}

      // ExportaciÃ³n de clientes (Excel/PDF) usando endpoints del backend
      function exportClients(kind){
        const base = (typeof window !== 'undefined' && window.API_BASE) || '/api';
        const endpoint = kind === 'excel' ? 'export/excel' : 'export/pdf';
        const url = `${base}/${endpoint}?kind=clients`;
        const token = localStorage.getItem('token');
        fetch(url, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
          .then(res => { if (!res.ok) return res.text().then(t=>{ throw new Error(t||'Error al exportar'); }); return res.blob(); })
          .then(blob => { const dl = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=dl; a.download = kind==='excel' ? 'clients.xlsx' : 'clients.pdf'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(dl); })
          .catch(err => { if (window.showAlert) window.showAlert(err.message || 'Error al exportar'); else alert(err.message || 'Error al exportar'); });
      }
      try {
        const leftTools = view.querySelector('.tools-left');
        const excelBtn = leftTools?.querySelector('.chip-btn.success');
        const pdfBtn = Array.from(leftTools?.querySelectorAll('.chip-btn') || []).find(b => (b.textContent||'').trim().toLowerCase() === 'pdf');
        excelBtn?.addEventListener('click', ()=> exportClients('excel'));
        pdfBtn?.addEventListener('click', ()=> exportClients('pdf'));
      } catch(_) {}

      // Ajustes solicitados: renombrar pestaÃ±as y destinos
      try {
        const titleEl = view.querySelector('.page-header .page-title');
        const subEl = view.querySelector('.page-header .page-subtitle');
        if (titleEl) titleEl.textContent = 'Gestión de Clientes';
        if (subEl) subEl.textContent = 'Administra y organiza la informaciÃ³n de los clientes';

        const tabs = view.querySelectorAll('.nav-pills .nav-pill');
        if (tabs[0]) tabs[0].textContent = 'Clientes';

        const remap = [
          { idx: 1, text: 'Usuarios', view: 'users' },
          { idx: 2, text: 'Productos', view: 'products' },
          { idx: 3, text: 'Operadores', view: 'operators' },
        ];
        remap.forEach(({ idx, text, view }) => {
          const t = tabs[idx];
          if (!t) return;
          const clone = t.cloneNode(true);
          clone.textContent = text;
          clone.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); loadView(view); });
          t.replaceWith(clone);
        });
      } catch(_) {}
      // paginaciÃ³n fija 10 por Pagina
      document.getElementById('prevPg')?.addEventListener('click', ()=>{ if (page>1){ page--; render(); } });
      document.getElementById('nextPg')?.addEventListener('click', ()=>{ page++; render(); });

      document.getElementById('btnNewClie')?.addEventListener('click', async () => {
        openClientLightModal(async (payload) => {
          await API.apiPost('/clients', payload);
          try { if (window.showAlert) await window.showAlert('Registrado exitosamente'); } catch(_) {}
          loadClients();
        });
      });
      document.querySelectorAll('button[data-act="edit"]').forEach((btn) => btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const current = await API.apiGet(`/clients/${id}`);
        const initial = { idclie: current?.idclie || '', nombre: current?.nombre || '', observaciones: current?.observaciones || '' };
        openClientLightModal(async (payload) => { await API.apiPut(`/clients/${id}`, payload); loadClients(); }, initial, 'Editar Cliente');
      }));
      document.querySelectorAll('button[data-act="del"]').forEach((btn) => btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!(await showConfirm('Eliminar cliente',{ okText:'Eliminar', cancelText:'Cancelar' }))) return; await API.apiDelete(`/clients/${id}`); loadClients();
      }));
      document.querySelectorAll('button[data-act="view"]').forEach((btn) => btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const current = await API.apiGet(`/clients/${id}`);
        const fields = ['idclie','nombre','observaciones'];
        openFormModal('Detalle de Cliente', fields, current, null);
        // Modo solo lectura
        try {
          const modal = document.getElementById('modal');
          const form = document.getElementById('modalForm');
          modal?.querySelector('button[type="submit"]')?.setAttribute('style','display:none');
          form?.querySelectorAll('input,textarea,select')?.forEach(el => el.setAttribute('disabled','disabled'));
        } catch(_) {}
      }));
    }

    render();
  } catch (e) {
    console.error(e);
    view.innerHTML = '<p>Sin permisos para ver clientes.</p>';
  }
}

// ---- Inventory (DiseÃ±o tipo Clientes) ----
async function loadInventory(){
  try{
    const data = await API.apiGet('/inventory');
    let q = '';
    let page = 1;
    let pageSize = 10;

    function render(){
      const search = q.trim().toLowerCase();
      const rowsAll = (data||[]).filter(r => {
        const cliente = typeof r.cliente === 'object' ? (r.cliente?.nombre||'') : (r.cliente||'');
        const producto = typeof r.producto === 'object' ? (r.producto?.nombre||'') : (r.producto||'');
        return !search || `${r.fecha||''} ${r.codigo_mr||''} ${r.descripcion||''} ${r.cantidad||''} ${producto} ${cliente}`.toLowerCase().includes(search);
      });
      const pages = Math.max(1, Math.ceil(rowsAll.length / pageSize));
      if (page > pages) page = pages;
      const start = (page - 1) * pageSize;
      const slice = rowsAll.slice(start, start + pageSize);

      const rows = slice.map(r => {
  const tds = cols.map(k => {
    const v = r[k];
    if (String(k).toLowerCase()==='imagen' && typeof v === 'string' && v) {
      return '<td>' + (v ? '<img class="prod-img-thumb" data-img="' + v + '" src="' + v + '" alt="img" style="width:48px;height:48px;object-fit:cover;border-radius:6px;border:1px solid #2b3440;cursor:zoom-in;"/>' : '') + '</td>';
    }
    const cell = (v && typeof v === 'object') ? (v.nombre || v.id || '') : (v ?? '');
    return '<td>' + cell + '</td>';
  }).join('');
  return '<tr>' + tds + '<td class="ops"><button class="op-btn" data-act="edit" data-id="' + r.id + '" title="Editar" aria-label="Editar">✏️</button> <button class="op-btn danger" data-act="del" data-id="' + r.id + '" title="Borrar" aria-label="Borrar">🗑️</button></td></tr>';
}).join('');

      view.innerHTML = `
        <div class="page-header">
          <div class="page-title">Gestión de Inventario</div>
          <div class="page-subtitle">Administra los registros de inventario</div>
        </div>

        <div class="toolbar toolbar-bar">
          <div class="left tools-left">
            <button class="chip-btn success">Excel</button>
            <button class="chip-btn">PDF</button>          </div>
          <div class="spacer"></div>
          <div class="right tools-right">
            <div class="search"><input id="invSearch" type="text" placeholder="Buscar en inventario" value="${q}"></div>
            <button class="btn-primary" id="btnNewInv">+ Registrar Movimiento</button>
          </div>
        </div>

        <div class="table-wrap pretty">
          <table>
            <thead>
              <tr><th>Fecha</th><th>CÃ³digo MR</th><th>DescripciÃ³n</th><th>Cantidad</th><th>Producto</th><th>Cliente</th><th>Acciones</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="pager">
          <div class="left">Mostrando ${rowsAll.length ? (start+1) : 0}-${Math.min(start+slice.length, rowsAll.length)} de ${rowsAll.length} registros</div>
          <div class="right">
            <span style="margin:0 8px">Pagina ${page} / ${pages}</span>
            <button class="btn-secondary" id="prevPg" ${page<=1?'disabled':''}>Atrás</button>
            <button class="btn-secondary" id="nextPg" ${page>=pages?'disabled':''}>Siguiente</button>
          </div>
        </div>`;

      document.getElementById('reloadInv')?.addEventListener('click', ()=>{ render(); });
      document.getElementById('invSearch')?.addEventListener('input', (e)=>{ const el=e.target; const s=el.selectionStart, t=el.selectionEnd; q = el.value; page = 1; render(); try{ const inp=document.getElementById('invSearch'); if(inp){ inp.focus({preventScroll:true}); if(typeof s==='number'&&typeof t==='number') inp.setSelectionRange(s,t); } }catch(_){} });
      // paginaciÃ³n fija 10 por Pagina
      document.getElementById('prevPg')?.addEventListener('click', ()=>{ if (page>1){ page--; render(); } });
      document.getElementById('nextPg')?.addEventListener('click', ()=>{ page++; render(); });

      document.getElementById('btnNewInv')?.addEventListener('click', async () => {
        const fields = ['fecha','codigo_mr','descripcion', { name: 'cantidad', label: 'Cantidad', type: 'number', step: 'any' }, 'producto_id','cliente_id'];
        openFormModal('Registrar Movimiento', fields, {}, async (obj) => { await API.apiPost('/inventory', obj); try { if (window.showAlert) await window.showAlert('Registrado exitosamente'); } catch(_) {} loadInventory(); });
      });
      document.querySelectorAll('button[data-act="edit"]').forEach((btn) => btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const current = await API.apiGet(`/inventory/${id}`);
        const fields = ['fecha','codigo_mr','descripcion', { name: 'cantidad', label: 'Cantidad', type: 'number', step: 'any' }, 'producto_id','cliente_id'];
        openFormModal('Editar Movimiento', fields, current, async (obj) => { await API.apiPut(`/inventory/${id}`, obj); loadInventory(); });
      }));
      document.querySelectorAll('button[data-act="del"]').forEach((btn) => btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!(await showConfirm('Eliminar registro',{ okText:'Eliminar', cancelText:'Cancelar' }))) return; await API.apiDelete(`/inventory/${id}`); loadInventory();
      }));
      document.querySelectorAll('button[data-act="view"]').forEach((btn) => btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const current = await API.apiGet(`/inventory/${id}`);
        const fields = ['fecha','codigo_mr','descripcion','cantidad','producto_id','cliente_id'];
        openFormModal('Detalle de Movimiento', fields, current, null);
      }));
    }

    render();
  } catch(e){
    console.error(e);
    view.innerHTML = '<p>Sin permisos para ver inventario.</p>';
  }
}

// ---- Proceso/ProducciÃ³n (DiseÃ±o tipo Clientes) ----
async function loadProduction(){
  try{
    const data = await API.apiGet('/production');
    let q = '';
    let page = 1;
    let pageSize = 10;

    function render(){
      const search = q.trim().toLowerCase();
      const rowsAll = (data||[]).filter(r => {
        const cliente = (r.cliente && (r.cliente.nombre||r.cliente)) || '';
        const producto = (r.producto && (r.producto.nombre||r.producto)) || '';
        return !search || `${r.op||''} ${cliente} ${producto} ${r.piezas||''} ${r.lote||''}`.toLowerCase().includes(search);
      });
      const pages = Math.max(1, Math.ceil(rowsAll.length / pageSize));
      if (page > pages) page = pages;
      const start = (page - 1) * pageSize;
      const slice = rowsAll.slice(start, start + pageSize);

      const rows = slice.map(r => `
        <tr>
          <td>${r.op ?? ''}</td>
          <td>${(r.cliente && (r.cliente.nombre||r.cliente)) || ''}</td>
          <td>${(r.producto && (r.producto.nombre||r.producto)) || ''}</td>
          <td>${r.variable1 ?? ''}</td>
          <td>${r.variable2 ?? ''}</td>
          <td>${r.variable3 ?? ''}</td>
          <td>${r.empaques ?? ''}</td>
          <td>${r.piezas ?? ''}</td>
          <td>${r.lote ?? ''}</td>
          <td>${r.imagen ? `<img class="prod-img-thumb" data-img="${r.imagen}" src="${r.imagen}" alt="img" style="max-height:32px;border-radius:4px;">` : ''}</td>
          <td class="ops">
            <button class="op-btn" data-act="edit" data-id="${r.id}" title="Editar" aria-label="Editar">✏️</button>
            <button class="op-btn danger" data-act="del" data-id="${r.id}" title="Borrar" aria-label="Borrar">🗑️</button>
          </td>
        </tr>`).join('');

      view.innerHTML = `
        <div class="page-header">
          <div class="page-title">Gestión de Producción</div>
          <div class="page-subtitle">Administra las Ordenes de proceso/producción</div>
        </div>


        <div class="toolbar toolbar-bar">
          <div class="left tools-left">
            <div class="search"><input id="procSearch" type="text" placeholder="Buscar en proceso" value="${q}"></div>
            <button class="btn-primary" id="btnNewProc">+ Registrar Proceso</button>
          </div>
          <div class="spacer"></div>
          <div class="right tools-right"></div>
        </div>

        <div class="table-wrap pretty">
          <table>
            <thead>
              <tr><th>OP</th><th>Cliente</th><th>Producto</th><th>Color</th><th>Tamaño</th><th>Material</th><th>Empaques</th><th>Piezas</th><th>Lote</th><th>Imagen</th><th>Acciones</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="pager">
          <div class="left">Mostrando ${rowsAll.length ? (start+1) : 0}-${Math.min(start+slice.length, rowsAll.length)} de ${rowsAll.length} procesos</div>
          <div class="right">
            <span style="margin:0 8px">Pagina ${page} / ${pages}</span>
            <button class="btn-secondary" id="prevPg" ${page<=1?'disabled':''}>Atrás</button>
            <button class="btn-secondary" id="nextPg" ${page>=pages?'disabled':''}>Siguiente</button>
          </div>
        </div>`;
      document.getElementById('reloadProc')?.addEventListener('click', ()=>{ render(); });
      document.getElementById('procSearch')?.addEventListener('input', (e)=>{ const el=e.target; const s=el.selectionStart, t=el.selectionEnd; q = el.value; page = 1; render(); try{ const inp=document.getElementById('procSearch'); if(inp){ inp.focus({preventScroll:true}); if(typeof s==='number'&&typeof t==='number') inp.setSelectionRange(s,t); } }catch(_){} });
      // paginaciÃ³n fija 10 por Pagina
     document.getElementById('prevPg')?.addEventListener('click', ()=>{ if (page>1){ page--; render(); } });
      document.getElementById('nextPg')?.addEventListener('click', ()=>{ page++; render(); });
      // Imagen ampliable
       // Ampliar imagen al hacer clic
      Array.from(document.querySelectorAll('.prod-img-thumb')).forEach(img => {
        img.addEventListener('click', () => {
          const src = img.getAttribute('data-img');
          if (src) openImageModal(src, 'Imagen de Proceso');
        });
      });
      

      document.getElementById('btnNewProc')?.addEventListener('click', async () => {
        // Cargar catÃ¡logos para selects
        let clientes = [], productos = [];
        try { clientes = await API.apiGet('/clients'); } catch(_) { clientes = []; }
        try { productos = await API.apiGet('/products'); } catch(_) { productos = []; }
        const clientOpts = (clientes||[]).map(c => ({ value: c.id, text: `${c.idclie || ''} ${c.nombre || ''}`.trim() || c.id }));
        const prodOpts = (productos||[]).map(p => ({ value: p.id, text: `${p.idprod || ''} ${p.nombre || ''}`.trim() || p.id }));
        const uniq = (arr)=> Array.from(new Set((arr||[]).filter(Boolean)));
        const colorOpts = uniq((productos||[]).map(p=>p.variable1));
        const sizeOpts = uniq((productos||[]).map(p=>p.variable2));
        const materialOpts = uniq((productos||[]).map(p=>p.variable3));
        const imgMapEdit = {}; (productos||[]).forEach(p=>{ if(p && p.imagen){ const t = `${p.idprod||''} ${p.nombre||''}`.trim() || p.imagen; if(!imgMapEdit[p.imagen]) imgMapEdit[p.imagen]=t; } });
        const imgOptsEdit = Object.entries(imgMapEdit).map(([value,text])=>({ value, text }));
        const __imgMapView = {}; (productos||[]).forEach(p=>{ if(p && p.imagen){ const t = `${p.idprod||''} ${p.nombre||''}`.trim() || p.imagen; if(!__imgMapView[p.imagen]) __imgMapView[p.imagen]=t; } });
        const __imgOptsView = Object.entries(__imgMapView).map(([value,text])=>({ value, text }));
        const __imgMapEdit = {}; (productos||[]).forEach(p=>{ if(p && p.imagen){ const t = `${p.idprod||''} ${p.nombre||''}`.trim() || p.imagen; if(!__imgMapEdit[p.imagen]) __imgMapEdit[p.imagen]=t; } });
        const __imgOptsEdit = Object.entries(__imgMapEdit).map(([value,text])=>({ value, text }));
        const __imgMapNew = {}; (productos||[]).forEach(p=>{ if(p && p.imagen){ const t = `${p.idprod||''} ${p.nombre||''}`.trim() || p.imagen; if(!__imgMapNew[p.imagen]) __imgMapNew[p.imagen]=t; } });
        const __imgOptsNew = Object.entries(__imgMapNew).map(([value,text])=>({ value, text }));
        const fields = [
          'op',
          { name: 'cliente_id', label: 'Cliente', type: 'select', options: clientOpts },
          { name: 'producto_id', label: 'Producto', type: 'select', options: prodOpts },
          { name: 'variable1', label: 'Color', type: 'select', options: colorOpts },
          { name: 'variable2', label: 'Tamaño', type: 'select', options: sizeOpts },
          { name: 'variable3', label: 'Material', type: 'select', options: materialOpts },
          'empaques', { name: 'piezas', label: 'Piezas', type: 'number', step: 'any' }, 'lote',
          { name: 'imagen', label: 'Imagen' },
        ];
        openFormModal('Registrar Proceso', fields, {}, async (obj) => { 
          await API.apiPost('/production', obj);
          try { if (window.showCenterAlert) await window.showCenterAlert('Registro exitoso', 'Procesos'); else if (window.showAlert) await window.showAlert('Registro exitoso'); } catch(_) {}
          loadProduction();
        });
        // Forzar formulario vacío y sin autocompletar (Registrar Proceso)
        try {
          const modal = document.getElementById('modal');
          const form = document.getElementById('modalForm');
          const title = (document.getElementById('modalTitle')?.textContent || '').toLowerCase();
          if (form && title.includes('registrar proceso')){
            try { form.setAttribute('autocomplete','off'); } catch(_) {}
            try { form.querySelectorAll('input, textarea').forEach(el => { el.setAttribute('autocomplete','off'); el.setAttribute('autocapitalize','off'); el.setAttribute('spellcheck','false'); if (el.type !== 'file') el.value = ''; }); } catch(_) {}
            try {
              form.querySelectorAll('select').forEach(sel => {
                // Insertar placeholder inicial si no existe
                const hasPlaceholder = sel.querySelector('option[value=""]');
                if (!hasPlaceholder){
                  const opt = document.createElement('option');
                  opt.value = '';
                  opt.textContent = 'Seleccione...';
                  opt.selected = true;
                  sel.insertBefore(opt, sel.firstChild);
                }
                sel.value = '';
                sel.selectedIndex = 0;
              });
            } catch(_) {}
          }
        } catch(_) {}
        // Auto-rellenar variables e imagen desde producto
try {
  const form = document.getElementById('modalForm');
  const prodSel = form?.querySelector('select[name="producto_id"]');
  const imgInput = form?.querySelector('input[name="imagen"]');
  const loteLabel = form?.querySelector('input[name="lote"]')?.closest('label');
  const imgLabel = imgInput?.closest('label');
  if (imgLabel) {
    try {
      imgLabel.classList.remove('image-full');
      imgLabel.style.removeProperty('grid-column');
      const imgSlot = imgLabel.querySelector('.img-slot');
      if (imgSlot) imgSlot.style.display = 'none';
      const embPrev = imgLabel.querySelector('img.img-preview[data-preview-for="imagen"]');
      if (embPrev) embPrev.style.display = 'none';
    } catch(_) {}
  }
  try { if (loteLabel) loteLabel.style.gridColumn = 'auto'; } catch(_) {}
  // Nombre del archivo dentro del label (con recuadro como los demás campos)
  let nameBox = imgLabel?.querySelector('.file-name[data-file-for="imagen"]');
  if (!nameBox && imgLabel){
    nameBox = document.createElement('div');
    nameBox.className = 'file-name';
    nameBox.setAttribute('data-file-for','imagen');
    imgLabel.appendChild(nameBox);
  }
  // Preview (debajo de la columna Imagen)
  let preview = form?.querySelector('img.img-preview[data-preview-for="imagen"]');
  if (!preview){
    preview = document.createElement('img');
    preview.className = 'img-preview';
    preview.setAttribute('data-preview-for','imagen');
    preview.style.display = 'none';
    preview.style.gridColumn = '1 / -1';
    if (imgLabel) { imgLabel.insertAdjacentElement('afterend', preview); } else { form.appendChild(preview); }
  }
  // Fila de acciones con botón seleccionar imagen (debajo del preview)
  let actionsRow = form?.querySelector('.img-actions-row');
  if (!actionsRow){
    actionsRow = document.createElement('div');
    actionsRow.className = 'img-actions-row';
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'btn-secondary'; btn.textContent = 'Seleccionar imagen';
    btn.addEventListener('click', ()=> imgInput?.click());
    actionsRow.appendChild(btn);
    if (preview && preview.parentElement === form){ preview.insertAdjacentElement('afterend', actionsRow); }
    else if (imgLabel) { imgLabel.insertAdjacentElement('afterend', actionsRow); try { actionsRow.parentElement?.insertBefore(preview, actionsRow); } catch(_) {} }
    else { form.appendChild(actionsRow); }
  }
  // Ocultar input nativo (usaremos el botón)
  try { if (imgInput){ imgInput.style.position='absolute'; imgInput.style.width='1px'; imgInput.style.height='1px'; imgInput.style.opacity='0'; imgInput.style.pointerEvents='none'; } } catch(_) {}
  // Campos visibles desde el inicio; se mantienen constantes
  // Cambio de archivo -> actualizar nombre y preview
  imgInput?.addEventListener('change', ()=>{
    const f = imgInput.files && imgInput.files[0];
    if (nameBox) nameBox.textContent = f ? (f.name || '') : '';
    if (f){ preview.src = URL.createObjectURL(f); preview.style.display='block'; }
    else { preview.removeAttribute('src'); preview.style.display='none'; }
  });const map = {}; (productos||[]).forEach(p => { map[p.id] = p; });
function applyFromProduct(id){
  const p = map[id]; if (!p) return;
  const v1 = form.querySelector('[name="variable1"]');
  const v2 = form.querySelector('[name="variable2"]');
  const v3 = form.querySelector('[name="variable3"]');
  if (v1 && !v1.value) v1.value = p.variable1 || '';
  if (v2 && !v2.value) v2.value = p.variable2 || '';
  if (v3 && !v3.value) v3.value = p.variable3 || '';
  if (p.imagen && preview){
    preview.src = p.imagen; preview.style.display='block';
    try { imgLabel?.classList.add('has-preview'); } catch(_) {}
    try { if (nameBox) nameBox.textContent = (p.imagen.split('/').pop()||''); } catch(_) {}
  }
}
prodSel?.addEventListener('change', ()=> applyFromProduct(Number(prodSel.value)));
if (prodSel && prodSel.value ) applyFromProduct(Number(prodSel.value));
        } catch(_) {}
      });
      document.querySelectorAll('button[data-act="edit"]').forEach((btn) => btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const current = await API.apiGet(`/production/${id}`);
        let clientes = [], productos = [];
        try { clientes = await API.apiGet('/clients'); } catch(_) { clientes = []; }
        try { productos = await API.apiGet('/products'); } catch(_) { productos = []; }
        const clientOpts = (clientes||[]).map(c => ({ value: c.id, text: `${c.idclie || ''} ${c.nombre || ''}`.trim() || c.id }));
        const prodOpts = (productos||[]).map(p => ({ value: p.id, text: `${p.idprod || ''} ${p.nombre || ''}`.trim() || p.id }));
        const uniq = (arr)=> Array.from(new Set((arr||[]).filter(Boolean)));
        const colorOpts = uniq((productos||[]).map(p=>p.variable1));
        const sizeOpts = uniq((productos||[]).map(p=>p.variable2));
        const materialOpts = uniq((productos||[]).map(p=>p.variable3));
        const imgMapEdit = {}; (productos||[]).forEach(p=>{ if(p && p.imagen){ const t = `${p.idprod||''} ${p.nombre||''}`.trim() || p.imagen; if(!imgMapEdit[p.imagen]) imgMapEdit[p.imagen]=t; } });
        const imgOptsEdit = Object.entries(imgMapEdit).map(([value,text])=>({ value, text }));
        const fields = [
          'op',
          { name: 'cliente_id', label: 'Cliente', type: 'select', options: clientOpts },
          { name: 'producto_id', label: 'Producto', type: 'select', options: prodOpts },
          { name: 'variable1', label: 'Color', type: 'select', options: colorOpts },
          { name: 'variable2', label: 'Tamaño', type: 'select', options: sizeOpts },
          { name: 'variable3', label: 'Material', type: 'select', options: materialOpts },
          'empaques', { name: 'piezas', label: 'Piezas', type: 'number', step: 'any' }, 'lote',
          { name: 'imagen', label: 'Imagen' },
        ];
        const currentForm = {
          op: current.op,
          cliente_id: current?.cliente?.id,
          producto_id: current?.producto?.id,
          variable1: current.variable1,
          variable2: current.variable2,
          variable3: current.variable3,
          empaques: current.empaques,
          piezas: current.piezas,
          lote: current.lote,
          imagen: current.imagen,
        };
        openFormModal('Editar Proceso', fields, currentForm, async (obj) => { await API.apiPut(`/production/${id}`, obj); loadProduction(); });
        // Sync variables/image when product changes
        try {
          const form = document.getElementById('modalForm');
          try { if (!document.getElementById('proc-img-fill-style')){ const st = document.createElement('style'); st.id = 'proc-img-fill-style'; st.textContent = `.img-preview.fill{width:100%;height:auto;max-height:360px;object-fit:contain;margin:0;display:block}`; document.head.appendChild(st); } } catch(_) {}
          try { if (!document.getElementById('proc-img-fill-style')){ const st = document.createElement('style'); st.id = 'proc-img-fill-style'; st.textContent = `.img-preview.fill{width:100%;height:auto;max-height:360px;object-fit:contain;margin:0;display:block}`; document.head.appendChild(st); } } catch(_) {}
          const prodSel = form?.querySelector('select[name="producto_id"]');
          let imgPrev = form?.querySelector('img.img-preview[data-preview-for="imagen"]');
          const imgSel = form?.querySelector('select[name="imagen"]');
          // Editar Proceso: mantener Imagen junto a Lote y botón debajo del preview
try {
  const form = document.getElementById('modalForm');
  const prodSel = form?.querySelector('select[name="producto_id"]');
  const imgSel = form?.querySelector('select[name="imagen"]');
  const loteLabel = form?.querySelector('input[name="lote"]')?.closest('label');
  const imgLabel = (form?.querySelector('input[type="file"][name="imagen"]')?.closest('label')) || imgSel?.closest('label');
  // Nombre del archivo dentro del label (con recuadro)
  let nameBox = imgLabel?.querySelector('.file-name[data-file-for="imagen"]');
  if (!nameBox && imgLabel){
    nameBox = document.createElement('div');
    nameBox.className = 'file-name';
    nameBox.setAttribute('data-file-for','imagen');
    imgLabel.appendChild(nameBox);
  }
  try {
    imgLabel?.classList.remove('image-full');
    imgLabel?.style.removeProperty('grid-column');
    const slot = imgLabel?.querySelector('.img-slot');
    if (slot) slot.style.display = 'none';
    const embedded = imgLabel?.querySelector('img.img-preview[data-preview-for="imagen"]');
    if (embedded) embedded.style.display = 'none';
  } catch(_) {}
  try { if (loteLabel) loteLabel.style.gridColumn = 'auto'; } catch(_) {}
  // Crear/ubicar preview y fila de acciones
  let preview = form.querySelector('img.img-preview[data-preview-for="imagen"]');
  if (!preview){
    preview = document.createElement('img'); preview.className='img-preview'; preview.setAttribute('data-preview-for','imagen'); preview.style.display='none'; preview.style.gridColumn='1 / -1';
    if (imgLabel) { imgLabel.insertAdjacentElement('afterend', preview); } else { form.appendChild(preview); }
  }
  let actionsRow = form.querySelector('.img-actions-row');
  const fileInputEdit = form.querySelector('input[type="file"][name="imagen"]');
  if (!actionsRow && fileInputEdit){
    actionsRow = document.createElement('div');
    actionsRow.className = 'img-actions-row';
    const btn = document.createElement('button'); btn.type='button'; btn.className='btn-secondary'; btn.textContent='Seleccionar imagen';
    btn.addEventListener('click', ()=> fileInputEdit.click());
    actionsRow.appendChild(btn);
    if (preview && preview.parentElement === form){ preview.insertAdjacentElement('afterend', actionsRow); }
    else if (imgLabel) { imgLabel.insertAdjacentElement('afterend', actionsRow); try { actionsRow.parentElement?.insertBefore(preview, actionsRow); } catch(_) {} }
    else { form.appendChild(actionsRow); }
  }
  // Cambio de archivo -> actualizar nombre y preview
  fileInputEdit?.addEventListener('change', ()=>{
    const f = fileInputEdit.files && fileInputEdit.files[0];
    if (nameBox) nameBox.textContent = f ? (f.name || '') : '';
    if (f){ preview.src = URL.createObjectURL(f); preview.style.display='block'; imgLabel?.classList.add('has-preview'); }
    else { preview.removeAttribute('src'); preview.style.display='none'; imgLabel?.classList.remove('has-preview'); }
  });
  // Mostrar preview inicial si hay imagen
  const imgPrev = preview;
  try {
    const initial = (typeof current?.imagen === 'string' && current.imagen) ? current.imagen : (imgSel?.value || '');
    if (imgPrev && initial){ imgPrev.src = initial; imgPrev.style.display = 'block'; imgLabel?.classList.add('has-preview'); try { if (nameBox) nameBox.textContent = (initial.split('/').pop()||''); } catch(_) {} }
  } catch(_) {}
  // Actualizar preview al cambiar el select de imagen (editar)
  try {
    const sel = form?.querySelector('select[name="imagen"]');
    if (sel){
      sel.addEventListener('change', ()=>{
        if (!imgPrev) return;
        const v = sel.value || '';
        if (v){ imgPrev.src = v; imgPrev.style.display='block'; }
        else { imgPrev.removeAttribute('src'); imgPrev.style.display='none'; }
      });
    }
  } catch(_) {}
} catch(_) {}
// Asegurar que el preview quede visible tras ajustes de Editar Proceso
try {
  const form = document.getElementById('modalForm');
  const fileInput = form?.querySelector('input[type="file"][name="imagen"]');
  const imgLabel = fileInput?.closest('label');
  const imgPrev = form?.querySelector('img.img-preview[data-preview-for="imagen"]') || imgLabel?.querySelector('img.img-preview[data-preview-for="imagen"]');
  const val = (typeof current?.imagen === 'string' ? current.imagen : '') || '';
  if (imgPrev && val){ imgPrev.style.display='block'; imgPrev.src = val; imgLabel?.classList.add('has-preview'); }
} catch(_) {}
const map = {}; (productos||[]).forEach(p => { map[p.id] = p; });
function applyFromProduct(id){
  const p = map[id]; if (!p) return;
  const v1 = form.querySelector('[name="variable1"]');
  const v2 = form.querySelector('[name="variable2"]');
  const v3 = form.querySelector('[name="variable3"]');
  if (v1 && !v1.value) v1.value = p.variable1 || '';
  if (v2 && !v2.value) v2.value = p.variable2 || '';
  if (v3 && !v3.value) v3.value = p.variable3 || '';
  if (p.imagen && preview){
    preview.src = p.imagen; preview.style.display='block';
    try { imgLabel?.classList.add('has-preview'); } catch(_) {}
    try { if (nameBox) nameBox.textContent = (p.imagen.split('/').pop()||''); } catch(_) {}
  }
}
prodSel?.addEventListener('change', ()=> applyFromProduct(Number(prodSel.value)));
if (prodSel && prodSel.value ) applyFromProduct(Number(prodSel.value));
        } catch(_) {}
      }));
      document.querySelectorAll('button[data-act="del"]').forEach((btn) => btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!(await showConfirm('Eliminar proceso',{ okText:'Eliminar', cancelText:'Cancelar' }))) return; await API.apiDelete(`/production/${id}`); loadProduction();
      }));
      document.querySelectorAll('button[data-act="view"]').forEach((btn) => btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const current = await API.apiGet(`/production/${id}`);
        let clientes = [], productos = [];
        try { clientes = await API.apiGet('/clients'); } catch(_) { clientes = []; }
        try { productos = await API.apiGet('/products'); } catch(_) { productos = []; }
        const clientOpts = (clientes||[]).map(c => ({ value: c.id, text: `${c.idclie || ''} ${c.nombre || ''}`.trim() || c.id }));
        const prodOpts = (productos||[]).map(p => ({ value: p.id, text: `${p.idprod || ''} ${p.nombre || ''}`.trim() || p.id }));
        const uniq = (arr)=> Array.from(new Set((arr||[]).filter(Boolean)));
        const colorOpts = uniq((productos||[]).map(p=>p.variable1));
        const sizeOpts = uniq((productos||[]).map(p=>p.variable2));
        const materialOpts = uniq((productos||[]).map(p=>p.variable3));
        const imgMapView = {}; (productos||[]).forEach(p=>{ if(p && p.imagen){ const t = `${p.idprod||''} ${p.nombre||''}`.trim() || p.imagen; if(!imgMapView[p.imagen]) imgMapView[p.imagen]=t; } });
        const imgOptsView = Object.entries(imgMapView).map(([value,text])=>({ value, text }));
        const fields = [
          'op',
          { name: 'cliente_id', label: 'Cliente', type: 'select', options: clientOpts },
          { name: 'producto_id', label: 'Producto', type: 'select', options: prodOpts },
          { name: 'variable1', label: 'Color', type: 'select', options: colorOpts },
          { name: 'variable2', label: 'Tamaño', type: 'select', options: sizeOpts },
          { name: 'variable3', label: 'Material', type: 'select', options: materialOpts },
          'empaques', { name: 'piezas', label: 'Piezas', type: 'number', step: 'any' }, 'lote',
          { name: 'imagen', label: 'Imagen', type: 'select', options: imgOptsView },
        ];
        const currentForm = {
          op: current.op,
          cliente_id: current?.cliente?.id,
          producto_id: current?.producto?.id,
          variable1: current.variable1,
          variable2: current.variable2,
          variable3: current.variable3,
          empaques: current.empaques,
          piezas: current.piezas,
          lote: current.lote,
          imagen: current.imagen,
        };
        openFormModal('Detalle de Proceso', fields, currentForm, null);
        try {
          // Mostrar imagen si existe
          const modal = document.getElementById('modal');
          const form = document.getElementById('modalForm');
          let imgPrev = form?.querySelector('img.img-preview[data-preview-for="imagen"]');
          // Mantener preview dentro del label.image-full
          try {
            const imgSel = form?.querySelector('select[name="imagen"]');
            const imgLabel = imgSel?.closest('label');
            const embeddedPrev = imgLabel?.querySelector('img.img-preview[data-preview-for="imagen"]');
            if (embeddedPrev) { imgPrev = embeddedPrev; }
          } catch(_) {}
          if (imgPrev && current.imagen){ imgPrev.src = current.imagen; imgPrev.style.display='block'; }
          // Modo solo lectura: ocultar guardar y deshabilitar campos
          modal?.querySelector('button[type="submit"]')?.setAttribute('style','display:none');
          form?.querySelectorAll('input,textarea,select,button')?.forEach(el => { if (el.getAttribute('data-close') === null) el.setAttribute('disabled','disabled'); });
        } catch(_) {}
      }));
    }

    render();
  } catch(e){
    console.error(e);
    view.innerHTML = '<p>Sin permisos para ver procesos.</p>';
  }
}

// ---- Operators (DiseÃ±o tipo Usuarios) ----
async function loadOperators() {
  try {
    const data = await API.apiGet('/operators');
    let q = '';
    let page = 1;
    let pageSize = 10;

    function render(){
      const search = q.trim().toLowerCase();
      const rowsAll = (data||[]).filter(r => !search || `${r.nombre||''} ${r.rfid||''} ${r.estacion||''}`.toLowerCase().includes(search));
      const pages = Math.max(1, Math.ceil(rowsAll.length / pageSize));
      if (page > pages) page = pages;
      const start = (page - 1) * pageSize;
      const slice = rowsAll.slice(start, start + pageSize);

      const rows = slice.map(r => `
        <tr>
          <td class="user-cell">
            <span class="avatar-chip">${(r.nombre||'?').toString().slice(0,1).toUpperCase()}</span>
            <div>
              <div><strong>${r.nombre ?? ''}</strong></div>
              <div class="muted">RFID: ${r.rfid ?? ''}</div>
            </div>
          </td>
          <td>${r.estacion ?? ''}</td>
          <td class="ops">
            <button class="op-btn" data-act="edit" data-id="${r.id}" title="Editar">✏️</button>
            <button class="op-btn danger" data-act="del" data-id="${r.id}" title="Borrar">🗑️</button>
          </td>
        </tr>`).join('');

      view.innerHTML = clientsHubHeader('operators') + `
        <h2>Operadores</h2>
        <div class="toolbar toolbar-bar">
          <div class="left tools-left">
            <div class="search"><input id="opSearch" type="text" placeholder="Buscar operadores..." value="${q}"></div>
            <button class="btn-primary" id="btnNewOp">+ Registrar Operador</button>
          </div>
          <div class="spacer"></div>
          <div class="right tools-right"></div>
        </div>
        <div class="table-wrap pretty">
          <table>
            <thead>
              <tr><th>Operador</th><th>Estación</th><th>Acciones</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="pager">
          <div class="left">Mostrando ${rowsAll.length ? (start+1) : 0}-${Math.min(start+slice.length, rowsAll.length)} de ${rowsAll.length} operadores</div>
          <div class="right">
            
            <span style="margin:0 8px">Pagina ${page} / ${pages}</span>
            <button class="btn-secondary" id="prevPg" ${page<=1?'disabled':''}>Atrás</button>
            <button class="btn-secondary" id="nextPg" ${page>=pages?'disabled':''}>Siguiente</button>
          </div>
        </div>`;

      // Alinear barra inferior como Productos (sin selectores de Tamaño)
      try {
        document.getElementById('pg10')?.remove();
        document.getElementById('pg20')?.remove();
        document.getElementById('pg50')?.remove();
      } catch(_) {}
      // Aplicar clase de estilos para Operadores
      try { view.classList.add('operators-view'); } catch(_) {}

      // Handlers
      bindClientsHubTabs();
      try { const h=view.querySelector('h2'); if (h) h.textContent='Gestión de Operadores'; } catch(_){ }
      // Estilos de tabla para Operadores (modo claro/oscuro)
      if (!document.getElementById('ops-table-aesthetic')){
        const st = document.createElement('style');
        st.id = 'ops-table-aesthetic';
        st.textContent = `
          .operators-view .table-wrap { border:1px solid rgba(0,0,0,.2); border-radius:12px; overflow:hidden; box-shadow: 0 10px 24px rgba(0,0,0,.22); background: var(--panel); }
          body.light .operators-view .table-wrap { border-color:#e5e7eb; box-shadow: 0 8px 18px rgba(0,0,0,.06); background:#fff; }
          .operators-view table { width:100%; border-collapse: separate; border-spacing:0; table-layout: fixed; }
          .operators-view th, .operators-view td { padding:12px 14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
          .operators-view thead th { font-weight:700; color: var(--text); background: rgba(255,255,255,.03); border-bottom:1px solid rgba(0,0,0,.25); }
          body.light .operators-view thead th { background:#f3f4f6; border-bottom-color:#e5e7eb; }
          .operators-view tbody tr { border-bottom:1px solid rgba(0,0,0,.18); height:56px; }
          .operators-view tbody td { vertical-align: middle; }
          .operators-view tbody tr:nth-child(even){ background: rgba(255,255,255,.02); }
          body.light .operators-view tbody tr:nth-child(even){ background:#fafafa; }
          .operators-view tbody tr:hover{ background: rgba(255,255,255,.06); }
          body.light .operators-view tbody tr:hover{ background:#f5f7ff; }
          .operators-view thead th:last-child,
          .operators-view tbody td:last-child{ text-align:center; }
        `;
        document.head.appendChild(st);
      }
      document.getElementById('opSearch')?.addEventListener('input', (e)=>{ const el=e.target; const s=el.selectionStart, t=el.selectionEnd; q = el.value; page = 1; render(); try{ const inp=document.getElementById('opSearch'); if(inp){ inp.focus({preventScroll:true}); if(typeof s==='number'&&typeof t==='number') inp.setSelectionRange(s,t); } }catch(_){} });
      // paginaciÃ³n fija 10 por Pagina
      document.getElementById('prevPg')?.addEventListener('click', ()=>{ if (page>1){ page--; render(); } });
      document.getElementById('nextPg')?.addEventListener('click', ()=>{ page++; render(); });

      document.getElementById('btnNewOp')?.addEventListener('click', async () => {
        let stations = [];
        try { stations = await API.apiGet('/stations'); } catch(_){ stations = []; }
        const stationOptions = (stations||[]).map(s => s?.nombre || s?.name || s?.idest || '').filter(Boolean);
        const fields = [
          { name: 'rfid', label: 'RFID' },
          { name: 'nombre', label: 'Nombre' },
          { name: 'password', label: 'Contraseña', type: 'password' },
          { name: 'estacion', label: 'Estación', type: 'select', options: stationOptions },
        ];
        openFormModal('Registrar Operador', fields, {}, async (obj) => { await API.apiPost('/operators', obj); try { if (window.showCenterAlert) await window.showCenterAlert('Registro exitoso', 'Operadores'); else if (window.showAlert) await window.showAlert('Registro exitoso'); } catch(_) {} loadOperators(); });
      });
      document.querySelectorAll('button[data-act="edit"]').forEach((btn) => btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        // No hay GET /operators/<id> en rutas; usamos datos listados si no existe
        const current = (data||[]).find(x=>String(x.id)===String(id)) || {};
        let stations = [];
        try { stations = await API.apiGet('/stations'); } catch(_){ stations = []; }
        const stationOptions = (stations||[]).map(s => s?.nombre || s?.name || s?.idest || '').filter(Boolean);
        const fields = [
          { name: 'rfid', label: 'RFID' },
          { name: 'nombre', label: 'Nombre' },
          { name: 'password', label: 'Contraseña', type: 'password' },
          { name: 'estacion', label: 'Estación', type: 'select', options: stationOptions },
        ];
        openFormModal('Editar Operador', fields, current || {}, async (obj) => { await API.apiPut(`/operators/${id}`, obj); loadOperators(); });
      }));
      document.querySelectorAll('button[data-act="del"]').forEach((btn) => btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!(await showConfirm('Eliminar operador',{ okText:'Eliminar', cancelText:'Cancelar' }))) return; await API.apiDelete(`/operators/${id}`); loadOperators();
      }));
      document.querySelectorAll('button[data-act="view"]').forEach((btn) => btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const current = (data||[]).find(x=>String(x.id)===String(id)) || {};
        const fields = ['rfid','nombre','estacion'];
        openFormModal('Detalle de Operador', fields, current, null);
      }));
    }

    render();
  } catch (e) {
    console.error(e);
    view.innerHTML = '<p>Sin permisos para ver operadores.</p>';
  }
}

// ---- Company / Variables ----
async function loadCompany() {
  const data = await API.apiGet('/company');
  // Columnas solicitadas: 1) RFC,Nombre,Calle,Colonia,Ciudad  2) Estado,CP,Contacto,Correo,Telefono  3) Logotipo
  const col1 = ['rfc','nombre','calle','colonia','ciudad'];
  const col2 = ['estado','cp','contacto','correo','telefono'];
  const labelMap = { rfc:'Rfc', nombre:'Nombre', calle:'Calle', colonia:'Colonia', ciudad:'Ciudad', estado:'Estado', cp:'Cp', contacto:'Contacto', correo:'Correo', telefono:'Telefono' };

  const renderField = (f, col) => {
    const lbl = labelMap[f] || (f.charAt(0).toUpperCase() + f.slice(1));
    const type = (f === 'correo') ? 'email' : (f === 'telefono' ? 'tel' : 'text');
    return `<label data-col="${col}">${lbl}<input type="${type}" id="f_${f}" value="${data[f]??''}"></label>`;
  };

  const col1Html = `<div class="col col-1">${col1.map(f => renderField(f, 1)).join('')}</div>`;
  const col2Html = `<div class="col col-2">${col2.map(f => renderField(f, 2)).join('')}</div>`;

  const logoUrl = data.logotipo || '';
  const logoBlock = `
    <div class="logo-field logo-cell">
      <label class="logo-title">Logotipo</label>
      <input type="hidden" id="f_logotipo" value="${logoUrl}">
      <div class="logo-preview-wrap" style="margin-top:8px;">
        <img id="logoPreview" src="${logoUrl}" alt="Logotipo" style="${logoUrl?'' :'display:none;'}">
      </div>
      <div class="img-actions-row" style="margin-top:10px;">
        <input type="file" id="logoFile" accept="image/*" style="display:none;">
        <button type="button" class="btn-secondary" id="logoPickBtn">Seleccionar archivo</button>
      </div>
    </div>`;

  const form = col1Html + col2Html + logoBlock;
  view.innerHTML = toolsHubHeader('company') + `
    <div class="page-header">
      <div class="page-title">Empresa</div>
      <div class="page-subtitle">Configura los datos de tu empresa</div>
    </div>
    <div class="table-wrap company-form" style="padding:12px;">
      <form id="companyForm" class="form-grid compact">${form}</form>
      <div style="margin-top:10px;text-align:right;"><button class="btn-primary" id="saveCompany">Guardar</button></div>
    </div>`;
  bindToolsHubTabs();

  // Estilos del bloque de logotipo y grilla de 3 columnas
  if (!document.getElementById('company-logo-styles')){
    const st = document.createElement('style');
    st.id = 'company-logo-styles';
    st.textContent = `
      .company-form .form-grid.compact { grid-template-columns: repeat(3, minmax(220px, 1fr)); align-items:start; gap:12px; }
      .company-form .form-grid.compact .col-1{ grid-column: 1; display:flex; flex-direction:column; gap:8px; }
      .company-form .form-grid.compact .col-2{ grid-column: 2; display:flex; flex-direction:column; gap:8px; }
      .company-form .form-grid.compact .logo-cell{ grid-column: 3; grid-row: 1 / -1; display:flex; flex-direction:column; align-self:stretch; }
      .company-form .logo-preview-wrap{ width:100%; flex:1; min-height:240px; border:1px solid #2b3440; border-radius:10px; display:flex; align-items:center; justify-content:center; overflow:hidden; background:#0b1220; }
      body.light .company-form .logo-preview-wrap{ border-color:#e5e7eb; background:#ffffff; }
      .company-form #logoPreview{ width:100%; height:100%; object-fit:contain; display:block; }
      @media (max-width: 980px){
        .company-form .form-grid.compact { grid-template-columns: 1fr; }
        .company-form .form-grid.compact .col-1{ grid-column:1; }
        .company-form .form-grid.compact .col-2{ grid-column:1; }
        .company-form .form-grid.compact .logo-cell{ grid-column: 1; grid-row: auto; }
      }
    `;
    document.head.appendChild(st);
  }

  // Upload and preview logo on change
  const logoInput = document.getElementById('logoFile');
  const logoPreview = document.getElementById('logoPreview');
  const logoHidden = document.getElementById('f_logotipo');
  const logoPickBtn = document.getElementById('logoPickBtn');
  const logoFileName = document.getElementById('logoFileName');
  logoPickBtn?.addEventListener('click', ()=> logoInput?.click());
  logoInput?.addEventListener('change', async () => {
    const file = logoInput.files && logoInput.files[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const resp = await API.apiUpload('/company/logo', fd);
      const url = resp && resp.logotipo ? resp.logotipo : '';
      if (url) {
        logoHidden.value = url;
        logoPreview.src = url;
        logoPreview.style.display = '';
      }
      if (logoFileName) logoFileName.textContent = file.name || 'Archivo seleccionado';
    } catch (e) {
      if (window.showAlert) window.showAlert('Error al subir el logotipo'); else alert('Error al subir el logotipo');
    }
  });

  document.getElementById('saveCompany')?.addEventListener('click', async (ev)=>{
    ev.preventDefault();
    const obj={};
    [...col1, ...col2, 'logotipo'].forEach(f=>{ const el = document.getElementById(`f_${f}`); if (el) obj[f] = el.value; });
    try {
      await API.apiPut('/company', obj);
      const makeToast = (msg)=>{
        const n = document.createElement('div');
        n.className = 'center-toast success';
        n.textContent = msg;
        document.body.appendChild(n);
        setTimeout(()=> n.classList.add('hide'), 1400);
        setTimeout(()=> { try { n.remove(); } catch(_){} }, 1800);
      };
      makeToast('Guardado exitosamente');
    } catch(err) {
      const msg = (err && err.message) ? err.message : 'No se pudo guardar';
      if (window.showAlert) window.showAlert(msg, 'Error'); else alert(msg);
    }
  });
}

async function loadVariables() {
  const data = await API.apiGet('/variables');
  const keys = ['variable_prov1','variable_prov2','variable_prov3'];
  const labels = ['Variable1','Variable2','Variable3'];
  const placeholders = ['Variable1','Variable2','Variable3'];
  const form = `
    <div class="page-header">
      <div class="page-title">Variables</div>
      <div class="page-subtitle">Nombres que se muestran en Proceso</div>
    </div>
    <div class="table-wrap variables-form" style="padding:12px;">
      <form id="varsForm" class="form-grid vars-grid">
        ${keys.map((k,i)=>`<label>${labels[i]}<input type="text" id="v_${k}" placeholder="${placeholders[i]}" value="${data[k]??''}"></label>`).join('')}
      </form>
      <div style="margin-top:10px;text-align:right;"><button class="btn-primary" id="saveVars">Guardar</button></div>
    </div>`;
  view.innerHTML = toolsHubHeader('variables') + form;
  bindToolsHubTabs();
  document.getElementById('saveVars')?.addEventListener('click', async (ev)=>{
    ev.preventDefault();
    const obj={}; keys.forEach(k=>{ const el=document.getElementById(`v_${k}`); if (el) obj[k]=el.value; });
    await API.apiPut('/variables', obj);
    if (window.showAlert) window.showAlert('Guardado'); else alert('Guardado');
  });
}

  // ---- Simple list ----

  // ---- Stations (similar a Clientes: listado + CRUD) ----
  async function loadStations(){
    try {
      const data = await API.apiGet('/stations');
      let q = '';
      let page = 1;
      let pageSize = 10;

      function render(){
        const search = q.trim().toLowerCase();
        const rowsAll = (data||[]).filter(r => !search || `${r.idest||''} ${r.nombre||''} ${r.observaciones||''}`.toLowerCase().includes(search));
        const pages = Math.max(1, Math.ceil(rowsAll.length / pageSize));
        if (page > pages) page = pages;
        const start = (page - 1) * pageSize;
        const slice = rowsAll.slice(start, start + pageSize);

        const rows = slice.map(r => `
          <tr>
            <td class="user-cell">
              <span class="avatar-chip">${(r.nombre||'?').toString().slice(0,1).toUpperCase()}</span>
              <div>
                <div><strong>${r.nombre ?? ''}</strong></div>
                <div class="muted">${r.idest ?? ''}</div>
              </div>
            </td>
            <td>${r.observaciones ?? ''}</td>
            <td class="ops">
              <button class="op-btn" data-act="edit" data-id="${r.id}" title="Editar" aria-label="Editar">✏️</button>
              <button class="op-btn danger" data-act="del" data-id="${r.id}" title="Borrar" aria-label="Borrar">🗑️</button>
            </td>
          </tr>`).join('');

        view.innerHTML = toolsHubHeader('stations') + `
          <h2>Estaciones</h2>
          <div class="toolbar toolbar-bar">
            <div class="right tools-right">
              <div class="search"><input id="stationSearch" type="text" placeholder="Buscar Estación" value="${q}"></div>
              <button class="btn-primary" id="btnNewStation">+ Registrar Estación</button>
            </div>
          </div>

          <div class="table-wrap pretty">
            <table>
              <thead>
                <tr><th>Estación</th><th>Observaciones</th><th>Acciones</th></tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
          <div class="pager">
            <div class="left">Mostrando ${rowsAll.length ? (start+1) : 0}-${Math.min(start+slice.length, rowsAll.length)} de ${rowsAll.length} estaciones</div>
            <div class="right">
              <span style="margin:0 8px">Pagina ${page} / ${pages}</span>
              <button class="btn-secondary" id="prevPg" ${page<=1?'disabled':''}>Atrás</button>
              <button class="btn-secondary" id="nextPg" ${page>=pages?'disabled':''}>Siguiente</button>
            </div>
          </div>`;

        bindToolsHubTabs();

        // Handlers UI
        document.getElementById('stationSearch')?.addEventListener('input', (e)=>{ const el=e.target; const s=el.selectionStart, t=el.selectionEnd; q = el.value; page = 1; render(); try{ const inp=document.getElementById('stationSearch'); if(inp){ inp.focus({preventScroll:true}); if(typeof s==='number'&&typeof t==='number') inp.setSelectionRange(s,t); } }catch(_){} });
        document.getElementById('prevPg')?.addEventListener('click', ()=>{ if (page>1){ page--; render(); } });
        document.getElementById('nextPg')?.addEventListener('click', ()=>{ page++; render(); });

        // Nuevo
        document.getElementById('btnNewStation')?.addEventListener('click', async ()=>{
          openStationLightModal(async (payload) => {
            try {
              const modal = document.getElementById('modal');
              const form = document.getElementById('modalForm');
              const dialog = modal?.querySelector('.modal-dialog');
              form?.classList.remove('onecol');
              dialog?.classList.remove('small');
              if (modal) {
                modal.classList.remove('show');
                modal.setAttribute('aria-hidden','true');
                try { modal.style.display = 'none'; } catch(_) {}
              }
            } catch(_) {}
            await API.apiPost('/stations', payload);
            try { await new Promise(r => setTimeout(r, 0)); } catch(_) {}
            try { if (window.showCenterAlert) await window.showCenterAlert('Registro exitoso', 'Estaciones'); else if (window.showAlert) await window.showAlert('Registro exitoso'); } catch(_) {}
            loadStations();
          });
          // Forzar formulario vertical: IdEstación, Nombre, Observaciones
          try {
            const modal = document.getElementById('modal');
            const form = document.getElementById('modalForm');
            form?.classList.add('onecol');
            const dialog = modal?.querySelector('.modal-dialog');
            dialog?.classList.add('small');
            // Etiquetas exactas
            const lId = form?.querySelector('input[name="idest"]')?.closest('label');
            const lNm = form?.querySelector('input[name="nombre"]')?.closest('label');
            const lOb = form?.querySelector('textarea[name="observaciones"], input[name="observaciones"]')?.closest('label');
            if (lId && lId.firstChild) lId.firstChild.nodeValue = 'IdEstación';
            if (lNm && lNm.firstChild) lNm.firstChild.nodeValue = 'Nombre';
            if (lOb && lOb.firstChild) lOb.firstChild.nodeValue = 'Observaciones';
          } catch(_) {}
        });

        // Editar
        document.querySelectorAll('button[data-act="edit"]').forEach((btn) => btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const current = (data||[]).find(x => String(x.id) === String(id)) || {};
          const initial = { idest: current?.idest || '', nombre: current?.nombre || '', observaciones: current?.observaciones || '' };
          openStationLightModal(async (payload) => { await API.apiPut(`/stations/${id}`, payload); loadStations(); }, initial, 'Editar Estación');
        }));

        // Borrar
        document.querySelectorAll('button[data-act="del"]').forEach((btn) => btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          if (!(await showConfirm('Eliminar Estacion',{ okText:'Eliminar', cancelText:'Cancelar' }))) return; await API.apiDelete(`/stations/${id}`); loadStations();
        }));
      }

      render();
    } catch (e) {
      console.error(e);
      view.innerHTML = '<p>Sin permisos para ver estaciones.</p>';
    }
  }
async function loadSimpleList(path, title, cols) {
  const data = await API.apiGet(path);
  const rows = (data||[]).map(r => `<tr>${cols.map(c=>`<td>${r[c] ?? ''}</td>`).join('')}</tr>`).join('');
  const hub = (title && title.toLowerCase().includes('estac')) ? toolsHubHeader('stations') : '';
  view.innerHTML = hub + `<h2>${title}</h2><div class="table-wrap"><table><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
  if (hub) bindToolsHubTabs();
}

// ---- Modal helpers ----
function inputForField(desc, value = '') {
  const isObj = typeof desc === 'object' && desc !== null;
  const name = isObj ? (desc.name || '') : String(desc);
  let label = isObj ? (desc.label || name) : name;
  let type = isObj ? (desc.type || 'auto') : 'auto';
  const lower = (name || '').toLowerCase();
  const ph = isObj && desc.placeholder ? ` placeholder="${desc.placeholder}"` : '';
  const stp = isObj && (desc.step || String(desc.step)==='any') ? ` step="${desc.step}"` : '';
  const minAttr = isObj && (desc.min !== undefined) ? ` min="${desc.min}"` : '';
  if (type === 'auto'){
    if (lower.includes('fecha')) type = 'date';
    else if (lower.includes('correo') || lower === 'email') type = 'email';
    else if (lower.includes('password') || lower === 'pass' || lower === 'Contraseña') type = 'password';
    else if (lower.endsWith('_id') || ['cantidad','piezas','empaques','cp','peso'].some(k=>lower.includes(k))) type = 'number';
    else type = 'text';
  }
  const pretty = {
    idprod: 'IdProd',
    idclie: 'IdCliente',
    peso_por_pieza: 'Peso por pieza',
    op: 'OP',
    rfid: 'RFID',
    nombre: 'Nombre',
    observaciones: 'Observaciones',
    password: 'Contraseña',
    estacion: 'Estación',
    empaques: 'Empaques',
    piezas: 'Piezas',
    lote: 'Lote',
    imagen: 'Imagen',
  };
  if (!isObj && pretty[lower]) label = pretty[lower];
  if (type === 'select'){
    const opts = (desc.options || []).map(opt => {
      const val = typeof opt === 'object' ? (opt.value ?? opt.text ?? opt) : opt;
      const txt = typeof opt === 'object' ? (opt.text ?? opt.value ?? opt) : opt;
      const sel = String(val) === String(value) ? 'selected' : '';
      return `<option value="${val}" ${sel}>${txt}</option>`;
    }).join('');
    const imgPrev = lower.includes('imagen')
      ? (()=>{ const has = value && typeof value === 'string'; return `<div class=\"img-slot\"><img class=\"img-preview\" data-preview-for=\"${name}\" ${has?`src=\"${value}\"`:''} alt=\"preview\"></div>`; })()
      : '';
    // Para 'imagen' usar el mismo layout que Productos: label.image-full con preview dentro
    const cls = lower.includes('imagen') ? ` class="image-full${(value && String(value).length)?' has-preview':''}"` : '';
    return `<label${cls}>${label}${imgPrev}<select name="${name}">${opts}</select></label>`;
  }
  if (['imagen','image','foto','photo','picture'].some(k => lower.includes(k))) {
    const has = value && typeof value === 'string';
    const img = `<div class="img-slot"><img class="img-preview" data-preview-for="${name}" ${has?`src="${value}"`:''} alt="preview"></div>`;
    // Fila con botÃ³n-Ã­cono a la izquierda y preview a la derecha
    const extraCls = has ? 'image-full has-preview' : 'image-full';
    return `<label class="${extraCls}">${label}${img}<input type="file" name="${name}" accept="image/*"><div class="file-name" data-file-for="${name}"></div></label>`;
  }
  const isArea = ['observaciones','descripcion','nota','notas','direccion'].some(k=> lower.includes(k));
  if (isArea) return `<label>${label}<textarea name="${name}">${value ?? ''}</textarea></label>`;
  if (type === 'password') {
    const acPwd = ' autocomplete="new-password"';
    const eye = `<svg class="icon-eye" viewBox="0 0 24 24" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    const eyeOff = `<svg class="icon-eye-off" viewBox="0 0 24 24" aria-hidden="true" style="display:none"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 1 12 1 12a21.47 21.47 0 0 1 5.06-6.94"></path><path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.56 21.56 0 0 1-3.34 5"></path><line x1="1" y1="1" x2="23" y2="23"></line><circle cx="12" cy="12" r="3"></circle></svg>`;
    return `<label>${label}
      <div class="pwd-wrap">
        <input type="password" name="${name}" value="${value ?? ''}"${acPwd}${ph}>
        <button type="button" class="pwd-eye" data-for="${name}" aria-label="Mostrar Contraseña" title="Mostrar">${eye}${eyeOff}</button>
      </div>
    </label>`;
  }
  const ac = (type === 'password')
    ? ' autocomplete="new-password"'
    : ((type === 'email' || lower === 'correo' || lower === 'email') ? ' autocomplete="off"' : '');
  return `<label>${label}<input type="${type}" name="${name}" value="${value ?? ''}"${ac}${ph}${stp}${minAttr}></label>`;
}

// Agrupa las variables de producto en una secciÃ³n con encabezados y grilla uniforme
function enhanceProductVars(){
  try {
    const form = document.getElementById('modalForm');
    if (!form) return;
    // Inyectar estilos para la secciÃ³n de variables en productos si no existen
    try {
      if (!document.getElementById('prod-vars-styles')){
        const st = document.createElement('style');
        st.id = 'prod-vars-styles';
        st.textContent = `
          .prod-vars { grid-column: 1 / -1; }
          .prod-vars .vars-head { display:grid; grid-template-columns: repeat(3, 1fr); gap:16px; align-items:center; justify-items:center; margin: 4px 0; font-weight:600; color: var(--muted); }
          .prod-vars .vars-title{ text-align:center; font-weight:700; margin: 2px 0; }
          .prod-vars .vars-grid{ display:grid; grid-template-columns: repeat(3, 1fr); gap:16px; }
          .prod-vars .vars-grid label{ width:100%; align-items:flex-start; font-size:14px; }
          .prod-vars .vars-grid input,
          .prod-vars .vars-grid select,
          .prod-vars .vars-grid textarea{ width:100%; box-sizing:border-box; padding:12px 14px; font-size:15px; border-radius:10px; min-height:44px; }
          @media (max-width: 1100px){ .prod-vars .vars-grid { grid-template-columns: repeat(2, 1fr); } .prod-vars .vars-head{ grid-template-columns: repeat(2, 1fr); } }
          @media (max-width: 700px){ .prod-vars .vars-grid { grid-template-columns: 1fr; } .prod-vars .vars-head{ grid-template-columns: 1fr; } }
        `;
        document.head.appendChild(st);
      }
    } catch(_) {}
    const v1inp = form.querySelector('input[name="variable1"], select[name="variable1"]');
    const v2inp = form.querySelector('input[name="variable2"], select[name="variable2"]');
    const v3inp = form.querySelector('input[name="variable3"], select[name="variable3"]');
    const l1 = v1inp?.closest('label');
    const l2 = v2inp?.closest('label');
    const l3 = v3inp?.closest('label');
    if (!l1 || !l2 || !l3) return;
    // Evitar duplicar si ya existe
    if (form.querySelector('.prod-vars')) return;
    const wrap = document.createElement('div');
    wrap.className = 'prod-vars';
    const mkHead = () => {
      const h = document.createElement('div');
      h.className = 'vars-head';
      h.innerHTML = '<div>Variable1<br><small>Color</small></div><div>Variable2<br><small>Tamaño</small></div><div>Variable3<br><small>Material</small></div>';
      return h;
    };
    const title = document.createElement('div'); title.className='vars-title'; title.textContent = 'Variables';
    const grid = document.createElement('div'); grid.className = 'vars-grid';
    // Insertar el wrapper en el lugar del primer label
    form.insertBefore(wrap, l1);
    wrap.appendChild(mkHead());
    wrap.appendChild(title);
    wrap.appendChild(mkHead());
    wrap.appendChild(grid);
    grid.appendChild(l1);
    grid.appendChild(l2);
    grid.appendChild(l3);
  } catch(_) {}
}

// Ligero: formulario rÃ¡pido para Clientes (crear/editar)
function openClientLightModal(onSubmit, initial = { idclie: '', nombre: '', observaciones: '' }, title = '+ Registrar Cliente'){
  const fields = ['idclie','nombre','observaciones'];
  // Usa el generador de formularios estÃ¡ndar y delega submit
  openFormModal(title || 'Cliente', fields, initial || {}, async (obj) => {
    const payload = {
      idclie: obj.idclie ?? '',
      nombre: obj.nombre ?? '',
      observaciones: obj.observaciones ?? '',
    };
    if (typeof onSubmit === 'function') await onSubmit(payload);
  });
  // Forzar diseÃ±o en lista (una columna) para Clientes
  try {
    const modal = document.getElementById('modal');
    const form = document.getElementById('modalForm');
    form?.classList.add('onecol');
    // Hacer modal mÃ¡s compacto/pequeÃ±o
    const dialog = modal?.querySelector('.modal-dialog');
    dialog?.classList.add('small');
    // Limpiar clase al cerrar o enviar
    const cleanup = () => { form?.classList.remove('onecol'); dialog?.classList.remove('small'); };
    form?.addEventListener('submit', cleanup, { once: true });
    modal?.querySelectorAll('[data-close]')?.forEach(btn => btn.addEventListener('click', cleanup, { once: true }));
  } catch(_) {}
}

// Ligero: formulario rÃ¡pido para Estaciones (crear/editar)
function openStationLightModal(onSubmit, initial = { idest: '', nombre: '', observaciones: '' }, title = 'Nueva Estación'){
  const fields = [
    { name: 'idest', label: 'IdEstación' },
    { name: 'nombre', label: 'Nombre' },
    { name: 'observaciones', label: 'Observaciones' },
  ];
  // Generar formulario estÃ¡ndar en una columna (estilo Clientes)
  openFormModal(title || 'Estación', fields, initial || {}, async (obj) => {
    const payload = {
      idest: obj.idest ?? '',
      nombre: obj.nombre ?? '',
      observaciones: obj.observaciones ?? '',
    };
    if (typeof onSubmit === 'function') await onSubmit(payload);
  });
  // Forzar diseÃ±o en lista (una columna)
  try {
    const modal = document.getElementById('modal');
    const form = document.getElementById('modalForm');
    form?.classList.add('onecol');
    const dialog = modal?.querySelector('.modal-dialog');
    dialog?.classList.add('small');
    // Etiquetas exactas para Estación
    try {
      const lId = form?.querySelector('input[name="idest"]')?.closest('label');
      const lNm = form?.querySelector('input[name="nombre"]')?.closest('label');
      const lOb = form?.querySelector('textarea[name="observaciones"], input[name="observaciones"]')?.closest('label');
      if (lId && lId.firstChild) lId.firstChild.nodeValue = 'IdEstación';
      if (lNm && lNm.firstChild) lNm.firstChild.nodeValue = 'Nombre';
      if (lOb && lOb.firstChild) lOb.firstChild.nodeValue = 'Observaciones';
    } catch(_) {}
    const cleanup = () => { form?.classList.remove('onecol'); dialog?.classList.remove('small'); };
    form?.addEventListener('submit', cleanup, { once: true });
    modal?.querySelectorAll('[data-close]')?.forEach(btn => btn.addEventListener('click', cleanup, { once: true }));
  } catch(_) {}
}

function openFormModal(title, fields, current = {}, onSubmit) {
  const modal = document.getElementById('modal');
  const form = document.getElementById('modalForm');
  const mTitle = document.getElementById('modalTitle');
  if (!modal || !form || !mTitle) return;
  // Ensure submit button is visible and fields enabled by default
  try {
    const submitBtn = modal.querySelector('button[type="submit"][form="modalForm"]');
    if (submitBtn) submitBtn.style.display = '';
    form.querySelectorAll('input,textarea,select,button').forEach(el => el.removeAttribute('disabled'));
  } catch(_) {}
  mTitle.textContent = title || 'Formulario';
  form.innerHTML = fields.map(f => { const key = (typeof f === 'object' && f) ? f.name : f; return inputForField(f, (current||{})[key]); }).join('');
  // Mostrar placeholder "Sin archivo" salvo en Registrar Producto (se elimina el recuadro)
  try {
    const t = String(title || '').toLowerCase();
    if (t.includes('registrar producto')) {
      form.querySelectorAll('.file-name[data-file-for]')?.forEach(el => el.remove());
    } else {
      form.querySelectorAll('.file-name[data-file-for]')?.forEach(el => { if (!el.textContent || !el.textContent.trim()) el.textContent = 'Sin archivo'; });
    }
  } catch(_) {}

  // Proceso: ocultar el input nativo de archivo para no mostrar "Seleccionar archivo"
  try {
    const t = String(title || '').toLowerCase();
    if (t.includes('registrar proceso') || t.includes('editar proceso')){
      const fi = form.querySelector('input[type="file"][name="imagen"]');
      if (fi){ fi.style.position='absolute'; fi.style.width='1px'; fi.style.height='1px'; fi.style.opacity='0'; fi.style.pointerEvents='none'; }
    }
  } catch(_) {}

  // Imagen: enlazar botÃ³n-Ã­cono al input file y previsualizaciÃ³n
  try {
    form.querySelectorAll('.img-pick-btn').forEach(btn => {
      const target = btn.getAttribute('data-target');
      const file = form.querySelector(`input[type="file"][name="${target}"]`);
      if (file) btn.addEventListener('click', () => file.click());
    });
    form.querySelectorAll('input[type="file"]').forEach(inp => {
      inp.addEventListener('change', () => {
        const img = form.querySelector(`img.img-preview[data-preview-for="${inp.name}"]`);
        const file = inp.files && inp.files[0];
        if (img && file){ img.src = URL.createObjectURL(file); img.style.display='block'; }
        // Mostrar nombre del archivo en el recuadro
        try {
          const nameEl = inp.closest('label')?.querySelector(`.file-name[data-file-for="${inp.name}"]`);
          if (nameEl) nameEl.textContent = file ? (file.name || '') : '';
        } catch(_) {}
      });
    });
  } catch(_){ }
  // Asegurar preview para selects de imagen con valor inicial (p.ej. Editar Proceso)
  try {
    const imgSelects = Array.from(form.querySelectorAll('select[name]')).filter(sel => (sel.name||'').toLowerCase().includes('imagen'));
    imgSelects.forEach(sel => {
      const label = sel.closest('label');
      const img = label?.querySelector(`img.img-preview[data-preview-for="${sel.name}"]`);
      const v = (current && current[sel.name]) ? current[sel.name] : (sel.value || '');
      if (img){
        if (v){ img.src = v; img.style.display='block'; label?.classList.add('has-preview'); }
        else { img.removeAttribute('src'); img.style.display='none'; label?.classList.remove('has-preview'); }
      }
      sel.addEventListener('change', ()=>{
        const vv = sel.value || '';
        if (img){
          if (vv){ img.src = vv; img.style.display='block'; label?.classList.add('has-preview'); }
          else { img.removeAttribute('src'); img.style.display='none'; label?.classList.remove('has-preview'); }
        }
      });
    });
  } catch(_) {}
  // Wire password eye toggles
  try {
    form.querySelectorAll('.pwd-eye').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-for');
        const input = form.querySelector(`input[name="${name}"]`);
        if (!input) return;
        const showing = input.getAttribute('type') === 'text';
        input.setAttribute('type', showing ? 'password' : 'text');
        const eye = btn.querySelector('.icon-eye');
        const eyeOff = btn.querySelector('.icon-eye-off');
        if (eye && eyeOff) { eye.style.display = showing ? '' : 'none'; eyeOff.style.display = showing ? 'none' : ''; }
        btn.setAttribute('aria-label', showing ? 'Mostrar Contraseña' : 'Ocultar Contraseña');
        btn.setAttribute('title', showing ? 'Mostrar' : 'Ocultar');
      });
    });
  } catch(_) {}
  const close = () => {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden','true');
    // limpiar clases forzadas de layout compacto/lista
    try {
      const dialog = modal.querySelector('.modal-dialog');
      form.classList.remove('onecol');
      dialog?.classList.remove('small');
    } catch(_) {}
    form.onsubmit = null;
    modal.querySelectorAll('[data-close]').forEach(b=> b.onclick = null);
  };
  modal.querySelectorAll('[data-close]').forEach(b=> b.onclick = close);
  form.onsubmit = async (e) => {
    e.preventDefault();
    const data = {};
    const fd = new FormData(form);
    fd.forEach((v,k) => { if (!(v instanceof File)) data[k] = v; });
    // Procesar archivos (imagenes) como dataURL para enviarlas por JSON
    async function fileToDataURL(file){
      return await new Promise((resolve, reject) => { const fr = new FileReader(); fr.onload = () => resolve(fr.result); fr.onerror = reject; fr.readAsDataURL(file); });
    }
    const fileInputs = Array.from(form.querySelectorAll('input[type="file"][name]'));
    for (const input of fileInputs){
      const f = input.files && input.files[0];
      if (f) { data[input.name] = await fileToDataURL(f); }
    }
    try {
      if (onSubmit) {
        const result = await onSubmit(data);
        if (result === false) return; // mantener abierto para corregir
      }
      close();
    } catch (err) {
      // Mantener modal abierto y mostrar error bÃ¡sico
      try {
        const msg = (err && err.message) ? err.message : String(err);
        if (msg && (msg.toLowerCase().includes('correo') || msg.toLowerCase().includes('email')) && typeof window.showCenterAlert === 'function') {
          await window.showCenterAlert(msg, 'Aviso');
        } else {
          alert(msg || 'No se pudo guardar.');
        }
      } catch(_) {}
    }
  };
  // Preview de imagen al adjuntar
  try {
    const fileInputs = Array.from(form.querySelectorAll('input[type="file"][name]'));
    fileInputs.forEach(inp => {
      inp.addEventListener('change', () => {
        const img = form.querySelector(`img.img-preview[data-preview-for="${inp.name}"]`);
        const f = inp.files && inp.files[0];
        if (img){
          if (f){ const r = new FileReader(); r.onload = () => { img.src = r.result; img.style.display = 'block'; img.closest('label')?.classList.add('has-preview'); }; r.readAsDataURL(f); }
          else { img.removeAttribute('src'); img.style.display = 'none'; img.closest('label')?.classList.remove('has-preview'); }
        }
      });
    });
  } catch(_) {}
  modal.classList.add('show'); modal.setAttribute('aria-hidden','false');
}

// ---- Image preview in modal ----
function openImageModal(src, title = 'Imagen'){
  const modal = document.getElementById('modal');
  const form = document.getElementById('modalForm');
  const mTitle = document.getElementById('modalTitle');
  if (!modal || !form || !mTitle) return;
  // Mostrar solo la imagen sobre el backdrop, con una X para cerrar
  mTitle.textContent = '';
  // Limpiar overlays anteriores si existieran
  modal.querySelector('.image-only-wrap')?.remove();
  modal.querySelector('.image-close')?.remove();
  // Marcar modo solo-imagen
  modal.classList.add('image-only');
  // Crear overlay de imagen
  const wrap = document.createElement('div');
  wrap.className = 'image-only-wrap';
  const img = document.createElement('img');
  img.src = src; img.alt = 'preview';
  wrap.appendChild(img);
  modal.appendChild(wrap);
  // BotÃ³n de cierre (X)
  const closeBtn = document.createElement('button');
  closeBtn.className = 'image-close';
  closeBtn.setAttribute('data-close','');
  closeBtn.setAttribute('aria-label','Cerrar imagen');
  closeBtn.textContent = 'X';
  modal.appendChild(closeBtn);
  // Cerrar con Escape y clic en imagen
  const onKey = (e) => { if (e.key === 'Escape') closeBtn.click(); };
  document.addEventListener('keydown', onKey, { once:true });
  img.addEventListener('click', () => closeBtn.click());
  // Ocultar botÃ³n Guardar
  const submitBtn = modal.querySelector('button[type="submit"][form="modalForm"]');
  if (submitBtn) submitBtn.style.display = 'none';
  // Handlers de cierre
  modal.querySelectorAll('[data-close]').forEach(b=> b.onclick = ()=>{
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden','true');
    if (submitBtn) submitBtn.style.display='';
    modal.classList.remove('image-only');
    wrap.remove(); closeBtn.remove();
  });
  // Mostrar modal
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
}

// ---- Theme + user menu ----
const themeBtn = document.getElementById('themeToggle');
if (themeBtn) {
  // Reemplazar icono por SVG mitad sol/mitad luna (similar a luz.png)
  try {
    themeBtn.setAttribute('aria-label','Modo claro/oscuro');
    themeBtn.innerHTML = `
      <svg class="theme-ico" width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id="clipCircleTheme">
            <circle cx="12" cy="12" r="10" />
          </clipPath>
        </defs>
        <g clip-path="url(#clipCircleTheme)">
          <rect x="0" y="0" width="12" height="24" fill="#1a1d24" />
          <rect x="12" y="0" width="12" height="24" fill="#ffffff" />
        </g>
        <circle cx="12" cy="12" r="10" fill="none" stroke="#2c2f36" stroke-width="1.5" />
        <circle cx="8" cy="12" r="2.2" fill="#fbbf24" />
        <g stroke="#f59e0b" stroke-linecap="round">
          <line x1="8" y1="7.8" x2="8" y2="6.4" stroke-width="1.4" />
          <line x1="8" y1="16.2" x2="8" y2="17.6" stroke-width="1.4" />
          <line x1="5.1" y1="9.1" x2="4.0" y2="8.2" stroke-width="1.2" />
          <line x1="10.9" y1="14.9" x2="12.0" y2="15.8" stroke-width="1.2" />
          <line x1="5.1" y1="14.9" x2="4.0" y2="15.8" stroke-width="1.2" />
          <line x1="10.9" y1="9.1" x2="12.0" y2="8.2" stroke-width="1.2" />
        </g>
        <g>
          <circle cx="16.5" cy="11" r="3.4" fill="#9ca3af" />
          <circle cx="17.8" cy="10.5" r="3.4" fill="#ffffff" />
        </g>
      </svg>`;
  } catch(_) {}
  const currentTheme = localStorage.getItem('theme');
  if (currentTheme === 'light') document.body.classList.add('light');
  themeBtn.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  });
}

const userBtn  = document.getElementById('userBtn');
const userMenu = document.getElementById('userMenu');
const userWrap = document.getElementById('userWrap');
if (userBtn && userMenu && userWrap) {
  (function hydrateUser(){
    const u = JSON.parse(localStorage.getItem('usuario') || 'null') || { nombre:'Admin', rol:'Administrador' };
    userBtn.textContent = (u.nombre || '?').slice(0,1).toUpperCase();
    const av = document.getElementById('menuAvatar'); const nm = document.getElementById('menuName'); const rl = document.getElementById('menuRole');
    if (av) av.textContent = userBtn.textContent; if (nm) nm.textContent = u.nombre || 'Usuario'; if (rl) rl.textContent = (u.rol || 'USUARIO').toString().toUpperCase();
  })();
  userBtn.addEventListener('click', (e) => { e.stopPropagation(); const open = userMenu.classList.toggle('show'); userBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); userMenu.setAttribute('aria-hidden', open ? 'false' : 'true'); });
  document.addEventListener('click', (e) => { if (!userWrap.contains(e.target)) userMenu.classList.remove('show'); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') userMenu.classList.remove('show'); });
  document.querySelector('.user-menu [data-go="users"]')?.addEventListener('click', () => loadView('users'));
  document.querySelector('.user-menu [data-go="profile"]')?.addEventListener('click', () => loadView('profile'));
}

// ---- Perfil (usuario actual) ----
async function loadProfile(){
  try{
    const me = await API.apiGet('/profile');

    view.innerHTML = `
 <div class="profile-wrapper">
  <form id="profileForm" autocomplete="off">
    <div class="profile-columns">
      <!-- Columna 1: Datos -->
      <div class="profile-card">
      <h2>Perfil</h2>
      <div class="form-group">
        <label>RFID</label>
        <input type="text" id="rfid" name="rfid">
      </div>
      <div class="form-group">
        <label>Nombre</label>
        <input type="text" id="nombre" name="nombre">
      </div>
      <div class="form-group">
        <label>Correo</label>
        <input type="email" id="correo" name="correo">
      </div>
      <div class="form-group">
        <label>Nueva Contraseña</label>
        <input type="password" id="password" name="password" placeholder="Opcional">
      </div>
      </div>
      <!-- Columna 2: Fotografía -->
      <div class="profile-card">
      <h2>Fotografía</h2>
      <div class="photo-preview">
        <img id="profilePhotoPreview" src="" alt="Vista previa">
      </div>
      <label class="upload-btn">
        Seleccionar imagen
        <input type="file" id="profilePhotoInput" name="file" accept="image/*" />
      </label>
      </div>
    </div>
    <!-- Botones debajo de las 2 columnas -->
    <div class="save-container">
      <button class="save-btn" type="submit">Guardar</button>
      <button class="remove-btn" id="removeProfilePhoto" type="button" title="Quitar foto">Quitar foto</button>
    </div>
  </form>
 </div>`;

    // Prefill datos actuales
    try{ document.getElementById('rfid').value = me.rfid || ''; }catch(_){ }
    try{ document.getElementById('nombre').value = me.nombre || ''; }catch(_){ }
    try{ document.getElementById('correo').value = me.correo || ''; }catch(_){ }

    // Cargar foto actual (si existe) y controlar visibilidad del botón Quitar
    try{
      const p = await API.apiGet('/profile/photo');
      const prev = document.getElementById('profilePhotoPreview');
      const rm = document.getElementById('removeProfilePhoto');
      if (p && p.foto && prev){ prev.src = p.foto; }
      if (rm){ rm.style.display = (p && p.foto) ? 'inline-block' : 'none'; }
    }catch(_){ try{ const rm = document.getElementById('removeProfilePhoto'); if(rm) rm.style.display='none'; }catch(__){} }

    // Vista previa al seleccionar imagen
    try{
      const fi = document.getElementById('profilePhotoInput');
      const rm = document.getElementById('removeProfilePhoto');
      fi?.addEventListener('change', ()=>{
        const f = fi.files && fi.files[0];
        if (f){
          document.getElementById('profilePhotoPreview').src = URL.createObjectURL(f);
          if (rm) rm.style.display = 'inline-block';
        }
      });
    }catch(_){ }

    // Guardar perfil
    document.getElementById('profileForm')?.addEventListener('submit', async (e)=>{
      e.preventDefault();

      // Datos de texto
      const data = {};
      const fd = new FormData(e.target);
      fd.forEach((v, k) => { if (k !== 'file' && v != null && String(v).length) data[k] = v; });
      await API.apiPut('/profile', data);

      // Subir foto (si se seleccionó)
      try{
        const file = document.getElementById('profilePhotoInput')?.files?.[0];
        if (file){
          const ufd = new FormData();
          ufd.append('file', file);
          const res = await API.apiUpload('/profile/photo', ufd);
          if (res && res.foto){
            document.getElementById('profilePhotoPreview').src = res.foto;
            const rm = document.getElementById('removeProfilePhoto'); if (rm) rm.style.display = 'inline-block';
          }
        }
      }catch(_){ }

      try {
        const u = JSON.parse(localStorage.getItem('usuario') || '{}');
        if (data.nombre) u.nombre = data.nombre;
        if (data.correo) u.correo = data.correo;
        localStorage.setItem('usuario', JSON.stringify(u));
      } catch (_) {}

      alert('Perfil actualizado');
    });

    // Quitar foto
    document.getElementById('removeProfilePhoto')?.addEventListener('click', async ()=>{
      try {
        await API.apiDelete('/profile/photo');
        const prev = document.getElementById('profilePhotoPreview');
        if (prev) prev.src = '';
        const fi = document.getElementById('profilePhotoInput');
        if (fi) fi.value = '';
        try { if (window.showAlert) await window.showAlert('Foto eliminada'); } catch(_) {}
        const rm = document.getElementById('removeProfilePhoto'); if (rm) rm.style.display = 'none';
      } catch(err) {
        try { if (window.alert) alert('No fue posible eliminar la foto'); } catch(_) {}
      }
    });

  }catch(e){
    console.error(e);
    view.innerHTML = '<p>No fue posible cargar el perfil.</p>';
  }
}

// Captura clic en 'Perfil'
try {
  const __profCap = document.querySelector('.user-menu [data-go="profile"]');
  __profCap?.addEventListener('click', (e)=>{ 
    e.preventDefault(); 
    e.stopPropagation(); 
    loadView('profile'); 
  }, true);
} catch(_) {}


// ---- Default ----
loadView('dashboard');
// Recargar vista actual desde el botÃ³n de la barra
document.getElementById('reloadBtn')?.addEventListener('click', () => {
  try { loadView(__currentView || 'dashboard'); } catch(_) {}
});

// Enforce permisos UI: en vista Usuarios oculta acciones si no es administrador
(function(){
  try{
    const ui = JSON.parse(localStorage.getItem('usuario')||'{}');
    const isAdmin = ((ui.rol||'').toString().toLowerCase()==='administrador');
    if (isAdmin) return;
    const target = document.getElementById('view');
    if (!target) return;
    const apply = () => {
      const title = document.querySelector('#view h2');
      if (!title) return;
      const txt = (title.textContent||'').toLowerCase();
      if (txt.includes('gesti') && txt.includes('usuarios')){
        document.getElementById('btnNewUser')?.remove();
        const tbl = document.querySelector('#view table');
        if (tbl){
          const ths = tbl.querySelectorAll('thead th');
          if (ths.length>0) ths[ths.length-1]?.remove();
          tbl.querySelectorAll('tbody tr').forEach(tr=>{ const tds=tr.querySelectorAll('td'); if (tds.length>0) tds[tds.length-1]?.remove(); });
        }
      }
    };
    new MutationObserver(apply).observe(target, { childList:true, subtree:true });
  }catch(_){}
})();

// ----- Bonitos: Alert & Confirm centrados -----
window.showAlert = function showAlert(message, title = 'Aviso'){ return new Promise((resolve)=>{
  try {
    // Toast no bloqueante (sin backdrop), autocierra y permite interactuar de inmediato
    const toast = document.createElement('div');
    toast.setAttribute('role','status');
    toast.style.position = 'fixed';
    toast.style.right = '16px';
    toast.style.bottom = '16px';
    toast.style.zIndex = '4000';
    toast.style.background = 'var(--panel)';
    toast.style.color = 'var(--text)';
    toast.style.border = '1px solid #232a36';
    toast.style.borderRadius = '10px';
    toast.style.padding = '10px 14px';
    toast.style.boxShadow = '0 12px 24px rgba(0,0,0,.35)';
    toast.style.pointerEvents = 'none';
    toast.innerHTML = `<div style="font-weight:600;margin-bottom:2px">${title}</div><div>${message}</div>`;
    document.body.appendChild(toast);
    setTimeout(() => { try { toast.remove(); } catch(_){} }, 1400);
    resolve();
  } catch(_) { try { alert(message); } catch(__){} resolve(); }
}); };

window.showConfirm = function showConfirm(message, { title = 'Confirmar', okText = 'Aceptar', cancelText = 'Cancelar' } = {}){ return new Promise((resolve)=>{
  try {
    const wrap = document.createElement('div');
    wrap.className = 'x-modal show';
    wrap.innerHTML = `<div class="x-backdrop"></div><div class="x-dialog"><div class="x-title">${title}</div><div class="x-msg">${message}</div><div class="x-actions"><button class="btn-secondary" id="xCancel">${cancelText}</button><button class="btn-primary" id="xOk">${okText}</button></div></div>`;
    document.body.appendChild(wrap);
    const cleanup = (val)=>{ try { wrap.remove(); } catch(_){} resolve(val); };
    wrap.querySelector('#xOk')?.addEventListener('click', ()=>cleanup(true));
    wrap.querySelector('#xCancel')?.addEventListener('click', ()=>cleanup(false));
    wrap.querySelector('.x-backdrop')?.addEventListener('click', ()=>cleanup(false));
  } catch(_) { try { resolve(confirm(message)); } catch(__){ resolve(false); } }
}); };

// Reemplazar confirm/alert por versiones bonitas donde sea posible
try { window.alert = (msg)=>{ try { showAlert(String(msg||'')); } catch(_){} }; } catch(_) {}

// Interceptar clics en borrar para usar confirm bonito y evitar confirm nativo
document.addEventListener('click', async (e) => {
  const t = e.target && (e.target.closest ? e.target.closest('button[data-act="del"]') : null);
  if (!t) return;
  const id = t.getAttribute('data-id');
  const viewName = (typeof window !== 'undefined' && window.__currentView) ? String(window.__currentView).toLowerCase() : '';
  const pathMap = { users:'/users', products:'/products', clients:'/clients', catalogs:'/clients', inventory:'/inventory', production:'/production', process:'/production', operators:'/operators' };
  const labelMap = { users:'usuario', products:'producto', clients:'cliente', inventory:'registro', production:'proceso', process:'proceso', operators:'operador' };
  const base = pathMap[viewName];
  const label = labelMap[viewName] || 'registro';
  if (!base || !id){ return; }
  e.preventDefault();
  e.stopPropagation();
  if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
  const msg = (base === '/clients') ? 'Seguro que desea borrar?' : `Eliminar ${label}`;
  const ok = await showConfirm(msg, { okText: 'Eliminar', cancelText: 'Cancelar' });
  if (!ok) return;
  await API.apiDelete(`${base}/${id}`);
  // Recargar vista correspondiente
  try {
    switch(viewName){
      case 'users': return loadUsers();
      case 'products': return loadProducts();
      case 'clients':
      case 'catalogs': return loadClients();
      case 'inventory': return loadInventory();
      case 'production':
      case 'process': return loadProduction();
      case 'operators': return loadOperators();
      default: return loadView(viewName);
    }
  } catch(_) {}
}, true);


// Alerta centrada (modal) de un solo botón
window.showCenterAlert = function showCenterAlert(message, title = 'Aviso'){ return new Promise((resolve)=>{
  try {
    const wrap = document.createElement('div');
    wrap.className = 'x-modal show';
    wrap.innerHTML = `<div class="x-backdrop"></div><div class="x-dialog"><div class="x-title">${title}</div><div class="x-msg">${message}</div><div class="x-actions"><button class="btn-primary" id="xOk">Aceptar</button></div></div>`;
    document.body.appendChild(wrap);
    const done = ()=>{ try { wrap.remove(); } catch(_){} resolve(); };
    wrap.querySelector('#xOk')?.addEventListener('click', done);
    wrap.querySelector('.x-backdrop')?.addEventListener('click', done);
  } catch(_) { try { alert(message); } catch(__){} resolve(); }
}); };


// Refresco automático tras guardar/editar/borrar sin recargar la página
try {
  window.addEventListener('data:changed', async (ev) => {
    try {
      // Cerrar cualquier overlay que esté bloqueando interacción
      try { document.querySelectorAll('.x-modal')?.forEach(w => { try { w.remove(); } catch(_){} }); } catch(_) {}
      try {
        const modal = document.getElementById('modal');
        if (modal){
          modal.classList.remove('show');
          modal.classList.remove('image-only');
          modal.setAttribute('aria-hidden','true');
          const submitBtn = modal.querySelector('button[type="submit"][form="modalForm"]');
          if (submitBtn) submitBtn.style.display = '';
          const form = document.getElementById('modalForm');
          form?.querySelectorAll('input,textarea,select,button')?.forEach(el => el.removeAttribute('disabled'));
          modal.querySelector('.image-only-wrap')?.remove();
          modal.querySelector('.image-close')?.remove();
        }
      } catch(_) {}
      const viewName = (typeof window !== 'undefined' && window.__currentView) ? String(window.__currentView).toLowerCase() : '';
      switch(viewName){
        case 'users': await loadUsers(); break;
        case 'products': await loadProducts(); break;
        case 'clients':
        case 'catalogs': await loadClients(); break;
        case 'inventory': await loadInventory(); break;
        case 'production':
        case 'process': await loadProduction(); break;
        case 'operators': await loadOperators(); break;
        case 'stations': await loadView('stations'); break;
        default: await loadView(viewName || 'dashboard'); break;
      }
      // Intentar enfocar el registro recién afectado (si viene id)
      try {
        const id = ev && ev.detail && ev.detail.data && ev.detail.data.id;
        if (id != null) {
          setTimeout(() => {
            const btn = document.querySelector(`#view button[data-id="${id}"][data-act="edit"]`) || document.querySelector(`#view button[data-id="${id}"]`);
            if (btn && typeof btn.focus === 'function') btn.focus();
          }, 0);
        }
      } catch(_) {}
    } catch(_) {}
  });
} catch(_) {}






































