# Guía de UI (Design System)

Objetivo: definir tokens, componentes base y patrones de interacción para mantener una UI moderna, consistente, accesible y rápida.

## Tokens

Definidos en `frontend/css/ui.css` y consumidos por `styles.css`/componentes:

- Colores: `--color-bg`, `--color-panel`, `--color-text`, `--color-muted`, `--color-accent`
- Radios: `--radius-sm`, `--radius-md`, `--radius-lg`
- Sombras: `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- Espaciado: `--space-1..6`

Modo claro: activado con `body.light` (persistido en `localStorage['theme']`).

## Componentes base

- Button: `.btn`, variantes `.btn-primary`, `.btn-secondary`, `.btn-danger`. Estado `.loading` agrega spinner.
- Card: `.card` para contenedores con sombra sutil y bordes redondeados.
- Input: `.input` utilitaria (el sistema también estiliza `input/textarea/select` por defecto).
- Badge: `.badge` + `.success|.info|.warning|.danger` para estados.
- Modal: ya existente (estructura en `app.html` y estilos en `styles.css`).
- Table: usar `div.table-wrap` + `table` (estilo “pretty” opcional con sticky header).
- Toast: funciones `centerToast`, `showAlert`, `showConfirm` en `frontend/js/ui.js`.

## Patrones de estados

- Loading (esqueleto): usar marcado generado por `skeletonTableHTML(cols, rows)` durante cargas de listados. `ui.js` lo aplica automáticamente en las vistas genéricas.
- Empty state: insertar `emptyStateHTML('Sin datos', 'Mensaje')` o añadir un `<div class="empty-state">` manual.
- Error: usar `showAlert(msg)` o `showCenterAlert(msg)`.
- Success: `centerToast('Guardado', 'success')`.

## Navegación y tema

- Toggle de tema: botón `#themeToggle` en `app.html`. La clase `body.light` se alterna y se persiste.
- Sidebar colapsable: `#toggleSidebar` ya implementado en `ui.js`.

## Rendimiento

- Skeletons reducen la percepción de espera.
- Evitar imágenes pesadas; preferir SVG o `img` optimizadas con `loading="lazy"`.
- Debounce en búsquedas y filtros (implementar al usar inputs).
- Evitar re-renders: actualizar solo nodos necesarios en vistas.

## Accesibilidad

- Contraste alto por defecto; focus visibles en inputs y botones.
- `aria-*` en modales y menús ya aplicado.

## Uso rápido (ejemplos)

Botón primario con loading:

```html
<button class="btn btn-primary loading">Guardar</button>
```

Badge de estado:

```html
<span class="badge success">Activo</span>
```

Card:

```html
<div class="card">
  <div class="card-title">Ventas</div>
  <div class="card-value">$ 12,400</div>
  <div class="skeleton skeleton-line w-50"></div>
  <div class="skeleton skeleton-line w-75"></div>
  <div class="skeleton skeleton-line w-25"></div>
  <!-- Reemplazar skeletons con contenido real al cargar -->
  
```

Tabla con skeleton (marcado generado):

```html
<div class="table-skeleton" style="--cols:5">
  <div class="row">
    <div class="th"><div class="skeleton skeleton-line w-50"></div></div>
    ...
  </div>
  <!-- filas -->
</div>
```

Empty state:

```html
<div class="empty-state">
  <div class="title">Sin datos</div>
  <div>No se encontraron registros.</div>
</div>
```

## Notas

- Mantener rutas y contratos de API. Los cambios son puramente de presentación.
- Reutilizar componentes y tokens para consistencia y mantenimiento.

