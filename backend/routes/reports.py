from flask import request, jsonify
from routes import api
from database import db
from models.process import Process
from models.inventory import Inventory
from utils.auth import auth_required
from datetime import datetime


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
    cols_default = ["fecha", "codigo_mr", "descripcion", "cantidad", "producto", "cliente"]
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
        # Aplanar producto/cliente para columnas simples
        m["producto"] = (item.producto.nombre if item.producto else None)
        m["cliente"] = (item.cliente.nombre if item.cliente else None)
        return {k: m.get(k) for k in cols}

    data = [row_map(r) for r in rows]
    return jsonify({"columns": cols, "rows": data})
