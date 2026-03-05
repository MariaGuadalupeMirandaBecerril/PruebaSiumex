(function () {
  'use strict';

  // =========================
  // API BASE (si el backend Express corre en otro puerto/host)
  // Define en consola del navegador: window.__API_BASE = 'http://localhost:3001'
  const API_BASE = (window.__API_BASE || '').toString().replace(/\/$/, '');
  const apiUrl = (p) => (API_BASE ? (API_BASE + p) : p);

  const EXPORT_PREFIX = (window.__EXPORT_PREFIX || '').toString().replace(/\/$/, '');
  const exportUrl = (p) => apiUrl(`${EXPORT_PREFIX}${p}`);

  // =========================
  // Safe Globals (1 sola vez)
  // =========================
  const view = document.getElementById('view');
  const navLinks = document.querySelectorAll('.sidebar a[data-view]');
  let __currentView = 'dashboard';
  window.__currentView = __currentView;

  // Minimal helpers: skeletons and empty state
  function skeletonTableHTML(cols = 4, rows = 6) {
    const header = Array.from({ length: cols }).map(() => '<div class="th"><div class="skeleton skeleton-line w-50"></div></div>').join('');
    const body = Array.from({ length: rows }).map(() =>
      `<div class="row">${Array.from({ length: cols }).map(() => '<div class="td"><div class="skeleton skeleton-line w-75"></div></div>').join('')}</div>`
    ).join('');
    return `<div class="table-skeleton" style="--cols:${cols}">
      <div class="row">${header}</div>
      ${body}
    </div>`;
  }
  function emptyStateHTML(title = 'Sin datos', text = 'No se encontraron registros.') {
    return `<div class="empty-state"><div class="title">${title}</div><div>${text}</div></div>`;
  }

  // =========================
  // Toast centrado (sin modal)
  // =========================
  (function () {
    if (window.centerToast) return;

    function ensureStyles() {
      if (document.getElementById('center-toast-styles')) return;
      const st = document.createElement('style');
      st.id = 'center-toast-styles';
      st.textContent = `
        .center-toast{
          position: fixed;
          left: 50%;
          top: 18%;
          transform: translateX(-50%) translateY(-6px);
          z-index: 9999;
          min-width: 260px;
          max-width: min(520px, calc(100vw - 24px));
          padding: 12px 16px;
          border-radius: 14px;
          box-shadow: 0 18px 40px rgba(0,0,0,.35);
          border: 1px solid rgba(255,255,255,.12);
          color: #fff;
          font-weight: 600;
          text-align: center;
          opacity: 0;
          transition: opacity .18s ease, transform .18s ease;
          pointer-events: none;
        }
        .center-toast.show{ opacity:1; transform: translateX(-50%) translateY(0); }
        .center-toast.success{ background: rgba(16,185,129,.92); } /* verde */
        .center-toast.info{ background: rgba(59,130,246,.92); }     /* azul */
        body.light .center-toast{ box-shadow: 0 10px 22px rgba(0,0,0,.12); }
      `;
      document.head.appendChild(st);
    }

    window.centerToast = function (message, kind = 'success', ms = 2200) {
      ensureStyles();
      try { window.__centerToastEl?.remove(); } catch (_) {}
      const el = document.createElement('div');
      el.className = `center-toast ${kind}`;
      el.innerHTML = message;
      document.body.appendChild(el);
      window.__centerToastEl = el;

      requestAnimationFrame(() => el.classList.add('show'));

      setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => { try { el.remove(); } catch (_) {} }, 220);
      }, ms);
    };
  })();

  // ==================================
  // Alert/Confirm bonitos (NO usados
  // para borrar, pero se conservan)
  // ==================================
  window.showAlert = function showAlert(message, title = 'Aviso') {
    return new Promise((resolve) => {
      try {
        const toast = document.createElement('div');
        toast.setAttribute('role', 'status');
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
        setTimeout(() => { try { toast.remove(); } catch (_) {} }, 1400);
        resolve();
      } catch (_) {
        try { alert(message); } catch (__) {}
        resolve();
      }
    });
  };

  window.showConfirm = function showConfirm(message, { title = 'Confirmar', okText = 'Aceptar', cancelText = 'Cancelar' } = {}) {
    return new Promise((resolve) => {
      try {
        const wrap = document.createElement('div');
        wrap.className = 'x-modal show';
        wrap.innerHTML =
          `<div class="x-backdrop"></div>
           <div class="x-dialog">
             <div class="x-title">${title}</div>
             <div class="x-msg">${message}</div>
             <div class="x-actions">
               <button class="btn-danger" id="xCancel">${cancelText}</button>
               <button class="btn-primary" id="xOk">${okText}</button>
             </div>
           </div>`;
        document.body.appendChild(wrap);
        const cleanup = (val) => { try { wrap.remove(); } catch (_) {} resolve(val); };
        wrap.querySelector('#xOk')?.addEventListener('click', () => cleanup(true));
        wrap.querySelector('#xCancel')?.addEventListener('click', () => cleanup(false));
        wrap.querySelector('.x-backdrop')?.addEventListener('click', () => cleanup(false));
      } catch (_) {
        try { resolve(confirm(message)); } catch (__) { resolve(false); }
      }


    });
  };

  window.showCenterAlert = function showCenterAlert(message, title = 'Aviso') {
    return new Promise((resolve) => {
      try {
        const wrap = document.createElement('div');
        wrap.className = 'x-modal show';
        wrap.innerHTML =
          `<div class="x-backdrop"></div>
           <div class="x-dialog">
             <div class="x-title">${title}</div>
             <div class="x-msg">${message}</div>
             <div class="x-actions"><button class="btn-primary" id="xOk">Aceptar</button></div>
           </div>`;
        document.body.appendChild(wrap);
        const done = () => { try { wrap.remove(); } catch (_) {} resolve(); };
        wrap.querySelector('#xOk')?.addEventListener('click', done);
        wrap.querySelector('.x-backdrop')?.addEventListener('click', done);
      } catch (_) {
        try { alert(message); } catch (__) {}
        resolve();
      }
    });
  };

  // =========================
  // Command Palette (Ctrl/Cmd+K)
  // =========================
  (function setupCommandPalette(){
    try{
      if (window.__cmdkInit) return; window.__cmdkInit = true;
      const wrap = document.createElement('div');
      wrap.className = 'cmdk';
      wrap.innerHTML = '<div class="head"><input type="text" placeholder="Buscar (vistas, acciones)" aria-label="Buscar" /></div><div class="list" role="listbox"></div>';
      document.body.appendChild(wrap);
      const input = wrap.querySelector('input');
      const list = wrap.querySelector('.list');
      let items = [];

      function collect(){
        items = [];
        document.querySelectorAll('.sidebar nav a[data-view]').forEach((a)=>{
          const view = a.getAttribute('data-view')||''; const label=(a.querySelector('.label')?.textContent||a.textContent||view).trim();
          items.push({view,label});
        });
      }
      function render(filter=''){
        const q = filter.trim().toLowerCase();
        const data = items.filter(it=> !q || it.label.toLowerCase().includes(q) || it.view.toLowerCase().includes(q));
        list.innerHTML = data.map(it=>`<div class="item" role="option" data-view="${it.view}"><span class="iconify" data-icon="lucide:arrow-right"></span><span>${it.label}</span></div>`).join('') || '<div class="item" aria-disabled="true">Sin resultados</div>';
      }
      function open(){ collect(); render(''); wrap.classList.add('show'); setTimeout(()=> input?.focus(), 20); }
      function close(){ wrap.classList.remove('show'); }
      document.addEventListener('keydown', (e)=>{ if( (e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); open(); } if(e.key==='Escape'){ close(); } });
      list.addEventListener('click', (e)=>{ const it = e.target.closest?.('.item'); if(!it) return; const v = it.getAttribute('data-view'); close(); if(v) loadView(v); });
      input.addEventListener('input', ()=> render(input.value));
      wrap.addEventListener('click', (e)=>{ if(e.target===wrap) close(); });
    }catch(_){ }
  })();

  // =========================
  // Button ripple (visual-only)
  // =========================
  (function setupRipple(){
    try{
      document.addEventListener('click', (e)=>{
        const btn = e.target?.closest('button, .btn'); if(!btn) return;
        const rect = btn.getBoundingClientRect();
        const r = document.createElement('span'); r.className = 'ripple';
        const size = Math.max(rect.width, rect.height); r.style.width = r.style.height = size + 'px';
        const x = (e.clientX - rect.left) - size/2; const y = (e.clientY - rect.top) - size/2; r.style.left = x + 'px'; r.style.top = y + 'px';
        btn.style.position = btn.style.position || 'relative'; btn.style.overflow = 'hidden';
        btn.appendChild(r); setTimeout(()=> { try{ r.remove(); }catch(_){} }, 650);
      });
    }catch(_){ }
  })();

  // =========================
  // Dashboard: skeleton + enter animation
  // =========================
  (function enhanceDashboard(){
    try{
      function wrap(){
        if(window.loadDashboard && !window.__wrappedDash){
          const orig = window.loadDashboard;
          window.loadDashboard = async function(){
            try{ if(view){ view.innerHTML = '<div class="cards">'+ Array.from({length:4}).map(()=>'<div class="card kpi"><div class="skeleton skeleton-line w-50"></div><div class="skeleton skeleton-line w-75"></div></div>').join('') +'</div>'; } }catch(_){ }
            const res = await orig.apply(this, arguments);
            try{ if (window.motion && view){ view.querySelectorAll('.card')?.forEach((c,i)=> { window.motion.animate(c, { opacity:[0,1], y:[6,0] }, { delay:i*0.05, duration:.28, easing:'ease-out' }); }); } }catch(_){ }
            return res;
          };
          window.__wrappedDash = true;
        }
      }
      setTimeout(wrap, 0); setTimeout(wrap, 800); document.addEventListener('DOMContentLoaded', wrap);
    }catch(_){ }
  })();

  // Ensure iconify icons for theme/reload buttons
  try {
    const el = document.getElementById('themeToggle');
    if (el) el.innerHTML = '<span class="iconify" data-icon="lucide:sun-moon"></span>';
  } catch (_) { }
  try {
    const el = document.getElementById('reloadBtn');
    if (el) el.innerHTML = '<span class="iconify" data-icon="lucide:refresh-ccw"></span>';
  } catch (_) { }

  // ======================================
  // Simplificar menú usuario (solo Perfil)
  // ======================================
  try {
    document.querySelector('#userMenu .menu-item[data-go="users"]')?.remove();
    const um = document.getElementById('userMenu');
    if (um) um.querySelector('hr')?.remove();
    // document.getElementById('logoutBtn')?.remove(); // (se mantiene para permitir confirmación de salida)
  } catch (_) {}

  // ======================================
  // Sidebar: iconos y labels
  // ======================================
  try {
    const nav = document.querySelectorAll('.sidebar nav a[data-view]');
    if (nav && nav.length) {
      const icons = {
        dashboard: '🏠',
        operativo: '🏭',
        production: '🏭',
        catalogs: '📚',
        tools: '🛠️',
        reports: '📊'
      };
        icons.dashboard = '<span class="iconify" data-icon="lucide:layout-dashboard"></span>';
        icons.operativo = '<span class="iconify" data-icon="lucide:workflow"></span>';
        icons.production = '<span class="iconify" data-icon="lucide:factory"></span>';
        icons.catalogs = '<span class="iconify" data-icon="lucide:shapes"></span>';
        icons.tools = '<span class="iconify" data-icon="lucide:tool"></span>';
        icons.reports = '<span class="iconify" data-icon="lucide:bar-chart-2"></span>';
      nav.forEach((a) => {
        const v = a.getAttribute('data-view') || '';
        const labelText = (a.querySelector('.label')?.textContent || a.textContent || '').trim() || v;
        let iconEl = a.querySelector('.icon');
        let labelEl = a.querySelector('.label');

        if (!iconEl || !labelEl) {
          a.textContent = '';
          iconEl = document.createElement('span');
          iconEl.className = 'icon';
          iconEl.setAttribute('aria-hidden', 'true');

          labelEl = document.createElement('span');
          labelEl.className = 'label';

          a.appendChild(iconEl);
          a.appendChild(labelEl);
        }

        iconEl.innerHTML = icons[v] || '';
        labelEl.textContent = labelText;
      });
    }
  } catch (_) {}

  // =========================
  // Theme refinements (light)
  // =========================
  try {
    if (!document.getElementById('light-theme-refine')) {
      const st = document.createElement('style');
      st.id = 'light-theme-refine';
      st.textContent = `
        body.light{ --bg:#f8fafc; --panel:#ffffff; --text:#0b1220; --muted:#6b7280; --accent:#2563eb; }
        body.light .sidebar{ background:#ffffff; border-right:1px solid #e5e7eb; }
        body.light .sidebar nav a:hover{ background:#f3f4f6; }
        body.light .topbar{ background:#ffffff; border-bottom:1px solid #e5e7eb; }
        body.light .table-wrap{ background:#ffffff; border-color:#e5e7eb; }
        body.light th{ background:#f3f4f6; border-bottom-color:#e5e7eb; }
        body.light td{ border-bottom-color:#e5e7eb; }
        body.light table tbody tr:nth-child(even){ background:#fafafa; }
        body.light table tbody tr:hover{ background:#f5f7ff; }
        body.light input, body.light select, body.light textarea{
          background:#ffffff; color:#111111; border-color:#d1d5db;
        }
        body.light input:focus, body.light select:focus, body.light textarea:focus{
          border-color:#335bff; box-shadow:0 0 0 2px rgba(47,129,247,.25); outline:none;
        }
        body.light .card{ background:#ffffff; border-color:#e5e7eb; box-shadow: 0 8px 18px rgba(0,0,0,.06); }

        .btn-primary{ background: var(--accent); color:#fff; border:none; border-radius:10px; padding:10px 16px; }
        .btn-danger{ background:#ef4444; color:#fff; border:none; border-radius:10px; padding:10px 14px; }
        .btn-secondary{ background:transparent; color:var(--text); border:1px solid #cbd5e1; border-radius:10px; padding:10px 14px; }
        .btn-secondary[disabled]{ opacity:.5; }

        .pill{ display:inline-block; padding:4px 10px; border-radius:999px; border:1px solid #2b3440; font-size:12px; }
        body.light .pill{ background:#eef2ff; color:#1e3a8a; border-color:#dbeafe; }
        body.light .pill.role{ background:#eef6ff; color:#0b4db8; border-color:#dbeafe; }
        body.light .pill.success{ background:#ecfdf5; color:#047857; border-color:#bef0d5; }
      `;
      document.head.appendChild(st);
    }
  } catch (_) {}

  // =========================
  // Logout (sidebar + menu)
  // =========================
  async function doLogout() {
    try { localStorage.removeItem('token'); localStorage.removeItem('usuario'); } catch (_) {}
    // nota: en tu proyecto el login parece estar en "/" o "index.html"
    // usamos index.html para mantener tu flujo actual
    window.location.href = 'index.html';
  }

  async function confirmLogout() {
    // usa tu confirm bonito si existe; fallback a confirm nativo
    try {
      if (typeof window.showConfirm === 'function') {
        return await window.showConfirm('¿Estás seguro de salir?', {
          title: 'Confirmar',
          okText: 'Sí',
          cancelText: 'Cancelar'
        });
      }
    } catch (_) {}
    try { return confirm('¿Estás seguro de salir?'); } catch (_) { return false; }
  }

  // Botón "Salir" del sidebar (app.html)
  document.getElementById('sidebarLogoutBtn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const ok = await confirmLogout();
    if (!ok) return;
    await doLogout();
  });

  // Botón "Cerrar Sesión" del menú de usuario (si existe)
  document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const ok = await confirmLogout();
    if (!ok) return;
    await doLogout();
  });

  // =========================
  // Sidebar toggle
  // =========================
  document.getElementById('toggleSidebar')?.addEventListener('click', () => {
    const sb = document.getElementById('sidebar');
    sb?.classList.toggle('open');
  });

  // =========================
  // Menú dinámico por rol
  // =========================
  (function () {
    try {
      const u = JSON.parse(localStorage.getItem('usuario') || '{}');
      const rol = String(u.rol || '').trim().toLowerCase();
      const nav = document.querySelector('.sidebar nav');
      const enforceOperatorMenu = () => {
        try {
          if (!nav) return;
          const allowed = new Set(['operativo', 'reports', 'profile']);
          nav.querySelectorAll('a[data-view]')
            .forEach(a => { const v = (a.getAttribute('data-view')||'').toLowerCase(); if (!allowed.has(v)) a.remove(); });
        } catch (_) {}
      };

      if (rol === 'operador') {
        if (nav) {
          nav.innerHTML = [
            '<div class="group"><a href="#" data-view="operativo">Operativo</a></div>',
            '<div class="group"><a href="#" data-view="reports">Reportes</a></div>'
          ].join('');

          const map = { operativo: '🏭', reports: '📊' };
          nav.querySelectorAll('a[data-view]').forEach((a) => {
            const v = a.getAttribute('data-view') || '';
            const labelText = (a.textContent || '').trim();
            a.textContent = '';
            const iconEl = document.createElement('span');
            iconEl.className = 'icon';
            iconEl.setAttribute('aria-hidden', 'true');
            iconEl.textContent = map[v] || '';
            const labelEl = document.createElement('span');
            labelEl.className = 'label';
            labelEl.textContent = labelText;
            a.appendChild(iconEl);
            a.appendChild(labelEl);
            a.addEventListener('click', (e) => { e.preventDefault(); loadView(v); });
          });

          // Fallback duro: si por alguna razón se reinyectan enlaces, remuévelos
          enforceOperatorMenu();
          try {
            const mo = new MutationObserver(() => enforceOperatorMenu());
            mo.observe(nav, { childList: true, subtree: true });
          } catch (_) {}
          // Asegurar 'Ver perfil' como item del menú del operador
          try {
            if (nav && !nav.querySelector('a[data-view="profile"]')) {
              const grp = document.createElement('div');
              grp.className = 'group';
              grp.innerHTML = '<a href="#" data-view="profile">Ver perfil</a>';
              nav.insertBefore(grp, nav.firstChild || null);
              const a = nav.querySelector('a[data-view="profile"]');
              if (a) {
                const labelText = (a.textContent || '').trim();
                a.textContent = '';
                const iconEl = document.createElement('span'); iconEl.className = 'icon'; iconEl.setAttribute('aria-hidden','true'); iconEl.textContent = '👤';
                const labelEl = document.createElement('span'); labelEl.className = 'label'; labelEl.textContent = labelText;
                a.appendChild(iconEl); a.appendChild(labelEl);
                a.addEventListener('click', (e) => { e.preventDefault(); loadView('profile'); });
              }
            }
          } catch (_) {}
        }
      } else {
        // quitar operativo a admin/otros
        try { nav?.querySelectorAll('a[data-view="operativo"]').forEach((el) => el.remove()); } catch (_) {}
        // asegurar dashboard
        if (nav && !nav.querySelector('a[data-view="dashboard"]')) {
          const a = document.createElement('a');
          a.href = '#';
          a.setAttribute('data-view', 'dashboard');
          const iconEl = document.createElement('span'); iconEl.className = 'icon'; iconEl.textContent = '🏠';
          const labelEl = document.createElement('span'); labelEl.className = 'label'; labelEl.textContent = 'Panel';
          a.appendChild(iconEl); a.appendChild(labelEl);
          nav.insertBefore(a, nav.firstChild || null);
          a.addEventListener('click', (e) => { e.preventDefault(); loadView('dashboard'); });
        }
      }
    } catch (_) {}
  })();

  // =========================
  // Theme toggle button
  // =========================
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    try {
      themeBtn.setAttribute('aria-label', 'Modo claro/oscuro');
      themeBtn.innerHTML = `🌓`;
    } catch (_) {}

    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'light') document.body.classList.add('light');

    themeBtn.addEventListener('click', () => {
      const isLight = document.body.classList.toggle('light');
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
  }

  // =========================
  // User menu (avatar)
  // =========================
  const userBtn = document.getElementById('userBtn');
  const userMenu = document.getElementById('userMenu');
  const userWrap = document.getElementById('userWrap');

  if (userBtn && userMenu && userWrap) {
    (function hydrateUser() {
      const u = JSON.parse(localStorage.getItem('usuario') || 'null') || { nombre: 'Admin', rol: 'Administrador' };
      userBtn.textContent = (u.nombre || '?').slice(0, 1).toUpperCase();
      const av = document.getElementById('menuAvatar');
      const nm = document.getElementById('menuName');
      const rl = document.getElementById('menuRole');
      if (av) av.textContent = userBtn.textContent;
      if (nm) nm.textContent = u.nombre || 'Usuario';
      if (rl) rl.textContent = (u.rol || 'USUARIO').toString().toUpperCase();

      // Sidebar profile (avatar + nombre)
      try {
        const sbName = document.getElementById('sidebarProfileName');
        const sbAv = document.getElementById('sidebarAvatar');
        if (sbName) sbName.textContent = u.nombre || 'Usuario';
        if (sbAv) {
          sbAv.textContent = (u.nombre || '?').slice(0, 1).toUpperCase();
          const photo = u.foto || u.avatar || u.imagen || u.image || u.photo || u.avatarUrl;
          if (photo && typeof photo === 'string') {
            sbAv.style.backgroundImage = `url(${photo})`;
            sbAv.classList.add('has-image');
          } else {
            try { sbAv.style.removeProperty('background-image'); } catch (_) {}
            sbAv.classList.remove('has-image');
          }
        }
      } catch (_) {}
    })();

    userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = userMenu.classList.toggle('show');
      userBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      userMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
    });

    document.addEventListener('click', (e) => { if (!userWrap.contains(e.target)) userMenu.classList.remove('show'); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') userMenu.classList.remove('show'); });

    document.querySelector('.user-menu [data-go="profile"]')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      loadView('profile');
    });
  }

  // Click en tarjeta de perfil del sidebar
  try {
    document.getElementById('sidebarProfile')?.addEventListener('click', (e) => {
      e.preventDefault();
      loadView('profile');
    });
  } catch (_) {}

  // =========================
  // Router
  // =========================
  async function loadView(name) {
    __currentView = name || __currentView || 'dashboard';
    window.__currentView = __currentView;
    

    // Enforce rol operador
    try {
      const u = JSON.parse(localStorage.getItem('usuario') || '{}');
      const rol = String(u.rol || '').trim().toLowerCase();
      const allowed = { operativo: 1, reports: 1, help: 1, profile: 1 };
      if (rol === 'operador') {
        const key = String(name || '').toLowerCase();
        if (!allowed[key]) return (typeof window.loadOperativo === 'function') ? window.loadOperativo() : loadOperativo?.();
      }
    } catch (_) {}

    // Limpieza overlays
    try { document.querySelectorAll('.x-modal')?.forEach(w => { try { w.remove(); } catch (_) {} }); } catch (_) {}
    try {
      const modal = document.getElementById('modal');
      if (modal) {
        modal.classList.remove('show', 'image-only');
        modal.setAttribute('aria-hidden', 'true');
        modal.querySelector('.image-only-wrap')?.remove();
        modal.querySelector('.image-close')?.remove();
      }
    } catch (_) {}

    // Rutas existentes externas (si ya las tienes en otros js)
    if (name === 'dashboard') return (typeof window.loadDashboard === 'function') ? window.loadDashboard() : (typeof loadDashboard === 'function' ? loadDashboard() : null);
    if (name === 'help') return (typeof window.loadHelp === 'function') ? window.loadHelp() : (typeof loadHelp === 'function' ? loadHelp() : null);
    if (name === 'operativo') return (typeof window.loadOperativo === 'function') ? window.loadOperativo() : (typeof loadOperativo === 'function' ? loadOperativo() : null);

    // Vistas de este archivo
    if (name === 'reports' || name === 'reports_inventory') return (typeof window.loadReports === 'function') ? window.loadReports() : (typeof loadReports === 'function' ? loadReports() : null);
    if (name === 'reports_process') return (typeof window.loadReportsProcess === 'function') ? window.loadReportsProcess() : (typeof loadReportsProcess === 'function' ? loadReportsProcess() : null);

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

    // fallback genérico si lo usas
    const cfg = ({
      products: { path: '/products', cols: ['idprod', 'nombre', 'variable1', 'variable2', 'variable3', 'peso_por_pieza'], form: ['idprod', 'nombre', 'variable1', 'variable2', 'variable3', 'peso_por_pieza', 'imagen'] },
      clients: { path: '/clients', cols: ['idclie', 'nombre', 'observaciones'], form: ['idclie', 'nombre', 'observaciones'] },
      providers: { path: '/providers', cols: ['idprov', 'nombre', 'observaciones'], form: ['idprov', 'nombre', 'observaciones'] },
      production: { path: '/production', cols: ['op', 'cliente', 'producto', 'piezas', 'lote'], form: ['op', 'cliente_id', 'producto_id', 'empaques', 'piezas', 'lote', 'imagen'] },
      inventory: { path: '/inventory', cols: ['fecha', 'codigo_mr', 'descripcion', 'cantidad', 'producto', 'cliente'], form: ['fecha', 'codigo_mr', 'descripcion', 'cantidad', 'producto_id', 'cliente_id'] },
    })[name];

    if (!cfg || !view) return;

    // Show skeleton while loading generic lists
    try {
      const colCount = (cfg.cols?.length || 1) + (cfg.form ? 1 : 0);
      view.innerHTML = skeletonTableHTML(colCount, 6);
    } catch (_) {}

    const data = await API.apiGet(cfg.path);
    const rows = (Array.isArray(data) ? data : []).map((r) =>
      `<tr>${cfg.cols.map(c => {
        const v = typeof r[c] === 'object' ? (r[c]?.nombre || r[c]?.id || '') : (r[c] ?? '');
        return `<td>${v}</td>`;
      }).join('')}
      ${cfg.form ? `<td>
        <button class="op-btn" data-act="edit" data-id="${r.id}" title="Editar" aria-label="Editar">✏️</button>
        <button class="op-btn" data-act="del" data-id="${r.id}" title="Borrar" aria-label="Borrar">🗑️</button>
      </td>` : ''}</tr>`
    ).join('');

    view.innerHTML = `
      <h2>${name}</h2>
      <div class="filters" style="display:flex;gap:8px;align-items:center;margin:8px 0">
        <input id="tblFilter" type="search" placeholder="Buscar..." class="input" style="max-width:280px" />
        <div id="activeChips"></div>
        ${cfg.form ? `<div style="margin-left:auto"><button id="btnNew" class="btn btn-primary">Nuevo</button></div>` : ''}
      </div>
      <div class="table-wrap pretty">
        <table>
          <thead><tr>${cfg.cols.map(c => `<th>${c}</th>`).join('')}${cfg.form ? '<th>Acciones</th>' : ''}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;

    // Empty state pretty
    try {
      const hasRows = rows && rows.trim().length > 0;
      if (!hasRows) {
        view.querySelector('.table-wrap')?.insertAdjacentHTML('afterend', emptyStateHTML('Sin datos', 'No hay registros para mostrar.'));
      }
    } catch (_) {}

    if (cfg.form) {
      document.getElementById('btnNew')?.addEventListener('click', async () => {
        openFormModal(`Registrar ${name}`, cfg.form, {}, async (obj) => {
          await API.apiPost(cfg.path, obj);
          try { window.centerToast?.(`✅ Guardado <b>${name}</b>`, 'success', 2200); } catch (_) {}
          loadView(name);
        });
      });

      document.querySelectorAll('button[data-act="edit"]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const current = await API.apiGet(`${cfg.path}/${id}`);
          openFormModal(`Editar ${name}`, cfg.form, current, async (obj) => {
            await API.apiPut(`${cfg.path}/${id}`, obj);
            try { window.centerToast?.(`🔵 Editado <b>${name}</b>`, 'info', 2200); } catch (_) {}
            loadView(name);
          });
        });
      });
      // delete: lo maneja el interceptor global (abajo)
    }

    // Búsqueda con debounce + chip de filtro
    try {
      const input = document.getElementById('tblFilter');
      const chips = document.getElementById('activeChips');
      const tbody = view.querySelector('tbody');
      if (input && tbody) {
        let t = 0; let last = '';
        const apply = (q) => {
          const qq = (q||'').trim().toLowerCase();
          tbody.querySelectorAll('tr').forEach(tr => {
            const s = tr.textContent.toLowerCase();
            tr.style.display = qq ? (s.includes(qq) ? '' : 'none') : '';
          });
          if (chips) chips.innerHTML = qq ? `<span class="chip">Filtro: "${qq}" <span class="x" title="Quitar">×</span></span>` : '';
          if (chips && qq) chips.querySelector('.x')?.addEventListener('click', ()=>{ input.value=''; apply(''); });
        };
        input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(()=> { if (input.value!==last){ last=input.value; apply(last); } }, 220); });
      }
    } catch (_) {}
  }
  window.loadView = loadView;

  // =========================
  // NAV clicks (delegado, robusto)
  // =========================
  // Evita que la app quede “muerta” si el script corre antes de que exista el DOM
  // o si el sidebar se re-renderiza (menú por rol).
  document.addEventListener('click', (e) => {
    const a = e.target && (e.target.closest ? e.target.closest('.sidebar a[data-view]') : null);
    if (!a) return;

    e.preventDefault();
    const viewName = a.getAttribute('data-view');
    if (!viewName) return;

    // UI active state
    try {
      document.querySelectorAll('.sidebar a.active').forEach((x) => x.classList.remove('active'));
      a.classList.add('active');
    } catch (_) {}

    loadView(viewName);
  });

  // =========================
  // Helpers UI (si existen en otro archivo)
  // =========================
  function clientsHubHeader(active) {
    if (typeof window.clientsHubHeader === 'function') return window.clientsHubHeader(active);
    // fallback minimal
    return `<div class="nav-pills">
      <button class="nav-pill ${active === 'clients' ? 'active' : ''}" data-go="clients">Clientes</button>
      <button class="nav-pill ${active === 'users' ? 'active' : ''}" data-go="users">Usuarios</button>
      <button class="nav-pill ${active === 'products' ? 'active' : ''}" data-go="products">Productos</button>
      <button class="nav-pill ${active === 'operators' ? 'active' : ''}" data-go="operators">Operadores</button>
    </div>`;
  }
  function bindClientsHubTabs() {
    if (typeof window.bindClientsHubTabs === 'function') return window.bindClientsHubTabs();
    view?.querySelectorAll('.nav-pills .nav-pill')?.forEach((b) => {
      const go = b.getAttribute('data-go');
      if (!go) return;
      b.addEventListener('click', () => loadView(go));
    });
  }
  function toolsHubHeader(active) {
    if (typeof window.toolsHubHeader === 'function') return window.toolsHubHeader(active);
    return `<div class="nav-pills">
      <button class="nav-pill ${active === 'company' ? 'active' : ''}" data-go="company">Empresa</button>
      <button class="nav-pill ${active === 'variables' ? 'active' : ''}" data-go="variables">Variables</button>
      <button class="nav-pill ${active === 'stations' ? 'active' : ''}" data-go="stations">Estaciones</button>
    </div>`;
  }
  function bindToolsHubTabs() {
    if (typeof window.bindToolsHubTabs === 'function') return window.bindToolsHubTabs();
    view?.querySelectorAll('.nav-pills .nav-pill')?.forEach((b) => {
      const go = b.getAttribute('data-go');
      if (!go) return;
      b.addEventListener('click', () => loadView(go));
    });
  }

 const logoInput = document.getElementById('logoFile');
const logoPickBtn = document.getElementById('logoPickBtn');
const logoPreview = document.getElementById('logoPreview');

let __companyLogoUrl = null;

async function refreshLogoFromServer() {
  try {
    // 🔎 busca el IMG por varios ids posibles (ajusta si usas otro)
    const img =
      document.getElementById('companyLogoImg') ||
      document.getElementById('logoPreview') ||
      document.querySelector('[data-company-logo]');

    // ✅ si no existe el elemento, NO es error: simplemente no hay dónde pintar
    if (!img) {
      console.warn('Logo: no hay <img> para mostrar (companyLogoImg/logoPreview).');
      return;
    }

    const blob = await API.apiGetBlob(`/company/logo?ts=${Date.now()}`, { allow404: true });
    if (!blob) {
      img.removeAttribute('src');
      return;
    }

    if (__companyLogoUrl) URL.revokeObjectURL(__companyLogoUrl);
    __companyLogoUrl = URL.createObjectURL(blob);

    img.src = __companyLogoUrl;
  } catch (e) {
    console.error('Logo load failed:', e);
  }
}

window.refreshLogoFromServer = refreshLogoFromServer;

// al entrar: logo se carga desde la vista Empresa (evitar usar `data` global aquí)
logoPickBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  if (logoInput) logoInput.value = '';
  logoInput?.click();
});

logoInput?.addEventListener('change', async () => {
  const file = logoInput?.files?.[0];
  if (!file) return;

  // preview local inmediato
  const localUrl = URL.createObjectURL(file);
  logoPreview.src = localUrl;
  logoPreview.style.display = '';

  try {
    const fd = new FormData();
    fd.append('file', file);
    await API.apiUpload('/company/logo', fd);

    // ahora refresca desde server con token
    await refreshLogoFromServer();
  } catch (e) {
    console.error(e);
    alert('No se pudo subir el logo (sesión/permisos).');
  }
});



// ===== Password helpers (fix enhancePasswordFields not defined) =====
function attachPasswordEye(input) {
  if (!input || input.__eyeInstalled) return;
  input.__eyeInstalled = true;

  // default hidden
  input.type = 'password';

  const label = input.closest('label') || input.parentElement;
  if (!label) return;

  // make label relative so icon positions correctly
  label.style.position = 'relative';

  // room for icon
  input.style.paddingRight = '44px';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = '👁';
  btn.title = 'Mostrar/Ocultar';
  btn.setAttribute('aria-label', 'Mostrar u ocultar contraseña');

  btn.style.position = 'absolute';
  btn.style.right = '12px';
  btn.style.top = '50%';
  btn.style.transform = 'translateY(-50%)';
  btn.style.border = 'none';
  btn.style.background = 'transparent';
  btn.style.cursor = 'pointer';
  btn.style.fontSize = '16px';
  btn.style.opacity = '0.9';
  btn.style.zIndex = '10';
  btn.style.pointerEvents = 'auto';

  btn.addEventListener('click', () => {
    const hidden = input.type === 'password';
    input.type = hidden ? 'text' : 'password';
    btn.textContent = hidden ? '🙈' : '👁';
  });

  label.appendChild(btn);
}

// This is what your UI is calling (define it so it doesn't crash)
function enhancePasswordFields(root) {
  try {
    const scope = root || document;
    scope.querySelectorAll('input[type="password"], input[name="password"]').forEach((inp) => {
      attachPasswordEye(inp);
    });
  } catch (_) {}
}





  // =========================
  // Modal helpers
  // =========================
  function inputForField(desc, value = '') {
    const isObj = typeof desc === 'object' && desc !== null;
    const name = isObj ? (desc.name || '') : String(desc);
    let label = isObj ? (desc.label || name) : name;
    let type = isObj ? (desc.type || 'auto') : 'auto';
    const lower = (name || '').toLowerCase();
    const ph = isObj && desc.placeholder ? ` placeholder="${desc.placeholder}"` : '';
    let stp = isObj && (desc.step || String(desc.step) === 'any') ? ` step="${desc.step}"` : '';

    const disAttr = isObj && desc.disabled ? ' disabled' : '';
    const roAttr  = isObj && desc.readonly ? ' readonly' : '';


    if (type === 'auto') {
      if (lower.includes('fecha')) type = 'date';
      else if (lower.includes('correo') || lower === 'email') type = 'email';
      else if (lower.includes('password') || lower.includes('contraseña')) type = 'password';
      else if (lower.endsWith('_id') || ['cantidad', 'piezas', 'empaques', 'cp', 'peso'].some(k => lower.includes(k))) type = 'number';
      else type = 'text';
    }

    // Default: allow decimals for numeric fields (e.g., peso_por_pieza)
    if (!stp && type === 'number') stp = ' step="any"';

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

  if (type === 'select') {
  const hasValue = value !== undefined && value !== null && String(value).trim() !== '';

  const placeholderText = (isObj && desc.placeholder) ? desc.placeholder : 'Selecciona...';
  const placeholderOpt = hasValue
    ? ''
    : `<option value="" selected disabled hidden>${placeholderText}</option>`;

  const opts = (desc.options || []).map(opt => {
    const val = typeof opt === 'object' ? (opt.value ?? opt.text ?? opt) : opt;
    const txt = typeof opt === 'object' ? (opt.text ?? opt.value ?? opt) : opt;
    const sel = hasValue && String(val) === String(value) ? 'selected' : '';
    return `<option value="${val}" ${sel}>${txt}</option>`;
  }).join('');

  return `<label>${label}<select name="${name}"${disAttr}>${placeholderOpt}${opts}</select></label>`;
}


    if (['imagen','logo','archivo','foto'].some(k => lower.includes(k))) {
      const hasPrev = value !== undefined && value !== null && String(value).trim() !== '';
      const prevSrc = hasPrev ? String(value).trim() : '';

      // Input (en su celda) + Preview (fila completa debajo)
      // Nota: el preview se controla en openFormModal para registrar/editar.
      return `
        <label class="field-file${(isObj && desc.center) ? " center-span" : ""}" data-file-label="${name}">
          ${label}
          <input type="file" name="${name}"${disAttr} accept="image/*" data-preview-input="${name}">
        </label>
        <div class="file-preview-box is-hidden" data-preview-box="${name}" style="grid-column:1 / -1;">
          <img data-preview-img="${name}" src="${prevSrc}" alt="preview">
        </div>
      `;
    }

    const isArea = ['observaciones', 'descripcion', 'nota', 'notas', 'direccion'].some(k => lower.includes(k));
    if (isArea) return `<label>${label}<textarea name="${name}"${disAttr}${roAttr} rows="3">${value ?? ''}</textarea></label>`;

    const ac = (type === 'password') ? ' autocomplete="new-password"' : '';
    return `<label>${label}<input type="${type}" name="${name}"${disAttr}${roAttr} value="${value ?? ''}"${ac}${ph}${stp}></label>`;
  }


  // ===== Lock PK-like fields on EDIT (catalogs) =====
// ===== Lock PK fields on EDIT (definitivo) =====
function lockPrimaryKeyInputsOnEdit() {
  try {
    const modal = document.getElementById('modal');
    const titleEl = document.getElementById('modalTitle');
    const form = document.getElementById('modalForm');

    if (!modal || !form || !titleEl) return;

    const title = titleEl.textContent.toLowerCase();
    const isEdit = title.includes('editar');
    if (!isEdit) return;

    // IDs que NO se deben editar
    const pkNames = new Set([
      'id',
      'idprod',
      'idclie',
      'idest',
      'idprov',
      'rfid',
      'op'
    ]);

    Array.from(form.elements || []).forEach(el => {
      if (!el || !el.name) return;

      const name = el.name.toLowerCase();

      if (pkNames.has(name)) {
        // OP: visible pero NO editable (readonly). No usar disabled para que se envíe en FormData.
        if (name === 'op') {
          el.readOnly = true;
          el.disabled = false;
        } else {
          el.disabled = true;          // 🔒 NO editable
          el.readOnly = true;          // doble seguro
        }
        el.style.opacity = '0.6';
        el.style.cursor = 'not-allowed';
      }
    });
  } catch (e) {
    console.error('lockPrimaryKeyInputsOnEdit error:', e);
  }
}





  function openFormModal(title, fields, current = {}, onSubmit) {
    const modal = document.getElementById('modal');
    const form = document.getElementById('modalForm');
    const mTitle = document.getElementById('modalTitle');
    if (!modal || !form || !mTitle) return;

    // Estado default (por si venía deshabilitado)
    try {
      const submitBtn = modal.querySelector('button[type="submit"][form="modalForm"]');
      if (submitBtn) submitBtn.style.display = '';
      form.querySelectorAll('input,textarea,select,button').forEach(el => el.removeAttribute('disabled'));
    } catch (_) {}

    mTitle.textContent = title || 'Formulario';

    // ===== Forzar layout vertical SOLO para Clientes y Estaciones =====
    try {
      form.classList.add('form-grid'); // base
      const t = (title || '').toLowerCase();
      const isClients = t.includes('cliente');
      const isStations = t.includes('estación') || t.includes('estacion');

      if (isClients || isStations) {
        form.classList.add('onecol'); // 1 columna
        modal.querySelector('.modal-dialog')?.classList.add('small'); // opcional
      } else {
        form.classList.remove('onecol');
        modal.querySelector('.modal-dialog')?.classList.remove('small');
      }
    } catch (_) {}

    // Render campos
    form.innerHTML = (fields || []).map(f => {
      const key = (typeof f === 'object' && f) ? f.name : f;
      return inputForField(f, (current || {})[key]);
    }).join('');

    // 🔒 Bloquear IDs en modo Editar (después de render)
    try { setTimeout(lockPrimaryKeyInputsOnEdit, 0); } catch (_) {}

    // ✅ Forzar valores por JS (por si el navegador ignora value="" en password)
    try {
      (fields || []).forEach(f => {
        const key = (typeof f === 'object' && f) ? f.name : f;
        const val = (current || {})[key];
        if (val === undefined || val === null) return;
        const el = form.querySelector(`[name="${key}"]`);
        if (!el) return;
        if (el.type === 'file') return;
        el.value = String(val);
      });
    } catch (_) {}

    // ✅ Ojito password
    try { enhancePasswordFields(form); } catch (_) {}

    // ==========================
    // ==========================
    // Preview de imagen (EDIT + CHANGE)
    // - El input queda en su celda (2 columnas)
    // - El preview va ABAJO y ocupa 2 columnas
    // ==========================
    try {
      const fileInputs = Array.from(form.querySelectorAll('input[type="file"][name]'));
      fileInputs.forEach((input) => {
        const name = input.name || 'imagen';

        const box = form.querySelector(`[data-preview-box="${name}"]`);
        const img = form.querySelector(`[data-preview-img="${name}"]`);

        const show = (src) => {
          if (!box || !img) return;
          img.src = src;
          box.classList.remove('is-hidden');
          box.style.display = 'block';
        };

        // Mostrar imagen existente (modo editar)
        const existing = (current || {})[name];
        if (typeof existing === 'string' && existing.trim() !== '') {
          show(existing.trim());
        } else {
          // si no hay, ocultar
          if (box) {
            box.classList.add('is-hidden');
            box.style.display = 'none';
          }
        }

        input.addEventListener('change', () => {
          const file = input.files && input.files[0];
          if (!file) return;

          const fr = new FileReader();
          fr.onload = () => show(String(fr.result || ''));
          fr.readAsDataURL(file);
        });
      });
    } catch (e) {
      console.error('preview img error:', e);
    }

    // ✅ Ajuste especial para Proceso: preview grande y bien colocado (referencia)
    try {
      const t = (title || '').toLowerCase();
      const isProc = t.includes('proceso');
      if (isProc) {
        form.classList.add('proc-form');

        // Para que el preview sea “área inferior grande”
        const procImg = form.querySelector('[data-preview-box="imagen"]');
        if (procImg) procImg.classList.add('proc-img-box');

        // Mantener Lote e Imagen en la misma fila (2 columnas)
        // El preview ya está en grid-column: 1 / -1
      }
    } catch (e) {
      console.error('proc form layout error:', e);
    }

    // ✅ Ajuste especial para Producto: input centrado y oculto al cargar imagen
    try {
      const t = (title || '').toLowerCase();
      const isProd = t.includes('producto') && !t.includes('proceso');
      if (isProd) {
        form.classList.add('prod-form');

        // styles una sola vez
        if (!document.getElementById('prod-form-styles')) {
          const st = document.createElement('style');
          st.id = 'prod-form-styles';
          st.textContent = `
            /* Registrar Producto: input centrado */
            .prod-form .field-file.center-span,
            .prod-form .field-file.prod-file{
              grid-column: 1 / -1;
              justify-self: center;
              width: min(520px, 100%);
            }
            .prod-form .field-file.prod-file input[type="file"]{
              width: 100%;
            }
            /* Preview grande centrado */
            .prod-form .prod-img-box{
              grid-column: 1 / -1;
              margin-top: 8px;
            }

            .prod-form .prod-img-box img{
              display:block;
              width: min(920px, 100%);
              max-height: 420px;
              object-fit: contain;
              margin: 0 auto;
              border-radius: 14px;
              background: rgba(255,255,255,.02);
              border: 1px solid rgba(255,255,255,.10);
            }
            body.light .prod-form .prod-img-box img{
              background: #f8fafc;
              border-color: #e5e7eb;
            }
            /* Botón cambiar imagen */
            .prod-form .prod-change-img{
              margin: 10px auto 0;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              padding: 10px 14px;
              border-radius: 12px;
              border: 1px solid rgba(255,255,255,.14);
              background: rgba(255,255,255,.06);
              color: var(--text);
              cursor: pointer;
            }
            .prod-form .prod-img-box{
              text-align: center;
            }
            body.light .prod-form .prod-change-img{
              border-color: #e5e7eb;
              background: #ffffff;
            }
          `;
          document.head.appendChild(st);
        }

        const input = form.querySelector('input[type="file"][name="imagen"]');
        const labelEl = input ? input.closest('label') : null;
        const box = form.querySelector('[data-preview-box="imagen"]');

                // Botón para cambiar imagen (aparece cuando ya hay preview)
        let changeBtn = null;
        if (box) {
          changeBtn = box.querySelector('.prod-change-img');
          if (!changeBtn) {
            changeBtn = document.createElement('button');
            changeBtn.type = 'button';
            changeBtn.className = 'btn-secondary prod-change-img';
            changeBtn.textContent = 'Cambiar imagen';
            changeBtn.addEventListener('click', () => {
              try { input && input.click(); } catch (_) {}
            });
            box.appendChild(changeBtn);
          }
        }

if (labelEl) {
          labelEl.classList.add('prod-file');
        }
        if (box) {
          box.classList.add('prod-img-box');
        }

        // Si el layout actual es: label -> box, reordenar a: box -> label (para que "se vaya abajo")
        try {
          if (labelEl && box && labelEl.nextElementSibling === box) {
            box.after(labelEl);
          }
        } catch (_) {}

        const sync = () => {
          if (!input || !labelEl) return;
          const hasFile = !!(input.files && input.files[0]);
          const existing = (current || {}).imagen;
          const hasExisting = typeof existing === 'string' && existing.trim() !== '';
          const showImg = hasFile || hasExisting;

          // Si hay imagen: ocultar casilla y mostrar botón "Cambiar imagen"
          labelEl.style.display = showImg ? 'none' : '';
          if (changeBtn) changeBtn.style.display = showImg ? 'inline-flex' : 'none';
        };

        sync();
        input?.addEventListener('change', sync);
      }
    } catch (e) {
      console.error('prod form layout error:', e);
    }


const close = () => {
      modal.classList.remove('show', 'image-only');
      modal.setAttribute('aria-hidden', 'true');
      form.onsubmit = null;
      modal.querySelectorAll('[data-close]').forEach(b => b.onclick = null);
    };

    modal.querySelectorAll('[data-close]').forEach(b => b.onclick = close);

    form.onsubmit = async (e) => {
      e.preventDefault();

      const payload = {};
      const fd = new FormData(form);

      // texto
      fd.forEach((v, k) => { if (!(v instanceof File)) payload[k] = v; });

      // archivos -> dataURL
      const fileInputs = Array.from(form.querySelectorAll('input[type="file"][name]'));
      const fileToDataURL = (file) => new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = reject;
        fr.readAsDataURL(file);
      });

      for (const input of fileInputs) {
        const f = input.files && input.files[0];
        if (f) payload[input.name] = await fileToDataURL(f);
      }

      close();

      (async () => {
        try {
          if (onSubmit) await onSubmit(payload);
        } catch (err) {
          console.error(err);
          try { window.centerToast?.('❌ No se pudo guardar', 'info', 2500); } catch (_) {}
        }
      })();
    };

    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
  }
  window.openFormModal = openFormModal;

  function openImageModal(src, title = 'Imagen') {
    const modal = document.getElementById('modal');
    const form = document.getElementById('modalForm');
    const mTitle = document.getElementById('modalTitle');
    if (!modal || !form || !mTitle) return;

    mTitle.textContent = title || '';
    modal.querySelector('.image-only-wrap')?.remove();
    modal.querySelector('.image-close')?.remove();

    

    modal.classList.add('image-only');

    const wrap = document.createElement('div');
    wrap.className = 'image-only-wrap';
    const img = document.createElement('img');
    img.src = src; img.alt = 'preview';
    wrap.appendChild(img);
    modal.appendChild(wrap);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'image-close';
    closeBtn.setAttribute('data-close', '');
    closeBtn.setAttribute('aria-label', 'Cerrar imagen');
    closeBtn.textContent = 'X';
    modal.appendChild(closeBtn);

    const submitBtn = modal.querySelector('button[type="submit"][form="modalForm"]');
    if (submitBtn) submitBtn.style.display = 'none';

    const close = () => {
      modal.classList.remove('show', 'image-only');
      modal.setAttribute('aria-hidden', 'true');
      if (submitBtn) submitBtn.style.display = '';
      wrap.remove(); closeBtn.remove();
    };
    closeBtn.onclick = close;
    img.addEventListener('click', close);

    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
  }
  window.openImageModal = openImageModal;

  // =========================
  // ======= LOADERS =========
  // =========================

  async function loadUsers() {
    try {
      const data = await API.apiGet('/users');
      let q = '';
      let page = 1;
      const pageSize = 10;

      function pill(text, kind) {
        const cls = kind === 'role' ? 'pill role' : 'pill';
        return `<span class="${cls}">${text}</span>`;
      }

      function render() {
        const search = q.trim().toLowerCase();
        const rowsAll = (data || []).filter(r => {
          if (!search) return true;
          const line = `${r.nombre || ''} ${r.rfid || ''} ${r.correo || ''} ${r.rol || ''}`.toLowerCase();
          return line.includes(search);
        });

        const pages = Math.max(1, Math.ceil(rowsAll.length / pageSize));
        if (page > pages) page = pages;
        const start = (page - 1) * pageSize;
        const slice = rowsAll.slice(start, start + pageSize);

        const body = slice.map(r => {
          const rolTxt = (r.rol || '').toString().toUpperCase();
          return `<tr>
            <td class="user-cell">
              <span class="avatar-chip">${(r.nombre || '?').toString().slice(0, 1).toUpperCase()}</span>
              <div>
                <div><strong>${r.nombre ?? ''}</strong></div>
                <div class="muted">${r.rfid ?? ''}</div>
              </div>
            </td>
            <td>${r.correo ?? ''}</td>
            <td>${pill(rolTxt || 'USUARIO', 'role')}</td>
            <td class="ops">
              <button class="op-btn" data-act="edit" data-id="${r.id}" title="Editar">✏️</button>
              <button class="op-btn" data-act="del" data-id="${r.id}" title="Borrar">🗑️</button>
            </td>
          </tr>`;
        }).join('');

        view.innerHTML = clientsHubHeader('users') + `
          <h2>Gestión de Usuarios</h2>
          <div class="toolbar toolbar-bar">
            <div class="left tools-left">
              <div class="search"><input type="text" id="userSearch" placeholder="Buscar usuario" value="${q}" /></div>
              <button class="btn-primary" id="btnNewUser">Registrar Usuario</button>
            </div>
          </div>
          <div class="table-wrap pretty">
            <table>
              <thead>
                <tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Operaciones</th></tr>
              </thead>
              <tbody>${body}</tbody>
            </table>
          </div>
          <div class="pager">
            <div class="left">Mostrando ${rowsAll.length ? (start + 1) : 0}-${Math.min(start + slice.length, rowsAll.length)} de ${rowsAll.length} usuarios</div>
            <div class="right">
              <span style="margin:0 8px">Pagina ${page} / ${pages}</span>
              <button class="btn-secondary" id="prevPg" ${page <= 1 ? 'disabled' : ''}>Atrás</button>
              <button class="btn-secondary" id="nextPg" ${page >= pages ? 'disabled' : ''}>Siguiente</button>
            </div>
          </div>`;

        bindClientsHubTabs();

        document.getElementById('userSearch')?.addEventListener('input', (e) => {
          q = e.target.value; page = 1; render();
        });

        document.getElementById('prevPg')?.addEventListener('click', () => { if (page > 1) { page--; render(); } });
        document.getElementById('nextPg')?.addEventListener('click', () => { if (page < pages) { page++; render(); } });

        document.getElementById('btnNewUser')?.addEventListener('click', async () => {
  const userFields = [
    { name: 'rfid', label: 'RFID' },
    { name: 'nombre', label: 'Nombre' },
    {
      name: 'rol',
      label: 'Rol',
      type: 'select',
      options: ['Administrador', 'Operador'],
      placeholder: 'Seleccionar rol'
    },
    { name: 'correo', label: 'Correo', type: 'email' },
    { name: 'password', label: 'Contraseña', type: 'password' },
    { name: 'confirm_password', label: 'Confirmar Contraseña', type: 'password' },
  ];

  openFormModal('Registrar Usuario', userFields, {}, async (obj) => {
    if (!obj.rol) {
      await window.showCenterAlert?.('Selecciona un rol.', 'Aviso');
      return false;
    }

    const email = (obj.correo || '').trim();
    // ✅ Regla negocio: solo correos con terminación .com.mx
    if (!email) {
      await window.showCenterAlert?.('El correo es obligatorio', 'Aviso');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.com\.mx$/i.test(email)) {
      await window.showCenterAlert?.('El correo debe terminar en .com.mx (ej. usuario@empresa.com.mx)', 'Aviso');
      return false;
    }
    if ((obj.password || '') !== (obj.confirm_password || '')) {
      await window.showCenterAlert?.('Las contraseñas no coinciden', 'Aviso');
      return false;
    }

    delete obj.confirm_password;
    await API.apiPost('/users', obj);
    window.centerToast?.('✅ Usuario guardado', 'success', 2200);
    loadUsers();
  });
});


        document.querySelectorAll('button[data-act="edit"]').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const current = await API.apiGet(`/users/${id}`);
            const userFields = [
              { name: 'rfid', label: 'RFID' },
              { name: 'nombre', label: 'Nombre' },
              { name: 'rol', label: 'Rol', type: 'select', options: ['Administrador', 'Operador'] },
              { name: 'correo', label: 'Correo', type: 'email' },
              { name: 'password', label: 'Nueva Contraseña', type: 'password' },
              { name: 'confirm_password', label: 'Confirmar Contraseña', type: 'password' },

            ];
            openFormModal('Editar Usuario', userFields, current, async (obj) => {
              const email = (obj.correo || '').trim();
              // ✅ Regla negocio: solo correos con terminación .com.mx
              if (!email) {
                await window.showCenterAlert?.('El correo es obligatorio', 'Aviso');
                return false;
              }
              if (!/^[^\s@]+@[^\s@]+\.com\.mx$/i.test(email)) {
                await window.showCenterAlert?.('El correo debe terminar en .com.mx (ej. usuario@empresa.com.mx)', 'Aviso');
                return false;
              }
              if (obj.password && obj.password !== (obj.confirm_password || '')) {
                await window.showCenterAlert?.('Las contraseñas no coinciden', 'Aviso');
                return false;
              }
              delete obj.confirm_password;
              await API.apiPut(`/users/${id}`, obj);
              window.centerToast?.('🔵 Usuario editado', 'info', 2200);
              loadUsers();
            });
          });
        });

        // delete lo maneja interceptor global
      }

      render();
    } catch (e) {
      console.error(e);
      view.innerHTML = '<p>Sin permisos para ver usuarios.</p>';
    }
  }
  window.loadUsers = loadUsers;
  // ===== Products fast cache (solo Productos) =====
window.__productsCache = window.__productsCache || null;
window.__productsCacheTs = window.__productsCacheTs || 0;

function __prodTinyPlaceholder() {
  // 1x1 gif
  return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
}

function __prodNormalizePeso(v) {
  const s = (v === null || v === undefined) ? '' : String(v).trim();
  if (s === '') return '';
  const n = Number(s);
  return Number.isFinite(n) ? n : s;
}

function __prodMakeImageCell(img) {
  if (!img) return '';
  // IMPORTANTE: no ponemos img como src (si es base64 gigante), lo dejamos en data-src
  return `<img class="prod-img-thumb"
              loading="lazy"
              src="${__prodTinyPlaceholder()}"
              data-src="${img}"
              data-img="${img}"
              alt="img"
              style="width:48px;height:48px;object-fit:cover;border-radius:6px;cursor:zoom-in;"/>`;
}

function __prodHydrateLazyImages(root) {
  try {
    const imgs = Array.from((root || document).querySelectorAll('img.prod-img-thumb[data-src]'));
    if (!imgs.length) return;

    // Si no hay IntersectionObserver, cargamos de golpe (pero ya con loading="lazy")
    if (!('IntersectionObserver' in window)) {
      imgs.forEach(im => {
        const ds = im.getAttribute('data-src');
        if (ds && im.src !== ds) im.src = ds;
        im.removeAttribute('data-src');
      });
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(ent => {
        if (!ent.isIntersecting) return;
        const im = ent.target;
        const ds = im.getAttribute('data-src');
        if (ds && im.src !== ds) im.src = ds;
        im.removeAttribute('data-src');
        io.unobserve(im);
      });
    }, { root: null, threshold: 0.01 });

    imgs.forEach(im => io.observe(im));
  } catch (_) {}
}


async function loadProducts() {
  try {
    // 1) Usar cache si existe; si no existe, pedir una sola vez
    let data = window.__productsCache;
    if (!Array.isArray(data)) {
      data = await API.apiGet('/products');
      window.__productsCache = Array.isArray(data) ? data : [];
      window.__productsCacheTs = Date.now();
    } else {
      // 2) Refresco en segundo plano (NO bloquea UI)
      (async () => {
        try {
          const fresh = await API.apiGet('/products');
          if (Array.isArray(fresh)) {
            window.__productsCache = fresh;
            window.__productsCacheTs = Date.now();
          }
        } catch (_) {}
      })();
    }

    let q = '';
    let page = 1;
    const pageSize = 10;

// ✅ Fields correctos para Catálogo de Productos
function getProductFields() {
  return [
    { name: 'idprod', label: 'ID Producto', type: 'text' },
    { name: 'nombre', label: 'Nombre', type: 'text' },
    { name: 'variable1', label: 'Color', type: 'text' },
    { name: 'variable2', label: 'Tamaño', type: 'text' },
    { name: 'variable3', label: 'Material', type: 'text' },
    { name: 'peso_por_pieza', label: 'Peso por pieza', type: 'number', step: 'any' },
    { name: 'imagen', label: 'Imagen', type: 'file', center: true, accept: 'image/*' },
  ];
}


    function pill(text) { return `<span class="pill">${text}</span>`; }

    function render() {
      const all = Array.isArray(window.__productsCache) ? window.__productsCache : [];
      const search = q.trim().toLowerCase();

      const rowsAll = all.filter(r =>
        !search ||
        `${r.idprod || ''} ${r.nombre || ''} ${r.variable1 || ''} ${r.variable2 || ''} ${r.variable3 || ''}`
          .toLowerCase()
          .includes(search)
      );

      const pages = Math.max(1, Math.ceil(rowsAll.length / pageSize));
      if (page > pages) page = pages;
      const start = (page - 1) * pageSize;
      const slice = rowsAll.slice(start, start + pageSize);

      const rows = slice.map(r => `
        <tr data-id="${r.id}">
          <td class="user-cell">
            <span class="avatar-chip">${(r.nombre || '?').toString().slice(0, 1).toUpperCase()}</span>
            <div>
              <div><strong>${r.nombre ?? ''}</strong></div>
              <div class="muted">${r.idprod ?? ''}</div>
            </div>
          </td>
          <td class="var-col">${r.variable1 ? pill(r.variable1) : ''}</td>
          <td class="var-col">${r.variable2 ? pill(r.variable2) : ''}</td>
          <td class="var-col">${r.variable3 ? pill(r.variable3) : ''}</td>
          <td>${r.peso_por_pieza ?? ''}</td>
          <td>${__prodMakeImageCell(r.imagen)}</td>
          <td class="ops">
            <button class="op-btn" data-act="edit" data-id="${r.id}" title="Editar">✏️</button>
            <button class="op-btn" data-act="del" data-id="${r.id}" title="Borrar">🗑️</button>
          </td>
        </tr>`).join('');

      view.innerHTML = clientsHubHeader('products') + `
        <h2>Gestión de Productos</h2>
        <div class="toolbar toolbar-bar">
          <div class="left tools-left">
            <div class="search"><input id="prodSearch" type="text" placeholder="Buscar productos..." value="${q}"></div>
            <button class="btn-primary" id="btnNewProd">Registrar Producto</button>
          </div>
        </div>
        <div class="table-wrap products-only">
          <table class="products-table">
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
        <div class="pager">
          <div class="left">Mostrando ${rowsAll.length ? (start + 1) : 0}-${Math.min(start + slice.length, rowsAll.length)} de ${rowsAll.length} productos</div>
          <div class="right">
            <span style="margin:0 8px">Pagina ${page} / ${pages}</span>
            <button class="btn-secondary" id="prevPg" ${page <= 1 ? 'disabled' : ''}>Atrás</button>
            <button class="btn-secondary" id="nextPg" ${page >= pages ? 'disabled' : ''}>Siguiente</button>
          </div>
        </div>
        </section>`;

      bindClientsHubTabs();

      // Lazy-load de imágenes para evitar congelamientos por base64
      __prodHydrateLazyImages(view);

      document.getElementById('prodSearch')?.addEventListener('input', (e) => {
        q = e.target.value; page = 1; render();
      });
      document.getElementById('prevPg')?.addEventListener('click', () => { if (page > 1) { page--; render(); } });
      document.getElementById('nextPg')?.addEventListener('click', () => { if (page < pages) { page++; render(); } });

      // Click en imagen = modal (carga real ya estará en data-img)
      document.querySelectorAll('.prod-img-thumb').forEach(img => {
        img.addEventListener('click', () => {
          const src = img.getAttribute('data-img') || img.getAttribute('src');
          if (src) openImageModal(src, 'Imagen de Producto');
        });
      });

      // NUEVO (optimista: actualiza cache + re-render al instante)
      document.getElementById('btnNewProd')?.addEventListener('click', async () => {
        const fields = getProductFields();

        openFormModal('Registrar Producto', fields, {}, async (obj) => {
          // UI inmediato: fila temporal
          const tmpId = `tmp_${Date.now()}`;
          const tmp = {
            id: tmpId,
            idprod: obj.idprod || '',
            nombre: obj.nombre || '',
            variable1: obj.variable1 || '',
            variable2: obj.variable2 || '',
            variable3: obj.variable3 || '',
            peso_por_pieza: __prodNormalizePeso(obj.peso_por_pieza),
            imagen: obj.imagen || ''
          };

          window.__productsCache = Array.isArray(window.__productsCache) ? window.__productsCache : [];
          window.__productsCache.unshift(tmp);
          render();
          window.centerToast?.('⏳ Guardando producto…', 'info', 900);

          try {
            const payload = { ...obj };
            if (payload.peso_por_pieza !== undefined) {
              const s = String(payload.peso_por_pieza).trim();
              payload.peso_por_pieza = s === '' ? null : Number(s);
            }

            const created = await API.apiPost('/products', payload);

            // reemplaza temp por creado real
            const idx = window.__productsCache.findIndex(x => String(x.id) === String(tmpId));
            if (idx >= 0) window.__productsCache[idx] = created;
            render();
            window.centerToast?.('✅ Producto guardado', 'success', 1400);
          } catch (err) {
            console.error(err);
            // quita temp
            window.__productsCache = (window.__productsCache || []).filter(x => String(x.id) !== String(tmpId));
            render();
            window.centerToast?.('❌ No se pudo crear', 'info', 2200);
          }
        });
      });

      // EDIT (sin GET extra: toma "current" desde cache)
      document.querySelectorAll('button[data-act="edit"]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const current = (window.__productsCache || []).find(x => String(x.id) === String(id)) || {};

         const fields = getProductFields().map(f => (f.name === 'idprod' ? { ...f, disabled: true, readonly: true } : f));

          openFormModal('Editar Producto', fields, current, async (obj) => {
          delete obj.idprod;
            // Optimista: actualiza cache y render YA
            const before = current;
            const idx = (window.__productsCache || []).findIndex(x => String(x.id) === String(id));
            const optimistic = {
              ...before,
              ...obj,
              peso_por_pieza: __prodNormalizePeso(obj.peso_por_pieza)
            };

            if (idx >= 0) window.__productsCache[idx] = optimistic;
            render();
            window.centerToast?.('⏳ Guardando cambios…', 'info', 900);

            try {
              const payload = { ...obj };
              if (payload.peso_por_pieza !== undefined) {
                const s = String(payload.peso_por_pieza).trim();
                payload.peso_por_pieza = s === '' ? null : Number(s);
              }

              const updated = await API.apiPut(`/products/${id}`, payload);

              // pisa con respuesta real
              const idx2 = (window.__productsCache || []).findIndex(x => String(x.id) === String(id));
              if (idx2 >= 0) window.__productsCache[idx2] = updated;

              render();
              window.centerToast?.('🔵 Producto editado', 'info', 1400);
            } catch (err) {
              console.error(err);
              // rollback
              const idx3 = (window.__productsCache || []).findIndex(x => String(x.id) === String(id));
              if (idx3 >= 0) window.__productsCache[idx3] = before;

              render();
              window.centerToast?.('❌ No se pudo guardar', 'info', 2200);
            }
          });
        });
      });

      // DELETE lo maneja el interceptor global (abajo),
      // pero ahora lo vamos a hacer "fast" ahí para products.
    }

    render();
  } catch (e) {
    console.error(e);
    view.innerHTML = '<p>Sin permisos para ver productos.</p>';
  }
}
window.loadProducts = loadProducts;


  async function loadClients() {
    try {
      const data = await API.apiGet('/clients');
      let q = '';
      let page = 1;
      const pageSize = 10;

      function render() {
        const search = q.trim().toLowerCase();
        const rowsAll = (data || []).filter(r => !search || `${r.idclie || ''} ${r.nombre || ''} ${r.observaciones || ''}`.toLowerCase().includes(search));
        const pages = Math.max(1, Math.ceil(rowsAll.length / pageSize));
        if (page > pages) page = pages;
        const start = (page - 1) * pageSize;
        const slice = rowsAll.slice(start, start + pageSize);

        const rows = slice.map(r => `
          <tr>
            <td class="user-cell">
              <span class="avatar-chip">${(r.nombre || '?').toString().slice(0, 1).toUpperCase()}</span>
              <div>
                <div><strong>${r.nombre ?? ''}</strong></div>
                <div class="muted">${r.idclie ?? ''}</div>
              </div>
            </td>
            <td>${r.observaciones ?? ''}</td>
            <td class="ops">
              <button class="op-btn" data-act="edit" data-id="${r.id}" title="Editar">✏️</button>
              <button class="op-btn" data-act="del" data-id="${r.id}" title="Borrar">🗑️</button>
            </td>
          </tr>`).join('');

        view.innerHTML = clientsHubHeader('clients') + `
          <h2>Gestión de Clientes</h2>
          <div class="toolbar toolbar-bar">
            <div class="left tools-left">
              <div class="search"><input id="clieSearch" type="text" placeholder="Buscar Cliente" value="${q}"></div>
              <button class="btn-primary" id="btnNewClie">Registrar Cliente</button>
            </div>
          </div>
          <div class="table-wrap pretty">
            <table>
              <thead><tr><th>Cliente</th><th>Observaciones</th><th>Acciones</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
          <div class="pager">
            <div class="left">Mostrando ${rowsAll.length ? (start + 1) : 0}-${Math.min(start + slice.length, rowsAll.length)} de ${rowsAll.length} clientes</div>
            <div class="right">
              <span style="margin:0 8px">Pagina ${page} / ${pages}</span>
              <button class="btn-secondary" id="prevPg" ${page <= 1 ? 'disabled' : ''}>Atrás</button>
              <button class="btn-secondary" id="nextPg" ${page >= pages ? 'disabled' : ''}>Siguiente</button>
            </div>
          </div>`;

        bindClientsHubTabs();

        document.getElementById('clieSearch')?.addEventListener('input', (e) => { q = e.target.value; page = 1; render(); });
        document.getElementById('prevPg')?.addEventListener('click', () => { if (page > 1) { page--; render(); } });
        document.getElementById('nextPg')?.addEventListener('click', () => { if (page < pages) { page++; render(); } });

        document.getElementById('btnNewClie')?.addEventListener('click', async () => {
          const fields = [
            { name: 'idclie', label: 'IdCliente' },
            { name: 'nombre', label: 'Nombre' },
            { name: 'observaciones', label: 'Observaciones' },
          ];
          openFormModal('Registrar Cliente', fields, {}, async (obj) => {
            await API.apiPost('/clients', obj);
            window.centerToast?.('✅ Cliente guardado', 'success', 2200);
            loadClients();
          });
        });

        document.querySelectorAll('button[data-act="edit"]').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const current = await API.apiGet(`/clients/${id}`);
            const fields = [
              { name: 'idclie', label: 'IdCliente' },
              { name: 'nombre', label: 'Nombre' },
              { name: 'observaciones', label: 'Observaciones' },
            ];
            openFormModal('Editar Cliente', fields, current, async (obj) => {
              await API.apiPut(`/clients/${id}`, obj);
              window.centerToast?.('🔵 Cliente editado', 'info', 2200);
              loadClients();
            });
          });
        });

        // delete lo maneja interceptor global
      }

      render();
    } catch (e) {
      console.error(e);
      view.innerHTML = '<p>Sin permisos para ver clientes.</p>';
    }
  }
  window.loadClients = loadClients;

  async function loadInventory() {
    try {
      const data = await API.apiGet('/inventory');
      let q = '';
      let page = 1;
      const pageSize = 10;

      function render() {
        const search = q.trim().toLowerCase();
        const rowsAll = (data || []).filter(r => {
          const cliente = typeof r.cliente === 'object' ? (r.cliente?.nombre || '') : (r.cliente || '');
          const producto = typeof r.producto === 'object' ? (r.producto?.nombre || '') : (r.producto || '');
          return !search || `${r.fecha || ''} ${r.codigo_mr || ''} ${r.descripcion || ''} ${r.cantidad || ''} ${producto} ${cliente}`.toLowerCase().includes(search);
        });

        const pages = Math.max(1, Math.ceil(rowsAll.length / pageSize));
        if (page > pages) page = pages;
        const start = (page - 1) * pageSize;
        const slice = rowsAll.slice(start, start + pageSize);

        const rows = slice.map(r => `
          <tr>
            <td>${r.fecha ?? ''}</td>
            <td>${r.codigo_mr ?? ''}</td>
            <td>${r.descripcion ?? ''}</td>
            <td>${r.cantidad ?? ''}</td>
            <td>${(r.producto && (r.producto.nombre || r.producto)) || ''}</td>
            <td>${(r.cliente && (r.cliente.nombre || r.cliente)) || ''}</td>
            <td class="ops">
              <button class="op-btn" data-act="edit" data-id="${r.id}" title="Editar">✏️</button>
              <button class="op-btn" data-act="del" data-id="${r.id}" title="Borrar">🗑️</button>
            </td>
          </tr>`).join('');

        view.innerHTML = `
          <h2>Gestión de Inventario</h2>
          <div class="toolbar toolbar-bar">
            <div class="left tools-left">
              <div class="search"><input id="invSearch" type="text" placeholder="Buscar en inventario" value="${q}"></div>
              <button class="btn-primary" id="btnNewInv">Registrar Movimiento</button>
            </div>
          </div>
          <div class="table-wrap pretty">
            <table>
              <thead><tr><th>Fecha</th><th>Código MR</th><th>Descripción</th><th>Cantidad</th><th>Producto</th><th>Cliente</th><th>Acciones</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
          <div class="pager">
            <div class="left">Mostrando ${rowsAll.length ? (start + 1) : 0}-${Math.min(start + slice.length, rowsAll.length)} de ${rowsAll.length} registros</div>
            <div class="right">
              <span style="margin:0 8px">Pagina ${page} / ${pages}</span>
              <button class="btn-secondary" id="prevPg" ${page <= 1 ? 'disabled' : ''}>Atrás</button>
              <button class="btn-secondary" id="nextPg" ${page >= pages ? 'disabled' : ''}>Siguiente</button>
            </div>
          </div>`;

        document.getElementById('invSearch')?.addEventListener('input', (e) => { q = e.target.value; page = 1; render(); });
        document.getElementById('prevPg')?.addEventListener('click', () => { if (page > 1) { page--; render(); } });
        document.getElementById('nextPg')?.addEventListener('click', () => { if (page < pages) { page++; render(); } });

        document.getElementById('btnNewInv')?.addEventListener('click', async () => {
          const fields = [
            { name: 'fecha', label: 'Fecha', type: 'date' },
            { name: 'codigo_mr', label: 'Código MR' },
            { name: 'descripcion', label: 'Descripción' },
            { name: 'cantidad', label: 'Cantidad', type: 'number', step: 'any' },
            { name: 'producto_id', label: 'Producto ID' },
            { name: 'cliente_id', label: 'Cliente ID' },
          ];
          openFormModal('Registrar Movimiento', fields, {}, async (obj) => {
            await API.apiPost('/inventory', obj);
            window.centerToast?.('✅ Movimiento guardado', 'success', 2200);
            loadInventory();
          });
        });

        document.querySelectorAll('button[data-act="edit"]').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const current = await API.apiGet(`/inventory/${id}`);
            const fields = [
              { name: 'fecha', label: 'Fecha', type: 'date' },
              { name: 'codigo_mr', label: 'Código MR' },
              { name: 'descripcion', label: 'Descripción' },
              { name: 'cantidad', label: 'Cantidad', type: 'number', step: 'any' },
              { name: 'producto_id', label: 'Producto ID' },
              { name: 'cliente_id', label: 'Cliente ID' },
            ];
            openFormModal('Editar Movimiento', fields, current, async (obj) => {
              await API.apiPut(`/inventory/${id}`, obj);
              window.centerToast?.('🔵 Movimiento editado', 'info', 2200);
              loadInventory();
            });
          });
        });

        // delete lo maneja interceptor global
      }

      render();
    } catch (e) {
      console.error(e);
      view.innerHTML = '<p>Sin permisos para ver inventario.</p>';
    }
  }
  window.loadInventory = loadInventory;

async function loadProduction() {
  try {
    const data = await API.apiGet('/production');
    let q = '';
    let page = 1;
    const pageSize = 10;

    // ✅ 1) UNA sola función para fields (Registrar y Editar iguales)
    function getProcessFields(clientOpts, prodOpts) {
      return [
        { name: 'op', label: 'OP' },

        { name: 'cliente_id', label: 'Cliente', type: 'select', options: clientOpts, placeholder: 'Selecciona...' },
        { name: 'producto_id', label: 'Producto', type: 'select', options: prodOpts, placeholder: 'Selecciona...' },

        { name: 'variable1', label: 'Color' },
        { name: 'variable2', label: 'Tamaño' },
        { name: 'variable3', label: 'Material' },

        { name: 'empaques', label: 'Empaques', type: 'number' },
        { name: 'piezas', label: 'Piezas', type: 'number', step: 'any' },

        { name: 'lote', label: 'Lote' },

        { name: 'imagen', label: 'Imagen', type: 'file' }
      ];
    }

    function render() {
      const search = q.trim().toLowerCase();
      const rowsAll = (data || []).filter(r => !search || String(r.op || '').toLowerCase().includes(search));
      const pages = Math.max(1, Math.ceil(rowsAll.length / pageSize));
      if (page > pages) page = pages;
      const start = (page - 1) * pageSize;
      const slice = rowsAll.slice(start, start + pageSize);

      const rows = slice.map(r => `
        <tr>
          <td>${r.op ?? ''}</td>
          <td>${(r.cliente && (r.cliente.nombre || r.cliente)) || ''}</td>
          <td>${(r.producto && (r.producto.nombre || r.producto)) || ''}</td>
          <td>${r.variable1 ?? ''}</td>
          <td>${r.variable2 ?? ''}</td>
          <td>${r.variable3 ?? ''}</td>
          <td>${r.empaques ?? ''}</td>
          <td>${r.piezas ?? ''}</td>
          <td>${r.lote ?? ''}</td>
          <td>${r.imagen ? `<img class="prod-img-thumb" data-img="${r.imagen}" src="${r.imagen}" alt="img" style="max-height:32px;border-radius:4px;cursor:zoom-in;">` : ''}</td>
          <td class="ops">
            <button class="op-btn" data-act="edit" data-id="${r.id}" title="Editar">✏️</button>
            <button class="op-btn" data-act="del" data-id="${r.id}" title="Borrar">🗑️</button>
          </td>
        </tr>`).join('');

      view.innerHTML = `
        <section class="production-view">
        <h2>Gestión de Producción</h2>
        <div class="toolbar toolbar-bar">
          <div class="left tools-left">
            <div class="search"><input id="procSearch" type="text" placeholder="Buscar por OP" value="${q}"></div>
            <button class="btn-primary" id="btnNewProc">Registrar Proceso</button>
          </div>
        </div>
        <div class="table-wrap pretty">
          <table>
            <thead>
              <tr>
                <th>OP</th><th>Cliente</th><th>Producto</th>
                <th>Color</th><th>Tamaño</th><th>Material</th>
                <th>Empaques</th><th>Piezas</th><th>Lote</th><th>Imagen</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="pager">
          <div class="left">Mostrando ${rowsAll.length ? (start + 1) : 0}-${Math.min(start + slice.length, rowsAll.length)} de ${rowsAll.length} procesos</div>
          <div class="right">
            <span style="margin:0 8px">Pagina ${page} / ${pages}</span>
            <button class="btn-secondary" id="prevPg" ${page <= 1 ? 'disabled' : ''}>Atrás</button>
            <button class="btn-secondary" id="nextPg" ${page >= pages ? 'disabled' : ''}>Siguiente</button>
          </div>
        </div>
        </section>`;

      document.getElementById('procSearch')?.addEventListener('input', (e) => { q = e.target.value; page = 1; render(); });
      document.getElementById('prevPg')?.addEventListener('click', () => { if (page > 1) { page--; render(); } });
      document.getElementById('nextPg')?.addEventListener('click', () => { if (page < pages) { page++; render(); } });

      document.querySelectorAll('.prod-img-thumb').forEach(img => {
        img.addEventListener('click', () => {
          const src = img.getAttribute('data-img');
          if (src) openImageModal(src, 'Imagen de Proceso');
        });
      });

      // ✅ Registrar Proceso
      document.getElementById('btnNewProc')?.addEventListener('click', async () => {
        let clientes = [], productos = [];
        try { clientes = await API.apiGet('/clients'); } catch (_) { clientes = []; }
        try { productos = await API.apiGet('/products'); } catch (_) { productos = []; }

        const clientOpts = (clientes || []).map(c => ({
          value: c.id,
          text: `${c.idclie || ''} ${c.nombre || ''}`.trim() || c.id
        }));

        const prodOpts = (productos || []).map(p => ({
          value: p.id,
          text: `${p.idprod || ''} ${p.nombre || ''}`.trim() || p.id
        }));

        openFormModal(
          'Registrar Proceso',
          getProcessFields(clientOpts, prodOpts),
          {},
          async (obj) => {
            // 👇 Enviamos cliente_id/producto_id (backend ya los resuelve a nombres)
            await API.apiPost('/production', obj);
            window.centerToast?.('✅ Proceso guardado', 'success', 2200);
            loadProduction();
          }
        );
      });

      // ====== Layout "Imagen grande" en Registrar/Editar ======
      try {
        const form = document.getElementById('modalForm');
        if (!form) return;

        form.classList.add('proc-form');

        const imgInput = form.querySelector('input[type="file"][name="imagen"]');
        const imgLabel = imgInput?.closest('label');
        const preview = form.querySelector('img.img-preview[data-preview-for="imagen"]');
        const actionsRow = form.querySelector('.img-actions-row');

        if (imgLabel) {
          imgLabel.setAttribute('data-field', 'imagen');
          imgLabel.classList.remove('image-full');
          imgLabel.style.gridColumn = '2 / 3';
        }

        if (preview) {
          preview.style.gridColumn = '2 / 3';
          preview.style.display = preview.src ? 'block' : preview.style.display;
        }

        if (actionsRow) {
          actionsRow.style.gridColumn = '2 / 3';
        }
      } catch (_) {}

      // ✅ Editar Proceso
      document.querySelectorAll('button[data-act="edit"]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');

          let clientes = [], productos = [];
          try { clientes = await API.apiGet('/clients'); } catch (_) { clientes = []; }
          try { productos = await API.apiGet('/products'); } catch (_) { productos = []; }

          const clientOpts = (clientes || []).map(c => ({
            value: c.id,
            text: `${c.idclie || ''} ${c.nombre || ''}`.trim() || c.id
          }));

          const prodOpts = (productos || []).map(p => ({
            value: p.id,
            text: `${p.idprod || ''} ${p.nombre || ''}`.trim() || p.id
          }));

          const current = await API.apiGet(`/production/${id}`);

          // ✅ Como el backend guarda nombres en procesos, al editar necesitamos
          // seleccionar el ID a partir del nombre actual:
          // ✅ Al editar: el backend puede devolver cliente/producto como:
// - nombre (cliente.nombre)
// - o el código (cliente.idclie / producto.idprod)
// Por eso hacemos match por código primero y si no, por nombre.
const currentClienteVal =
  (current?.cliente && (current.cliente.idclie || current.cliente.nombre || current.cliente)) || '';
const currentProductoVal =
  (current?.producto && (current.producto.idprod || current.producto.nombre || current.producto)) || '';

const cliMatch = (clientes || []).find(c =>
  String(c.idclie || '').trim().toLowerCase() === String(currentClienteVal).trim().toLowerCase()
) || (clientes || []).find(c =>
  String(c.nombre || '').trim().toLowerCase() === String(currentClienteVal).trim().toLowerCase()
);

const prodMatch = (productos || []).find(p =>
  String(p.idprod ?? p.id ?? '').trim().toLowerCase() === String(currentProductoVal).trim().toLowerCase()
) || (productos || []).find(p =>
  String(p.nombre || '').trim().toLowerCase() === String(currentProductoVal).trim().toLowerCase()
);

const currentForm = {
  op: current.op ?? '',

  cliente_id: cliMatch ? cliMatch.idclie : '',
  producto_id: prodMatch ? (prodMatch.idprod ?? prodMatch.id) : '',

  variable1: current.variable1 ?? '',
  variable2: current.variable2 ?? '',
  variable3: current.variable3 ?? '',

  empaques: current.empaques ?? '',
  piezas: current.piezas ?? '',
  lote: current.lote ?? '',

  imagen: current.imagen ?? ''
};



          const fields = getProcessFields(clientOpts, prodOpts);

          openFormModal('Editar Proceso', fields, currentForm, async (obj) => {
            // 👇 Enviamos cliente_id/producto_id (backend ya los resuelve a nombres)
            await API.apiPut(`/production/${id}`, obj);
            window.centerToast?.('🔵 Proceso editado', 'info', 2200);
            loadProduction();
          });

          // ====== Bloquear edición de OP ======
          try {
            const form = document.getElementById('modalForm');
            const opInp = form?.querySelector('input[name="op"]');
            if (opInp) {
              opInp.readOnly = true;
              opInp.classList.add('readonly');
              opInp.title = 'No se puede editar';
            }
          } catch (_) {}
        });
      });

      // delete lo maneja interceptor global
    }

    render();
  } catch (e) {
    console.error(e);
    view.innerHTML = '<p>Sin permisos para ver procesos.</p>';
  }
}

window.loadProduction = loadProduction;



  async function loadOperators() {
    try {
      const data = await API.apiGet('/operators');
      let q = '';
      let page = 1;
      const pageSize = 10;




      function render() {
        const search = q.trim().toLowerCase();
        const rowsAll = (data || []).filter(r => !search || `${r.nombre || ''} ${r.rfid || ''} ${r.estacion || ''}`.toLowerCase().includes(search));
        const pages = Math.max(1, Math.ceil(rowsAll.length / pageSize));
        if (page > pages) page = pages;
        const start = (page - 1) * pageSize;
        const slice = rowsAll.slice(start, start + pageSize);

        const rows = slice.map(r => `
          <tr>
            <td class="user-cell">
              <span class="avatar-chip">${(r.nombre || '?').toString().slice(0, 1).toUpperCase()}</span>
              <div>
                <div><strong>${r.nombre ?? ''}</strong></div>
                <div class="muted">RFID: ${r.rfid ?? ''}</div>
              </div>
            </td>
            <td>${r.estacion ?? ''}</td>
            <td class="ops">
              <button class="op-btn" data-act="edit" data-id="${r.id}" title="Editar">✏️</button>
              <button class="op-btn" data-act="del" data-id="${r.id}" title="Borrar">🗑️</button>
            </td>
          </tr>`).join('');

        view.innerHTML = clientsHubHeader('operators') + `
          <h2>Gestión de Operadores</h2>
          <div class="toolbar toolbar-bar">
            <div class="left tools-left">
              <div class="search"><input id="opSearch" type="text" placeholder="Buscar operadores..." value="${q}"></div>
              <button class="btn-primary" id="btnNewOp">Registrar Operador</button>
            </div>
          </div>
          <div class="table-wrap pretty">
            <table>
              <thead><tr><th>Operador</th><th>Estación</th><th>Acciones</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
          <div class="pager">
            <div class="left">Mostrando ${rowsAll.length ? (start + 1) : 0}-${Math.min(start + slice.length, rowsAll.length)} de ${rowsAll.length} operadores</div>
            <div class="right">
              <span style="margin:0 8px">Pagina ${page} / ${pages}</span>
              <button class="btn-secondary" id="prevPg" ${page <= 1 ? 'disabled' : ''}>Atrás</button>
              <button class="btn-secondary" id="nextPg" ${page >= pages ? 'disabled' : ''}>Siguiente</button>
            </div>
          </div>`;

        bindClientsHubTabs();

        document.getElementById('opSearch')?.addEventListener('input', (e) => { q = e.target.value; page = 1; render(); });
        document.getElementById('prevPg')?.addEventListener('click', () => { if (page > 1) { page--; render(); } });
        document.getElementById('nextPg')?.addEventListener('click', () => { if (page < pages) { page++; render(); } });

        document.getElementById('btnNewOp')?.addEventListener('click', async () => {
          let stations = [];
          try { stations = await API.apiGet('/stations'); } catch (_) { stations = []; }
          const stationOptions = (stations || []).map(s => s?.nombre || s?.name || s?.idest || '').filter(Boolean);

          const fields = [
            { name: 'rfid', label: 'RFID' },
            { name: 'nombre', label: 'Nombre' },
            { name: 'password', label: 'Contraseña', type: 'password' },
            { name: 'estacion', label: 'Estación', type: 'select', options: stationOptions },
          ];

          openFormModal('Registrar Operador', fields, {}, async (obj) => {
            if (!obj.estacion) {
  await window.showCenterAlert?.('Selecciona una estación.', 'Aviso');
  return false;
}

            await API.apiPost('/operators', obj);
            window.centerToast?.('✅ Operador guardado', 'success', 2200);
            loadOperators();
          });
        });

       document.querySelectorAll('button[data-act="edit"]').forEach(btn => {
  btn.addEventListener('click', async () => {
    const id = btn.getAttribute('data-id');
    if (!id) return;

    // ✅ Cargar estaciones (igual que ya lo tienes)
    let stations = [];
    try { stations = await API.apiGet('/stations'); } catch (_) { stations = []; }
    const stationOptions = (stations || []).map(s => s?.nombre || s?.name || s?.idest || '').filter(Boolean);

    // ✅ IMPORTANTE: Traer detalle con password desde backend
    let current = {};
    try {
      current = await API.apiGet(`/operators/${id}`); // debe traer { password: "..." }
    } catch (e) {
      console.error('GET /operators/:id falló:', e);
      current = {}; // sin fallback para evitar que “parezca” que sí trae password
    }

    const fields = [
      { name: 'rfid', label: 'RFID' },
      { name: 'nombre', label: 'Nombre' },
      { name: 'password', label: 'Contraseña', type: 'password' }, // oculto por defecto
      { name: 'estacion', label: 'Estación', type: 'select', options: stationOptions },
    
    ];

    openFormModal('Editar Operador', fields, current, async (obj) => {
      // ✅ si lo dejan vacío, NO sobreescribas la BD con vacío
      if (obj.password === '') delete obj.password;

      await API.apiPut(`/operators/${id}`, obj);
      window.centerToast?.('🔵 Operador editado', 'info', 2200);
      loadOperators();
    });

    // ✅ Forzar que el password se vea (precarga) + ojo toggle
 setTimeout(() => {
  const passInput = document.querySelector('#modalForm input[name="password"]');
  if (!passInput) return;
  passInput.value = (current && current.password !== undefined) ? (current.password || '') : '';
  passInput.type = 'password';
  attachPasswordEye(passInput);
}, 0);
  });
});

        // delete lo maneja interceptor global
      }

      render();
    } catch (e) {
      console.error(e);
      view.innerHTML = '<p>Sin permisos para ver operadores.</p>';
    }
  }
  window.loadOperators = loadOperators;

// ---- Company / Variables ----
async function loadCompany() {
  let data = null;

  // 1) Intentar cargar /company, pero NO permitir que rompa la vista
  try {
    data = await API.apiGet('/company');
  } catch (e) {
    console.warn('No se pudo cargar /company:', e);
    data = null;
  }

  // 2) Si data es null/undefined, usa defaults para que render no truene
  if (!data || typeof data !== 'object') {
    data = {
      rfc: '', nombre: '', calle: '', colonia: '', ciudad: '',
      estado: '', cp: '', contacto: '', correo: '', telefono: '',
      hasLogo: false
    };
  }

  // Columnas solicitadas
  const col1 = ['rfc','nombre','calle','colonia','ciudad'];
  const col2 = ['estado','cp','contacto','correo','telefono'];
  const labelMap = { rfc:'Rfc', nombre:'Nombre', calle:'Calle', colonia:'Colonia', ciudad:'Ciudad', estado:'Estado', cp:'Cp', contacto:'Contacto', correo:'Correo', telefono:'Telefono' };

  const renderField = (f, col) => {
    const lbl = labelMap[f] || (f.charAt(0).toUpperCase() + f.slice(1));
    const type = (f === 'correo') ? 'email' : (f === 'telefono' ? 'tel' : 'text');
    const v = (data && data[f] != null) ? data[f] : '';
    return `<label data-col="${col}">${lbl}<input type="${type}" id="f_${f}" value="${String(v).replaceAll('"','&quot;')}"></label>`;
  };

  const col1Html = `<div class="col col-1">${col1.map(f => renderField(f, 1)).join('')}</div>`;
  const col2Html = `<div class="col col-2">${col2.map(f => renderField(f, 2)).join('')}</div>`;

  // 3) Logo: NO uses data.logotipo (tu backend devuelve hasLogo)
  //    Si hay logo, apunta directo al endpoint.

