Sistema Administrativo - Backend (Flask)

Estructura principal del API REST con Flask y SQLAlchemy.

Ejecutar (desarrollo):
- Crear entorno virtual y `pip install -r requirements.txt`.
- Establecer variables de entorno si es necesario (ver `config.py`).
- `python app.py`

Notas:
- Base de datos por defecto SQLite (`sistema.db`). Cambiar a MySQL/PostgreSQL con la URL en `DATABASE_URL`.
- Rutas bajo prefijo `/api`.
- Autenticación por token (JWT-like usando `itsdangerous`).


