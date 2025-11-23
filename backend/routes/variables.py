from flask import request, jsonify
from routes import api
from database import db
from models.variables import Variables
from utils.auth import auth_required


@api.get("/variables")
@auth_required()
def get_variables():
    v = db.session.query(Variables).first()
    return jsonify(v.to_dict() if v else {})


@api.put("/variables")
@auth_required(role="Administrador")
def update_variables():
    v = db.session.query(Variables).first()
    if not v:
        v = Variables()
        db.session.add(v)
    data = request.get_json() or {}
    for field in [
        "variable_prov1",
        "variable_prov2",
        "variable_prov3",
        "variable_clie1",
        "variable_clie2",
        "variable_clie3",
    ]:
        if field in data:
            setattr(v, field, data[field])
    db.session.commit()
    return jsonify(v.to_dict())