const logoBlock = `
  <div class="logo-field logo-cell">
    <label class="logo-title">Logotipo</label>

    <div class="logo-preview-wrap" style="margin-top:8px;">
      <img id="logoPreview" alt="Logotipo" style="display:none; max-width:100%; height:auto;">
    </div>

    <div class="img-actions-row" style="margin-top:10px; position:relative;">
      <input type="file" id="logoFile" accept="image/*"
             style="position:absolute; left:-9999px; width:1px; height:1px; opacity:0;">
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

  

  async function refreshLogoPreviewFromServer() {
  try {
    const blob = await API.apiGetBlob('/company/logo', { allow404: true });
    if (!blob) {
      logoPreview.style.display = 'none';
      logoPreview.src = '';
      return;
    }
    const url = URL.createObjectURL(blob);
    logoPreview.src = url;
    logoPreview.style.display = '';
  } catch (e) {
    console.warn('No se pudo cargar logo:', e);
    logoPreview.style.display = 'none';
    logoPreview.src = '';
  }
}

// si el backend dice que hay logo, intenta cargarlo
if (data.hasLogo) {
  refreshLogoPreviewFromServer();
}



  // ====== Logo: selector + upload ======
const logoInput = document.getElementById('logoFile');
const logoPickBtn = document.getElementById('logoPickBtn');
const logoPreview = document.getElementById('logoPreview');

logoPickBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  if (logoInput) logoInput.value = ''; // permite re-elegir el mismo archivo
  logoInput?.click();
});

logoInput?.addEventListener('change', async () => {
  const file = logoInput?.files?.[0];
  if (!file) return;

  try {
    // preview inmediato (local)
    const localUrl = URL.createObjectURL(file);
    logoPreview.src = localUrl;
    logoPreview.style.display = '';

    // subir al backend
    const fd = new FormData();
    fd.append('file', file); // IMPORTANTE: 'file'
    await API.apiUpload('/company/logo', fd);

    // recargar desde server (para confirmar que se guardó)
    const base = (window.API_BASE || '/api');
          // ✅ No uses <img src="/company/logo"> porque NO manda Authorization.
      // Cargar por blob con token:
      await refreshLogoFromServer();
} catch (err) {
    console.error(err);
    alert('Error al subir el logotipo');
  }
});

// ====== Guardar datos ======
document.getElementById('saveCompany')?.addEventListener('click', async (ev) => {
  ev.preventDefault();

  try {
    const obj = {};
    [...col1, ...col2].forEach(f => {
      const el = document.getElementById(`f_${f}`);
      if (el) obj[f] = el.value;
    });

    // AQUÍ estaba tu bug: usabas payload (no existe).
    await API.apiPut('/company', obj);

    window.centerToast?.('✅ Empresa guardada', 'success', 2200);
  } catch (err) {
    console.error(err);
    const code = err?.status ? ` (HTTP ${err.status})` : '';
    window.centerToast?.(`❌ No se pudo guardar${code}`, 'info', 2600);
  }
});


  // ===== helpers =====
  function setLogo(src) {
    const img = document.getElementById('companyLogoPreview');
    const empty = document.getElementById('companyLogoEmpty');
    if (!img || !empty) return;

    if (src) {
      img.src = src;
      img.style.display = 'block';
      empty.style.display = 'none';
    } else {
      img.src = '';
      img.style.display = 'none';
      empty.style.display = 'block';
    }
  }

  function getToken() {
    try { return localStorage.getItem('token') || ''; } catch (_) { return ''; }
  }

  async function fetchJSON(url, opts = {}) {
    const res = await fetch(url, opts);
    const ct = res.headers.get('content-type') || '';
    let payload = null;
    if (ct.includes('application/json')) payload = await res.json();
    else payload = await res.text();
    if (!res.ok) {
      const msg = typeof payload === 'string' ? payload : (payload?.error || payload?.detail || res.statusText);
      const err = new Error(msg || 'Request failed');
      err.status = res.status;
      err.payload = payload;
      throw err;
    }
    return payload;
  }

 
  // ===== selector de archivo =====
  document.getElementById('btnPickLogo')?.addEventListener('click', () => {
    document.getElementById('companyLogoInput')?.click();
  });

  // preview
  document.getElementById('companyLogoInput')?.addEventListener('change', () => {
    const file = document.getElementById('companyLogoInput')?.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLogo(url);
  });

  // quitar logo (BD)
  document.getElementById('btnClearLogo')?.addEventListener('click', async () => {
    try {
      await fetchJSON('/api/company/logo', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const fi = document.getElementById('companyLogoInput');
      if (fi) fi.value = '';
      setLogo(null);
      window.centerToast?.('✅ Logo eliminado', 'success', 1800);
    } catch (err) {
      console.error(err);
      window.centerToast?.(`❌ No se pudo eliminar (HTTP ${err.status || ''})`, 'info', 2400);
    }
  });

  // guardar datos + logo
  document.getElementById('saveCompany')?.addEventListener('click', async (ev) => {
    ev.preventDefault();

    try {
      // 1) guardar campos de texto
      const obj = {};
      [...col1, ...col2].forEach(f => {
        const el = document.getElementById(`f_${f}`);
        if (el) obj[f] = el.value;
      });
      await API.apiPut('/company', obj);


      // 2) subir logo si hay archivo (multipart REAL)
      const file = document.getElementById('companyLogoInput')?.files?.[0];
      if (file) {
        const fd = new FormData();
        fd.append('file', file); // MUST: 'file'

        const up = await fetchJSON('/api/company/logo', {
          method: 'POST',
          headers: { Authorization: `Bearer ${getToken()}` },
          body: fd
        });

        // el backend devuelve { logo: "data:image/...base64" }
        if (up?.logo) setLogo(up.logo);

        // limpia input
        const fi = document.getElementById('companyLogoInput');
        if (fi) fi.value = '';
      }

      window.centerToast?.('✅ Empresa guardada', 'success', 2200);
    } catch (err) {
      console.error(err);
      const code = err?.status ? ` (HTTP ${err.status})` : '';
      window.centerToast?.(`❌ No se pudo guardar${code}`, 'info', 2600);
    }
  });
}
window.loadCompany = loadCompany;


async function loadCompanyLogo() {
  // Carga segura del logo usando token (evita 401 en <img src="/api/...">)
  const img = document.querySelector('#companyLogo');
  if (!img) return;

  try {
    const blob = await API.apiGetBlob('/company/logo?ts=' + Date.now(), { allow404: true });
    if (!blob) {
      img.removeAttribute('src');
      return;
    }
    const url = URL.createObjectURL(blob);
    img.src = url;
  } catch (e) {
    console.warn('Logo load failed:', e);
    img.removeAttribute('src');
  }
}
async function loadVariables() {
  let data = {};

  try {
    data = await API.apiGet('/variables');
  } catch (e) {
    console.error('Error cargando variables:', e);

    view.innerHTML = toolsHubHeader('variables') + `
      <div class="page-header">
        <div class="page-title">Variables</div>
        <div class="page-subtitle">No tienes permiso para acceder a esta sección o hubo un error.</div>
      </div>`;
    bindToolsHubTabs();
    return;
  }

  const keys = [
    'variable_prov1',
    'variable_prov2',
    'variable_prov3',
   
  ];

  view.innerHTML = toolsHubHeader('variables') + `
    <div class="page-header">
      <div class="page-title">Variables</div>
      <div class="page-subtitle">Configura los nombres personalizados</div>
    </div>

    <div class="table-wrap variables-form" style="padding:12px;">
      <form id="varsForm" class="form-grid vars-grid"
            style="display:grid;grid-template-columns:repeat(3,minmax(180px,1fr));gap:12px;">

        ${keys.map((k, i) => `
          <label>
            ${k.includes('prov') ? `Variable ${i % 3 + 1}` : `Cliente ${i % 3 + 1}`}
            <input type="text" id="v_${k}" value="${data[k] ?? ''}">
          </label>
        `).join('')}

      </form>

      <div style="margin-top:10px;text-align:right;">
        <button class="btn-primary" id="saveVars">Guardar</button>
      </div>
    </div>`;

  bindToolsHubTabs();

  // ===== Guardar =====
  document.getElementById('saveVars')?.addEventListener('click', async (ev) => {
    ev.preventDefault();

    try {
      const obj = {};
      keys.forEach(k => {
        const el = document.getElementById(`v_${k}`);
        if (el) obj[k] = el.value;
      });

      await API.apiPut('/variables', obj);

      window.centerToast?.('✅ Variables guardadas', 'success', 2200);

    } catch (err) {
      console.error(err);
      window.centerToast?.('❌ No se pudieron guardar las variables', 'info', 2600);
    }
  });
}

window.loadVariables = loadVariables;
console.log('✅ loadVariables registrado', typeof window.loadVariables);



  async function loadStations() {
    try {
      const data = await API.apiGet('/stations');
      let q = '';
      let page = 1;
      const pageSize = 10;

      function render() {
        const search = q.trim().toLowerCase();
        const rowsAll = (data || []).filter(r => !search || `${r.idest || ''} ${r.nombre || ''} ${r.observaciones || ''}`.toLowerCase().includes(search));
        const pages = Math.max(1, Math.ceil(rowsAll.length / pageSize));
        if (page > pages) page = pages;
        const start = (page - 1) * pageSize;
        const slice = rowsAll.slice(start, start + pageSize);

        const rows = slice.map(r => `
          <tr>
            <td class="user-cell">
              <span class="avatar-chip">${(r.nombre || '?').toString().slice(0, 1).toUpperCase()}</span>
              <div>
                <div><strong>${r.nombre ?? ''}</strong></div>
                <div class="muted">${r.idest ?? ''}</div>
              </div>
            </td>
            <td>${r.observaciones ?? ''}</td>
            <td class="ops">
              <button class="op-btn" data-act="edit" data-id="${r.id}" title="Editar">✏️</button>
              <button class="op-btn" data-act="del" data-id="${r.id}" title="Borrar">🗑️</button>
            </td>
          </tr>`).join('');

        view.innerHTML = toolsHubHeader('stations') + `
          <h2>Estaciones</h2>
          <div class="toolbar toolbar-bar">
            <div class="left tools-left">
              <div class="search"><input id="stationSearch" type="text" placeholder="Buscar Estación" value="${q}"></div>
              <button class="btn-primary" id="btnNewStation">Registrar Estación</button>
            </div>
          </div>
          <div class="table-wrap pretty">
            <table>
              <thead><tr><th>Estación</th><th>Observaciones</th><th>Acciones</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
          <div class="pager">
            <div class="left">Mostrando ${rowsAll.length ? (start + 1) : 0}-${Math.min(start + slice.length, rowsAll.length)} de ${rowsAll.length} estaciones</div>
            <div class="right">
              <span style="margin:0 8px">Pagina ${page} / ${pages}</span>
              <button class="btn-secondary" id="prevPg" ${page <= 1 ? 'disabled' : ''}>Atrás</button>
              <button class="btn-secondary" id="nextPg" ${page >= pages ? 'disabled' : ''}>Siguiente</button>
            </div>
          </div>`;

        bindToolsHubTabs();

        document.getElementById('stationSearch')?.addEventListener('input', (e) => { q = e.target.value; page = 1; render(); });
        document.getElementById('prevPg')?.addEventListener('click', () => { if (page > 1) { page--; render(); } });
        document.getElementById('nextPg')?.addEventListener('click', () => { if (page < pages) { page++; render(); } });

        document.getElementById('btnNewStation')?.addEventListener('click', async () => {
          const fields = [
            { name: 'idest', label: 'IdEstación' },
            { name: 'nombre', label: 'Nombre' },
            { name: 'observaciones', label: 'Observaciones' },
          ];
          openFormModal('Registrar Estación', fields, {}, async (obj) => {
            await API.apiPost('/stations', obj);
            window.centerToast?.('✅ Estación guardada', 'success', 2200);
            loadStations();
          });
        });

        document.querySelectorAll('button[data-act="edit"]').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const current = (data || []).find(x => String(x.id) === String(id)) || {};
            const fields = [
              { name: 'idest', label: 'IdEstación' },
              { name: 'nombre', label: 'Nombre' },
              { name: 'observaciones', label: 'Observaciones' },
            ];
            openFormModal('Editar Estación', fields, current, async (obj) => {
              await API.apiPut(`/stations/${id}`, obj);
              window.centerToast?.('🔵 Estación editada', 'info', 2200);
              loadStations();
            });
          });
        });

        // delete lo maneja interceptor global
      }

      render();
    } catch (e) {
      console.error(e);
      view.innerHTML = '<p>Sin permisos para ver estaciones.</p>';
    }
  }
  window.loadStations = loadStations;

  async function loadProfile() {
    try {
      const me = await API.apiGet('/profile');

      view.innerHTML = `
        <div class="profile-wrapper">
          <form id="profileForm" autocomplete="off">
            <div class="profile-columns">
              <div class="profile-card card" style="padding:16px;">
                <h2>Perfil</h2>
                <div class="form-group"><label>RFID</label><input type="text" id="rfid" name="rfid"></div>
                <div class="form-group"><label>Nombre</label><input type="text" id="nombre" name="nombre"></div>
              </div>

              <div class="profile-card card" style="padding:16px;">
                <h2>Fotografía</h2>
                <div class="photo-preview" style="width:100%;height:240px;border:1px solid rgba(0,0,0,.2);border-radius:12px;overflow:hidden;display:flex;align-items:center;justify-content:center;">
                  <img id="profilePhotoPreview" src="" alt="Vista previa" style="width:100%;height:100%;object-fit:contain;">
                </div>
                <label class="upload-btn btn-secondary" style="display:inline-block;margin-top:10px;cursor:pointer;">
                  Seleccionar imagen
                  <input type="file" id="profilePhotoInput" name="file" accept="image/*" style="display:none" />
                </label>
              </div>
            </div>
            <div class="save-container">
            <button class="btn-primary" type="submit">Guardar</button>
            <button class="btn-secondary" id="removeProfilePhoto" type="button" title="Quitar foto">Quitar foto</button>
            </div>

          </form>
        </div>`;

      try { document.getElementById('rfid').value = me.rfid || ''; } catch (_) {}
      try { document.getElementById('nombre').value = me.nombre || ''; } catch (_) {}

      // foto actual
      try {
        const p = await API.apiGet('/profile/photo');
        const prev = document.getElementById('profilePhotoPreview');
        const rm = document.getElementById('removeProfilePhoto');
        if (p && p.foto && prev) prev.src = p.foto;
        if (rm) rm.style.display = (p && p.foto) ? 'inline-block' : 'none';
      } catch (_) {
        const rm = document.getElementById('removeProfilePhoto');
        if (rm) rm.style.display = 'none';
      }

      // preview nueva foto
      document.getElementById('profilePhotoInput')?.addEventListener('change', () => {
        const fi = document.getElementById('profilePhotoInput');
        const rm = document.getElementById('removeProfilePhoto');
        const f = fi?.files?.[0];
        if (f) {
          document.getElementById('profilePhotoPreview').src = URL.createObjectURL(f);
          if (rm) rm.style.display = 'inline-block';
        }
      });

      // guardar
      document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {};
const fd = new FormData(e.target);

// solo permitir estos campos en perfil
const allowed = new Set(['rfid', 'nombre']);
fd.forEach((v, k) => {
  if (k === 'file') return;
  if (!allowed.has(k)) return;
  if (v != null && String(v).trim().length) data[k] = v;
});

await API.apiPut('/profile', data);

        try {
          const file = document.getElementById('profilePhotoInput')?.files?.[0];
          if (file) {
            const ufd = new FormData();
            ufd.append('file', file);
            const res = await API.apiUpload('/profile/photo', ufd);
            if (res && res.foto) document.getElementById('profilePhotoPreview').src = res.foto;
          }
        } catch (_) {}

        try {
  const u = JSON.parse(localStorage.getItem('usuario') || '{}');
  if (data.nombre) u.nombre = data.nombre;
  localStorage.setItem('usuario', JSON.stringify(u));
} catch (_) {}

        window.centerToast?.('✅ Perfil actualizado', 'success', 2200);
      });

      // quitar foto
      document.getElementById('removeProfilePhoto')?.addEventListener('click', async () => {
        try {
          await API.apiDelete('/profile/photo');
          const prev = document.getElementById('profilePhotoPreview');
          if (prev) prev.src = '';
          const fi = document.getElementById('profilePhotoInput');
          if (fi) fi.value = '';
          document.getElementById('removeProfilePhoto').style.display = 'none';
          window.centerToast?.('✅ Foto eliminada', 'success', 2200);
        } catch (err) {
          console.error(err);
          window.centerToast?.('❌ No fue posible eliminar la foto', 'info', 2200);
        }
      });

    } catch (e) {
      console.error(e);
      view.innerHTML = '<p>No fue posible cargar el perfil.</p>';
    }
  }
  window.loadProfile = loadProfile;

    // ==========================================
  // DELETE GLOBAL (CON confirmación SOLO eliminar)
  // ==========================================
  document.addEventListener('click', async (e) => {
    const t = e.target && (e.target.closest ? e.target.closest('button[data-act="del"]') : null);
    if (!t) return;

    const id = t.getAttribute('data-id');
    const viewName = window.__currentView ? String(window.__currentView).toLowerCase() : '';

    const pathMap = {
      users: '/users',
      products: '/products',
      clients: '/clients',
      catalogs: '/clients',
      inventory: '/inventory',
      production: '/production',
      process: '/production',
      operators: '/operators',
      stations: '/stations'
    };

    const labelMap = {
      users: 'usuario',
      products: 'producto',
      clients: 'cliente',
      catalogs: 'cliente',
      inventory: 'registro',
      production: 'proceso',
      process: 'proceso',
      operators: 'operador',
      stations: 'estación'
    };

    const base = pathMap[viewName];
    const label = labelMap[viewName] || 'registro';
    if (!base || !id) return;

    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();

    // ✅ Confirmación SOLO en eliminar (como tu imagen)
    const ok = await window.showConfirm?.(`¿Estás seguro de eliminar este ${label}?`, {
      title: 'Confirmar',
      okText: 'Eliminar',
      cancelText: 'Cancelar'
    });

    if (!ok) return;

    try {
      await API.apiDelete(`${base}/${id}`);

      // ✅ toast verde centrado (éxito)
      window.centerToast?.(`✅ Eliminado <b>${label}</b>`, 'success', 2200);

      switch (viewName) {
        case 'users': return loadUsers();
        case 'products': {
  // ✅ Fast: quitar fila + actualizar cache (sin recargar /products)
  try {
    const tr = document.querySelector(`tr[data-id="${id}"]`) || t.closest('tr');
    if (tr) tr.remove();
  } catch (_) {}

  try {
    if (Array.isArray(window.__productsCache)) {
      window.__productsCache = window.__productsCache.filter(x => String(x.id) !== String(id));
    }
  } catch (_) {}

  // si quieres recontar/paginación exacta, simplemente re-render:
  try { loadProducts(); } catch (_) {}
  return;
}

        case 'clients':
        case 'catalogs': return loadClients();
        case 'inventory': return loadInventory();
        case 'production':
        case 'process': return loadProduction();
        case 'operators': return loadOperators();
        case 'stations': return loadStations();
        default: return loadView(viewName);
      }
    } catch (err) {
      console.error(err);
      window.centerToast?.('❌ No se pudo eliminar', 'info', 2200);
    }
  }, true);



  // =========================================================
  // REPORTES (Inventario) - Tabla sólida + Export PDF/Excel
  //  - Lo exportado = lo mostrado (misma fuente: __reportsState)
  // =========================================================
  (function () {
    if (window.loadReports) return; // no duplicar si ya existe en otro archivo

    const esc = (v) => String(v ?? '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');

    function ensureReportsStyles() {
      if (document.getElementById('reports-styles')) return;
      const st = document.createElement('style');
      st.id = 'reports-styles';
      st.textContent = `
        .toolbar-bar{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center;margin:10px 0 14px}
        .toolbar-bar input{background:var(--panel);color:var(--text);border:1px solid #232a36;border-radius:10px;padding:8px 10px;outline:none}
        .toolbar-bar input:focus{border-color:#3b82f6}
        .reports-table{width:100%;border-collapse:collapse}
        .reports-table th,.reports-table td{border:1px solid rgba(255,255,255,.08);padding:8px 10px;font-size:12px}
        body.light .reports-table th, body.light .reports-table td{border-color:rgba(0,0,0,.10)}
        .reports-table th{background:rgba(255,255,255,.04);position:sticky;top:0;z-index:2;cursor:pointer;user-select:none}
        body.light .reports-table th{background:rgba(0,0,0,.04)}
        .table-wrap.pretty{overflow:auto;max-height:calc(100vh - 270px);border-radius:12px}
        .reports-table td,.reports-table th{white-space:nowrap}
        .pager{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-top:10px}
        .pager .left{color:var(--muted);font-size:12px}
        .btn-secondary{background:transparent;border:1px solid #2b3444;color:var(--text);border-radius:10px;padding:8px 10px;cursor:pointer}
        .btn-secondary:disabled{opacity:.5;cursor:not-allowed}
      `;
      document.head.appendChild(st);
    }

    function applyClientFilter(rows, q) {
      const s = (q || '').trim().toLowerCase();
      if (!s) return rows;
      return (rows || []).filter(r => JSON.stringify(r).toLowerCase().includes(s));
    }

    function sortRows(rows, col, dir) {
      if (!col) return rows;
      const m = dir === 'desc' ? -1 : 1;

      return [...rows].sort((a,b) => {
        const va = a?.[col], vb = b?.[col];
        const na = Number(va), nb = Number(vb);
        const aNum = Number.isFinite(na) && String(va ?? '').trim() !== '';
        const bNum = Number.isFinite(nb) && String(vb ?? '').trim() !== '';
        if (aNum && bNum) return (na - nb) * m;

        return String(va ?? '').localeCompare(String(vb ?? ''), 'es', { numeric:true, sensitivity:'base' }) * m;
      });
    }

    function buildExcelXml(columns, rows) {
      const xmlEsc = (v) => String(v ?? '')
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

      let xml = '';
      xml += '<?xml version="1.0"?>\n';
      xml += '<?mso-application progid="Excel.Sheet"?>\n';
      xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
      xml += ' xmlns:o="urn:schemas-microsoft-com:office:office"\n';
      xml += ' xmlns:x="urn:schemas-microsoft-com:office:excel"\n';
      xml += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
      xml += '<Worksheet ss:Name="report"><Table>\n';

      xml += '<Row>';
      for (const h of columns) xml += `<Cell><Data ss:Type="String">${xmlEsc(h)}</Data></Cell>`;
      xml += '</Row>\n';

      for (const r of rows) {
        xml += '<Row>';
        for (const c of columns) {
          const v = r?.[c];
          const n = (typeof v === 'number') ? v : Number(String(v ?? '').replace(',', '.'));
          const isNum = Number.isFinite(n) && String(v ?? '').trim() !== '';
          const t = isNum ? 'Number' : 'String';
          const val = isNum ? String(n) : xmlEsc(v);
          xml += `<Cell><Data ss:Type="${t}">${val}</Data></Cell>`;
        }
        xml += '</Row>\n';
      }

      xml += '</Table></Worksheet></Workbook>';
      return '\uFEFF' + xml; // BOM para Excel
    }

    function downloadBlob(blob, filename) {
      const a = document.createElement('a');
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 250);
    }

    function exportExcelFromState(mode = 'filtered') {
      const st = window.__reportsState;
      if (!st) return;

      const cols = st.columns || [];
      const rows = (mode === 'page') ? (st.rowsPage || []) : (st.rowsAll || []);

      const xml = buildExcelXml(cols, rows);
      const blob = new Blob([xml], { type: 'application/vnd.ms-excel; charset=utf-8' });
      downloadBlob(blob, `reporte_inventario_${mode}.xls`);
    }

    function exportPdfFromState(mode = 'filtered') {
      const st = window.__reportsState;
      if (!st) return;

      const filters = st.filters || {};
      const params = new URLSearchParams();
      params.set('kind', 'inventory');
      params.set('scope', mode);
      if (filters.mr) params.set('mr', filters.mr);
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);

      const token = localStorage.getItem('token') || localStorage.getItem('access_token') || '';
      if (token) params.set('token', token);
      params.set('_', Date.now().toString());

      // ✅ Descarga directa: sin window.open, sin preview, sin print
      window.location.href = exportUrl(`/api/export/pdf?${params.toString()}`);
    }

    function renderTable(view, state) {
      const { columns, rowsAll, sortCol, sortDir, pageSize } = state;
      const pages = Math.max(1, Math.ceil(rowsAll.length / pageSize));
      const p = Math.min(Math.max(1, state.page), pages);
      state.page = p;

      const start = (p - 1) * pageSize;
      const slice = rowsAll.slice(start, start + pageSize);
      state.rowsPage = slice;

      const th = columns.map(c => {
        const active = (c === sortCol);
        const arrow = active ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';
        return `<th class="r-th" data-col="${esc(c)}" title="Ordenar">${esc(c)}${arrow}</th>`;
      }).join('');

      const tbody = slice.map(r => {
        const tds = columns.map(c => `<td>${esc(r?.[c])}</td>`).join('');
        return `<tr>${tds}</tr>`;
      }).join('');

      const fromTo = rowsAll.length ? `${start+1}-${Math.min(start + slice.length, rowsAll.length)}` : `0-0`;

      view.querySelector('#reportsTableWrap').innerHTML = `
        <div class="table-wrap pretty">
          <table class="reports-table">
            <thead><tr>${th}</tr></thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>
        <div class="pager">
          <div class="left">Mostrando ${fromTo} de ${rowsAll.length} registros</div>
          <div class="right">
            <span style="margin:0 8px">Página ${p} / ${pages}</span>
            <button class="btn-secondary" id="rpPrev" ${p<=1?'disabled':''}>Atrás</button>
            <button class="btn-secondary" id="rpNext" ${p>=pages?'disabled':''}>Siguiente</button>
          </div>
        </div>
      `;

      // Orden por header
      view.querySelectorAll('th.r-th').forEach(thEl => {
        thEl.addEventListener('click', () => {
          const col = thEl.getAttribute('data-col');
          if (!col) return;
          if (state.sortCol === col) state.sortDir = (state.sortDir === 'asc' ? 'desc' : 'asc');
          else { state.sortCol = col; state.sortDir = 'asc'; }
          state.rowsAll = sortRows(state.rowsAll, state.sortCol, state.sortDir);
          renderTable(view, state);
        });
      });

      // Paginación
      view.querySelector('#rpPrev')?.addEventListener('click', () => { state.page--; renderTable(view, state); });
      view.querySelector('#rpNext')?.addEventListener('click', () => { state.page++; renderTable(view, state); });
    }

    async function fetchInventoryReport(filters) {
      const qs = new URLSearchParams();
      if (filters.from) qs.set('from', filters.from);
      if (filters.to) qs.set('to', filters.to);
      if (filters.mr) qs.set('mr', filters.mr);
      const data = await API.apiGet(`/reports/inventory?${qs.toString()}`);
      return data; // { columns, rows }
    }

    window.loadReports = async function loadReports() {
      ensureReportsStyles();
      const view = document.getElementById('view');

      view.innerHTML = `
        <div class="page-header">
          <div class="page-title">Reportes</div>
          <div class="page-subtitle">Inventario / Procesos</div>
        </div>

        <div class="toolbar toolbar-bar">
          <div class="left" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
            <input id="filter-mr" placeholder="Buscar OP/MR" style="min-width:180px">
          </div>

          <div class="right" style="display:flex;gap:8px;flex-wrap:wrap">
            <button type="button" class="btn-secondary" id="btnXlsPage">Exportar en Excel</button>
            <button type="button" class="btn-secondary" id="btnPdfPage">Exportar en PDF</button>
            
          </div>
        </div>

        <div id="reportsTableWrap">
          <div style="padding:14px;color:var(--muted)">Cargando...</div>
        </div>
      `;

  document.getElementById('btnXlsPage')?.addEventListener('click', async () => {
  try {
    const params = new URLSearchParams();
    params.set('kind', 'inventory');

    const from = document.querySelector('#filter-from')?.value;
    const to   = document.querySelector('#filter-to')?.value;
    const mr   = document.querySelector('#filter-mr')?.value;

    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (mr) params.set('mr', mr);

    // ✅ token por query (tu backend lo soporta para export)
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      '';

    if (token) params.set('token', token);

    const url = exportUrl(`/api/export/excel?${params.toString()}`);
    console.log('📊 Export Excel:', url);

    // ✅ descarga directa (lo más robusto)
    window.location.href = url;

  } catch (e) {
    console.error('❌ Error export Excel:', e);
    alert('Error al exportar Excel');
  }
});

  function forceDownload(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || '';
  document.body.appendChild(a);
  a.click();
  a.remove();
}






  

      // Estado único (vista == export)
      window.__reportsState = {
        columns: [],
        rowsRaw: [],
        rowsAll: [],
        rowsPage: [],
        sortCol: '',
        sortDir: 'asc',
        page: 1,
        pageSize: 12
      };

      const st = window.__reportsState;

      const getFiltersFromUI = () => ({
        from: view.querySelector('#filter-from')?.value || '',
        to: view.querySelector('#filter-to')?.value || '',
        mr: view.querySelector('#filter-mr')?.value || '',
        q: view.querySelector('#filter-q')?.value || ''
      });

      async function run() {
        const filters = getFiltersFromUI();
        const data = await fetchInventoryReport(filters); // ✅ evita "data is not defined"
        const columns = Array.isArray(data?.columns) ? data.columns : [];
        const rows = Array.isArray(data?.rows) ? data.rows : [];

        const filtered = applyClientFilter(rows, filters.q);

        st.columns = columns;
        st.rowsRaw = rows;
        st.rowsAll = sortRows(filtered, st.sortCol, st.sortDir);
        st.page = 1;

        renderTable(view, st);
      }

      // Eventos
      view.querySelector('#btnRun')?.addEventListener('click', () => run());
      view.querySelector('#btnPdfAll')?.addEventListener('click', () => exportPdfFromState('filtered'));
      view.querySelector('#btnPdfPage')?.addEventListener('click', () => exportPdfFromState('page'));



      

      ['#filter-mr','#filter-from','#filter-to','#filter-q'].forEach(sel => {
        view.querySelector(sel)?.addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); });
      });

      try { await run(); }
      catch (e) {
        console.error(e);
        view.querySelector('#reportsTableWrap').innerHTML =
          `<div style="padding:14px">❌ No se pudo cargar reportes (permisos o backend).</div>`;
      }
    };
  })();



  // =========================
  // Reload button
  // =========================
  document.getElementById('reloadBtn')?.addEventListener('click', () => {
    try { loadView(window.__currentView || 'dashboard'); } catch (_) {}
  });

  // =========================
  // Default initial view (DOM ready)
  // =========================
  (function () {
    const boot = () => {
      let initial = 'dashboard';
      try {
        const u = JSON.parse(localStorage.getItem('usuario') || '{}');
        if (String(u.rol || '').trim().toLowerCase() === 'operador') initial = 'operativo';
      } catch (_) {}
      try {
        loadView(initial);
      } catch (e) {
        console.error('Boot loadView failed:', e);
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
      boot();
    }
  })();

  // ===== Expose functions for tools_hub.js =====
  try { window.loadVariables = loadVariables; } catch (_) {}
  try { window.loadCompany = loadCompany; } catch (_) {}
  try { window.loadReports = window.loadReports || loadReports; } catch (_) {}

})();
