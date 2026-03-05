// MÃ³dulo Operativo: captura, pesos, registrar e imprimir
(function(){
  async function fetchPedidos() {
    try { return await API.apiGet('/operativo/orders'); } catch(_){ return []; }
  }

  async function fetchByQR(qr) {
    if (!qr) return null;
    try { return await API.apiGet(`/operativo/order_by_qr?qr=${encodeURIComponent(qr)}`); } catch(_){ return null; }
  }

  function computeNeto(bruto, tara){
    const b = Number(bruto||0), t = Number(tara||0);
    return Math.max(0, +(b - t).toFixed(3));
  }

  function piezasIndicator(actual, pzp){
    const a = Number(actual||0), target = Number(pzp||0);
    if (!target) return { color: '#999', text: 'Sin objetivo' };
    if (a === target) return { color: '#16a34a', text: 'Cantidad correcta' };
    if (a < target) return { color: '#f59e0b', text: `Faltan ${target - a}` };
    return { color: '#dc2626', text: `Exceso ${a - target}` };
  }

  function labelHTML({ op, cliente, producto, lote, piezas, pzp, neto }){
    return `<!doctype html><html><head><meta charset='utf-8'><title>Etiqueta ${op}</title>
    <style>body{margin:0;padding:12px;font-family:Arial,Helvetica,sans-serif}
    .lbl{width:72mm;min-height:48mm;border:1px dashed #999;padding:8px}
    .row{margin:4px 0}.big{font-size:18px;font-weight:700}.sm{font-size:12px}
    </style></head>
    <body onload="window.print();setTimeout(()=>window.close(),300);">
      <div class='lbl'>
        <div class='row big'>OP: ${op||''}</div>
        <div class='row sm'>Cliente: ${cliente||''}</div>
        <div class='row sm'>Producto: ${producto||''}</div>
        <div class='row sm'>Lote: ${lote||''}</div>
        <div class='row sm'>Piezas: ${piezas??''} (PxP: ${pzp??''})</div>
        <div class='row sm'>Neto: ${neto??''}</div>
      </div>
    </body></html>`;
  }

  async function registrar(payload){
    return API.apiPost('/operativo/registrar', payload);
  }

  async function imprimir(payload){
    try{
      const res = await API.apiPost('/operativo/print', payload);
      const html = res && res.html ? res.html : labelHTML(payload);
      const w = window.open('', '_blank', 'width=600,height=400');
      if (w){ w.document.write(html); w.document.close(); }
    } catch(_){
      const html = labelHTML(payload);
      const w = window.open('', '_blank', 'width=600,height=400');
      if (w){ w.document.write(html); w.document.close(); }
    }
  }

  async function loadOperativo(){
    const root = document.getElementById('view');
    root.innerHTML = `
      <div class="page-header">
        <div class="page-title">Operativo</div>
        <div class="page-subtitle">Captura, pesa, registra e imprime</div>
      </div>
      <div class="grid2">
        <div class="card">
          <div class="card-title">Orden</div>
          <div class="form-grid">
            <label>QR
              <input type="text" id="f_qr" autocomplete="off" placeholder="Escanea QR" />
            </label>
            <label>OP
              <input type="text" id="f_op" autocomplete="off" />
            </label>
            <label>Id producto
              <input type="number" id="f_producto_id" />
            </label>
            <label>Producto
              <input type="text" id="f_producto" />
            </label>
            <label>Cliente
              <input type="text" id="f_cliente" />
            </label>
            <label>Lote
              <input type="text" id="f_lote" />
            </label>
            <label>CategorÃ­a
              <input type="text" id="f_categoria" />
            </label>
            <label>TamaÃ±o
              <input type="text" id="f_tamano" />
            </label>
            <label>Piezas
              <input type="number" step="0.001" id="f_piezas" />
            </label>
            <label>Empaques
              <input type="number" id="f_empaques" />
            </label>
            <label>Piezas por pieza (PxP)
              <input type="number" step="0.001" id="f_pzp" />
            </label>
          </div>
          <div style="margin-top:8px">
            <label>Ã“rdenes pendientes
              <select id="sel_op"></select>
            </label>
          </div>
          <div id="img_wrap" style="margin-top:10px;display:none">
            <img id="img_prod" alt="Producto" style="max-width:280px;max-height:180px;border-radius:8px"/>
          </div>
        </div>

        <div class="card">
          <div class="card-title">Pesos</div>
          <div class="weights">
            <div class="wbox gross" style="--bg:#6d28d9">
              <div class="wtitle">Peso Bruto</div>
              <div class="wval"><input type="number" step="0.001" id="w_bruto" value="0"></div>
            </div>
            <div class="wbox tara" style="--bg:#334155">
              <div class="wtitle">Peso Tara</div>
              <div class="wval"><input type="number" step="0.001" id="w_tara" value="0"></div>
            </div>
            <div class="wbox neto" style="--bg:#16a34a">
              <div class="wtitle">Peso Neto del Empaque</div>
              <div class="wval"><input type="number" step="0.001" id="w_neto" value="0" readonly></div>
            </div>
            <div class="wbox piezas" style="--bg:#dc2626">
              <div class="wtitle">Piezas del Empaque</div>
              <div class="wval"><span id="w_pzas">0</span></div>
            </div>
          </div>
          <div class="actions">
            <button class="btn-secondary" id="btn_tarar">Tarar</button>
            <button class="btn-primary" id="btn_registrar">Registrar</button>
            <button class="btn-primary" id="btn_imprimir">Imprimir</button>
            <span id="piezas_state" class="state"></span>
          </div>
        </div>
      </div>
    `;

    // Estilos especÃ­ficos del mÃ³dulo
    if (!document.getElementById('operativo-styles')){
      const st = document.createElement('style');
      st.id = 'operativo-styles';
      st.textContent = `
        .grid2{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        @media (max-width: 1100px){ .grid2{ grid-template-columns:1fr; } }
        .weights{ display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; }
        @media (max-width: 900px){ .weights{ grid-template-columns:1fr 1fr; } }
        .wbox{ background: var(--panel); border:1px solid #2b3440; border-radius:12px; padding:12px; }
        body.light .wbox{ border-color:#e5e7eb; }
        .wtitle{ color:#ccd6f6; font-weight:600; margin-bottom:6px; }
        body.light .wtitle{ color:#111; }
        .wval{ font-size:24px; font-weight:800; color:#fff; }
        body.light .wval{ color:#0b1220; }
        .wbox input{ width:100%; font-size:22px; border-radius:10px; padding:8px 10px; }
        .actions{ margin-top:12px; display:flex; align-items:center; gap:10px; }
        .state{ font-weight:700; }
      `;
      document.head.appendChild(st);
    }

    // Poblar Ã³rdenes
    const sel = document.getElementById('sel_op');
    try {
      const pedidos = await fetchPedidos();
      sel.innerHTML = `<option value="">-- Selecciona --</option>` + (pedidos||[]).map(p => `<option value="${p.id}" data-op="${p.op}">${p.op} - ${(p.producto&&p.producto.nombre)||''}</option>`).join('');
      sel.addEventListener('change', () => {
        const id = sel.value;
        const p = (pedidos||[]).find(x => String(x.id) === String(id));
        if (p) fillFromOrder(p);
      });
    } catch(_) {}

    // QR buscar
    document.getElementById('f_qr')?.addEventListener('change', async (e)=>{
      const v = e.target.value || '';
      const ord = await fetchByQR(v.trim());
      if (ord) fillFromOrder(ord);
    });

    const fld = id => document.getElementById(id);
    function fillFromOrder(o){
      fld('f_op').value = o.op || '';
      fld('f_producto_id').value = (o.producto && o.producto.id) || '';
      fld('f_producto').value = (o.producto && o.producto.nombre) || '';
      fld('f_cliente').value = (o.cliente && o.cliente.nombre) || '';
      fld('f_lote').value = o.lote || '';
      if (o.imagen){
        const img = document.getElementById('img_prod');
        img.src = o.imagen; document.getElementById('img_wrap').style.display = '';
      }
      if (o.piezas != null) fld('f_piezas').value = o.piezas;
      if (o.empaques != null) fld('f_empaques').value = o.empaques;
    }

    // Recalcular neto y estado de piezas
    const wBr = fld('w_bruto');
    const wTa = fld('w_tara');
    const wNe = fld('w_neto');
    const fPzas = fld('f_piezas');
    const fPzp = fld('f_pzp');
    const wPzas = fld('w_pzas');
    const state = fld('piezas_state');
    const update = () => {
      const neto = computeNeto(wBr.value, wTa.value); wNe.value = neto;
      wPzas.textContent = (fPzas.value || '0');
      const ind = piezasIndicator(fPzas.value, fPzp.value);
      if (state){ state.textContent = ind.text; state.style.color = ind.color; }
    };
    wBr.addEventListener('input', update);
    wTa.addEventListener('input', update);
    fPzas.addEventListener('input', update);
    fPzp.addEventListener('input', update);
    update();

    // Tarar => Tara = Bruto actual
    document.getElementById('btn_tarar')?.addEventListener('click', ()=>{
      wTa.value = wBr.value || 0; update();
    });

    // Registrar
    document.getElementById('btn_registrar')?.addEventListener('click', async ()=>{
      const payload = {
        op: fld('f_op').value.trim(),
        producto_id: Number(fld('f_producto_id').value||0) || undefined,
        cliente: { nombre: fld('f_cliente').value },
        lote: fld('f_lote').value,
        categoria: fld('f_categoria').value,
        tamano: fld('f_tamano').value,
        piezas: Number(fld('f_piezas').value||0),
        empaques: Number(fld('f_empaques').value||0),
        pzp: Number(fld('f_pzp').value||0),
        peso_bruto: Number(wBr.value||0),
        peso_tara: Number(wTa.value||0),
        peso_neto: Number(wNe.value||0)
      };
      try{
        await registrar(payload);
        try{ if (window.showAlert) await window.showAlert('Registrado'); }catch(_){ alert('Registrado'); }
      }catch(e){
        alert('No fue posible registrar');
      }
    });

    // Imprimir
    document.getElementById('btn_imprimir')?.addEventListener('click', async ()=>{
      const payload = {
        op: fld('f_op').value.trim(),
        producto: { nombre: fld('f_producto').value },
        cliente: { nombre: fld('f_cliente').value },
        lote: fld('f_lote').value,
        piezas: Number(fld('f_piezas').value||0),
        pzp: Number(fld('f_pzp').value||0),
        neto: Number(fld('w_neto').value||0),
        peso_neto: Number(fld('w_neto').value||0),
      };
      await imprimir(payload);
    });
  }

  // Exponer
  try { window.loadOperativo = loadOperativo; } catch(_) {}
})();

