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

    // Client-like fields block
    const extra = JSON.parse(localStorage.getItem('perfil_cliente_extra')||'null') || {};
    const clie = document.createElement('div');
    clie.className = 'form-section';
    clie.innerHTML = `
      <div class="section-title">Cliente</div>
      <div class="grid-2">
        <label>Nombre<input type="text" name="clie_nombre" value="${extra.clie_nombre||''}" placeholder="Nombre del cliente"></label>
        <label>RFC<input type="text" name="clie_rfc" value="${extra.clie_rfc||''}" placeholder="RFC"></label>
      </div>
      <label>Observaciones<textarea name="clie_observaciones">${extra.clie_observaciones||''}</textarea></label>
      <div class="section-title">Direccion</div>
      <label>Calle<input type="text" name="clie_calle" value="${extra.clie_calle||''}"></label>
      <div class="grid-2">
        <label>Numero Interior<input type="text" name="clie_num_interior" value="${extra.clie_num_interior||''}"></label>
        <label>Numero Exterior<input type="text" name="clie_num_exterior" value="${extra.clie_num_exterior||''}"></label>
      </div>
      <div class="grid-2">
        <label>Colonia<input type="text" name="clie_colonia" value="${extra.clie_colonia||''}"></label>
        <label>Ciudad<input type="text" name="clie_ciudad" value="${extra.clie_ciudad||''}"></label>
      </div>
      <div class="grid-2">
        <label>Estado<input type="text" name="clie_estado" value="${extra.clie_estado||''}"></label>
        <label>Codigo Postal<input type="text" name="clie_cp" value="${extra.clie_cp||''}"></label>
      </div>
    `;
    form.appendChild(clie);

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

    // Override submit to upsert client and save extras
    const origSubmit = form.onsubmit;
    form.addEventListener('submit', async (e) => {
      try {
        const fd = new FormData(form);
        const extra = {
          clie_nombre: fd.get('clie_nombre')||'', clie_rfc: fd.get('clie_rfc')||'', clie_observaciones: fd.get('clie_observaciones')||'',
          clie_calle: fd.get('clie_calle')||'', clie_num_interior: fd.get('clie_num_interior')||'', clie_num_exterior: fd.get('clie_num_exterior')||'',
          clie_colonia: fd.get('clie_colonia')||'', clie_ciudad: fd.get('clie_ciudad')||'', clie_estado: fd.get('clie_estado')||'', clie_cp: fd.get('clie_cp')||''
        };
        try { localStorage.setItem('perfil_cliente_extra', JSON.stringify(extra)); } catch(_) {}
        const idclie = (extra.clie_rfc||'').toString().trim();
        const nombre = (extra.clie_nombre||'').toString().trim();
        const observaciones = (extra.clie_observaciones||'').toString();
        if (idclie && nombre) {
          try {
            const all = await API.apiGet('/clients');
            const found = (all||[]).find(c => (c.idclie||'').toLowerCase() === idclie.toLowerCase());
            const payload = { idclie, nombre, observaciones };
            if (found) await API.apiPut(`/clients/${found.id}`, payload); else await API.apiPost('/clients', payload);
          } catch(_) {}
        }
      } catch(_) {}
      // continue original
      if (typeof origSubmit === 'function') return origSubmit.call(form, e);
    }, true);
  }

  // Observe view changes to enhance profile when rendered
  const root = document.getElementById('view');
  if (root) new MutationObserver(() => { try { enhance(); } catch(_) {} }).observe(root, { childList:true, subtree:true });

  // Apply once in case already rendered
  try { enhance(); } catch(_) {}
})();

