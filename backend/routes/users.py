from flask import request, jsonify
from routes import api
from database import db
from models.user import User
from utils.auth import auth_required


@api.get("/users")
@auth_required()
def list_users():
    users = db.session.query(User).all()
    return jsonify([u.to_dict() for u in users])


@api.post("/users")
@auth_required(role="Administrador")
def create_user():
    data = request.get_json() or {}
    try:
        user = User(
            rfid=data.get("rfid"),
            nombre=data.get("nombre"),
            correo=data.get("correo"),
            rol=data.get("rol", "Operador"),
        )
        if not data.get("password"):
            return jsonify({"error": "password requerido"}), 400
        user.set_password(data["password"])
        db.session.add(user)
        db.session.commit()
        return jsonify(user.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


@api.get("/users/<int:user_id>")
@auth_required()
def get_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "No encontrado"}), 404
    return jsonify(user.to_dict())


@api.put("/users/<int:user_id>")
@auth_required(role="Administrador")
def update_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "No encontrado"}), 404
    data = request.get_json() or {}
    for field in ["rfid", "nombre", "correo", "rol"]:
        if field in data:
            setattr(user, field, data[field])
    if data.get("password"):
        user.set_password(data["password"])
    db.session.commit()
    return jsonify(user.to_dict())


@api.delete("/users/<int:user_id>")
@auth_required(role="Administrador")
def delete_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "No encontrado"}), 404
    db.session.delete(user)
    db.session.commit()
    return jsonify({"status": "ok"})


# Perfil del usuario actual
@api.get("/profile")
@auth_required()
def get_profile():
    u = getattr(request, 'user', None)
    return jsonify(u.to_dict() if u else {})


@api.put("/profile")
@auth_required()
def update_profile():
    u = getattr(request, 'user', None)
    if not u:
        return jsonify({"error": "No autorizado"}), 401
    data = request.get_json() or {}
    for f in ["rfid", "nombre", "correo"]:
        if f in data:
            setattr(u, f, data[f])
    if data.get("password"):
        u.set_password(data["password"])
    db.session.commit()
    return jsonify(u.to_dict())
