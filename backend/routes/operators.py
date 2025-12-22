from flask import request, jsonify
from routes import api
from database import db
from models.operator import Operator
from utils.auth import auth_required
from werkzeug.security import generate_password_hash


@api.get("/operators")
@auth_required()
def list_operators():
    ops = db.session.query(Operator).all()
    return jsonify([o.to_dict() for o in ops])


@api.post("/operators")
@auth_required()
def create_operator():
    data = request.get_json() or {}
    if not data.get("password"):
        return jsonify({"error": "password requerido"}), 400
    o = Operator(
        rfid=data.get("rfid"),
        nombre=data.get("nombre"),
        password_hash=generate_password_hash(data["password"]),
        estacion=data.get("estacion"),
    )
    # Completar columnas legadas obligatorias
    o.legacy_idest = o.estacion or ""
    o.legacy_contrasena = "********"
    db.session.add(o)
    db.session.commit()
    return jsonify(o.to_dict()), 201


@api.put("/operators/<int:oid>")
@auth_required()
def update_operator(oid):
    o = db.session.get(Operator, oid)
    if not o:
        return jsonify({"error": "No encontrado"}), 404
    data = request.get_json() or {}
    for field in ["rfid", "nombre", "estacion"]:
        if field in data:
            setattr(o, field, data[field])
    # Mantener columnas legadas en sincronía
    if "estacion" in data:
        o.legacy_idest = data.get("estacion") or ""
    if data.get("password"):
        o.password_hash = generate_password_hash(data["password"])
        o.legacy_contrasena = "********"
    db.session.commit()
    return jsonify(o.to_dict())


@api.delete("/operators/<int:oid>")
@auth_required()
def delete_operator(oid):
    o = db.session.get(Operator, oid)
    if not o:
        return jsonify({"error": "No encontrado"}), 404
    db.session.delete(o)
    db.session.commit()
    return jsonify({"status": "ok"})
