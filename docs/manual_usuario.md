# Manual de Usuario Interno

Bienvenido al Sistema Administrativo. Este manual presenta una guía visual y práctica para usar la aplicación día a día.

## Índice rápido
- Inicio de sesión
- Panel (gráficas y KPIs)
- Inventario (registro y consulta)
- Producción (órdenes/procesos)
- Catálogos: Productos y Clientes
- Reportes (tabla y exportación)
- Usuarios, Estaciones y Variables
- Perfil y foto
- Búsqueda y filtros
- Preguntas frecuentes

---

## Inicio de sesión
1) Abra la URL del sistema y autentíquese con su usuario y contraseña.
2) Si olvida su contraseña, contacte al administrador.

Referencia visual: docs/img/login.png

## Panel (gráficas y KPIs)
- Encabezado con título y subtítulo.
- Tarjetas KPI: Registros, Clientes, Productos.
- Gráficas:
  - Productos pesados por día (línea): suma de Peso por Fecha. Referencia: docs/img/panel_line.png
  - Top 5 clientes por órdenes (pastel). Referencia: docs/img/panel_pie.png
  - Top 5 productos más utilizados (barras). Referencia: docs/img/panel_bar.png

Tips
- Haga clic en una gráfica para ampliarla.
- Use el hash ?panel=line/pie/bar para ir directo a una sección (ej. …/app.html?panel=line).

## Inventario (registro y consulta)
- Vista de tabla con columnas del inventario (OP, IdClie, IdProd, Pzas, Peso, Fecha, etc.).
- Crear/editar: complete Fecha, Descripción, Cantidad (o Peso), Producto y Cliente.
- Filtros rápidos por fecha, texto o código OP.

Referencias visuales: docs/img/inventario_listado.png, docs/img/inventario_form.png

Buenas prácticas
- Use separador decimal con punto o coma; el sistema lo normaliza.
- Verifique Producto/Cliente correctos antes de guardar.

## Producción (órdenes/procesos)
- Alta de procesos por OP, Cliente, Producto y variables.
- Cada registro puede incluir imagen (vista previa y zoom).

Referencias: docs/img/produccion_listado.png, docs/img/produccion_form.png

## Catálogos: Productos y Clientes
- Productos: nombre, variables, imagen opcional.
- Clientes: datos básicos, búsqueda y paginación.

Referencias: docs/img/productos.png, docs/img/clientes.png

## Reportes (tabla y exportación)
- Reporte de Inventario respeta columnas de dbo.Inventario.
- Exportar: botones “Exportar PDF/Excel”.

Referencias: docs/img/reportes.png

## Usuarios, Estaciones y Variables
- Usuarios: gestión de operadores y administradores.
- Estaciones: altas/ediciones (si aplica a su operación).
- Variables/Empresa: datos de empresa, logos e imagen corporativa.

Referencias: docs/img/usuarios.png, docs/img/estaciones.png, docs/img/empresa.png

## Perfil y foto
- Sección Perfil para ver/editar datos propios y fotografía.
- Soporta vista previa y recarga inmediata en la interfaz.

Referencias: docs/img/perfil.png

## Búsqueda y filtros
- Búsqueda contextual por texto en listados.
- Filtros por fecha y por OP (parámetro ?mr= en reportes de inventario).

## Preguntas frecuentes
- ¿Qué mide la primera gráfica?
  - “Productos pesados por día”: suma de la columna Peso, agrupada por Fecha, tomada de /reports/inventory.
- ¿Puedo ver piezas en lugar de peso?
  - Sí, ajuste se puede realizar bajo solicitud (Pzas por Fecha).
- ¿Cómo exporto el inventario?
  - Botones Exportar PDF/Excel en la vista de Reportes de Inventario.

---

Notas
- Este manual referencia imágenes en docs/img/. Coloque ahí las capturas con los nombres indicados.
- Si su despliegue personaliza campos o columnas, actualice las capturas y esta guía en consecuencia.
