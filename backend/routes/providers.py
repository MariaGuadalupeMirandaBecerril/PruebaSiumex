from flask import request, jsonify
from routes import api
from database import db
from models.provider import Provider
from utils.auth import auth_required


@api.get("/providers")
@auth_required()
def list_providers():
    q = db.session.query(Provider)
    term = request.args.get("q")
    if term:
        like = f"%{term}%"
        q = q.filter((Provider.nombre.ilike(like)) | (Provider.idprov.ilike(like)))
    provs = q.all()
    return jsonify([p.to_dict() for p in provs])


@api.post("/providers")
@auth_required()
def create_provider():
    data = request.get_json() or {}
    p = Provider(
        idprov=data.get("idprov"),
        nombre=data.get("nombre"),
        observaciones=data.get("observaciones"),
    )
    db.session.add(p)
    db.session.commit()
    return jsonify(p.to_dict()), 201


@api.get("/providers/<int:pid>")
@auth_required()
def get_provider(pid):
    p = db.session.get(Provider, pid)
    if not p:
        return jsonify({"error": "No encontrado"}), 404
    return jsonify(p.to_dict())


@api.put("/providers/<int:pid>")
@auth_required()
def update_provider(pid):
    p = db.session.get(Provider, pid)
    if not p:
        return jsonify({"error": "No encontrado"}), 404
    data = request.get_json() or {}
    for field in ["idprov", "nombre", "observaciones"]:
        if field in data:
            setattr(p, field, data[field])
    db.session.commit()
    return jsonify(p.to_dict())


@api.delete("/providers/<int:pid>")
@auth_required()
def delete_provider(pid):
    p = db.session.get(Provider, pid)
    if not p:
        return jsonify({"error": "No encontrado"}), 404
    db.session.delete(p)
    db.session.commit()
    return jsonify({"status": "ok"})

