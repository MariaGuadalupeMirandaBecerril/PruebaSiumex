// Evitar redeclaración si el script se incluye dos veces
if (window.__apiLoaded) {
  // no hacer nada
} else {
  window.__apiLoaded = true;

const API_BASE = (window.API_BASE || '/api');

function getToken() {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    ''
  );
}

function setToken(t) {
  localStorage.setItem('token', t);
}

function authHeaders() {
  const t = getToken();
  return t ? { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

function handleAuth(res) {
  if (res.status === 401) {
    try { localStorage.removeItem('token'); } catch (_) {}
    // Redirigir al login del frontend (servido en la raíz)
    if (typeof window !== 'undefined') window.location.href = (window.APP_BASE || '') + '/index.html';

  }
}

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
  if (!res.ok) { handleAuth(res); throw new Error(await res.text()); }
  return res.json();
}

// GET que permite 404 sin romper (devuelve null)
async function apiGetOptional(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });

  if (res.status === 404) return null;

  if (!res.ok) {
    handleAuth(res);
    throw new Error(await res.text());
  }

  // Intenta JSON, si no, regresa texto (por seguridad)
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

// GET para binarios (blob), ideal para logos / PDFs / Excel, etc.
async function apiGetBlob(path, { allow404 = false } = {}) {
  const t = getToken();

  // Si no hay token, fallará 401 sí o sí -> mejor cortar y mandarte a login
  if (!t) {
    console.warn('⚠️ No hay token en localStorage. Redirigiendo a login...');
    try { window.location.hash = '#/login'; } catch (_) {}
    throw new Error('No autorizado: token faltante');
  }

  const headers = {
    Authorization: `Bearer ${t}`
  };

  const res = await fetch(`${API_BASE}${path}`, { headers });

  if (allow404 && res.status === 404) return null;

  // Manejo explícito de 401 (token expirado o inválido)
  if (res.status === 401) {
    console.warn('⚠️ 401 Unauthorized. Token inválido/expirado. Limpiando sesión...');
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('jwt');
      window.location.hash = '#/login';
    } catch (_) {}
    // si tienes handleAuth, también ejecútalo
    try { handleAuth(res); } catch (_) {}
    throw new Error('401 Unauthorized');
  }

  if (!res.ok) {
    try { handleAuth(res); } catch (_) {}
    throw new Error(await res.text());
  }

  return res.blob();
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
  if (!res.ok) { handleAuth(res); throw new Error(await res.text()); }
  const json = await res.json();
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('data:changed', { detail: { method: 'POST', path, data: json } })); } catch(_) {}
  return json;
}

async function apiPut(path, body) {
  const res = await fetch(`${API_BASE}${path}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) });
  if (!res.ok) { handleAuth(res); throw new Error(await res.text()); }
  const json = await res.json();
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('data:changed', { detail: { method: 'PUT', path, data: json } })); } catch(_) {}
  return json;
}

async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) { handleAuth(res); throw new Error(await res.text()); }
  const json = await res.json();
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('data:changed', { detail: { method: 'DELETE', path, data: json } })); } catch(_) {}
  return json;
}

// Upload (multipart/form-data). Do not set Content-Type; let browser set it.
async function apiUpload(path, formData) {
  const headers = {};
  const t = getToken();
  if (t) headers['Authorization'] = `Bearer ${t}`;
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: formData });
  if (!res.ok) { handleAuth(res); throw new Error(await res.text()); }
  return res.json();
}

window.API = { apiGet, apiGetBlob, apiPost, apiPut, apiDelete, apiUpload, setToken };
}// Evitar redeclaración si el script se incluye dos veces
if (window.__apiLoaded) {
  // no hacer nada
} else {
  window.__apiLoaded = true;

const API_BASE = (window.API_BASE || '/api');

function getToken() {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('jwt') ||          // por si usaste otra key
    ''
  );
}

function setToken(t) {
  localStorage.setItem('token', t);
}

function authHeaders() {
  const t = getToken();
  return t ? { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

function handleAuth(res) {
  if (res.status === 401) {
    try { localStorage.removeItem('token'); } catch (_) {}
    // Redirigir al login del frontend (servido en la raíz)
    if (typeof window !== 'undefined') window.location.href = (window.APP_BASE || '') + '/index.html';

  }
}

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
  if (!res.ok) { handleAuth(res); throw new Error(await res.text()); }
  return res.json();
}

// GET que permite 404 sin romper (devuelve null)
async function apiGetOptional(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });

  if (res.status === 404) return null;

  if (!res.ok) {
    handleAuth(res);
    throw new Error(await res.text());
  }

  // Intenta JSON, si no, regresa texto (por seguridad)
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (ct.includes('application/json')) return res.json();
  return res.text();
}



async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
  if (!res.ok) { handleAuth(res); throw new Error(await res.text()); }
  const json = await res.json();
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('data:changed', { detail: { method: 'POST', path, data: json } })); } catch(_) {}
  return json;
}

async function apiPut(path, body) {
  const res = await fetch(`${API_BASE}${path}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) });
  if (!res.ok) { handleAuth(res); throw new Error(await res.text()); }
  const json = await res.json();
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('data:changed', { detail: { method: 'PUT', path, data: json } })); } catch(_) {}
  return json;
}

async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) { handleAuth(res); throw new Error(await res.text()); }
  const json = await res.json();
  try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('data:changed', { detail: { method: 'DELETE', path, data: json } })); } catch(_) {}
  return json;
}

// Upload (multipart/form-data). Do not set Content-Type; let browser set it.
async function apiUpload(path, formData) {
  const headers = {};
  const t = getToken();
  if (t) headers['Authorization'] = `Bearer ${t}`;
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: formData });
  if (!res.ok) { handleAuth(res); throw new Error(await res.text()); }
  return res.json();
}

window.API = { apiGet, apiGetBlob, apiPost, apiPut, apiDelete, apiUpload, setToken };
}
