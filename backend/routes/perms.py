from flask import request, jsonify
from routes import api
from database import db
from models.permarekel import Permarekel
from utils.auth import auth_required
import json


@api.get("/perms")
@auth_required(role="Administrador")
def list_perms():
    items = db.session.query(Permarekel).all()
    return jsonify([i.to_dict() for i in items])


@api.post("/perms")
@auth_required(role="Administrador")
def create_perm():
    data = request.get_json() or {}
    p = Permarekel(
        nombre=data.get("nombre"),
        config=json.dumps(data.get("config", {}), ensure_ascii=False),
    )
    db.session.add(p)
    db.session.commit()
    return jsonify(p.to_dict()), 201


@api.get("/perms/<int:pid>")
@auth_required(role="Administrador")
def get_perm(pid):
    p = db.session.get(Permarekel, pid)
    if not p:
        return jsonify({"error": "No encontrado"}), 404
    return jsonify(p.to_dict())


@api.put("/perms/<int:pid>")
@auth_required(role="Administrador")
def update_perm(pid):
    p = db.session.get(Permarekel, pid)
    if not p:
        return jsonify({"error": "No encontrado"}), 404
    data = request.get_json() or {}
    if "nombre" in data:
        p.nombre = data["nombre"]
    if "config" in data:
        p.config = json.dumps(data.get("config", {}), ensure_ascii=False)
    db.session.commit()
    return jsonify(p.to_dict())


@api.delete("/perms/<int:pid>")
@auth_required(role="Administrador")
def delete_perm(pid):
    p = db.session.get(Permarekel, pid)
    if not p:
        return jsonify({"error": "No encontrado"}), 404
    db.session.delete(p)
    db.session.commit()
    return jsonify({"status": "ok"})

