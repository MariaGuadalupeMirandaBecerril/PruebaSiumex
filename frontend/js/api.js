const API_BASE = (typeof window !== 'undefined' && window.API_BASE) || 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('token');
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
    // Redirigir al login servido por el backend
    if (typeof window !== 'undefined') window.location.href = '/ui/';
  }
}

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
  if (!res.ok) { handleAuth(res); throw new Error(await res.text()); }
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
  if (!res.ok) { handleAuth(res); throw new Error(await res.text()); }
  return res.json();
}

async function apiPut(path, body) {
  const res = await fetch(`${API_BASE}${path}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) });
  if (!res.ok) { handleAuth(res); throw new Error(await res.text()); }
  return res.json();
}

async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE', headers: authHeaders() });
  if (!res.ok) { handleAuth(res); throw new Error(await res.text()); }
  return res.json();
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

window.API = { apiGet, apiPost, apiPut, apiDelete, apiUpload, setToken };
