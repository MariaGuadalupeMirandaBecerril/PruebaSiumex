#!/usr/bin/env python3
"""
Migración de datos desde SQLite (backend/instance/sistema.db) a SQL Server (SOConteo)

Idempotente: hace upsert por llaves naturales.
No borra datos. Mantiene integridad referencial.

Uso:
  python scripts/migrate_sqlite_to_mssql.py \
      --sqlite backend/instance/sistema.db \
      --url "mssql+pyodbc://USER:PASS@HOST/SOConteo?driver=ODBC+Driver+17+for+SQL+Server"

Si --url no se pasa, intenta construirlo de variables de entorno DB_* como en backend/config.py
"""
from __future__ import annotations

import argparse
import os
from typing import Any, Dict, Optional, Tuple
from datetime import datetime, date

from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import hashlib
from sqlalchemy.engine import Engine, Row


def build_mssql_url_from_env() -> Optional[str]:
    url = os.getenv("DATABASE_URL")
    if url:
        return url
    host = os.getenv("DB_HOST")
    user = os.getenv("DB_USER")
    pw = os.getenv("DB_PASS")
    name = os.getenv("DB_NAME")
    driver = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server").replace(" ", "+")
    if all([host, user, pw, name]):
        return f"mssql+pyodbc://{user}:{pw}@{host}/{name}?driver={driver}"
    return None


def ensure_schema(engine: Engine) -> None:
    # Ejecuta el script de sincronización de esquema, tolerante a errores por lote
    sql_path = os.path.join(os.path.dirname(__file__), "mssql_schema_sync.sql")
    if os.path.exists(sql_path):
        with open(sql_path, "r", encoding="utf-8") as f:
            sql = f.read()
        # dividir por GO seguro
        chunks = [c.strip() for c in sql.split("GO") if c.strip()]
        with engine.connect() as conn:
            for chunk in chunks:
                try:
                    conn.execute(text(chunk))
                    conn.commit()
                except Exception as e:
                    conn.rollback()
                    # Continuar con siguientes bloques, loguear advertencia
                    print("[schema-sync] aviso:", e)


def fetchall(sqlite: Engine, query: str) -> list[Row[Any]]:
    with sqlite.connect() as conn:
        return conn.execute(text(query)).fetchall()


def to_dt(val) -> Optional[datetime]:
    if val is None:
        return None
    if isinstance(val, (datetime,)):
        return val
    if isinstance(val, date):
        return datetime(val.year, val.month, val.day)
    try:
        return datetime.fromisoformat(str(val))
    except Exception:
        return None


def upsert_usuarios(src: Engine, dst: Engine) -> None:
    rows = fetchall(src, "SELECT id, rfid, nombre, correo, rol, password_hash, created_at, updated_at FROM usuarios")
    with dst.begin() as conn:
        for r in rows:
            # Buscar por correo
            existing = conn.execute(text("SELECT id FROM dbo.usuarios WHERE correo=:correo"), {"correo": r.correo}).scalar()
            if existing:
                conn.execute(text(
                    """
                    UPDATE dbo.usuarios SET rfid=:rfid, nombre=:nombre, rol=:rol, password_hash=:password_hash
                    WHERE id=:id
                    """
                ), {
                    "rfid": r.rfid,
                    "nombre": r.nombre,
                    "rol": r.rol or "Operador",
                    "password_hash": r.password_hash,
                    "id": existing,
                })
            else:
                conn.execute(text(
                    """
                    INSERT INTO dbo.usuarios (rfid, nombre, correo, rol, password_hash, created_at, updated_at)
                    VALUES (:rfid, :nombre, :correo, :rol, :password_hash, :created_at, :updated_at)
                    """
                ), {
                    "rfid": r.rfid,
                    "nombre": r.nombre,
                    "correo": r.correo,
                    "rol": r.rol or "Operador",
                    "password_hash": r.password_hash,
                    "created_at": to_dt(r.created_at),
                    "updated_at": to_dt(r.updated_at),
                })


