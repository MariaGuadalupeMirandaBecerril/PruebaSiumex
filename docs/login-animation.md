# Login Animation (SIAUMex Mascot)

Este proyecto usa frontend estático (vanilla HTML/CSS/JS). Se añadió una animación ligera tipo “story” para el login, inspirada en `evidencias/diseño.png`.

## Qué se agregó
- `frontend/css/login_mascot.css`: estilos premium (fondo con gradientes, glassmorphism en el card y animaciones CSS por transform/opacity).
- `frontend/js/login_mascot.js`: componente/máquina de estados (intro → idle → loading) y reacciones a focus/submit/error.
- `frontend/img/siaumex_head.svg`: cabeza (símbolo SIAUMEX) en SVG.
- `frontend/img/astronaut_body.svg`: cuerpo minimalista del astronauta en SVG.
- Integración: `frontend/index.html` referencia el CSS/JS nuevos y `auth.js` es cargado explícitamente.

No se modificó la lógica de endpoints; se envuelven las llamadas a `API.apiPost('/auth/login', ...)` para disparar eventos de UI.

## Estados y timeline
- 0–900ms: `walkIn` (entra desde la izquierda)
- 900–1200ms: `arrive` (detiene)
- 1200–1800ms: `sitDown`
- 1800–2300ms: `headDrop` (cabeza encaja)
- 2300ms+: `idleFloat` (loop sutil)

Si `prefers-reduced-motion: reduce` está activo, se desactivan las animaciones y queda un layout estático.

## Interacciones
- Focus en Correo: clase `login-focus-email` → leve tilt + glow azul en la cabeza.
- Focus en Contraseña: clase `login-focus-pass` → tilt contrario + glow magenta.
- Submit/login: se despacha `login:loading`, se muestra spinner en el botón y un loop de “typing” (manos). Si error, el `card` hace `shake` y se dispara `login:error`. En éxito se lanza `login:success` y se mantiene el flujo original de redirección.

## Ajustes comunes
- Tiempos: en `frontend/css/login_mascot.css`, `animation` de `.mascot.play` (delays y duraciones).
- SVG del logo/cabeza: reemplazar `frontend/img/siaumex_head.svg` (mantener `viewBox` similar para encaje).
- Activar/desactivar partículas: regla `.login-visual::before` en el mismo CSS. Puedes comentar esa regla para desactivar.
- Colores: variables `--login-glow` y `--login-pink`.

## Notas de rendimiento
- Solo `transform`/`opacity`; sin layout thrashing.
- Sin videos ni Lottie. SVGs simples y estáticos.
- Respeta `prefers-reduced-motion`.

## Extensión opcional
Si el proyecto adopta una librería de motion (p.ej. `motion` ya referenciado), se puede migrar la secuencia a JS declarativo. La estructura actual facilita esa migración (señales por clases/estados).
