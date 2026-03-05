const form = document.getElementById('loginForm');
const msg = document.getElementById('loginMsg');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = '';
  try {
    const ident = document.getElementById('correo').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember')?.checked || false;
    // Enviar tanto en "correo" como en "usuario" para maximizar compatibilidad con el backend
    const res = await API.apiPost('/auth/login', { correo: ident, usuario: ident, password });
    API.setToken(res.token);
    if (res.usuario) {
      localStorage.setItem('usuario', JSON.stringify(res.usuario));
    }
    if (remember) localStorage.setItem('remember', '1'); else localStorage.removeItem('remember');
    // Redirigir según rol
    const rol = String((res.usuario && res.usuario.rol) || '').trim().toLowerCase();
    if (rol === 'operador') window.location.href = '/app.html#operativo';
    else window.location.href = '/app.html#dashboard';
  } catch (err) {
    try {
      const t = String((err && err.message) || '');
      const j = JSON.parse(t);
      msg.textContent = (j && (j.error || j.detail)) || 'Error de autenticación';
    } catch (_) {
      msg.textContent = 'Error de autenticación';
    }
    window.dispatchEvent(new CustomEvent('login:error'));
  }
});

// ===== Mostrar / ocultar contraseña =====
(function setupPasswordToggle(){
  const input = document.getElementById('password');
  const btn = document.getElementById('togglePassword');
  if (!input || !btn) return;

  btn.addEventListener('click', () => {
    const isHidden = input.getAttribute('type') === 'password';
    input.setAttribute('type', isHidden ? 'text' : 'password');
    btn.setAttribute('aria-label', isHidden ? 'Ocultar contraseña' : 'Mostrar contraseña');
    btn.title = isHidden ? 'Ocultar contraseña' : 'Mostrar contraseña';
    try {
      btn.innerHTML = isHidden
        ? '<span class="iconify" data-icon="mdi:eye-off-outline"></span>'
        : '<span class="iconify" data-icon="mdi:eye-outline"></span>';
    } catch(_){}
  });
})();

