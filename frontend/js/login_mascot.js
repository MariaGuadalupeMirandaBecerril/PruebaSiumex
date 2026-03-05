(function(){
  function ready(fn){ if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  ready(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.body.classList.add('login-premium');

    // Animaci?n de la mascota ya presente en el DOM
    const mascot = document.querySelector('.mascot');
    if (mascot){
      requestAnimationFrame(() => {
        if (prefersReduced){
          mascot.classList.add('idle');
          try{ mascot.querySelector('.helmet').style.opacity = '1'; }catch(_){ }
          return;
        }
        mascot.classList.add('intro_walk');
        setTimeout(() => mascot.classList.add('intro_arrive'), 900);
        setTimeout(() => mascot.classList.add('intro_sit'), 1200);
        setTimeout(() => mascot.classList.add('intro_helmet'), 1800);
        setTimeout(() => mascot.classList.add('idle'), 2300);
      });
    }

    // Reacciones a focus
    const correo = document.getElementById('correo');
    const pass = document.getElementById('password');
    function setFocusClass(which){
      document.body.classList.remove('login-focus-email','login-focus-pass');
      if (which) document.body.classList.add(which);
    }
    if (correo) correo.addEventListener('focus', () => setFocusClass('login-focus-email'));
    if (pass) pass.addEventListener('focus', () => setFocusClass('login-focus-pass'));
    [correo, pass].forEach(i => i && i.addEventListener('blur', () => setFocusClass('')));

    // Loading / error / success
    window.addEventListener('login:loading', () => document.body.classList.add('state-loading'));
    window.addEventListener('login:error', () => {
      document.body.classList.remove('state-loading');
      const c = document.querySelector('.login-card');
      if (c){ c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); }
    });
    window.addEventListener('login:success', () => document.body.classList.remove('state-loading'));
  });
})();

// Hook API.apiPost para /auth/login (no toca endpoints)
if (window.API && typeof window.API.apiPost === 'function'){
  const _apiPost = window.API.apiPost.bind(window.API);
  window.API.apiPost = async function(path, body){
    if (String(path).indexOf('/auth/login') === 0){
      try {
        window.dispatchEvent(new CustomEvent('login:loading'));
        const res = await _apiPost(path, body);
        try{ window.dispatchEvent(new CustomEvent('login:success')); }catch(_){ }
        return res;
      } catch (e){
        try{ window.dispatchEvent(new CustomEvent('login:error')); }catch(_){ }
        throw e;
      }
    }
    return _apiPost(path, body);
  }
}

// Spinner en bot?n al enviar
(function(){
  const form = document.getElementById('loginForm');
  if (!form) return;
  form.addEventListener('submit', () => {
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.classList.add('loading');
  }, { capture: true });
})();


