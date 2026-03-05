Backend Node (Migracion)

Resumen
- El backend Node en `node-backend/` implementa todas las rutas de la API.
- Todo corre en Node (sin proxy a Flask).

Ejecucion
- `npm run start` o `npm run start:node` (usa `PORT`/`NODE_PORT`, por defecto 5001).

Rutas y estaticos
- API base: `/api`.
- Salud: `/health`.
- UI estatica: `/` (sirve `frontend/`).
- Subidas: `/uploads/` (directorio `backend/uploads`).

Configuracion
- Reutiliza `backend/.env`.
- Autenticacion: `SECRET_KEY`, `TOKEN_EXP_MINUTES`.
- Base de datos MSSQL: `DATABASE_URL` (estilo SQLAlchemy con `odbc_connect`) o variables `DB_*` (`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_TRUSTED`, `DB_ENCRYPT`, `DB_TRUST_CERT`, `DB_TIMEOUT`).

Cobertura de rutas en Node
- Auth (login/register), Users (CRUD + perfil), Clients, Products, Providers, Stations, Operators, Variables, Company (incluye logo), Processes, Operativo, Inventory, Reports, Dashboard, DB, Export (CSV/Excel/PDF), Maintenance.

Export PDF
- Implementacion nativa ligera (texto tabular). Si se requiere un PDF mas elaborado, se puede integrar una libreria (por ejemplo, `pdfkit`) bajo aprobacion.
