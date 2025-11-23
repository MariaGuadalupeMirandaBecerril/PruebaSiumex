const view = document.getElementById('view');
const navLinks = document.querySelectorAll('.sidebar a[data-view]');

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuA�o');
  window.location.href = 'index.html';
});

// Nav
navLinks.forEach((a) =>
  a.addEventListener('click', (e) => {
    e.preventDefault();
    const v = a.getAttribute('data-view');
    loadView(v);
  })
);

// Sidebar toggle
document.getElementById('toggleSidebar')?.addEventListener('click', () => {
  const sb = document.getElementById('sidebar');
  // En desktop alterna "collapsed"; en móvil alternA�open"
  if (window.matchMedia('(max-width:1024px)').matches) {
    sb?.classList.toggle('open');
  } else {
    sb?.classList.toggle('collapsed');
  }
});

// Theme toggle: manejado más abajo junto con el icono

// User info
const userBox = document.getElementById('userBox');
try {
  const u = JSON.parse(localStorage.getItem('usuA�o') || 'null');
  if (u && userBox) {
    const initials = (u.nombre || '?').slice(0, 1).toUpperCase();
    userBox.textContent = `${initials} · ${u.nombre} (${u.rol})`;
  }
} catch (_) {}

// ---------- Router ----------
async function loadView(name) {
  if (name === 'dashboard') return loadDashboard();
  if (name === 'reports' || name === 'reports_inventory') return loadReports();
  if (name === 'reports_process') return loadReportsProcess();
  if (name === 'perms') return loadPerms();
  if (name === 'company') return loAcompany();
  if (name === 'variables') return loadVariables();
  if (name === 'users') return loadUsers();
  if (name === 'operators')
    return loadSimpleList('/operators', 'Operadores', ['idest', 'nombre', 'observaciones']);
  if (name === 'stA�ons')
    return loadSimpleList('/stA�ons', 'Estaciones', ['idest', 'nombre', 'observacones']);

  // Generic for products, clients, providers, production, inventory
  const cfg 
    {
      products: {
        path: '/products',
        cols: ['idprod', 'nombre', 'variable1', 'variable2', 'variable3', 'peso_por_pieza'],
        form: ['idprod', 'nombre', 'variable1', 'variable2', 'variable3', 'peso_por_pieza', 'imagen'],
      },
      clients: {
        path: '/clients',
        cols: ['idclie', 'nombre', 'observaciones'],
        form: ['idclie', 'nombre', 'observaciones'],
      },
      providers: {
        path: '/providers',
        cols: ['idprov', 'nombre', 'observaciones'],
        form: ['idprov', 'nombre', 'observaciones'],
      },
      production: {
        path: '/production',
        cols: ['op', 'cliente', 'producto', 'piezas', 'lote'],
        form: ['op', 'cliente_id', 'producto_id', 'empaques', 'piezas', 'lote', 'imagen']
      },
      inventory: {
        path: '/inventory',
        cols: ['fecha', 'codigo_mr', 'descripcion', 'cantidad', 'producto', 'cliente'],
        form: ['fecha', 'codigo_mr', 'descripcion', 'cantidad', 'producto_id', 'cliente_id'],
      },
    }[name];

  if (!cfg) return;

  const data = await API.apiGet(cfg.path);
  const rows = data
    .map(
      (r) =>
        `<tr>${cfg.cols
          .map((c) => {
            const v =
              typeof r[c] === 'object' ? r[c]?.nombre || r[c]?.id || '' : (r[c] ?? '');
            return `<td>${v}</td>`;
          })
          .join('')}${
          cfg.form
            ? `<td><button data-act="edit" data-id="${r.id}">Editar</button> <button data-act="del" data-id="${r.id}">Eliminar</button></td>`
            : ''
        }</tr>`
    )
    .join('');

  view.innerHTML = `
    <h2>${name}</h2>
    ${cfg.form ? `<div><button id="btnNew">Nuevo</button></div>` : ''}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>${cfg.cols.map((c) => `<th>${c}</th>`).join('')}${cfg.form ? '<th>Acciones</th>' : ''}</tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;

  // Filtros y paginación sin recrear filas (no altera rutas/handlers)
  (function(){
    const wrap = document.querySelector('.table-wrap');
    if (!wrap) return;
    const tbl = wrap.querySelector('table');
    const tbody = wrap.querySelector('tbody');
    if (!tbl || !tbody) return;
    const top = document.createElement('div');
    top.className = 'filters';
    top.innerHTML = '<input type="text" id="tblSearch" placeholder="Buscar..." /><span style="margin-left:A�o" id="tblInfo"></span>';
    wrap.parentNode.insertBefore(top, wrap);
    const bot = document.createElement('div');
    bot.className = 'filters';
    bot.innerHTML = '<button id="prevPage">&lt; Prev</button><span id="pageInfo" style="margin:0 8px"></span><button id="nextPage">Next &gt;</button>';
    wrap.parentNode.insertBefore(bot, wrap.nextSibling);
    let q = '';
    let page = 1;
    const pageSize = 10;
    function allRows(){ return Array.from(tbody.querySelectorAll('tr')); }
    function matches(tr){ return !q ? true : tr.textContent.toLowerCase().includes(q.toLowerCase()); }
    function apply(){
      const rowsAll = allRows();
      const filtered = rowsAll.filter(matches);
      const total = filtered.length;
      const pages = Math.max(1, Math.ceil(total / pageSize));
      if (page > pages) page = pages;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      let shown = 0;
      rowsAll.forEach(r => r.style.display = 'none');
      filtered.forEach((r, i) => { if (i >= start && i < end) { r.style.display = ''; shown++; } });
      const pageInfo = document.getElementById('pageInfo');
      const tblInfo = document.getElementById('tblInfo');
      const prev = document.getElementById('prevPage');
      const next = document.getElementById('nextPage');
      if (pageInfo) pageInfo.textContent = `Página ${page} / ${pages}`;
      if (prev) prev.disabled = (page <= 1);
      if (next) next.disabled = (page >= pages);
      if (tblInfo) tblInfo.textContent = `${total ? (start+1) : 0}-${Math.min(start+shown, total)} de ${total}`;
    }
    document.getElementById('tblSearch')?.addEventListener('input', (e)=>{ q = e.target.value.trim(); page = 1; apply(); });
    document.getElementById('prevPage')?.addEventListener('click', ()=>{ if (page>1){ page--; apply(); } });
    document.getElementById('nextPage')?.addEventListener('click', ()=>{ page++; apply(); });
    apply();
  })();

  if (cfg.form) {
    document.getElementById('btnNew').addEventListener('click', async () => {
      openFormModal(`Registrar ${name}`, cfg.form, {}, async (obj) => {
        await API.apiPost(cfg.path, obj);
        loadView(name);
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

// ---------- Users ----------
async function loadUsers() {
  try {
    const view = document.getElementById('view'); // 🔹 Definir aquí el contenedor
    const data = await API.apiGet('/users');
    if (!Array.isArray(data)) throw new Error('Respuesta inesperada del servidor.');

    const cols = ['nombre', 'correo', 'rol'];

    const rows = data
      .map(
        (r) =>
          `<tr>${cols
            .map((c) => `<td>${r[c] ?? ''}</td>`)
            .join('')}<td>
              <button data-act="edit" data-id="${r.id}">Editar</button> 
              <button data-act="del" data-id="${r.id}">Eliminar</button>
            </td></tr>`
      )
      .join('');

    view.innerHTML = `
      <h2>UsuA�os</h2>
      <div><button id="btnNewUser">Nuevo</button></div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>${cols.map((c) => `<th>${c}</th>`).join('')}<th>Acciones</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    // 🔹 Crear usuA�o
    document.getElementById('btnNewUser').addEventListener('click', async () => {
      openFormModal('Registrar UsuA�o', ['nombre','correo','rol','password'], {}, async (obj) => {
        await API.apiPost('/users', obj);
        loadUsers();
      });
    });

    // 🔹 Editar usuA�o
    document.querySelectorAll('button[data-act="edit"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const current = await API.apiGet(`/users/${id}`);
        openFormModal('Editar UsuA�o', ['nombre','correo','rol','password'], current, async (obj) => {
          await API.apiPut(`/users/${id}`, obj);
          loadUsers();
        });
      });
    });

    // 🔹 Eliminar usuA�o
    document.querySelectorAll('button[data-act="del"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!confirm('¿Eliminar usuA�o?')) return;
        await API.apiDelete(`/users/${id}`);
        loadUsers();
      });
    });

  } catch (err) {
    console.error(err);
    const view = document.getElementById('view');
    view.innerHTML = '<p>Sin permisos para ver usuA�os.</p>';
  }
}


