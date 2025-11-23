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
    # Auto-asignación de variables desde el producto
    producto = db.session.get(Product, data.get("producto_id"))
    cliente = db.session.get(Client, data.get("cliente_id"))
    if not producto or not cliente:
        return jsonify({"error": "Cliente o Producto inválido"}), 400
    p = Process(
        op=data.get("op"),
        cliente_id=cliente.id,
        producto_id=producto.id,
        variable1=data.get("variable1", producto.variable1),
        variable2=data.get("variable2", producto.variable2),
        variable3=data.get("variable3", producto.variable3),
        empaques=data.get("empaques"),
        piezas=data.get("piezas"),
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
