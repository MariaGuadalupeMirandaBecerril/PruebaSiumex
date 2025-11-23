// Minimal UI controller (router + dashboard + users view)
// This file replaces a previously corrupted controller.

// ---- Setup ----
const view = document.getElementById('view');
const navLinks = document.querySelectorAll('.sidebar a[data-view]');
let __currentView = 'clients';

document.getElementById('logoutBtn')?.addEventListener('click', () => {
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
  __currentView = name || __currentView || 'clients';
  if (name === 'dashboard') return loadDashboard();
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
    }).join('')}${cfg.form ? `<td><button data-act="view" data-id="${r.id}">Ver</button> <button data-act="edit" data-id="${r.id}">Editar</button> <button data-act="del" data-id="${r.id}">Eliminar</button></td>` : ''}</tr>`
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
        if (!confirm('¿Eliminar registro?')) return;
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
    let pageSize = 50;

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
      const rowsAll = (data||[]).filter(r =>
        !search || `${r.nombre||''} ${r.apellido||''} ${r.correo||''} ${r.username||''}`.toLowerCase().includes(search)
      );
      const pages = Math.max(1, Math.ceil(rowsAll.length / pageSize));
      if (page > pages) page = pages;
      const start = (page - 1) * pageSize;
      const slice = rowsAll.slice(start, start + pageSize);

      const body = slice.map(r => {
        const rolTxt = (r.rol || '').toString().toUpperCase();
        const statusTxt = (r.status || 'Activo');
        return `<tr>
          <td>${r.nombre ?? ''}</td>
          <td>${r.correo ?? ''}</td>
          <td>${pill(rolTxt || 'USUARIO', 'role')}</td>
          <td class="ops">
            <button class="op-btn" title="Ver" data-act="view" data-id="${r.id}">Ver</button>
            <button class="op-btn" title="Editar" data-act="edit" data-id="${r.id}">Editar</button>
            <button class="op-btn danger" title="Eliminar" data-act="del" data-id="${r.id}">Eliminar</button>
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

      view.innerHTML = clientsHubHeader('users') + `
        <h2>Gestión de Usuarios</h2>
        <div class="muted">Administra y monitorea los usuarios del sistema</div>
        <div class="toolbar">
          <div><button class="btn-secondary" id="btnFilters">? Filtros</button></div>
          <div class="spacer"></div>
          <div class="search"><input type="text" id="userSearch" placeholder="Buscar usuario" value="${q}" /></div>
          <button class="btn-primary" id="btnNewUser">+ Nuevo Usuario</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead>${header}</thead>
            <tbody>${body}</tbody>
          </table>
        </div>
        <div class="pager">
          <div class="left">Mostrando ${rowsAll.length ? (start+1) : 0}-${Math.min(start+slice.length, rowsAll.length)} de ${rowsAll.length} usuarios</div>
          <div class="right">
            <button class="btn-secondary" id="pg10" ${pageSize===10?'disabled':''}>10</button>
            <button class="btn-secondary" id="pg20" ${pageSize===20?'disabled':''}>20</button>
            <button class="btn-secondary" id="pg50" ${pageSize===50?'disabled':''}>50</button>
            <span style="margin:0 8px">Pág ${page} / ${pages}</span>
            <button class="btn-secondary" id="prevPg" ${page<=1?'disabled':''}>Prev</button>
            <button class="btn-secondary" id="nextPg" ${page>=pages?'disabled':''}>Next</button>
          </div>
        </div>`;

      // Handlers
      bindClientsHubTabs();
      try { const h=view.querySelector('h2'); if (h) h.textContent='Gestión de Usuarios'; } catch(_){ }
      document.getElementById('userSearch')?.addEventListener('input', (e)=>{ q = e.target.value; page = 1; render(); });
      document.getElementById('pg10')?.addEventListener('click', ()=>{ pageSize=10; page=1; render(); });
      document.getElementById('pg20')?.addEventListener('click', ()=>{ pageSize=20; page=1; render(); });
      document.getElementById('pg50')?.addEventListener('click', ()=>{ pageSize=50; page=1; render(); });
      document.getElementById('prevPg')?.addEventListener('click', ()=>{ if (page>1){ page--; render(); } });
      document.getElementById('nextPg')?.addEventListener('click', ()=>{ page++; render(); });

      document.getElementById('btnNewUser')?.addEventListener('click', async () => {
        const userFields = [
          { name: 'rfid', label: 'RFID' },
          { name: 'nombre', label: 'Nombre' },
          { name: 'correo', label: 'Correo', type: 'email' },
          { name: 'rol', label: 'Rol', type: 'select', options: ['Administrador','Operador','Usuario'] },
          { name: 'password', label: 'Contraseña', type: 'password' },
        ];
        openFormModal('Registrar Usuario', userFields, {}, async (obj) => {
          await API.apiPost('/users', obj);
          loadUsers();
        });
      });
      document.querySelectorAll('button[data-act="edit"]').forEach((btn) => btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const current = await API.apiGet(`/users/${id}`);
        const userFields = [
          { name: 'rfid', label: 'RFID' },
          { name: 'nombre', label: 'Nombre' },
          { name: 'correo', label: 'Correo', type: 'email' },
          { name: 'rol', label: 'Rol', type: 'select', options: ['Administrador','Operador','Usuario'] },
          { name: 'password', label: 'Contraseña', type: 'password' },
        ];
        openFormModal('Editar Usuario', userFields, current, async (obj) => {
          await API.apiPut(`/users/${id}`, obj);
          loadUsers();
        });
      }));
      document.querySelectorAll('button[data-act="del"]').forEach((btn) => btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!confirm('¿Eliminar usuario?')) return;
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