// ---------- Company / Variables ----------
async function loAcompany() {
  const data = await API.apiGet('/company');
  const fields = ['rfc','nombre','calle','colonia','ciudad','estado','cp','contA�o','correo','telefono','logotipo'];
  const form = fields.map(f=>`<label>${f}<input type="text" id="f_${f}" value="${data[f]??''}"></label>`).join('');
  view.innerHTML = `<h2>Empresa</h2><div class="form">${form}<button id="saveCompany">Guardar</button></div>`;
  document.getElementById('saveCompany').addEventListener('click', async ()=>{
    const obj={}; fields.forEach(f=>{ obj[f]=document.getElementById(`f_${f}`).value; });
    await API.apiPut('/company', obj);
    alert('Guardado');
  });
}

async function loadVariables() {
  const data = await API.apiGet('/variables');
  const keys = ['variable_prov1','variable_prov2','variable_prov3'];
  const labels = ['Variable1','Variable2','Variable3'];
  const form = keys.map((k,i)=>`<label>${labels[i]}<input type="text" id="v_${k}" value="${data[k]??''}"></label>`).join('');
  view.innerHTML = `<h2>Variables</h2><div class="form">${form}<button id="saveVars">Guardar</button></div>`;
  document.getElementById('saveVars').addEventListener('click', async ()=>{
    const obj={}; keys.forEach(k=>{ obj[k]=document.getElementById(`v_${k}`).value; });
    await API.apiPut('/variables', obj);
    alert('Guardado');
  });
}

