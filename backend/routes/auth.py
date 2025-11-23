from flask import request, jsonify
from routes import api
from models.user import User
from database import db
from utils.auth import generate_token


@api.post("/auth/register")
def register():
    data = request.get_json() or {}
    nombre = data.get("nombre")
    correo = data.get("correo")
    password = data.get("password")
    rol = data.get("rol", "Operador")
    if not all([nombre, correo, password]):
        return jsonify({"error": "Datos incompletos"}), 400
    if db.session.query(User).filter_by(correo=correo).first():
        return jsonify({"error": "Correo ya registrado"}), 400
    user = User(nombre=nombre, correo=correo, rol=rol)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201


@api.post("/auth/login")
def login():
    data = request.get_json() or {}
    correo = data.get("correo")
    password = data.get("password")
    if not all([correo, password]):
        return jsonify({"error": "Datos incompletos"}), 400
    user = db.session.query(User).filter_by(correo=correo).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Credenciales inválidas"}), 401
    token = generate_token({"id": user.id, "rol": user.rol})
    return jsonify({"token": token, "usuario": user.to_dict()})