// ---- Products (Diseño tipo Usuarios) ----
async function loadProducts() {
  try {
    const data = await API.apiGet('/products');
    let q = '';
    let page = 1;
    let pageSize = 50;

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
          <td>${[r.variable1, r.variable2, r.variable3].filter(Boolean).map(pill).join(' ')}</td>
          <td>${r.peso_por_pieza ?? ''}</td>
          <td>${r.imagen ? `<img class="prod-img-thumb" data-img="${r.imagen}" src="${r.imagen}" alt="img" style="width:48px;height:48px;object-fit:cover;border-radius:6px;border:1px solid #2b3440;cursor:zoom-in;"/>` : ''}</td>
          <td class="ops">
            <button class="op-btn" data-act="view" data-id="${r.id}">Ver</button>
            <button class="op-btn" data-act="edit" data-id="${r.id}">Editar</button>
            <button class="op-btn danger" data-act="del" data-id="${r.id}">Eliminar</button>
          </td>
        </tr>`).join('');

      view.innerHTML = clientsHubHeader('products') + `
        <h2>Productos</h2>
        <div class="toolbar">
          <div class="search"><input id="prodSearch" type="text" placeholder="Buscar productos..." value="${q}"></div>
          <div class="spacer"></div>
          <button class="btn-primary" id="btnNewProd">Nuevo producto</button>
        </div>
        <div class="table-wrap products-only">
          <table class="products-table">
            <thead>
              <tr><th>Producto</th><th>Variables</th><th>Peso por pieza</th><th>Imagen</th><th>Acciones</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="pager">
          <div class="left">Mostrando ${rowsAll.length ? (start+1) : 0}-${Math.min(start+slice.length, rowsAll.length)} de ${rowsAll.length} productos</div>
          <div class="right">
            <button class="btn-secondary" id="pg10" ${pageSize===10?'disabled':''}>10</button>
            <button class="btn-secondary" id="pg20" ${pageSize===20?'disabled':''}>20</button>
            <button class="btn-secondary" id="pg50" ${pageSize===50?'disabled':''}>50</button>
            <span style="margin:0 8px">Pág ${page} / ${pages}</span>
            <button class="btn-secondary" id="prevPg" ${page<=1?'disabled':''}>Prev</button>
            <button class="btn-secondary" id="nextPg" ${page>=pages?'disabled':''}>Next</button>
          </div>
        </div>`;

      // Handlers
      bindClientsHubTabs();
      try { const h=view.querySelector('h2'); if (h) h.textContent='Gestión de Productos'; } catch(_){ }
      document.getElementById('prodSearch')?.addEventListener('input', (e)=>{ q = e.target.value; page = 1; render(); });
      document.getElementById('pg10')?.addEventListener('click', ()=>{ pageSize=10; page=1; render(); });
      document.getElementById('pg20')?.addEventListener('click', ()=>{ pageSize=20; page=1; render(); });
      document.getElementById('pg50')?.addEventListener('click', ()=>{ pageSize=50; page=1; render(); });
      document.getElementById('prevPg')?.addEventListener('click', ()=>{ if (page>1){ page--; render(); } });
      document.getElementById('nextPg')?.addEventListener('click', ()=>{ page++; render(); });

      document.getElementById('btnNewProd')?.addEventListener('click', async () => {
        const fields = [
          { name: 'idprod', label: 'IdProd' },
          { name: 'nombre', label: 'Nombre' },
          { name: 'variable1', label: 'Color' },
          { name: 'variable2', label: 'Tamaño' },
          { name: 'variable3', label: 'Material' },
          { name: 'peso_por_pieza', label: 'Peso por pieza', type: 'number' },
          { name: 'imagen', label: 'Imagen' },
        ];
        openFormModal('Registrar Producto', fields, {}, async (obj) => { await API.apiPost('/products', obj); loadProducts(); });
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
          { name: 'idprod', label: 'IdProd' },
          { name: 'nombre', label: 'Nombre' },
          { name: 'variable1', label: 'Color' },
          { name: 'variable2', label: 'Tamaño' },
          { name: 'variable3', label: 'Material' },
          { name: 'peso_por_pieza', label: 'Peso por pieza', type: 'number' },
          { name: 'imagen', label: 'Imagen' },
        ];
        openFormModal('Editar Producto', fields, current, async (obj) => { await API.apiPut(`/products/${id}`, obj); loadProducts(); });
      }));
      document.querySelectorAll('button[data-act="del"]').forEach((btn) => btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!confirm('¿Eliminar producto?')) return; await API.apiDelete(`/products/${id}`); loadProducts();
      }));
      document.querySelectorAll('button[data-act="view"]').forEach((btn) => btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const current = await API.apiGet(`/products/${id}`);
        const fields = [
          { name: 'idprod', label: 'IdProd' },
          { name: 'nombre', label: 'Nombre' },
          { name: 'variable1', label: 'Color' },
          { name: 'variable2', label: 'Tamaño' },
          { name: 'variable3', label: 'Material' },
          { name: 'peso_por_pieza', label: 'Peso por pieza' },
          { name: 'imagen', label: 'Imagen' },
        ];
        openFormModal('Detalle de Producto', fields, current, null);
      }));
    }

    render();
  } catch (e) {
    console.error(e);
    view.innerHTML = '<p>Sin permisos para ver productos.</p>';
  }
}

// ---- Clients (Diseño tipo Usuarios) ----
async function loadClients() {
  try {
    const data = await API.apiGet('/clients');
    let q = '';
    let page = 1;
    let pageSize = 50;

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
            <button class="op-btn" data-act="view" data-id="${r.id}">Ver</button>
            <button class="op-btn" data-act="edit" data-id="${r.id}">Editar</button>
            <button class="op-btn danger" data-act="del" data-id="${r.id}">Eliminar</button>
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
          <div class="left tools-left">
            <button class="chip-btn">Filtros</button>
            <button class="chip-btn success">Excel</button>
            <button class="chip-btn">PDF</button>
            <button class="circle-btn" id="reloadClients" title="Recargar">?</button>
          </div>
          <div class="spacer"></div>
          <div class="right tools-right">
            <div class="search"><input id="clieSearch" type="text" placeholder="Buscar Cliente" value="${q}"></div>
            <button class="btn-primary" id="btnNewClie">+ Registrar Cliente</button>
          </div>
        </div>

        <div class="table-wrap">
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
            <button class="btn-secondary" id="pg10" ${pageSize===10?'disabled':''}>10</button>
            <button class="btn-secondary" id="pg20" ${pageSize===20?'disabled':''}>20</button>
            <button class="btn-secondary" id="pg50" ${pageSize===50?'disabled':''}>50</button>
            <span style="margin:0 8px">Pág ${page} / ${pages}</span>
            <button class="btn-secondary" id="prevPg" ${page<=1?'disabled':''}>Prev</button>
            <button class="btn-secondary" id="nextPg" ${page>=pages?'disabled':''}>Next</button>
          </div>
        </div>`;

      // Sustituir encabezado estático por barra de pestañas + título contextual
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
      document.getElementById('clieSearch')?.addEventListener('input', (e)=>{ q = e.target.value; page = 1; render(); });
      document.getElementById('reloadClients')?.addEventListener('click', ()=>{ render(); });

      // Enlazar píldoras de navegación (Clientes)
      try {
        const pills = view.querySelectorAll('.nav-pills .nav-pill');
        // 0 = Clientes (activa), 1 = Tipo de Basura, 2 = Reporte Entradas, 3 = Reporte Entradas y salidas
        pills[1]?.addEventListener('click', () => loadView('variables'));
        pills[2]?.addEventListener('click', () => { if (typeof loadReports === 'function') loadReports(); });
        pills[3]?.addEventListener('click', () => { if (typeof loadReports === 'function') loadReports(); });
      } catch(_) {}

      // Exportación de clientes (Excel/PDF) usando endpoints del backend
      function exportClients(kind){
        const base = (typeof window !== 'undefined' && window.API_BASE) || '/api';
        const endpoint = kind === 'excel' ? 'export/excel' : 'export/pdf';
        const url = `${base}/${endpoint}?kind=clients`;
        const token = localStorage.getItem('token');
        fetch(url, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
          .then(res => { if (!res.ok) return res.text().then(t=>{ throw new Error(t||'Error al exportar'); }); return res.blob(); })
          .then(blob => { const dl = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=dl; a.download = kind==='excel' ? 'clients.xlsx' : 'clients.pdf'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(dl); })
          .catch(err => alert(err.message || 'Error al exportar'));
      }
      try {
        const leftTools = view.querySelector('.tools-left');
        const excelBtn = leftTools?.querySelector('.chip-btn.success');
        const pdfBtn = Array.from(leftTools?.querySelectorAll('.chip-btn') || []).find(b => (b.textContent||'').trim().toLowerCase() === 'pdf');
        excelBtn?.addEventListener('click', ()=> exportClients('excel'));
        pdfBtn?.addEventListener('click', ()=> exportClients('pdf'));
      } catch(_) {}

      // Ajustes solicitados: renombrar pestañas y destinos
      try {
        const titleEl = view.querySelector('.page-header .page-title');
        const subEl = view.querySelector('.page-header .page-subtitle');
        if (titleEl) titleEl.textContent = 'Gestión de Clientes';
        if (subEl) subEl.textContent = 'Administra y organiza la información de los clientes';

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
      document.getElementById('pg10')?.addEventListener('click', ()=>{ pageSize=10; page=1; render(); });
      document.getElementById('pg20')?.addEventListener('click', ()=>{ pageSize=20; page=1; render(); });
      document.getElementById('pg50')?.addEventListener('click', ()=>{ pageSize=50; page=1; render(); });
      document.getElementById('prevPg')?.addEventListener('click', ()=>{ if (page>1){ page--; render(); } });
      document.getElementById('nextPg')?.addEventListener('click', ()=>{ page++; render(); });

      document.getElementById('btnNewClie')?.addEventListener('click', async () => {
        openClientLightModal(async (payload) => {
          await API.apiPost('/clients', payload);
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
        if (!confirm('¿Eliminar cliente?')) return; await API.apiDelete(`/clients/${id}`); loadClients();
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

// ---- Inventory (Diseño tipo Clientes) ----
async function loadInventory(){
  try{
    const data = await API.apiGet('/inventory');
    let q = '';
    let page = 1;
    let pageSize = 50;

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
        const cliente = typeof r.cliente === 'object' ? (r.cliente?.nombre||'') : (r.cliente||'');
        const producto = typeof r.producto === 'object' ? (r.producto?.nombre||'') : (r.producto||'');
        return `
        <tr>
          <td>${r.fecha ?? ''}</td>
          <td>${r.codigo_mr ?? ''}</td>
          <td>${r.descripcion ?? ''}</td>
          <td>${r.cantidad ?? ''}</td>
          <td>${producto}</td>
          <td>${cliente}</td>
          <td class="ops">
            <button class="op-btn" data-act="view" data-id="${r.id}">Ver</button>
            <button class="op-btn" data-act="edit" data-id="${r.id}">Editar</button>
            <button class="op-btn danger" data-act="del" data-id="${r.id}">Eliminar</button>
          </td>
        </tr>`;
      }).join('');

      view.innerHTML = `
        <div class="page-header">
          <div class="page-title">Gestión de Inventario</div>
          <div class="page-subtitle">Administra los registros de inventario</div>
        </div>

        <div class="nav-pills">
          <button class="nav-pill active">Inventario</button>
          <button class="nav-pill">Reportes</button>
        </div>

        <div class="toolbar toolbar-bar">
          <div class="left tools-left">
            <button class="chip-btn">Filtros</button>
            <button class="chip-btn success">Excel</button>
            <button class="chip-btn">PDF</button>
            <button class="circle-btn" id="reloadInv" title="Recargar">?</button>
          </div>
          <div class="spacer"></div>
          <div class="right tools-right">
            <div class="search"><input id="invSearch" type="text" placeholder="Buscar en inventario" value="${q}"></div>
            <button class="btn-primary" id="btnNewInv">+ Registrar Movimiento</button>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Fecha</th><th>Código MR</th><th>Descripción</th><th>Cantidad</th><th>Producto</th><th>Cliente</th><th>Acciones</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="pager">
          <div class="left">Mostrando ${rowsAll.length ? (start+1) : 0}-${Math.min(start+slice.length, rowsAll.length)} de ${rowsAll.length} registros</div>
          <div class="right">
            <button class="btn-secondary" id="pg10" ${pageSize===10?'disabled':''}>10</button>
            <button class="btn-secondary" id="pg20" ${pageSize===20?'disabled':''}>20</button>
            <button class="btn-secondary" id="pg50" ${pageSize===50?'disabled':''}>50</button>
            <span style="margin:0 8px">Pág ${page} / ${pages}</span>
            <button class="btn-secondary" id="prevPg" ${page<=1?'disabled':''}>Prev</button>
            <button class="btn-secondary" id="nextPg" ${page>=pages?'disabled':''}>Next</button>
          </div>
        </div>`;

      document.getElementById('reloadInv')?.addEventListener('click', ()=>{ render(); });
      document.getElementById('invSearch')?.addEventListener('input', (e)=>{ q = e.target.value; page = 1; render(); });
      document.getElementById('pg10')?.addEventListener('click', ()=>{ pageSize=10; page=1; render(); });
      document.getElementById('pg20')?.addEventListener('click', ()=>{ pageSize=20; page=1; render(); });
      document.getElementById('pg50')?.addEventListener('click', ()=>{ pageSize=50; page=1; render(); });
      document.getElementById('prevPg')?.addEventListener('click', ()=>{ if (page>1){ page--; render(); } });
      document.getElementById('nextPg')?.addEventListener('click', ()=>{ page++; render(); });

      document.getElementById('btnNewInv')?.addEventListener('click', async () => {
        const fields = ['fecha','codigo_mr','descripcion','cantidad','producto_id','cliente_id'];
        openFormModal('Registrar Movimiento', fields, {}, async (obj) => { await API.apiPost('/inventory', obj); loadInventory(); });
      });
      document.querySelectorAll('button[data-act="edit"]').forEach((btn) => btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const current = await API.apiGet(`/inventory/${id}`);
        const fields = ['fecha','codigo_mr','descripcion','cantidad','producto_id','cliente_id'];
        openFormModal('Editar Movimiento', fields, current, async (obj) => { await API.apiPut(`/inventory/${id}`, obj); loadInventory(); });
      }));
      document.querySelectorAll('button[data-act="del"]').forEach((btn) => btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!confirm('¿Eliminar registro?')) return; await API.apiDelete(`/inventory/${id}`); loadInventory();
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

// ---- Proceso/Producción (Diseño tipo Clientes) ----
async function loadProduction(){
  try{
    const data = await API.apiGet('/production');
    let q = '';
    let page = 1;
    let pageSize = 50;

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
            <button class="op-btn" data-act="view" data-id="${r.id}">Ver</button>
            <button class="op-btn" data-act="edit" data-id="${r.id}">Editar</button>
            <button class="op-btn danger" data-act="del" data-id="${r.id}">Eliminar</button>
          </td>
        </tr>`).join('');

      view.innerHTML = toolsHubHeader('process') + `
        <div class="page-header">
          <div class="page-title">Gestión de Proceso</div>
          <div class="page-subtitle">Administra las órdenes de proceso/producción</div>
        </div>

        <div class="nav-pills">
          <button class="nav-pill active">Proceso</button>
          <button class="nav-pill"> Reportes</button>
        </div>

        <div class="toolbar toolbar-bar">
          <div class="left tools-left">
            <button class="chip-btn">Filtros</button>
            <button class="chip-btn success">Excel</button>
            <button class="chip-btn">PDF</button>
            <button class="circle-btn" id="reloadProc" title="Recargar">?</button>
          </div>
          <div class="spacer"></div>
          <div class="right tools-right">
            <div class="search"><input id="procSearch" type="text" placeholder="Buscar en proceso" value="${q}"></div>
            <button class="btn-primary" id="btnNewProc">+ Registrar Proceso</button>
          </div>
        </div>

        <div class="table-wrap">
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
            <button class="btn-secondary" id="pg10" ${pageSize===10?'disabled':''}>10</button>
            <button class="btn-secondary" id="pg20" ${pageSize===20?'disabled':''}>20</button>
            <button class="btn-secondary" id="pg50" ${pageSize===50?'disabled':''}>50</button>
            <span style="margin:0 8px">Pág ${page} / ${pages}</span>
            <button class="btn-secondary" id="prevPg" ${page<=1?'disabled':''}>Prev</button>
            <button class="btn-secondary" id="nextPg" ${page>=pages?'disabled':''}>Next</button>
          </div>
        </div>`;

      bindToolsHubTabs();
      document.getElementById('reloadProc')?.addEventListener('click', ()=>{ render(); });
      document.getElementById('procSearch')?.addEventListener('input', (e)=>{ q = e.target.value; page = 1; render(); });
      document.getElementById('pg10')?.addEventListener('click', ()=>{ pageSize=10; page=1; render(); });
      document.getElementById('pg20')?.addEventListener('click', ()=>{ pageSize=20; page=1; render(); });
      document.getElementById('pg50')?.addEventListener('click', ()=>{ pageSize=50; page=1; render(); });
      document.getElementById('prevPg')?.addEventListener('click', ()=>{ if (page>1){ page--; render(); } });
      document.getElementById('nextPg')?.addEventListener('click', ()=>{ page++; render(); });
      // Imagen ampliable
      Array.from(document.querySelectorAll('.prod-img-thumb')).forEach(img => {
        img.addEventListener('click', () => {
          const src = img.getAttribute('data-img') || img.getAttribute('src');
          if (src) openImageModal(src, 'Imagen de Proceso');
        });
      });

      document.getElementById('btnNewProc')?.addEventListener('click', async () => {
        // Cargar catálogos para selects
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
          'empaques','piezas','lote',
          { name: 'imagen', label: 'Imagen', type: 'select', options: __imgOptsNew },
        ];
        openFormModal('Registrar Proceso', fields, {}, async (obj) => { 
          await API.apiPost('/production', obj); loadProduction();
        });
        // Auto-rellenar variables e imagen desde producto
        try {
          const form = document.getElementById('modalForm');
          const prodSel = form?.querySelector('select[name="producto_id"]');
          const imgPrev = form?.querySelector('img.img-preview[data-preview-for="imagen"]');
          const imgSel = form?.querySelector('select[name="imagen"]');
          const map = {}; (productos||[]).forEach(p => { map[p.id] = p; });
          function applyFromProduct(id){
            const p = map[id]; if (!p) return;
            const v1 = form.querySelector('[name="variable1"]');
            const v2 = form.querySelector('[name="variable2"]');
            const v3 = form.querySelector('[name="variable3"]');
            if (v1 && !v1.value) v1.value = p.variable1 || '';
            if (v2 && !v2.value) v2.value = p.variable2 || '';
            if (v3 && !v3.value) v3.value = p.variable3 || '';
            if (imgSel && p.imagen){ imgSel.value = p.imagen; }
            if (imgPrev && (imgSel?.value || p.imagen)){ imgPrev.src = imgSel?.value || p.imagen; imgPrev.style.display='block'; }
          }
          prodSel?.addEventListener('change', ()=> applyFromProduct(Number(prodSel.value)));
          if (prodSel && prodSel.value) applyFromProduct(Number(prodSel.value));
          imgSel?.addEventListener('change', ()=>{ if (imgPrev){ const v = imgSel.value; if (v){ imgPrev.src = v; imgPrev.style.display='block'; } else { imgPrev.style.display='none'; } } });
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
          'empaques','piezas','lote',
          { name: 'imagen', label: 'Imagen', type: 'select', options: imgOptsEdit },
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
          const prodSel = form?.querySelector('select[name="producto_id"]');
          const imgPrev = form?.querySelector('img.img-preview[data-preview-for="imagen"]');
          const imgSel = form?.querySelector('select[name="imagen"]');
          const map = {}; (productos||[]).forEach(p => { map[p.id] = p; });
          function applyFromProduct(id){
            const p = map[id]; if (!p) return;
            const v1 = form.querySelector('[name="variable1"]');
            const v2 = form.querySelector('[name="variable2"]');
            const v3 = form.querySelector('[name="variable3"]');
            if (v1 && !v1.value) v1.value = p.variable1 || '';
            if (v2 && !v2.value) v2.value = p.variable2 || '';
            if (v3 && !v3.value) v3.value = p.variable3 || '';
            if (imgSel && (current.imagen || p.imagen)) { imgSel.value = current.imagen || p.imagen; }
            if (imgPrev && (imgSel?.value || current.imagen || p.imagen)){
              imgPrev.src = imgSel?.value || current.imagen || p.imagen; imgPrev.style.display='block';
            }
          }
          prodSel?.addEventListener('change', ()=> applyFromProduct(Number(prodSel.value)));
          if (prodSel && prodSel.value) applyFromProduct(Number(prodSel.value));
          imgSel?.addEventListener('change', ()=>{ if (imgPrev){ const v = imgSel.value; if (v){ imgPrev.src = v; imgPrev.style.display='block'; } else { imgPrev.style.display='none'; } } });
        } catch(_) {}
      }));
      document.querySelectorAll('button[data-act="del"]').forEach((btn) => btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!confirm('¿Eliminar proceso?')) return; await API.apiDelete(`/production/${id}`); loadProduction();
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
          'empaques','piezas','lote',
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
          const imgPrev = form?.querySelector('img.img-preview[data-preview-for="imagen"]');
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

// ---- Operators (Diseño tipo Usuarios) ----
async function loadOperators() {
  try {
    const data = await API.apiGet('/operators');
    let q = '';
    let page = 1;
    let pageSize = 50;

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
            <button class="op-btn" data-act="view" data-id="${r.id}">Ver</button>
            <button class="op-btn" data-act="edit" data-id="${r.id}">Editar</button>
            <button class="op-btn danger" data-act="del" data-id="${r.id}">Eliminar</button>
          </td>
        </tr>`).join('');

      view.innerHTML = clientsHubHeader('operators') + `
        <h2>Operadores</h2>
        <div class="toolbar">
          <div class="search"><input id="opSearch" type="text" placeholder="Buscar operadores..." value="${q}"></div>
          <div class="spacer"></div>
          <button class="btn-primary" id="btnNewOp">Nuevo operador</button>
        </div>
        <div class="table-wrap">
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
            <button class="btn-secondary" id="pg10" ${pageSize===10?'disabled':''}>10</button>
            <button class="btn-secondary" id="pg20" ${pageSize===20?'disabled':''}>20</button>
            <button class="btn-secondary" id="pg50" ${pageSize===50?'disabled':''}>50</button>
            <span style="margin:0 8px">Pág ${page} / ${pages}</span>
            <button class="btn-secondary" id="prevPg" ${page<=1?'disabled':''}>Prev</button>
            <button class="btn-secondary" id="nextPg" ${page>=pages?'disabled':''}>Next</button>
          </div>
        </div>`;

      // Handlers
      bindClientsHubTabs();
      try { const h=view.querySelector('h2'); if (h) h.textContent='Gestión de Operadores'; } catch(_){ }
      document.getElementById('opSearch')?.addEventListener('input', (e)=>{ q = e.target.value; page = 1; render(); });
      document.getElementById('pg10')?.addEventListener('click', ()=>{ pageSize=10; page=1; render(); });
      document.getElementById('pg20')?.addEventListener('click', ()=>{ pageSize=20; page=1; render(); });
      document.getElementById('pg50')?.addEventListener('click', ()=>{ pageSize=50; page=1; render(); });
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
        openFormModal('Registrar Operador', fields, {}, async (obj) => { await API.apiPost('/operators', obj); loadOperators(); });
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
        if (!confirm('¿Eliminar operador?')) return; await API.apiDelete(`/operators/${id}`); loadOperators();
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
  const fields = ['rfc','nombre','calle','colonia','ciudad','estado','cp','contacto','correo','telefono'];
  const formFields = fields.map(f=>`<label>${f}<input type="text" id="f_${f}" value="${data[f]??''}"></label>`).join('');
  const logoUrl = data.logotipo || '';
  const logoBlock = `
    <div class="logo-field" style="grid-column: 1 / -1; margin-top: 6px;">
      <label>logotipo
        <input type="hidden" id="f_logotipo" value="${logoUrl}">
        <input type="file" id="logoFile" accept="image/*" style="display:block;margin-top:6px;">
      </label>
      <div style="margin-top:8px;">
        <img id="logoPreview" src="${logoUrl}" alt="Logotipo" style="max-height:140px;${logoUrl?'' :'display:none;'}border:1px solid #2b3440;border-radius:6px;padding:4px;background:#0b1220;">
      </div>
      <small style="display:block;margin-top:6px;opacity:0.8;">Selecciona una imagen; se sube y se guarda automáticamente.</small>
    </div>`;
  const form = formFields + logoBlock;
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

  // Upload and preview logo on change
  const logoInput = document.getElementById('logoFile');
  const logoPreview = document.getElementById('logoPreview');
  const logoHidden = document.getElementById('f_logotipo');
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
    } catch (e) {
      alert('Error al subir el logotipo');
    }
  });

  document.getElementById('saveCompany')?.addEventListener('click', async (ev)=>{
    ev.preventDefault();
    const obj={};
    [...fields, 'logotipo'].forEach(f=>{ const el = document.getElementById(`f_${f}`); if (el) obj[f] = el.value; });
    await API.apiPut('/company', obj);
    alert('Guardado');
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
    alert('Guardado');
  });
}

  // ---- Simple list ----

  // ---- Stations (editable obs) ----
  async function loadStations(){
    const data = await API.apiGet('/stations');
    const rows = (data||[]).map((r) => `
      <tr>
        <td>${r.idest ?? ''}</td>
        <td>${r.nombre ?? ''}</td>
        <td style="min-width:240px;">
          <textarea id="obs_${r.id}" rows="2" placeholder="Escribe observaciones...">${r.observaciones ?? ''}</textarea>
        </td>
        <td class="ops"><button class="op-btn" data-act="save" data-id="${r.id}">Guardar</button></td>
      </tr>`).join('');
    view.innerHTML = toolsHubHeader('stations') + `
      <div class="page-header">
        <div class="page-title">Estaciones</div>
        <div class="page-subtitle">Edita las observaciones y guarda los cambios</div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Id</th><th>Nombre</th><th>Observaciones</th><th>Acciones</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
    bindToolsHubTabs();
    // Bind save buttons
    document.querySelectorAll('button[data-act="save"]').forEach(btn => {
      btn.addEventListener('click', async ()=>{
        const id = btn.getAttribute('data-id');
        const ta = document.getElementById(`obs_${id}`);
        const val = (ta?.value || '').toString();
        await API.apiPut(`/stations/${id}`, { observaciones: val });
        btn.textContent = 'Guardado';
        setTimeout(()=>{ btn.textContent = 'Guardar'; }, 1200);
      });
    });
  }
async function loadSimpleList(path, title, cols) {
  const data = await API.apiGet(path);
  const rows = (data||[]).map(r => `<tr>${cols.map(c=>`<td>${r[c] ?? ''}</td>`).join('')}</tr>`).join('');
  const hub = (title && title.toLowerCase().includes('estac')) ? toolsHubHeader('stations') : '';
  view.innerHTML = hub + `<h2>${title}</h2><div class="table-wrap"><table><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
  if (hub) bindToolsHubTabs();
}

// ---- Dashboard ----
async function loadDashboard() {
  try {
    const data = await API.apiGet('/dashboard/summary');
    const c = data?.cards || {};
    const seriesPP = data?.series_piezas_por_producto || [];
    const seriesSaldo = data?.serie_saldo_tarjetas || [];
    const usingSaldo = seriesSaldo.length > 0 && seriesPP.length === 0;

    view.innerHTML = `
      <h2>Panel de Visualización de Datos</h2>
      <div class="muted">Obtén información precisa sobre el desempeño y evolución de los datos.</div>
      <div class="tabs">
        <button class="tab active" id="tabResTar">Resumen Tarjetas</button>
        <button class="tab" id="tabResBas">Resumen Basura</button>
      </div>
      <div class="filters">
        <select id="timeRange">
          <option value="7d">Últimos 7 días</option>
          <option value="30d">Últimos 30 días</option>
          <option value="ytd">Año en curso</option>
        </select>
        <input type="text" id="search" placeholder="Buscar tarjeta…" />
        <button class="icon-btn" id="applyFilters" title="Aplicar">?</button>
      </div>
      <div class="cards">
        ${c.tarjetas_activas !== undefined ? `<div class="card"><div class="card-title">Total Tarjetas Activas</div><div class="card-value">${c.tarjetas_activas}</div></div>` : ''}
        ${c.saldo_promedio !== undefined ? `<div class="card"><div class="card-title">Saldo Promedio</div><div class="card-value">${c.saldo_promedio}</div></div>` : ''}
        ${c.tarjetas_emitidas !== undefined ? `<div class="card"><div class="card-title">Tarjetas Emitidas</div><div class="card-value">${c.tarjetas_emitidas}</div></div>` : ''}
        ${c.movimientos_totales !== undefined ? `<div class="card"><div class="card-title">Movimientos Totales</div><div class="card-value">${c.movimientos_totales}</div></div>` : ''}
      </div>
      <h3>${usingSaldo ? 'Saldo de Tarjetas Activas' : 'Piezas por Producto'}</h3>
      <canvas id="dashChart" height="220"></canvas>
    `;

    // Reordenar para que los filtros queden debajo de las tarjetas (como en el mock)
    try {
      const container = document.getElementById('view');
      const filtersEl = container?.querySelector('.filters');
      const cardsEl = container?.querySelector('.cards');
      if (filtersEl && cardsEl && filtersEl.previousElementSibling !== cardsEl) {
        cardsEl.parentNode?.insertBefore(filtersEl, cardsEl.nextSibling);
      }
      const searchEl = container?.querySelector('#search');
      if (searchEl) searchEl.setAttribute('placeholder','Ingrese numero de tarjeta');
      const tr = container?.querySelector('#timeRange');
      if (tr) tr.value = '30d';
    } catch(_) {}

    const ctx = document.getElementById('dashChart');
    const labels = usingSaldo ? seriesSaldo.map(s => `${s.tarjeta}`) : seriesPP.map(s => `Prod ${s.producto_id}`);
    const values = usingSaldo ? seriesSaldo.map(s => s.saldo) : seriesPP.map(s => s.piezas);
    if (ctx && typeof Chart !== 'undefined') {
      // eslint-disable-next-line no-undef
      new Chart(ctx, { type: 'line', data: { labels, datasets: [{ label: usingSaldo ? 'Saldo' : 'Piezas', data: values }] } });
    }

    const t1 = document.getElementById('tabResTar');
    const t2 = document.getElementById('tabResBas');
    t1?.addEventListener('click', () => { t1.classList.add('active'); t2?.classList.remove('active'); });
    t2?.addEventListener('click', () => { t2.classList.add('active'); t1?.classList.remove('active'); });
  } catch (e) {
    console.error(e);
    view.innerHTML = '<h2>Panel de Visualización de Datos</h2><p>No fue posible cargar el panel.</p>';
  }
}

// ---- Modal helpers ----
function inputForField(desc, value = '') {
  const isObj = typeof desc === 'object' && desc !== null;
  const name = isObj ? (desc.name || '') : String(desc);
  let label = isObj ? (desc.label || name) : name;
  let type = isObj ? (desc.type || 'auto') : 'auto';
  const lower = (name || '').toLowerCase();
  if (type === 'auto'){
    if (lower.includes('fecha')) type = 'date';
    else if (lower.includes('correo') || lower === 'email') type = 'email';
    else if (lower.includes('password') || lower === 'pass' || lower === 'contraseña') type = 'password';
    else if (lower.endsWith('_id') || ['cantidad','piezas','empaques','cp','peso'].some(k=>lower.includes(k))) type = 'number';
    else type = 'text';
  }
  const pretty = {
    idprod: 'IdProd',
    idclie: 'IdClie',
    peso_por_pieza: 'Peso por pieza',
    op: 'OP',
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
      ? (()=>{ const has = value && typeof value === 'string'; const disp = has ? '' : 'display:none;'; return `<img class=\"img-preview\" data-preview-for=\"${name}\" src=\"${has?value:''}\" alt=\"preview\" style=\"max-height:120px;${disp}margin-top:8px;\">`; })()
      : '';
    return `<label>${label}<select name="${name}">${opts}</select>${imgPrev}</label>`;
  }
  if (['imagen','image','foto','photo','picture'].some(k => lower.includes(k))) {
    const has = value && typeof value === 'string';
    const img = has ? `<img class="img-preview" data-preview-for="${name}" src="${value}" alt="preview" style="max-height:120px;display:block;margin-top:8px;">`
                    : `<img class="img-preview" data-preview-for="${name}" alt="preview" style="max-height:120px;display:none;margin-top:8px;">`;
    return `<label>${label}<input type="file" name="${name}" accept="image/*">${img}</label>`;
  }
  const isArea = ['observaciones','descripcion','nota','notas','direccion'].some(k=> lower.includes(k));
  if (isArea) return `<label>${label}<textarea name="${name}">${value ?? ''}</textarea></label>`;
  return `<label>${label}<input type="${type}" name="${name}" value="${value ?? ''}"></label>`;
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
  const close = () => { modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); form.onsubmit = null; modal.querySelectorAll('[data-close]').forEach(b=> b.onclick = null); };
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
    if (onSubmit) await onSubmit(data);
    close();
  };
  // Preview de imagen al adjuntar
  try {
    const fileInputs = Array.from(form.querySelectorAll('input[type="file"][name]'));
    fileInputs.forEach(inp => {
      inp.addEventListener('change', () => {
        const img = form.querySelector(`img.img-preview[data-preview-for="${inp.name}"]`);
        const f = inp.files && inp.files[0];
        if (img && f){ const r = new FileReader(); r.onload = () => { img.src = r.result; img.style.display = 'block'; }; r.readAsDataURL(f); }
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
  mTitle.textContent = title;
  form.innerHTML = `<div style="padding:8px 0;text-align:center"><img src="${src}" alt="preview" style="max-width:100%;max-height:70vh;border-radius:8px;border:1px solid #2b3440"></div>`;
  const submitBtn = modal.querySelector('button[type="submit"][form="modalForm"]');
  if (submitBtn) submitBtn.style.display = 'none';
  modal.querySelectorAll('[data-close]').forEach(b=> b.onclick = ()=>{ modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); if (submitBtn) submitBtn.style.display=''; });
  modal.classList.add('show'); modal.setAttribute('aria-hidden','false');
}

// ---- Simple client modal (IdClie, Nombre, Observaciones) ----
function openClientLightModal(onSubmit, initial = {}, title = 'Registrar Cliente'){
  const modal = document.getElementById('modal');
  const form = document.getElementById('modalForm');
  const mTitle = document.getElementById('modalTitle');
  if (!modal || !form || !mTitle) return;
  mTitle.textContent = title;
  const init = initial || {};
  const val = (k, fb = '') => (init[k] ?? fb);
  form.innerHTML = `
    <div class="form-section">
      <div class="grid-2">
        <label>IdClie<input type="text" name="idclie" required value="${val('idclie','')}"></label>
        <label>Nombre<input type="text" name="nombre" required value="${val('nombre','')}"></label>
      </div>
      <label>Observaciones<textarea name="observaciones">${val('observaciones','')}</textarea></label>
    </div>`;
  const close = () => { modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); form.onsubmit = null; modal.querySelectorAll('[data-close]').forEach(b=> b.onclick = null); };
  modal.querySelectorAll('[data-close]').forEach(b=> b.onclick = close);
  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = { idclie: (fd.get('idclie')||'').toString().trim(), nombre: (fd.get('nombre')||'').toString().trim(), observaciones: (fd.get('observaciones')||'').toString() };
    if (onSubmit) await onSubmit(payload);
    close();
  };
  modal.classList.add('show'); modal.setAttribute('aria-hidden','false');
}
// ---- User full form modal (user + client-like extras) ----
function openUserFullModal(onSubmit, initialUser = {}, initialExtra = {}, title = 'Registrar Usuario'){
  const modal = document.getElementById('modal');
  const form = document.getElementById('modalForm');
  const mTitle = document.getElementById('modalTitle');
  if (!modal || !form || !mTitle) return;
  mTitle.textContent = title;
  const U = initialUser || {};
  const X = initialExtra || {};
  const valU = (k, fb = '') => (U[k] ?? fb);
  const valX = (k, fb = '') => (X[k] ?? fb);

  form.innerHTML = `
    <div class="form-section">
      <div class="section-title">Cuenta de usuario</div>
      <div class="grid-2">
        <label>RFID<input type="text" name="rfid" value="${valU('rfid','')}"></label>
        <label>Nombre<input type="text" name="nombre" required value="${valU('nombre','')}"></label>
      </div>
      <div class="grid-2">
        <label>Correo<input type="email" name="correo" required value="${valU('correo','')}"></label>
        <label>Rol
          <select name="rol">
            <option ${String(valU('rol','')).toLowerCase()==='administrador'?'selected':''}>Administrador</option>
            <option ${String(valU('rol','')).toLowerCase()==='operador'?'selected':''}>Operador</option>
            <option ${String(valU('rol','')).toLowerCase()==='usuario'?'selected':''}>Usuario</option>
          </select>
        </label>
      </div>
      <label>Nueva contraseña<input type="password" name="password" value=""></label>
    </div>

    <div class="form-section">
      <div class="section-title">Cliente (opcional)</div>
      <div class="grid-2">
        <label>Nombre<input type="text" name="clie_nombre" value="${valX('clie_nombre','')}"></label>
        <label>RFC<input type="text" name="clie_rfc" value="${valX('clie_rfc','')}"></label>
      </div>
      <label>Observaciones<textarea name="clie_observaciones">${valX('clie_observaciones','')}</textarea></label>
      <div class="section-title">Dirección</div>
      <label>Calle<input type="text" name="clie_calle" value="${valX('clie_calle','')}"></label>
      <div class="grid-2">
        <label>Número Interior<input type="text" name="clie_num_interior" value="${valX('clie_num_interior','')}"></label>
        <label>Número Exterior<input type="text" name="clie_num_exterior" value="${valX('clie_num_exterior','')}"></label>
      </div>
      <div class="grid-2">
        <label>Colonia<input type="text" name="clie_colonia" value="${valX('clie_colonia','')}"></label>
        <label>Ciudad<input type="text" name="clie_ciudad" value="${valX('clie_ciudad','')}"></label>
      </div>
      <div class="grid-2">
        <label>Estado<input type="text" name="clie_estado" value="${valX('clie_estado','')}"></label>
        <label>Código Postal<input type="text" name="clie_cp" value="${valX('clie_cp','')}"></label>
      </div>
    </div>
  `;

  const close = () => { modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); form.onsubmit = null; modal.querySelectorAll('[data-close]').forEach(b=> b.onclick = null); };
  modal.querySelectorAll('[data-close]').forEach(b=> b.onclick = close);
  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const user = { rfid: fd.get('rfid')||'', nombre: fd.get('nombre')||'', correo: fd.get('correo')||'', rol: fd.get('rol')||'' };
    const pwd = (fd.get('password')||'').toString(); if (pwd) user.password = pwd;
    const clientPayload = { idclie: (fd.get('clie_rfc')||'').toString().trim(), nombre: (fd.get('clie_nombre')||'').toString().trim(), observaciones: (fd.get('clie_observaciones')||'').toString() };
    const extra = {
      clie_nombre: fd.get('clie_nombre')||'', clie_rfc: fd.get('clie_rfc')||'', clie_observaciones: fd.get('clie_observaciones')||'',
      clie_calle: fd.get('clie_calle')||'', clie_num_interior: fd.get('clie_num_interior')||'', clie_num_exterior: fd.get('clie_num_exterior')||'',
      clie_colonia: fd.get('clie_colonia')||'', clie_ciudad: fd.get('clie_ciudad')||'', clie_estado: fd.get('clie_estado')||'', clie_cp: fd.get('clie_cp')||''
    };
    if (onSubmit) await onSubmit(user, clientPayload, extra);
    close();
  };
  modal.classList.add('show'); modal.setAttribute('aria-hidden','false');
}

// ---- Custom: Registrar Cliente (UI-only layout) ----
function openClientCreateModal(onSubmit, initial = {}, title = 'Registrar Cliente'){
  const modal = document.getElementById('modal');
  const form = document.getElementById('modalForm');
  const mTitle = document.getElementById('modalTitle');
  if (!modal || !form || !mTitle) return;
  mTitle.textContent = title;
  const init = initial || {};
  const val = (k, fb = '') => (init[k] ?? fb);

  form.innerHTML = `
    <div class="form-section">
      <div class="section-title">Información general del cliente</div>
      <div class="grid-2">
        <label class="with-icon">Nombre
          <span class="icon">??</span>
          <input type="text" name="nombre" placeholder="Nombre completo" required value="${val('nombre','')}">
        </label>
        <label class="with-icon">RFC
          <span class="icon">??</span>
          <input type="text" name="rfc_ui" placeholder="RFC" required value="${val('rfc_ui', init.idclie || '')}">
        </label>
      </div>
      <div class="grid-2">
        <label class="with-icon">Permiso
          <span class="icon">???</span>
          <input type="text" name="permiso" placeholder="Número de permiso" value="${val('permiso','')}">
        </label>
        <label class="with-icon">Vigencia
          <span class="icon">??</span>
          <input type="date" name="vigencia" placeholder="dd/mm/aaaa" value="${val('vigencia','')}">
        </label>
      </div>
      <label class="with-icon">Observaciones
        <span class="icon">???</span>
        <textarea name="observaciones" placeholder="Notas u observaciones">${val('observaciones','')}</textarea>
      </label>
    </div>

    <div class="form-section">
      <div class="section-title">Dirección</div>
      <label class="with-icon">Calle
        <span class="icon">??</span>
        <input type="text" name="calle" placeholder="Calle" value="${val('calle','')}">
      </label>
      <div class="grid-2">
        <label class="with-icon">Número Interior
          <span class="icon">??</span>
          <input type="text" name="num_interior" placeholder="Num. interior" value="${val('num_interior','')}">
        </label>
        <label class="with-icon">Número Exterior
          <span class="icon">??</span>
          <input type="text" name="num_exterior" placeholder="Num. exterior" value="${val('num_exterior','')}">
        </label>
      </div>
      <div class="grid-2">
        <label class="with-icon">Colonia
          <span class="icon">??</span>
          <input type="text" name="colonia" placeholder="Colonia" value="${val('colonia','')}">
        </label>
        <label class="with-icon">Ciudad
          <span class="icon">???</span>
          <input type="text" name="ciudad" placeholder="Ciudad" value="${val('ciudad','')}">
        </label>
      </div>
      <div class="grid-2">
        <label class="with-icon">Estado
          <span class="icon">???</span>
          <input type="text" name="estado" placeholder="Estado" value="${val('estado','')}">
        </label>
        <label class="with-icon">Código Postal
          <span class="icon">??</span>
          <input type="text" name="cp" placeholder="Código Postal" value="${val('cp','')}">
        </label>
      </div>
    </div>

    <div class="form-section">
      <div class="section-title">Documento</div>
      <div class="dropzone" id="clientDrop">
        <input type="file" id="clientFile" accept="application/pdf" style="display:none" />
        <div class="drop-inner">
          <div class="circle">??</div>
          <div class="dz-text">Arrastra un archivo aquí o haz clic para seleccionar</div>
          <div class="dz-hint muted">Formato aceptado: PDF</div>
        </div>
      </div>
    </div>
  `;

  // Simple dropzone behavior (UI-only)
  const dz = form.querySelector('#clientDrop');
  const fileInput = form.querySelector('#clientFile');
  if (dz && fileInput){
    dz.addEventListener('click', ()=> fileInput.click());
    dz.addEventListener('dragover', (e)=>{ e.preventDefault(); dz.classList.add('drag'); });
    dz.addEventListener('dragleave', ()=> dz.classList.remove('drag'));
    dz.addEventListener('drop', (e)=>{ e.preventDefault(); dz.classList.remove('drag'); if (e.dataTransfer?.files?.length) fileInput.files = e.dataTransfer.files; });
  }

  const close = () => { modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); form.onsubmit = null; modal.querySelectorAll('[data-close]').forEach(b=> b.onclick = null); };
  modal.querySelectorAll('[data-close]').forEach(b=> b.onclick = close);
  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = {
      idclie: (fd.get('rfc_ui') || '').toString().trim(),
      nombre: (fd.get('nombre') || '').toString().trim(),
      observaciones: (fd.get('observaciones') || '').toString(),
      calle: (fd.get('calle') || '').toString(),
      num_interior: (fd.get('num_interior') || '').toString(),
      num_exterior: (fd.get('num_exterior') || '').toString(),
      colonia: (fd.get('colonia') || '').toString(),
      ciudad: (fd.get('ciudad') || '').toString(),
      estado: (fd.get('estado') || '').toString(),
      cp: (fd.get('cp') || '').toString(),
    };
    if (onSubmit) await onSubmit(payload);
    close();
  };
  modal.classList.add('show'); modal.setAttribute('aria-hidden','false');
}