// ---------- Simple List (Operators / StA�ons) ----------
async function loadSimpleList(path, title, cols) {
  const data = await API.apiGet(path);
  const rows = data
    .map((r) => `<tr>${cols.map((c) => `<td>${r[c] ?? ''}</td>`).join('')}</tr>`)
    .join('');
  view.innerHTML = `
    <h2>${title}</h2>
    <div class="table-wrap">
      <table>
        <thead><tr>${cols.map((c) => `<th>${c}</th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

// ---------- Dashboard ----------
async function loadDashboard() {
  const data = await API.apiGet('/dashboard/summary');
  const c = data.cards || {};
  const seriesPP = data.series_piezas_por_producto || [];
  const seriesSA�o = data.serie_sA�o_tarjetas || [];
  const usingSA�o = seriesSA�o.length > 0 && seriesPP.length === 0;

  view.innerHTML = `
    <h2>Panel de Visualizacion de Datos</h2>
    <div class="filters">
      <select id="timeRange">
        <option value="7d">Últimos 7 d�as</option>
        <option value="30d">Últimos 30 d�as</option>
        <option value="ytd">A�o en curso</option>
      </select>
      <input type="text" id="search" placeholder="Buscar..." />
    </div>
    <div class="cards">
      ${c.procesos_totales !== undefined ? `<div class="card"><div class="card-title">Procesos Totales</div><div class="card-value">${c.procesos_totales}</div></div>` : ''}
      ${c.piezas_totales !== undefined ? `<div class="card"><div class="card-title">Piezas Totales</div><div class="card-value">${c.piezas_totales}</div></div>` : ''}
      ${c.productos_registrados !== undefined ? `<div class="card"><div class="card-title">Productos</div><div class="card-value">${c.productos_registrados}</div></div>` : ''}
      ${c.clientes_registrados !== undefined ? `<div class="card"><div class="card-title">Clientes</div><div class="card-value">${c.clientes_registrados}</div></div>` : ''}
      ${c.tarjetas_activas !== undefined ? `<div class="card"><div class="card-title">Tarjetas Activas</div><div class="card-value">${c.tarjetas_activas}</div></div>` : ''}
      ${c.sA�o_promedio !== undefined ? `<div class="card"><div class="card-title">SA�o Promedio</div><div class="card-value">${c.sA�o_promedio}</div></div>` : ''}
      ${c.tarjetas_emitidas !== undefined ? `<div class="card"><div class="card-title">Tarjetas Emitidas</div><div class="card-value">${c.tarjetas_emitidas}</div></div>` : ''}
      ${c.movimientos_totales !== undefined ? `<div class="card"><div class="card-title">Movimientos Totales</div><div class="card-value">${c.movimientos_totales}</div></div>` : ''}
    </div>
    <h3>${usingSA�o ? 'SA�o de Tarjetas Activas' : 'Piezas por Producto'}</h3>
    <canvas id="dashChart" height="200"></canvas>
  `;

  const ctx = document.getElementById('dashChart');
  const labels = usingSA�o
    ? seriesSA�o.map((s) => `${s.tarjeta}`)
    : seriesPP.map((s) => `Prod ${s.producto_id}`);
  const values = usingSA�o ? seriesSA�o.map((s) => s.sA�o) : seriesPP.map((s) => s.piezas);

  // Chart.js via CDN en app.html
  // eslint-disable-next-line no-undef
  new Chart(ctx, {
    type: 'line',
    data: { labels, d�asets: [{ label: 'Piezas', data: values }] },
  });
}

// ---------- Prompt form ----------
// --- Modal genérico ---
function inputForField(name, value = '') {
  const lower = name.toLowerCase();
  let type = 'text';
  if (lower.includes('fecha')) type = 'date';
  else if (lower.includes('correo')) type = 'email';
  else if (lower.includes('password') || lower === 'pass') type = 'password';
  else if (lower.endsWith('_id') || ['cantidad','piezas','empaques','cp'].some(k=>lower.includes(k))) type = 'number';
  const isArea = ['observA�ones','descripcion','nota','notas','direccion'].some(k=> lower.includes(k));
  if (isArea) {
    return `<label>${name}<textarea name="${name}">${value ?? ''}</textarea></label>`;
  }
  return `<label>${name}<input type="${type}" name="${name}" value="${value ?? ''}"></label>`;
}

function openFormModal(title, fields, current = {}, onSubmit) {
  const modal = document.getElementById('modal');
  const form = document.getElementById('modA�orm');
  const mTitle = document.getElementById('modalTitle');
  if (!modal || !form || !mTitle) return;

  mTitle.textContent = title || 'FormulA�o';
  form.innerHTML = fields.map(f => inputForField(f, current[f])).join('');

  const close = () => {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden','true');
    form.onsubmit = null;
    modal.querySelectorAll('[data-close]').forEach(b=> b.onclick = null);
  };
  modal.querySelectorAll('[data-close]').forEach(b=> b.onclick = close);
  form.onsubmit = async (e) => {
    e.preventDefault();
    const data = {};
    new FormDatA�orm).forEach((v,k)=>{ data[k]=v; });
    if (onSubmit) await onSubmit(data);
    close();
  };

  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
}

