Sistema Administrativo - Backend (Flask)

Estructura principal del API REST con Flask y SQLAlchemy.

Ejecutar (desarrollo):
- Crear entorno virtual y `pip install -r requirements.txt`.
- Establecer variables de entorno si es necesario (ver `config.py`).
- `python app.py`

Notas:
- Base de datos soportada: SQL Server (SOConteo). No hay fallback a SQLite.
- Configure `DATABASE_URL` con un string SQLAlchemy, por ejemplo:
  - `mssql+pyodbc://usuario:password@SERVIDOR/NombreBD?driver=ODBC+Driver+17+for+SQL+Server`
  - Requiere `pyodbc` y un driver ODBC instalado en el sistema.
- En este repo se incluye un backup `SOConteo.bak`. Para restaurarlo:
  1) En SQL Server Management Studio: Restore Database > From Device > seleccione `SOConteo.bak`.
  2) Ajuste el nombre de la base y rutas de archivos si es necesario.
  3) Configure `DATABASE_URL` apuntando a esa base.
- Rutas bajo prefijo `/api`.
- AutenticaciÃ³n por token (JWT-like usando `itsdangerous`).
- Endpoints nuevos/ajustados segÃºn requerimientos:
  - `GET /api/dashboard/summary` resumen para tarjetas y grÃ¡fica.
  - Alias de ProducciÃ³n: `GET/POST /api/production` y `PUT/DELETE /api/production/<id>`.
  - CRUD de Proveedores en `/api/providers`.
  - Ping de BD: `GET /api/db/ping` para verificar conexiÃ³n y dialecto.

ConfiguraciÃ³n por .env:
- Copie `.env.example` a `.env` y ajuste:
  - `DATABASE_URL` a su servidor SQL Server restaurado desde `SOConteo.bak`.
  - Variables `MSSQL_*` con nombres reales de sus tablas/columnas. Si estÃ¡n presentes y se usa SQL Server, el Dashboard usarÃ¡ consultas nativas a esas tablas.


