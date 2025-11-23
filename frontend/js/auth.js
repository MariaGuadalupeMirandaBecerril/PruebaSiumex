const form = document.getElementById('loginForm');
const msg = document.getElementById('loginMsg');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = '';
  try {
    const correo = document.getElementById('correo').value;
    const password = document.getElementById('password').value;
    const res = await API.apiPost('/auth/login', { correo, password });
    API.setToken(res.token);
    if (res.usuario) {
      localStorage.setItem('usuario', JSON.stringify(res.usuario));
    }
    window.location.href = '/ui/app.html';
  } catch (err) {
    msg.textContent = 'Error de autenticación';
  }
});