// ---------- Stubs opcionales para evitar errores si aún no existen ----------
function loadReports() {
  view.innerHTML = '<h2>Reportes</h2><p>En construcción…</p>';
}
function loadInventoryView() {
  view.innerHTML = '<h2>Inventario</h2><p>En construcción…</p>';
}


// ---------- Reports: Proceso (resumen) ----------
async function loadReportsProcess() {
  try {
    const data = await API.apiGet('/reports/summary');
    const labels = (data || []).map(d => `Prod ${d.producto_id}`);
    const values = (data || []).map(d => d.piezas);
    view.innerHTML = `
      <h2>Reportes - Proceso</h2>
      <p>Resumen de piezas por producto.</p>
      <canvas id=\"procChart\" height=\"200\"></canvas>
    `;
    const ctx = document.getElementById('procChart');
    if (ctx && typeof Chart !== 'undefined') {
      // eslint-disable-next-line no-undef
      new Chart(ctx, { type: 'bar', data: { labels, d�asets: [{ label: 'Piezas', data: values }] } });
    }
  } catch (e) {
    console.error(e);
    view.innerHTML = '<h2>Reportes - Proceso</h2><p>No fue posible cargar el reporte.</p>';
  }
}

// Sincronizar tema
const themeBtn = document.getElementById('themeToggle');
if (themeBtn) {
  const currentTheme = localStorage.getItem('theme');
  if (currentTheme === 'light') document.body.classList.add('light');
  themeBtn.textContent = document.body.classList.contains('light') ? '☀️' : '🌙';
  themeBtn.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    themeBtn.textContent = document.body.classList.contains('light') ? '☀️' : '🌙';
  });
}


// Recargar página
document.getElementById('reloadBtn')?.addEventListener('click', () => locA�on.reload());

// Avatar + menú
// --- Header opcional: avatar + menú (solo si existen en el DOM) ---
const userBtn  = document.getElementById('userBtn');
const userMenu = document.getElementById('userMenu');
const userWrap = document.getElementById('userWrap');

if (userBtn && userMenu && userWrap) {
  (function hydrateUser() {
    const u = JSON.parse(localStorage.getItem('usuA�o') || 'null') || { nombre: 'Admin', rol: 'Administrador' };
    const initials = (u.nombre || '?').slice(0, 1).toUpperCase();
    userBtn.textContent = initials;
    const av = document.getElementById('menuAvatar');
    const nm = document.getElementById('menuName');
    const rl = document.getElementById('menuRole');
    if (av) av.textContent = initials;
    if (nm) nm.textContent = u.nombre || 'UsuA�o';
    if (rl) rl.textContent = (u.rol || 'USUA�o').toString().toUpperCase();
  })();

  userBtn.addEventListener('click', (e) => {
    e.stopPropagA�on();
    const open = userMenu.classList.toggle('show');
    userBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    userMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
  });

  document.addEventListener('click', (e) => {
    if (!userWrap.contains(e.target)) userMenu.classList.remove('show');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') userMenu.classList.remove('show');
  });

  document.querySelector('.user-menu [datA�o="users"]')?.addEventListener('click', () => loadView('users'));
  document.querySelector('.user-menu [datA�o="profile"]')?.addEventListener('click', () => alert('Perfil próximamente'));
}


// Default view
loadView('dashboard');



