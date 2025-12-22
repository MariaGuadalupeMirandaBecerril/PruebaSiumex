from flask import request, jsonify
import os
import glob
import uuid
from werkzeug.utils import secure_filename
import re
from routes import api
from database import db
from models.user import User
from utils.auth import auth_required


@api.get("/users")
@auth_required()
def list_users():
    users = db.session.query(User).all()
    return jsonify([u.to_dict() for u in users])


EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


@api.post("/users")
@auth_required(role="Administrador")
def create_user():
    data = request.get_json() or {}
    try:
        correo = (data.get("correo") or "").strip()
        if correo and not EMAIL_RE.match(correo):
            return jsonify({"error": "correo invalido"}), 400
        user = User(
            rfid=data.get("rfid"),
            nombre=data.get("nombre"),
            correo=correo,
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
    if "correo" in data:
        correo = (data.get("correo") or "").strip()
        if correo and not EMAIL_RE.match(correo):
            return jsonify({"error": "correo invalido"}), 400
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


# --- Profile photo upload / fetch (no DB change required) ---
@api.get("/profile/photo")
@auth_required()
def get_profile_photo():
    u = getattr(request, 'user', None)
    if not u:
        return jsonify({"foto": None}), 200
    # Look for any file matching uploads/profile_<id>.*
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    upload_dir = os.path.join(base_dir, "uploads")
    os.makedirs(upload_dir, exist_ok=True)
    pattern = os.path.join(upload_dir, f"profile_{u.id}.*")
    matches = glob.glob(pattern)
    if not matches:
        return jsonify({"foto": None}), 200
    # Return URL path for the first match
    filename = os.path.basename(matches[0])
    return jsonify({"foto": f"/uploads/{filename}"}), 200


@api.post("/profile/photo")
@auth_required()
def upload_profile_photo():
    u = getattr(request, 'user', None)
    if not u:
        return jsonify({"error": "No autorizado"}), 401
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    f = request.files["file"]
    if f.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    upload_dir = os.path.join(base_dir, "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    filename = secure_filename(f.filename)
    _, ext = os.path.splitext(filename)
    if not ext:
        ext = ".png"
    # Unique but stable per user: overwrite previous
    target = os.path.join(upload_dir, f"profile_{u.id}{ext.lower()}")
    # Remove previous files for this user regardless of ext
    for old in glob.glob(os.path.join(upload_dir, f"profile_{u.id}.*")):
        try:
            os.remove(old)
        except Exception:
            pass
    f.save(target)
    url_path = f"/uploads/{os.path.basename(target)}"
    return jsonify({"foto": url_path}), 201


@api.delete("/profile/photo")
@auth_required()
def delete_profile_photo():
    u = getattr(request, 'user', None)
    if not u:
        return jsonify({"error": "No autorizado"}), 401
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    upload_dir = os.path.join(base_dir, "uploads")
    removed = False
    for old in glob.glob(os.path.join(upload_dir, f"profile_{u.id}.*")):
        try:
            os.remove(old)
            removed = True
        except Exception:
            pass
    return jsonify({"status": "ok", "removed": removed}), 200


