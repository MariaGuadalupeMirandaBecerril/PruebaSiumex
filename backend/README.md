Sistema Administrativo - Backend (Flask)

Estructura principal del API REST con Flask y SQLAlchemy.

Ejecutar (desarrollo):
- Crear entorno virtual y `pip install -r requirements.txt`.
- Establecer variables de entorno si es necesario (ver `config.py`).
- `python app.py`

Notas:
- Base de datos por defecto SQLite (`sistema.db`). Para usar SQL Server, establezca `DATABASE_URL` con un string SQLAlchemy, por ejemplo:
  - `mssql+pyodbc://usuario:password@SERVIDOR/NombreBD?driver=ODBC+Driver+17+for+SQL+Server`
  - Requiere `pyodbc` y un driver ODBC instalado en el sistema.
- En este repo se incluye un backup `SOConteo.bak`. Para restaurarlo:
  1) En SQL Server Management Studio: Restore Database > From Device > seleccione `SOConteo.bak`.
  2) Ajuste el nombre de la base y rutas de archivos si es necesario.
  3) Configure `DATABASE_URL` apuntando a esa base.
- Rutas bajo prefijo `/api`.
- Autenticación por token (JWT-like usando `itsdangerous`).
- Endpoints nuevos/ajustados según requerimientos:
  - `GET /api/dashboard/summary` resumen para tarjetas y gráfica.
  - Alias de Producción: `GET/POST /api/production` y `PUT/DELETE /api/production/<id>`.
  - CRUD de Proveedores en `/api/providers`.
  - Ping de BD: `GET /api/db/ping` para verificar conexión y dialecto.

Configuración por .env:
- Copie `.env.example` a `.env` y ajuste:
  - `DATABASE_URL` a su servidor SQL Server restaurado desde `SOConteo.bak`.
  - Variables `MSSQL_*` con nombres reales de sus tablas/columnas. Si están presentes y se usa SQL Server, el Dashboard usará consultas nativas a esas tablas.
