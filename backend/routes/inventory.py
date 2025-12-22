from flask import request, jsonify
from routes import api
from database import db
from models.inventory import Inventory
from utils.auth import auth_required
from datetime import datetime


def _parse_date(s: str | None):
    if not s:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


@api.get("/inventory")
@auth_required()
def list_inventory():
    q = db.session.query(Inventory)
    d_from = _parse_date(request.args.get("from"))
    d_to = _parse_date(request.args.get("to"))
    mr = request.args.get("mr")
    term = request.args.get("q")
    if d_from:
        q = q.filter(Inventory.fecha >= d_from)
    if d_to:
        q = q.filter(Inventory.fecha <= d_to)
    if mr:
        like = f"%{mr}%"
        q = q.filter(Inventory.codigo_mr.ilike(like))
    if term:
        like = f"%{term}%"
        q = q.filter(Inventory.descripcion.ilike(like))
    rows = q.order_by(Inventory.fecha.desc()).all()
    return jsonify([r.to_dict() for r in rows])


@api.post("/inventory")
@auth_required()
def create_inventory():
    data = request.get_json() or {}
    def _to_float(x):
        if x is None or x == "":
            return None
        try:
            # Aceptar coma decimal ingresada por el usuario
            return float(str(x).replace(",", "."))
        except (ValueError, TypeError):
            return None
    item = Inventory(
        fecha=_parse_date(data.get("fecha")),
        codigo_mr=data.get("codigo_mr"),
        descripcion=data.get("descripcion"),
        cantidad=_to_float(data.get("cantidad")),
        producto_id=data.get("producto_id"),
        cliente_id=data.get("cliente_id"),
    )
    db.session.add(item)
    db.session.commit()
    return jsonify(item.to_dict()), 201


@api.get("/inventory/<int:iid>")
@auth_required()
def get_inventory(iid):
    item = db.session.get(Inventory, iid)
    if not item:
        return jsonify({"error": "No encontrado"}), 404
    return jsonify(item.to_dict())


@api.put("/inventory/<int:iid>")
@auth_required()
def update_inventory(iid):
    item = db.session.get(Inventory, iid)
    if not item:
        return jsonify({"error": "No encontrado"}), 404
    data = request.get_json() or {}
    if "fecha" in data:
        item.fecha = _parse_date(data.get("fecha"))
    # Actualizar campos; convertir cantidad a float (double)
    for f in ["codigo_mr", "descripcion", "producto_id", "cliente_id"]:
        if f in data:
            setattr(item, f, data[f])
    if "cantidad" in data:
        try:
            item.cantidad = float(str(data.get("cantidad")).replace(",", ".")) if data.get("cantidad") not in (None, "") else None
        except (ValueError, TypeError):
            item.cantidad = None
    db.session.commit()
    return jsonify(item.to_dict())


@api.delete("/inventory/<int:iid>")
@auth_required()
def delete_inventory(iid):
    item = db.session.get(Inventory, iid)
    if not item:
        return jsonify({"error": "No encontrado"}), 404
    db.session.delete(item)
    db.session.commit()
    return jsonify({"status": "ok"})