def upsert_catalog_generic(src: Engine, dst: Engine, table: str, key_col: str, cols: Tuple[str, ...]) -> Dict[str, int]:
    # Devuelve mapa key->id en destino
    cols_csv = ", ".join(cols)
    rows = fetchall(src, f"SELECT id, {key_col}, {cols_csv} FROM {table}")
    key_to_id: Dict[str, int] = {}
    with dst.begin() as conn:
        for r in rows:
            key_val = getattr(r, key_col)
            existing = conn.execute(text(f"SELECT id FROM dbo.{table} WHERE {key_col}=:key"), {"key": key_val}).scalar()
            if existing:
                sets = ", ".join([f"{c}=:{c}" for c in cols])
                params = {c: getattr(r, c) for c in cols}
                params["id"] = existing
                conn.execute(text(f"UPDATE dbo.{table} SET {sets} WHERE id=:id"), params)
                key_to_id[str(key_val)] = int(existing)
            else:
                all_cols = [key_col] + list(cols)
                cols_list = ", ".join(all_cols)
                vals_list = ", ".join([f":{c}" for c in all_cols])
                params = {c: getattr(r, c) for c in all_cols}
                res = conn.execute(text(f"INSERT INTO dbo.{table} ({cols_list}) OUTPUT INSERTED.id VALUES ({vals_list})"), params)
                new_id = int(res.scalar() or 0)
                key_to_id[str(key_val)] = new_id
    return key_to_id


def upsert_productos(src: Engine, dst: Engine) -> Dict[str, int]:
    return upsert_catalog_generic(src, dst, "productos", "idprod", ("nombre", "variable1", "variable2", "variable3", "peso_por_pieza", "imagen"))


def upsert_clientes(src: Engine, dst: Engine) -> Dict[str, int]:
    return upsert_catalog_generic(
        src, dst, "clientes", "idclie",
        ("nombre", "observaciones", "calle", "num_interior", "num_exterior", "colonia", "ciudad", "estado", "cp")
    )


def upsert_estaciones(src: Engine, dst: Engine) -> None:
    upsert_catalog_generic(src, dst, "estaciones", "idest", ("nombre", "observaciones"))


def upsert_proveedores(src: Engine, dst: Engine) -> None:
    upsert_catalog_generic(src, dst, "proveedores", "idprov", ("nombre", "observaciones"))


def upsert_empresa(src: Engine, dst: Engine) -> None:
    rows = fetchall(src, "SELECT id, rfc, nombre, calle, colonia, ciudad, estado, cp, contacto, correo, telefono, logotipo FROM empresa ORDER BY id LIMIT 1")
    if not rows:
        return
    r = rows[0]
    with dst.begin() as conn:
        target_id = conn.execute(text("SELECT TOP 1 id FROM dbo.empresa ORDER BY id")) .scalar()
        params = {
            "rfc": r.rfc, "nombre": r.nombre, "calle": r.calle, "colonia": r.colonia, "ciudad": r.ciudad,
            "estado": r.estado, "cp": r.cp, "contacto": r.contacto, "correo": r.correo, "telefono": r.telefono,
            "logotipo": r.logotipo,
        }
        if target_id:
            params["id"] = target_id
            sets = ", ".join([f"{k}=:{k}" for k in params.keys() if k != "id"])
            conn.execute(text(f"UPDATE dbo.empresa SET {sets} WHERE id=:id"), params)
        else:
            cols = ", ".join(params.keys())
            vals = ", ".join([f":{k}" for k in params.keys()])
            conn.execute(text(f"INSERT INTO dbo.empresa ({cols}) VALUES ({vals})"), params)


def upsert_variables(src: Engine, dst: Engine) -> None:
    rows = fetchall(src, "SELECT id, variable_prov1, variable_prov2, variable_prov3, variable_clie1, variable_clie2, variable_clie3 FROM variables ORDER BY id LIMIT 1")
    if not rows:
        return
    r = rows[0]
    with dst.begin() as conn:
        target_id = conn.execute(text("SELECT TOP 1 id FROM dbo.variables ORDER BY id")) .scalar()
        params = {
            "variable_prov1": r.variable_prov1, "variable_prov2": r.variable_prov2, "variable_prov3": r.variable_prov3,
            "variable_clie1": r.variable_clie1, "variable_clie2": r.variable_clie2, "variable_clie3": r.variable_clie3,
        }
        if target_id:
            params["id"] = target_id
            sets = ", ".join([f"{k}=:{k}" for k in params.keys() if k != "id"])
            conn.execute(text(f"UPDATE dbo.variables SET {sets} WHERE id=:id"), params)
        else:
            cols = ", ".join(params.keys())
            vals = ", ".join([f":{k}" for k in params.keys()])
            conn.execute(text(f"INSERT INTO dbo.variables ({cols}) VALUES ({vals})"), params)


