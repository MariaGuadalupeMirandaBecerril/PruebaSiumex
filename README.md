Sistema Administrativo — Backend Node

Visión general
- Backend API REST ahora en Node.js (Express + mssql), totalmente funcional y sin dependencias del backend Flask.
- Frontend estático (HTML/CSS/JS) servido por Node en `/`.
- Archivos subidos servidos desde `/uploads/` (directorio `backend/uploads`).

Estructura
- `node-backend/`: servidor y rutas de la API
  - `server.js`: arranque del servidor, estáticos y registro de routers
  - `db.js`: conexión MSSQL (lee `DATABASE_URL` o variables `DB_*`)
  - `auth-mw.js`: middleware de autenticación JWT
  - `routes/*.js`: módulos de rutas (auth, users, clients, products, providers, stations, operators, variables, company, processes, operativo, inventory, reports, dashboard, db, export, maintenance)
  - `utils/pdf.js`: generador de PDF ligero para exportación
- `frontend/`: interfaz estática
- `backend/`: solo utilizado para `.env` y `uploads/`
  - `backend/.env`: variables de entorno compartidas (Node las carga)
  - `backend/uploads/`: destino de archivos subidos
  - `backend/instance/`: artefactos locales (si existen); no son requeridos por Node
- `docs/NODE.md`: guía de uso del backend Node
- `package.json`: scripts de ejecución

Requisitos
- Node.js 18+
- Microsoft SQL Server accesible (BD objetivo: `SOConteo`)

Configuración
- Node carga variables desde `backend/.env`.
- Autenticación
  - `SECRET_KEY`: clave para firmar JWT
  - `TOKEN_EXP_MINUTES`: minutos de validez del token (ej. `120`)
- MSSQL (dos opciones)
  1) `DATABASE_URL` estilo SQLAlchemy con `odbc_connect`, por ejemplo:
     `mssql+pyodbc:///?odbc_connect=Driver%3DODBC+Driver+17+for+SQL+Server%3BServer%3DHOST%5CSQLEXPRESS%3BDatabase%3DSOConteo%3BTrusted_Connection%3DYes%3B`
  2) Variables `DB_*`:
     - `DB_HOST` (puede incluir instancia `HOST\SQLEXPRESS`)
     - `DB_NAME`, `DB_USER`, `DB_PASS`
     - `DB_TRUSTED` (1 para autenticación integrada)
     - `DB_ENCRYPT` (true/false), `DB_TRUST_CERT` (true/false), `DB_TIMEOUT` (ms)
 

Ejecución
- Desarrollo / estándar
  - `npm run start` (o `npm run start:node`)
  - Puerto configurable por `PORT` o `NODE_PORT` (por defecto 5001)
 

Rutas clave
- Salud: `GET /health`
- Base API: `/api`
- Autenticación: `POST /api/auth/register`, `POST /api/auth/login`
- Usuarios: CRUD y `PUT /api/profile`
- Catálogos: clientes, productos, proveedores, estaciones, operadores (CRUD)
- Procesos/Operativo: CRUD y flujos relacionados (incluye búsquedas por `op`/QR)
- Variables/Empresa: GET/PUT, `POST /api/company/logo`
- Reportes/Dashboard: `GET /api/reports/*`, `GET /api/dashboard/summary`
- Exportaciones: `GET /api/export/csv`, `GET /api/export/excel`, `GET /api/export/pdf`
- DB utilidades: `GET /api/db/ping`, `GET /api/db/tables`, `GET /api/db/peek`, `GET /api/db/auto-map`
- Mantenimiento: `GET /api/maintenance/procesos/peek`, `POST /api/maintenance/procesos/ensure-relations`, `POST /api/maintenance/procesos/seed-relations`

Estáticos
- UI: `/` sirve `frontend/`
- Subidas: `/uploads/` sirve `backend/uploads`

Notas de migración
- El backend Flask fue retirado del repositorio. La API se ejecuta íntegramente en Node.
 
