from flask import request, jsonify
from routes import api
from database import db
from models.station import Station
from utils.auth import auth_required


@api.get("/stations")
@auth_required()
def list_stations():
    stations = db.session.query(Station).all()
    return jsonify([s.to_dict() for s in stations])


@api.get("/stations/<int:sid>")
@auth_required()
def get_station(sid):
    s = db.session.get(Station, sid)
    if not s:
        return jsonify({"error": "No encontrado"}), 404
    return jsonify(s.to_dict())


@api.post("/stations")
@auth_required()
def create_station():
    data = request.get_json() or {}
    s = Station(
        idest=data.get("idest"),
        nombre=data.get("nombre"),
        observaciones=data.get("observaciones"),
    )
    db.session.add(s)
    db.session.commit()
    return jsonify(s.to_dict()), 201


@api.put("/stations/<int:sid>")
@auth_required()
def update_station(sid):
    s = db.session.get(Station, sid)
    if not s:
        return jsonify({"error": "No encontrado"}), 404
    data = request.get_json() or {}
    for field in ["idest", "nombre", "observaciones"]:
        if field in data:
            setattr(s, field, data[field])
    db.session.commit()
    return jsonify(s.to_dict())


@api.delete("/stations/<int:sid>")
@auth_required()
def delete_station(sid):
    s = db.session.get(Station, sid)
    if not s:
        return jsonify({"error": "No encontrado"}), 404
    db.session.delete(s)
    db.session.commit()
    return jsonify({"status": "ok"})
