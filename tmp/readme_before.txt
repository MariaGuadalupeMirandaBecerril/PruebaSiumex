Objetivo: unificar el esquema de SQL Server (SOConteo) con los modelos del proyecto y migrar todos los datos desde SQLite.

Prerrequisitos
- Tener restaurada la base SOConteo (ver `scripts/restore_from_bak.sql`).
- Tener conectividad a SQL Server desde este equipo.
- Tener instalado el driver ODBC de SQL Server (por ejemplo, ODBC Driver 17 o 18).
- Tener Python 3.9+ con `sqlalchemy` y `pyodbc` instalados.

Variables de conexión
- Puede usarse `DATABASE_URL` (recomendado) en formato:
  `mssql+pyodbc://USER:PASS@HOST/SOConteo?driver=ODBC+Driver+17+for+SQL+Server`
- Alternativamente, exportar `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME` (y opcional `DB_DRIVER`).
- Autenticación integrada (Windows):
  - `mssql+pyodbc://@HOST\\INSTANCIA/SOConteo?driver=ODBC+Driver+17+for+SQL+Server&Trusted_Connection=yes`
  - Si el usuario de Windows no tiene permisos sobre SOConteo, ejecutar `scripts/grant_windows_user.sql` en SSMS ajustando el principal `DESKTOP-XXX\\Usuario`.

1) Sincronizar esquema en SQL Server
- Ejecutar el script T-SQL en SOConteo (idempotente, no borra nada):
  - Desde SSMS: abrir `scripts/mssql_schema_sync.sql` y ejecutar sobre la base `SOConteo`.
  - Con `sqlcmd` (opcional):
    `sqlcmd -S <SERVIDOR> -d SOConteo -E -i scripts\mssql_schema_sync.sql`

2) Migrar datos desde SQLite a SQL Server
- Asegurar que el origen existe en `backend/instance/sistema.db` (o especificar otro path).
- Ejecutar:
  `python scripts/migrate_sqlite_to_mssql.py --sqlite backend/instance/sistema.db --url "mssql+pyodbc://USER:PASS@HOST/SOConteo?driver=ODBC+Driver+17+for+SQL+Server"`
- Si no se pasa `--url`, el script intentará construirla de `DB_*`/`DATABASE_URL`.

Notas de idempotencia
- Los catálogos hacen upsert por llaves naturales:
  - usuarios: correo
  - productos: idprod
  - clientes: idclie
  - estaciones: idest
  - proveedores: idprov
  - permarekel: nombre
  - empresa/variables: primera fila
- procesos: upsert por `op` y remapea FKs por (idclie, idprod)
- inventario: upsert por (fecha, codigo_mr, descripcion, producto_id, cliente_id) remapeando FKs por (idclie, idprod)

3) Verificación post-migración
- Conteos básicos en SOConteo:
  - `SELECT COUNT(*) FROM dbo.usuarios;`
  - `SELECT COUNT(*) FROM dbo.productos;`
  - `SELECT COUNT(*) FROM dbo.clientes;`
  - `SELECT COUNT(*) FROM dbo.procesos;`
  - `SELECT COUNT(*) FROM dbo.inventario;`
- Probar login contra API (usar un usuario con correo/password existente en SQLite):
  - `POST /api/auth/login` con `{ "correo": "...", "password": "..." }`

4) Forzar uso de SQL Server en el backend
- El backend ya no tiene fallback a SQLite. Si no define `DATABASE_URL` o variables `DB_*` válidas para SQL Server, fallará al iniciar.

Solución de problemas
- Error de driver: instalar el controlador ODBC que indique el mensaje y ajustar `DB_DRIVER`.
- Conflictos de llaves: el script hace upserts por llaves naturales; revise duplicados en origen.
- FKs al migrar procesos/inventario: asegúrese de que productos y clientes del origen existan en destino (el script los sincroniza primero).

