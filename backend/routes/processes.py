from flask import request, jsonify
from routes import api
from database import db
from models.process import Process
from models.product import Product
from models.client import Client
from utils.auth import auth_required


@api.get("/processes")
@api.get("/production")  # alias per requerimiento (Produccion)
@auth_required()
def list_processes():
    procs = db.session.query(Process).all()
    return jsonify([p.to_dict() for p in procs])


@api.post("/processes")
@api.post("/production")
@auth_required()
def create_process():
    data = request.get_json() or {}
    # Auto-asignacion de variables desde el producto
    producto = db.session.get(Product, data.get("producto_id"))
    cliente = db.session.get(Client, data.get("cliente_id"))
    if not producto or not cliente:
        return jsonify({"error": "Cliente o Producto invalido"}), 400
    # Coerciones de tipos para MSSQL
    def _to_int(x):
        try:
            return int(x) if x is not None and x != '' else None
        except Exception:
            return None
    def _to_float(x):
        if x is None or x == '':
            return None
        try:
            return float(str(x).replace(',', '.'))
        except (ValueError, TypeError):
            return None

    p = Process(
        op=data.get("op"),
        cliente_id=cliente.id,
        producto_id=producto.id,
        variable1=data.get("variable1", producto.variable1),
        variable2=data.get("variable2", producto.variable2),
        variable3=data.get("variable3", producto.variable3),
        empaques=_to_int(data.get("empaques")),
        piezas=_to_float(data.get("piezas")),
        lote=data.get("lote"),
        imagen=data.get("imagen") or getattr(producto, "imagen", None),
    )
    db.session.add(p)
    db.session.commit()
    return jsonify(p.to_dict()), 201


@api.get("/processes/<int:pid>")
@api.get("/production/<int:pid>")
@auth_required()
def get_process(pid):
    p = db.session.get(Process, pid)
    if not p:
        return jsonify({"error": "No encontrado"}), 404
    return jsonify(p.to_dict())


@api.put("/processes/<int:pid>")
@api.put("/production/<int:pid>")
@auth_required()
def update_process(pid):
    p = db.session.get(Process, pid)
    if not p:
        return jsonify({"error": "No encontrado"}), 404
    data = request.get_json() or {}
    for field in [
        "op",
        "cliente_id",
        "producto_id",
        "variable1",
        "variable2",
        "variable3",
        "empaques",
        "piezas",
        "lote",
        "imagen",
    ]:
        if field in data:
            if field == "empaques":
                try:
                    setattr(p, field, int(data[field]) if data[field] != '' and data[field] is not None else None)
                except Exception:
                    setattr(p, field, None)
            elif field == "piezas":
                v = data[field]
                try:
                    setattr(p, field, float(str(v).replace(',', '.')) if v not in (None, '') else None)
                except (ValueError, TypeError):
                    setattr(p, field, None)
            else:
                setattr(p, field, data[field])
    db.session.commit()
    return jsonify(p.to_dict())


@api.delete("/processes/<int:pid>")
@api.delete("/production/<int:pid>")
@auth_required()
def delete_process(pid):
    p = db.session.get(Process, pid)
    if not p:
        return jsonify({"error": "No encontrado"}), 404
    db.session.delete(p)
    db.session.commit()
    return jsonify({"status": "ok"})
