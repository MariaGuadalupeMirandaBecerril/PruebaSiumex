Modo demo (sin base de datos)

Para validar flujos de login y del módulo Operativo sin conectarse a MSSQL, puedes activar un modo de desarrollo con datos y autenticación simulados.

Cómo activarlo
- Define la variable de entorno `DEV_FAKE_AUTH=1` antes de iniciar el servidor.
- Inicia con `npm start`.

Login de prueba
- Usuario: `admin` (cualquier contraseña) → rol Administrador; ve todo el panel.
- Usuario: `operador` (cualquier contraseña) → rol Operador; ve solo “Operativo” y “Reportes”.

Qué queda simulado
- Autenticación: se emite un JWT sin consultar la BD y el middleware acepta el token y compone `req.user` desde el payload.
- Operativo:
  - `GET /api/operativo/orders` devuelve una lista fija de órdenes demo.
  - `GET /api/operativo/order_by_qr?qr=OP-001` busca en el arreglo demo.
  - `POST /api/operativo/registrar` responde éxito sin tocar BD.
  - `POST /api/operativo/print` funciona igual (no requiere BD).

Desactivar
- Quita `DEV_FAKE_AUTH` del entorno (o ponlo en `0/false`) para usar la BD real.