// V2 de interfaz Operativo basada en evidencias/img1.png
(function(){
  async function apiGet(path){ try { return await API.apiGet(path); } catch(_){ return null; } }
  async function apiPost(path, obj){ try { return await API.apiPost(path, obj); } catch(_){ throw _; } }

  function computeNeto(bruto, tara){ const b=Number(bruto||0), t=Number(tara||0); return Math.max(0, +(b - t).toFixed(4)); }
  function piezasIndicator(actual, pzp){ const a=Number(actual||0), target=Number(pzp||0); if(!target) return {color:'#999',text:'Sin objetivo'}; if(a===target) return{color:'#16a34a',text:'Cantidad correcta'}; if(a<target) return{color:'#f59e0b',text:`Faltan ${target-a}`}; return{color:'#dc2626',text:`Exceso ${a-target}`}; }

  async function fetchPedidos(){ return (await apiGet('/operativo/orders')) || []; }
  async function fetchByQR(q){ if(!q) return null; return await apiGet(`/operativo/order_by_qr?qr=${encodeURIComponent(q)}`); }
  async function registrar(payload){ return apiPost('/operativo/registrar', payload); }
  async function imprimir(payload){
    try{
      const res = await apiPost('/operativo/print', payload);
      const html = res && res.html ? res.html : '';
      if (html){ const w = window.open('', '_blank', 'width=600,height=400'); if (w){ w.document.write(html); w.document.close(); } return; }
    }catch(_){ /* fallback abajo */ }
    const w = window.open('', '_blank', 'width=600,height=400');
    if (w){ w.document.write('<!doctype html><meta charset="utf-8"><body onload="window.print();setTimeout(()=>window.close(),300)"><div style="padding:20px;font:14px Arial">Etiqueta generada</div></body>'); w.document.close(); }
  }

  function fmt4(x){ return Number(x||0).toFixed(4); }

  async function loadOperativoV2(){
    const root = document.getElementById('view');
    if (!root) return;
    root.innerHTML = `
      <div class="op-wrap">
        <div class="op-side" aria-hidden="true"><span>CONTEO PIEZAS</span></div>
        <div class="op-main">
          <div class="op-top">
            <div class="op-top-left">
              <div class="sec-title">Ingresar datos</div>
              <label class="qr-row"><span class="lbl">QR</span>
                <input type="text" id="f_qr" autocomplete="off" placeholder="Escanea o escribe QR" />
              </label>
            </div>
            <div class="op-top-right">
              <div class="user-chip" id="opUserChip" title="Usuario">
                <div class="avatar" aria-hidden="true">ðŸ‘¤</div>
                <div class="uname" id="opUserName"></div>
              </div>
              <button class="btn-exit" id="opExit">Salir</button>
            </div>
          </div>
          <div class="op-form">
            <div class="sec-title">Datos producto</div>
            <input type="text" id="f_op" class="hidden" aria-hidden="true" />
            <div class="fields">
              <label>Id producto<input type="number" id="f_producto_id" /></label>
              <label>Piezas<input type="number" step="0.001" id="f_piezas" /></label>
              <label>Producto<input type="text" id="f_producto" /></label>
              <label>Empaques<input type="number" id="f_empaques" /></label>
              <label>Cliente<input type="text" id="f_cliente" /></label>
              <label>P x P<input type="number" step="0.001" id="f_pzp" /></label>
              <label>Lote<input type="text" id="f_lote" /></label>
              <label>Categoria<input type="text" id="f_categoria" /></label>
              <label>Terminado<input type="text" id="f_terminado" /></label>
              <label>Tamano<input type="text" id="f_tamano" /></label>
            </div>
            <div class="pend-wrap"><label>Ordenes pendientes <select id="sel_op"></select></label></div>
          </div>
          <div class="op-bottom">
            <div class="tile gross"><div class="t-head">Peso Bruto</div><div class="t-val"><input type="number" step="0.0001" id="w_bruto" value="0.0000"></div><div class="units">kg</div></div>
            <div class="tile neto"><div class="t-head">Peso Neto Emp.</div><div class="t-val"><input type="number" step="0.0001" id="w_neto" value="0.0000" readonly></div><div class="units">kg</div></div>
            <div class="tile pieces"><div class="t-head">Piezas del Empaque</div><div class="t-val"><span id="w_pzas">00000</span></div></div>
            <div class="tile tara"><div class="t-head">Peso Tara</div><div class="t-val"><input type="number" step="0.0001" id="w_tara" value="0.0000"></div></div>
            <div class="act-col">
              <button class="btn-tare" id="btn_tarar">Tarar</button>
              <button class="btn-save" id="btn_registrar">Registrar</button>
              <button class="btn-print" id="btn_imprimir">Imprimir</button>
              <div id="piezas_state" class="pstate"></div>
            </div>
          </div>
        </div>
      </div>`;

    if (!document.getElementById('operativo-styles')){
      const st = document.createElement('style'); st.id = 'operativo-styles'; st.textContent = `
        .hidden{display:none}
        .op-wrap{ display:flex; background:#d9dde4; border:1px solid #b8bcc4; border-radius:8px; min-height:560px; }
        .op-side{ width:84px; background:#6cb25a; color:#fff; display:flex; align-items:center; justify-content:center; border-top-left-radius:8px; border-bottom-left-radius:8px; }
        .op-side span{ writing-mode:vertical-rl; transform: rotate(180deg); font-weight:800; letter-spacing:1px; }
        .op-main{ flex:1; padding:12px 14px; }
        .sec-title{ color:#5a6b80; font-weight:700; font-size:12px; margin:2px 0 6px; }
        .op-top{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
        .op-top-left{ flex:1; }
        .qr-row{ display:grid; grid-template-columns: 40px 1fr; gap:8px; align-items:center; }
        .qr-row .lbl{ color:#2b3748; font-weight:600; }
        .op-top-right{ display:flex; align-items:center; gap:10px; }
        .user-chip{ display:flex; align-items:center; gap:8px; background:#e7ebf1; border:1px solid #c9ced6; border-radius:8px; padding:6px 10px; }
        .user-chip .avatar{ width:28px; height:28px; border-radius:50%; background:#d1d7e1; display:flex; align-items:center; justify-content:center; }
        .user-chip .uname{ font-weight:600; color:#3b4a5e; }
        .btn-exit{ background:#c0392b; color:#fff; border:none; border-radius:8px; padding:8px 14px; font-weight:700; cursor:pointer; }
        .op-form{ margin-top:8px; background:#eef2f7; border:1px solid #c9ced6; border-radius:8px; padding:10px; }
        /* Dos columnas: izquierda flexible, derecha fija (como evidencia) */
        .fields{ display:grid; grid-template-columns: 1fr 1fr; column-gap:14px; row-gap:8px; }
        .fields label{ display:flex; flex-direction:column; font-size:14px; color:#2f3b4b; }
        /* Alinear tamaÃ±os: todos los inputs ocupan el 100% del ancho de su columna */
        .fields input{ width:100%; box-sizing:border-box; margin-top:4px; background:#fff; border:1px solid #bfc5cf; border-radius:6px; padding:8px 10px; height:36px; }
        /* Enforce pairing por filas: campo amplio + campo corto */
        .fields label:nth-child(odd){ grid-column:1; }
        .fields label:nth-child(even){ grid-column:2; }
        .pend-wrap{ margin-top:8px; }
        .op-bottom{ display:grid; grid-template-columns: 1.1fr 1.1fr 1fr 180px; grid-auto-rows: 140px; gap:12px; margin-top:12px; align-items:stretch; }
        .tile{ position:relative; border-radius:8px; padding:10px; display:flex; flex-direction:column; justify-content:center; }
        .tile .t-head{ color:#e0e8ff; font-weight:700; margin-bottom:6px; }
        .tile .t-val{ font-family: Consolas, 'Courier New', monospace; font-size:40px; font-weight:800; letter-spacing:1px; color:#ffffff; text-shadow: 0 0 6px rgba(0,0,0,.25); }
        .tile .t-val input{ width:100%; font: inherit; color:inherit; background:transparent; border:none; outline:none; text-align:left; }
        .tile .units{ position:absolute; right:10px; bottom:10px; color:#e0e8ff; font-weight:700; }
        .tile.gross{ background:#3d2a64; }
        .tile.neto{ background:#0b3f1b; }
        .tile.pieces{ background:#350e0e; }
        .tile.tara{ background:#2a303b; grid-column: 1 / 2; grid-row: 2; height:110px; }
        .tile.pieces .t-val{ color:#ff4d4d; }
        .tile.neto .t-val{ color:#66ff66; }
        .tile.gross .t-val{ color:#d09cff; }
        .act-col{ display:flex; flex-direction:column; gap:10px; }
        .btn-tare{ background:#4ea9f5; color:#fff; border:none; border-radius:8px; padding:12px 10px; font-weight:700; cursor:pointer; }
        .btn-save{ background:#2ecc71; color:#fff; border:none; border-radius:8px; padding:12px 10px; font-weight:700; cursor:pointer; }
        .btn-print{ background:#f1c40f; color:#000; border:none; border-radius:8px; padding:12px 10px; font-weight:700; cursor:pointer; }
        .pstate{ font-weight:700; text-align:center; margin-top:4px; }
        @media (max-width: 1100px){ .op-bottom{ grid-template-columns: 1fr; grid-auto-rows:auto; } .tile.tara{ grid-row:auto; height:auto; } .act-col{ flex-direction:row; } }
      `; document.head.appendChild(st);
    }

    // Llenado de Ã³rdenes
    const sel = document.getElementById('sel_op');
    try { const pedidos = await fetchPedidos(); sel.innerHTML = `<option value="">-- Selecciona --</option>` + (pedidos||[]).map(p => `<option value="${p.id}" data-op="${p.op}">${p.op} - ${(p.producto&&p.producto.nombre)||''}</option>`).join(''); sel.addEventListener('change', ()=>{ const id=sel.value; const p=(pedidos||[]).find(x=>String(x.id)===String(id)); if(p) fillFromOrder(p); }); } catch(_){ }

    // Cargar usuario y botÃ³n Salir
    try{ const u = JSON.parse(localStorage.getItem('usuario')||'{}'); const label = [u.id, u.nombre].filter(Boolean).join(' - '); const el = document.getElementById('opUserName'); if (el) el.textContent = label || ''; }catch(_){ }
    document.getElementById('opExit')?.addEventListener('click', ()=>{ try { localStorage.removeItem('token'); localStorage.removeItem('usuario'); } catch(_){} window.location.href = 'index.html'; });

    // Buscar por QR
    document.getElementById('f_qr')?.addEventListener('change', async (e)=>{ const v=e.target.value||''; const ord = await fetchByQR(v.trim()); if (ord) fillFromOrder(ord); });

    const fld = id => document.getElementById(id);
    function fillFromOrder(o){ try{
      fld('f_op').value = o.op || '';
      fld('f_producto_id').value = (o.producto && o.producto.id) || '';
      fld('f_producto').value = (o.producto && o.producto.nombre) || '';
      fld('f_cliente').value = (o.cliente && o.cliente.nombre) || '';
      fld('f_lote').value = o.lote || '';
      if (o.piezas != null) fld('f_piezas').value = o.piezas;
      if (o.empaques != null) fld('f_empaques').value = o.empaques;
    }catch(_){} }

    // Pesos y estado
    const wBr = fld('w_bruto'); const wTa = fld('w_tara'); const wNe = fld('w_neto'); const fPzas = fld('f_piezas'); const fPzp = fld('f_pzp'); const wPzas = fld('w_pzas'); const state = fld('piezas_state');
    const update = () => { const neto = computeNeto(wBr.value, wTa.value); wNe.value = fmt4(neto); wBr.value = fmt4(wBr.value); wTa.value = fmt4(wTa.value); wPzas.textContent = String(fPzas.value || '0').padStart(5,'0'); const ind = piezasIndicator(fPzas.value, fPzp.value); if (state){ state.textContent = ind.text; state.style.color = ind.color; } };
    wBr.addEventListener('input', update); wTa.addEventListener('input', update); fPzas.addEventListener('input', update); fPzp.addEventListener('input', update); update();

    // Botones
    document.getElementById('btn_tarar')?.addEventListener('click', ()=>{ wTa.value = wBr.value || 0; update(); });
    document.getElementById('btn_registrar')?.addEventListener('click', async ()=>{
      const payload = { op: fld('f_op').value.trim(), producto_id: Number(fld('f_producto_id').value||0) || undefined, cliente:{ nombre: fld('f_cliente').value }, lote: fld('f_lote').value, categoria: fld('f_categoria').value, tamano: fld('f_tamano').value, piezas: Number(fld('f_piezas').value||0), empaques: Number(fld('f_empaques').value||0), pzp: Number(fld('f_pzp').value||0), peso_bruto: Number(wBr.value||0), peso_tara: Number(wTa.value||0), peso_neto: Number(wNe.value||0) };
      try{ await registrar(payload); try{ if (window.showAlert) await window.showAlert('Registrado'); }catch(_){ alert('Registrado'); } }catch(e){ alert('No fue posible registrar'); }
    });
    document.getElementById('btn_imprimir')?.addEventListener('click', async ()=>{
      const payload = { op: fld('f_op').value.trim(), producto: { nombre: fld('f_producto').value }, cliente: { nombre: fld('f_cliente').value }, lote: fld('f_lote').value, piezas: Number(fld('f_piezas').value||0), pzp: Number(fld('f_pzp').value||0), neto: Number(fld('w_neto').value||0), peso_neto: Number(fld('w_neto').value||0) };
      await imprimir(payload);
    });
  }

  try { window.loadOperativo = loadOperativoV2; } catch(_) {}
})();