def upsert_permarekel(src: Engine, dst: Engine) -> None:
    rows = fetchall(src, "SELECT id, nombre, config FROM permarekel")
    with dst.begin() as conn:
        for r in rows:
            existing = conn.execute(text("SELECT id FROM dbo.permarekel WHERE nombre=:n"), {"n": r.nombre}).scalar()
            if existing:
                conn.execute(text("UPDATE dbo.permarekel SET config=:cfg WHERE id=:id"), {"cfg": r.config, "id": existing})
            else:
                conn.execute(text("INSERT INTO dbo.permarekel (nombre, config) VALUES (:n, :cfg)"), {"n": r.nombre, "cfg": r.config})


def upsert_operadores(src: Engine, dst: Engine) -> None:
    rows = fetchall(src, "SELECT id, rfid, nombre, password_hash, estacion, created_at, updated_at FROM operadores")
    with dst.begin() as conn:
        for r in rows:
            # preferir rfid si existe; si no, nombre
            existing = None
            key = None
            if r.rfid:
                key = ("RFID", r.rfid)
                existing = conn.execute(text("SELECT id FROM dbo.operadores WHERE [RFID]=:v"), {"v": r.rfid}).scalar()
            if not existing:
                key = ("Nombre", r.nombre)
                existing = conn.execute(text("SELECT id FROM dbo.operadores WHERE [Nombre]=:v"), {"v": r.nombre}).scalar()
            # Preparar columnas legadas requeridas (RFID, Nombre, Contraseña, IdEst)
            legacy = {
                "RFID": r.rfid or "",
                "Nombre": r.nombre or "",
                "Contraseña": "********",
                "IdEst": r.estacion or "",
            }
            if existing:
                conn.execute(text(
                    "UPDATE dbo.operadores SET [RFID]=:l_rfid, [Nombre]=:l_nombre, password_hash=:ph, estacion=:est, "
                    "[Contraseña]=:l_pwd, [IdEst]=:l_idest WHERE id=:id"
                ), {
                    "l_rfid": legacy["RFID"], "l_nombre": legacy["Nombre"], "l_pwd": legacy["Contraseña"], "l_idest": legacy["IdEst"],
                    "ph": r.password_hash, "est": r.estacion, "id": existing})
            else:
                conn.execute(text(
                    "INSERT INTO dbo.operadores ([RFID], [Nombre], password_hash, estacion, created_at, updated_at, [Contraseña], [IdEst])"
                    " VALUES (:l_rfid, :l_nombre, :ph, :est, :ca, :ua, :l_pwd, :l_idest)"
                ), {
                    "ca": to_dt(r.created_at), "ua": to_dt(r.updated_at),
                    "l_rfid": legacy["RFID"], "l_nombre": legacy["Nombre"], "l_pwd": legacy["Contraseña"], "l_idest": legacy["IdEst"],
                    "ph": r.password_hash, "est": r.estacion,
                   })


def map_ids(conn: Any, table: str, key_col: str) -> Dict[str, int]:
    rows = conn.execute(text(f"SELECT id, {key_col} AS k FROM dbo.{table}")).mappings().all()
    return {str(r["k"]): int(r["id"]) for r in rows}