// ---- Theme + user menu ----
const themeBtn = document.getElementById('themeToggle');
if (themeBtn) {
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
  document.querySelector('.user-menu [data-go="profile"]')?.addEventListener('click', () => alert('Perfil próximamente'));
}

// ---- Perfil (usuario actual) ----
async function loadProfile(){
  try{
    const me = await API.apiGet('/profile');
    const fields = ['rfid','nombre','correo','password'];
    view.innerHTML = `
      <div class="page-header">
        <div class="page-title">Perfil</div>
        <div class="page-subtitle">Datos de tu cuenta</div>
      </div>
      <div class="table-wrap" style="padding:16px;">
        <form id="profileForm" class="form-grid">
          ${fields.map(f => {
            const label = f === 'password' ? 'Nueva contrase?a' : f;
            const type = f === 'password' ? 'password' : (f==='correo'?'email':'text');
            const val = f==='password' ? '' : (me[f] ?? '');
            return `<label>${label}<input name="${f}" type="${type}" value="${val}"></label>`;
          }).join('')}
          <div><button class="btn-primary" type="submit">Guardar</button></div>
        </form>
      </div>`;
    document.getElementById('profileForm')?.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const data = {}; new FormData(e.target).forEach((v,k)=>{ if(v) data[k]=v; });
      await API.apiPut('/profile', data);
      try {
        const u = JSON.parse(localStorage.getItem('usuario')||'{}');
        if (data.nombre) u.nombre = data.nombre;
        if (data.correo) u.correo = data.correo;
        localStorage.setItem('usuario', JSON.stringify(u));
      } catch(_){}
      alert('Perfil actualizado');
    });
  }catch(e){
    console.error(e);
    view.innerHTML = '<p>No fue posible cargar el perfil.</p>';
  }
}

// Captura clic en 'Perfil' para evitar alert antiguo si existiera
try {
  const __profCap = document.querySelector('.user-menu [data-go="profile"]');
  __profCap?.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); loadView('profile'); }, true);
} catch(_) {}

// ---- Default ----
loadView('clients');
// Recargar vista actual desde el botón de la barra
document.getElementById('reloadBtn')?.addEventListener('click', () => {
  try { loadView(__currentView || 'clients'); } catch(_) {}
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






