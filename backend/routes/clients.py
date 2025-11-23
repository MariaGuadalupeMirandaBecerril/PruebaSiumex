from flask import request, jsonify
from routes import api
from database import db
from models.client import Client
from utils.auth import auth_required


@api.get("/clients")
@auth_required()
def list_clients():
    q = db.session.query(Client)
    term = request.args.get("q")
    if term:
        like = f"%{term}%"
        q = q.filter(Client.nombre.ilike(like))
    clients = q.all()
    return jsonify([c.to_dict() for c in clients])


@api.post("/clients")
@auth_required()
def create_client():
    data = request.get_json() or {}
    c = Client(
        idclie=data.get("idclie"),
        nombre=data.get("nombre"),
        observaciones=data.get("observaciones"),
        calle=data.get("calle"),
        num_interior=data.get("num_interior"),
        num_exterior=data.get("num_exterior"),
        colonia=data.get("colonia"),
        ciudad=data.get("ciudad"),
        estado=data.get("estado"),
        cp=data.get("cp"),
    )
    db.session.add(c)
    db.session.commit()
    return jsonify(c.to_dict()), 201


@api.get("/clients/<int:cid>")
@auth_required()
def get_client(cid):
    c = db.session.get(Client, cid)
    if not c:
        return jsonify({"error": "No encontrado"}), 404
    return jsonify(c.to_dict())


@api.put("/clients/<int:cid>")
@auth_required()
def update_client(cid):
    c = db.session.get(Client, cid)
    if not c:
        return jsonify({"error": "No encontrado"}), 404
    data = request.get_json() or {}
    for field in [
        "idclie",
        "nombre",
        "observaciones",
        "calle",
        "num_interior",
        "num_exterior",
        "colonia",
        "ciudad",
        "estado",
        "cp",
    ]:
        if field in data:
            setattr(c, field, data[field])
    db.session.commit()
    return jsonify(c.to_dict())


@api.delete("/clients/<int:cid>")
@auth_required()
def delete_client(cid):
    c = db.session.get(Client, cid)
    if not c:
        return jsonify({"error": "No encontrado"}), 404
    db.session.delete(c)
    db.session.commit()
    return jsonify({"status": "ok"})