def upsert_procesos(src: Engine, dst: Engine) -> None:
    rows = fetchall(src, "SELECT id, op, cliente_id, producto_id, variable1, variable2, variable3, empaques, piezas, lote, imagen FROM procesos")
    # Necesitamos mapear cliente_id y producto_id a destino por idclie y idprod
    with dst.begin() as conn, src.connect() as sconn:
        # construir mapas desde destino
        cli_map = map_ids(conn, "clientes", "idclie")
        prod_map = map_ids(conn, "productos", "idprod")
        for r in rows:
            # Obtener claves naturales desde origen
            cli_row = sconn.execute(text("SELECT idclie FROM clientes WHERE id=:id"), {"id": r.cliente_id}).mappings().first()
            prod_row = sconn.execute(text("SELECT idprod FROM productos WHERE id=:id"), {"id": r.producto_id}).mappings().first()
            if not cli_row or not prod_row:
                continue
            cliente_id = cli_map.get(str(cli_row["idclie"]))
            producto_id = prod_map.get(str(prod_row["idprod"]))
            if not cliente_id or not producto_id:
                continue
            existing = conn.execute(text("SELECT id FROM dbo.procesos WHERE op=:op"), {"op": r.op}).scalar()
            params = {
                "cliente_id": cliente_id,
                "producto_id": producto_id,
                "variable1": r.variable1,
                "variable2": r.variable2,
                "variable3": r.variable3,
                "empaques": r.empaques,
                "piezas": r.piezas,
                "lote": r.lote,
                "imagen": r.imagen,
                "op": r.op,
            }
            if existing:
                params["id"] = existing
                sets = ", ".join([f"{k}=:{k}" for k in params.keys() if k not in ("op", "id")])
                conn.execute(text(f"UPDATE dbo.procesos SET {sets} WHERE id=:id"), params)
            else:
                cols = ", ".join(params.keys())
                vals = ", ".join([f":{k}" for k in params.keys()])
                conn.execute(text(f"INSERT INTO dbo.procesos ({cols}) VALUES ({vals})"), params)


