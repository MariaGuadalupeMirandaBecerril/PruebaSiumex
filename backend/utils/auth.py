from functools import wraps
from flask import request, jsonify, current_app
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from models.user import User
from database import db


def get_serializer():
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"]) 


def generate_token(payload: dict) -> str:
    s = get_serializer()
    return s.dumps(payload)


def verify_token(token: str):
    s = get_serializer()
    max_age = current_app.config.get("TOKEN_EXP_MINUTES", 120) * 60
    try:
        data = s.loads(token, max_age=max_age)
        return data
    except SignatureExpired:
        return None
    except BadSignature:
        return None


def auth_required(role: str | None = None):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            auth_header = request.headers.get("Authorization", "")
            if not auth_header.startswith("Bearer "):
                return jsonify({"error": "No autorizado"}), 401
            token = auth_header.split(" ", 1)[1]
            data = verify_token(token)
            if not data:
                return jsonify({"error": "Token invalido o expirado"}), 401
            user = db.session.get(User, data.get("id"))
            if not user:
                return jsonify({"error": "Usuario no encontrado"}), 401
            if role and user.rol.lower() != role.lower():
                return jsonify({"error": "Permiso denegado"}), 403
            request.user = user
            return f(*args, **kwargs)
        return wrapper
    return decorator


