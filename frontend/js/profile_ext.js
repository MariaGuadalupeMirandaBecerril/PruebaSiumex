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

    // Inject avatar uploader
    const avatarWrap = document.createElement('div');
    avatarWrap.className = 'avatar-uploader';
    const saved = localStorage.getItem('avatarImage') || '';
    const letter = (form.querySelector('input[name="nombre"]')?.value || '?').slice(0,1).toUpperCase();
    avatarWrap.innerHTML = `
      <div class="section-title">Fotografia</div>
      <div class="avatar-preview ${saved? 'has-img':''}" id="avatarPreview" style="${saved?`background-image:url('${saved}')`:''}">${letter}</div>
      <div class="avatar-actions">
        <input type="file" id="avatarInput" accept="image/*">
        <button type="button" class="btn-secondary" id="saveAvatar">Guardar foto</button>
      </div>
    `;
    form.appendChild(avatarWrap);

    // Removed client-like fields block per request

    // Avatar events
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('avatarPreview');
    avatarInput?.addEventListener('change', () => {
      const f = avatarInput.files && avatarInput.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result;
        avatarPreview.classList.add('has-img');
        avatarPreview.style.backgroundImage = `url('${url}')`;
      };
      reader.readAsDataURL(f);
    });
    document.getElementById('saveAvatar')?.addEventListener('click', () => {
      try {
        const bg = avatarPreview.style.backgroundImage;
        const m = /url\("?'?(.*)"?'?\)/.exec(bg);
        const dataUrl = m && m[1] ? m[1] : '';
        if (dataUrl) localStorage.setItem('avatarImage', dataUrl);
        const btn = document.getElementById('userBtn');
        const mini = document.getElementById('menuAvatar');
        if (btn){ btn.style.backgroundImage = `url('${dataUrl}')`; btn.classList.add('has-img'); btn.textContent=''; }
        if (mini){ mini.style.backgroundImage = `url('${dataUrl}')`; mini.classList.add('has-img'); mini.textContent=''; }
        alert('Foto guardada localmente');
      } catch(_) { alert('No se pudo guardar la foto'); }
    });

    // Remove client submit override; keep original form behavior only
  }

  // Observe view changes to enhance profile when rendered
  const root = document.getElementById('view');
  if (root) new MutationObserver(() => { try { enhance(); } catch(_) {} }).observe(root, { childList:true, subtree:true });

  // Apply once in case already rendered
  try { enhance(); } catch(_) {}
})();