def upsert_inventario(src: Engine, dst: Engine) -> None:
    rows = fetchall(src, "SELECT id, fecha, codigo_mr, descripcion, cantidad, producto_id, cliente_id FROM inventario")
    with dst.begin() as conn, src.connect() as sconn:
        req_meta = conn.execute(text(
            "SELECT c.name AS name, c.is_nullable AS n, t.name AS typ, c.max_length AS maxlen FROM sys.columns c JOIN sys.types t ON c.user_type_id=t.user_type_id WHERE c.object_id=OBJECT_ID('dbo.inventario')"
        )).mappings().all()
        # Detectar si Folio es requerido y su tipo
        fol_col = next((m for m in req_meta if str(m["name"]).lower() == "folio"), None)
        req_folio = 1 if fol_col and int(fol_col["n"]) == 0 else 0
        folio_is_int = bool(fol_col and str(fol_col["typ"]).lower() in ("int", "bigint", "smallint", "tinyint"))
        # Otras columnas NOT NULL legadas no cubiertas por nuestros campos
        known = {"id","fecha","codigo_mr","descripcion","cantidad","producto_id","cliente_id","created_at","updated_at"}
        extra_notnull = [m for m in req_meta if int(m["n"]) == 0 and str(m["name"]).lower() not in known]
        cli_key_map = map_ids(conn, "clientes", "idclie")
        prod_key_map = map_ids(conn, "productos", "idprod")
        for r in rows:
            cli_row = sconn.execute(text("SELECT idclie FROM clientes WHERE id=:id"), {"id": r.cliente_id}).mappings().first() if r.cliente_id is not None else None
            prod_row = sconn.execute(text("SELECT idprod FROM productos WHERE id=:id"), {"id": r.producto_id}).mappings().first() if r.producto_id is not None else None
            tgt_cli_id = cli_key_map.get(str(cli_row["idclie"])) if cli_row else None
            tgt_prod_id = prod_key_map.get(str(prod_row["idprod"])) if prod_row else None

            # Upsert por llave de negocio: fecha+codigo_mr+descripcion+producto_id+cliente_id
            existing = conn.execute(text(
                """
                SELECT id FROM dbo.inventario
                WHERE (fecha IS NULL AND :fecha IS NULL OR fecha = :fecha)
                  AND (codigo_mr IS NULL AND :codigo_mr IS NULL OR codigo_mr = :codigo_mr)
                  AND (descripcion IS NULL AND :descripcion IS NULL OR descripcion = :descripcion)
                  AND (producto_id IS NULL AND :producto_id IS NULL OR producto_id = :producto_id)
                  AND (cliente_id IS NULL AND :cliente_id IS NULL OR cliente_id = :cliente_id)
                """
            ), {
                "fecha": r.fecha,
                "codigo_mr": r.codigo_mr,
                "descripcion": r.descripcion,
                "producto_id": tgt_prod_id,
                "cliente_id": tgt_cli_id,
            }).scalar()

            params = {
                "fecha": r.fecha,
                "codigo_mr": r.codigo_mr,
                "descripcion": r.descripcion,
                "cantidad": r.cantidad,
                "producto_id": tgt_prod_id,
                "cliente_id": tgt_cli_id,
            }
            if req_folio:
                seed = f"{r.fecha}|{r.codigo_mr}|{r.descripcion}|{tgt_prod_id}|{tgt_cli_id}"
                if folio_is_int:
                    params["Folio"] = int(hashlib.sha1(seed.encode("utf-8")).hexdigest()[:8], 16) % 2000000000
                else:
                    params["Folio"] = "AUTO-" + hashlib.sha1(seed.encode("utf-8")).hexdigest()[:20]
            # Satisfacer otras columnas NOT NULL con valores determinísticos
            for m in extra_notnull:
                col = str(m["name"])
                if col in params:
                    continue
                t = str(m["typ"]).lower()
                maxlen = int(m.get("maxlen") or 0)
                # ajustar longitud para tipos de texto (bytes -> chars para nvarchar)
                if t in ("nvarchar","nchar") and maxlen > 0:
                    char_len = max(1, maxlen // 2)
                elif t in ("varchar","char") and maxlen > 0:
                    char_len = maxlen
                else:
                    char_len = 50
                seed = f"{r.fecha}|{r.codigo_mr}|{r.descripcion}|{tgt_prod_id}|{tgt_cli_id}|{col}"
                if t in ("int","bigint","smallint","tinyint"):
                    params[col] = int(hashlib.sha1(seed.encode("utf-8")).hexdigest()[:8], 16) % 2000000000
                elif t in ("decimal","numeric","money","smallmoney","float","real"):
                    params[col] = 0
                elif t in ("date","datetime","datetime2","smalldatetime"):
                    params[col] = r.fecha
                elif t == "bit":
                    params[col] = 0
                else:
                    base = "AUTO-" + hashlib.sha1(seed.encode("utf-8")).hexdigest()
                    params[col] = base[:char_len]

            if existing:
                params["id"] = existing
                sets = ", ".join([f"{k}=:{k}" for k in params.keys() if k != "id"])
                conn.execute(text(f"UPDATE dbo.inventario SET {sets} WHERE id=:id"), params)
            else:
                cols = list(params.keys())
                if req_folio and "Folio" not in cols:
                    cols.append("Folio")
                cols_csv = ", ".join(cols)
                vals_csv = ", ".join([f":{k}" for k in cols])
                conn.execute(text(f"INSERT INTO dbo.inventario ({cols_csv}) VALUES ({vals_csv})"), params)


def main():
    # Cargar variables de entorno (backend/.env si existe)
    env_paths = [
        os.path.join(os.path.dirname(__file__), "..", "backend", ".env"),
        os.path.join(os.path.dirname(__file__), "..", ".env"),
    ]
    for p in env_paths:
        p = os.path.abspath(p)
        if os.path.exists(p):
            load_dotenv(p, override=True)

    parser = argparse.ArgumentParser(description="Migrar datos desde SQLite a SQL Server (SOConteo)")
    parser.add_argument("--sqlite", default="backend/instance/sistema.db", help="Ruta al archivo SQLite origen")
    parser.add_argument("--url", default=None, help="URL SQLAlchemy de destino (mssql+pyodbc://...)")
    args = parser.parse_args()

    sqlite_url = f"sqlite:///{args.sqlite}"
    mssql_url = args.url or build_mssql_url_from_env()
    if not mssql_url:
        raise SystemExit("Debe proporcionar --url o variables DB_* / DATABASE_URL para SQL Server")
    if not mssql_url.startswith("mssql+"):
        raise SystemExit("La URL de destino debe ser mssql+pyodbc")

    src_engine = create_engine(sqlite_url, future=True)
    dst_engine = create_engine(mssql_url, future=True)

    # Asegurar esquema destino
    ensure_schema(dst_engine)

    # Orden recomendado por FKs
    upsert_usuarios(src_engine, dst_engine)
    prod_map = upsert_productos(src_engine, dst_engine)
    cli_map = upsert_clientes(src_engine, dst_engine)
    upsert_estaciones(src_engine, dst_engine)
    upsert_proveedores(src_engine, dst_engine)
    upsert_empresa(src_engine, dst_engine)
    upsert_variables(src_engine, dst_engine)
    upsert_permarekel(src_engine, dst_engine)
    upsert_operadores(src_engine, dst_engine)
    upsert_procesos(src_engine, dst_engine)
    upsert_inventario(src_engine, dst_engine)

    print("Migración completada correctamente.")


if __name__ == "__main__":
    main()
