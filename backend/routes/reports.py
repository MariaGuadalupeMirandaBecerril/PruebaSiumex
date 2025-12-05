from flask import request, jsonify
from routes import api
from database import db
from models.process import Process
from models.inventory import Inventory
from utils.auth import auth_required
from datetime import datetime
import os
import re


@api.get("/reports/summary")
@auth_required()
def report_summary():
    # Ejemplo simple de agregación: piezas por producto
    rows = (
        db.session.query(Process.producto_id, db.func.sum(Process.piezas))
        .group_by(Process.producto_id)
        .all()
    )
    data = [{"producto_id": r[0], "piezas": int(r[1] or 0)} for r in rows]
    return jsonify(data)


def _parse_date(s: str | None):
    if not s:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


@api.get("/reports/inventory")
@auth_required()
def report_inventory():
    d_from = _parse_date(request.args.get("from"))
    d_to = _parse_date(request.args.get("to"))
    mr = request.args.get("mr")
    columns = request.args.get("columns")
    # MSSQL external table support via env vars
    table = os.getenv("MSSQL_INV_TABLE")
    date_col = os.getenv("MSSQL_INV_DATE_COL")

    def _ident(name: str) -> str:
        if not name:
            raise ValueError("Empty identifier")
        if not re.fullmatch(r"[A-Za-z0-9_\.]+", name):
            raise ValueError(f"Invalid identifier: {name}")
        return ".".join(f"[{p}]" for p in name.split("."))

    if table:
        tbl = _ident(table)
        where = []
        params = {}
        if date_col and d_from:
            where.append(f"{_ident(date_col)} >= :dfrom")
            params["dfrom"] = d_from
        if date_col and d_to:
            where.append(f"{_ident(date_col)} <= :dto")
            params["dto"] = d_to
        sql = f"SELECT * FROM {tbl}"
        if where:
            sql += " WHERE " + " AND ".join(where)
        if date_col:
            sql += f" ORDER BY {_ident(date_col)} DESC"
        rows = db.session.execute(db.text(sql), params).mappings().all()
        if columns:
            cols = [c for c in columns.split(",") if c]
        elif rows:
            cols = list(rows[0].keys())
        else:
            cols = []
        data = []
        for r in rows:
            m = {k: r.get(k) for k in cols}
            for k, v in list(m.items()):
                if hasattr(v, "isoformat"):
                    try:
                        m[k] = v.isoformat()
                    except Exception:
                        m[k] = str(v)
            data.append(m)
        return jsonify({"columns": cols, "rows": data})

    # Fallback ORM (SQLite etc.)
    # Incluir claves necesarias para la tabla canonica del frontend
    cols_default = [
        "id", "fecha", "codigo_mr", "descripcion", "cantidad",
        "producto", "cliente", "producto_id", "cliente_id",
    ]
    cols = [c for c in (columns.split(",") if columns else cols_default) if c]

    q = db.session.query(Inventory)
    if d_from:
        q = q.filter(Inventory.fecha >= d_from)
    if d_to:
        q = q.filter(Inventory.fecha <= d_to)
    if mr:
        like = f"%{mr}%"
        q = q.filter(Inventory.codigo_mr.ilike(like))
    rows = q.order_by(Inventory.fecha.desc()).all()

    def row_map(item: Inventory):
        m = item.to_dict()
        # Asegurar ids planos y nombres simples
        m["producto_id"] = item.producto_id
        m["cliente_id"] = item.cliente_id
        m["producto"] = (item.producto.nombre if item.producto else None)
        m["cliente"] = (item.cliente.nombre if item.cliente else None)
        return {k: m.get(k) for k in cols}

    data = [row_map(r) for r in rows]
    return jsonify({"columns": cols, "rows": data})
