// Vista de Ayuda (manual interno)
function loadHelp(){
  const container = document.getElementById('view');
  if (!container) return;
  try { window.__currentView = 'help'; } catch(_) {}
  document.title = 'Ayuda - Sistema Administrativo';
  container.innerHTML = `
    <div class="card" style="padding:16px;">
      <h2 style="margin:0 0 8px 0;">Manual de Usuario</h2>
      <p style="color:var(--muted); margin-top:4px;">Guía rápida del sistema.</p>
      <div class="form-grid" style="grid-template-columns: 1fr; gap:12px; margin-top:12px;">
        <section class="card" style="padding:12px;">
          <h3>Panel</h3>
          <p>Resumen de indicadores y accesos rápidos.</p>
        </section>
        <section class="card" style="padding:12px;">
          <h3>Catálogos</h3>
          <p>Administra entidades base como clientes y productos. Usa el botón “Nuevo” para crear y el ícono de lápiz para editar.</p>
        </section>
        <section class="card" style="padding:12px;">
          <h3>Producción</h3>
          <p>Registra y consulta órdenes y procesos. Filtra resultados con la barra superior.</p>
        </section>
        <section class="card" style="padding:12px;">
          <h3>Reportes</h3>
          <p>Genera reportes por periodo. Exporta usando el botón correspondiente.</p>
        </section>
        <section class="card" style="padding:12px;">
          <h3>Consejos</h3>
          <ul>
            <li>Usa la barra izquierda para navegar.</li>
            <li>El botón sol/luna cambia el tema.</li>
            <li>Puedes contraer la barra lateral con el botón de la parte superior.</li>
          </ul>
        </section>
      </div>
    </div>
  `;
}

