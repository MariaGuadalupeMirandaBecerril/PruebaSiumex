// Profile enhancements: client-like fields + avatar image (UI only, optional persistence)
(function(){
  function enhance() {
    const view = document.getElementById('view');
    if (!view) return;
    const title = view.querySelector('.page-title, h2');
    if (!title) return;
    const txt = (title.textContent||'').toLowerCase();
    if (!txt.includes('perfil')) return;
    const form = document.getElementById('profileForm');
    if (!form || form.__enhanced) return;
    form.__enhanced = true;

    // Si ya existen avatarPreview y avatarInput en el DOM (columna derecha), solo conectar eventos
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('avatarPreview');

    // Inicializar letra o imagen guardada
    const saved = localStorage.getItem('avatarImage') || '';
    const nameInput = form.querySelector('input[name="nombre"], input[name="Nombre"]');
    const letter = (((nameInput && nameInput.value) || '?').slice(0,1)).toUpperCase();
    if (avatarPreview){
      if (saved){ avatarPreview.style.backgroundImage = `url('${saved}')`; avatarPreview.classList.add('has-img'); avatarPreview.textContent = ''; }
      else { avatarPreview.textContent = letter; }
    }

    if (avatarInput && avatarPreview){
      avatarInput.addEventListener('change', () => {
        const f = avatarInput.files && avatarInput.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => {
          const url = reader.result;
          avatarPreview.classList.add('has-img');
          avatarPreview.style.backgroundImage = `url('${url}')`;
          avatarPreview.textContent = '';
          // Actualiza avatar en botón superior y guarda localmente
          try {
            localStorage.setItem('avatarImage', url);
            const btn = document.getElementById('userBtn');
            const mini = document.getElementById('menuAvatar');
            if (btn){ btn.style.backgroundImage = `url('${url}')`; btn.classList.add('has-img'); btn.textContent=''; }
            if (mini){ mini.style.backgroundImage = `url('${url}')`; mini.classList.add('has-img'); mini.textContent=''; }
          } catch(_) {}
        };
        reader.readAsDataURL(f);
      });
    }
  }

  // Observe view changes to enhance profile when rendered
  const root = document.getElementById('view');
  if (root) new MutationObserver(() => { try { enhance(); } catch(_) {} }).observe(root, { childList:true, subtree:true });

  // Apply once in case already rendered
  try { enhance(); } catch(_) {}
})();
