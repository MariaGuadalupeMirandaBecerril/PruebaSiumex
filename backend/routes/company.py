import os
import uuid
from flask import request, jsonify
from routes import api
from database import db
from models.company import Company
from utils.auth import auth_required
from werkzeug.utils import secure_filename


@api.get("/company")
@auth_required()
def get_company():
    c = db.session.query(Company).first()
    return jsonify(c.to_dict() if c else {})


@api.put("/company")
@auth_required(role="Administrador")
def update_company():
    c = db.session.query(Company).first()
    if not c:
        c = Company()
        db.session.add(c)
    data = request.get_json() or {}
    for field in [
        "rfc",
        "nombre",
        "calle",
        "colonia",
        "ciudad",
        "estado",
        "cp",
        "contacto",
        "correo",
        "telefono",
        "logotipo",
    ]:
        if field in data:
            setattr(c, field, data[field])
    db.session.commit()
    return jsonify(c.to_dict())


@api.post("/company/logo")
@auth_required(role="Administrador")
def upload_company_logo():
    # Ensure upload directory exists (backend/uploads)
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    upload_dir = os.path.join(base_dir, "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    f = request.files["file"]
    if f.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    # Sanitize and uniquify filename
    filename = secure_filename(f.filename)
    name, ext = os.path.splitext(filename)
    unique = f"{uuid.uuid4().hex[:12]}{ext.lower()}"
    save_path = os.path.join(upload_dir, unique)
    f.save(save_path)

    # Store relative URL in company record
    url_path = f"/uploads/{unique}"
    c = db.session.query(Company).first()
    if not c:
        c = Company()
        db.session.add(c)
    c.logotipo = url_path
    db.session.commit()
    return jsonify(c.to_dict()), 201
