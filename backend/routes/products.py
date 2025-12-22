from flask import request, jsonify
from routes import api
from database import db
from models.product import Product
from utils.auth import auth_required
from decimal import Decimal, InvalidOperation


@api.get("/products")
@auth_required()
def list_products():
    q = db.session.query(Product)
    term = request.args.get("q")
    if term:
        like = f"%{term}%"
        q = q.filter((Product.nombre.ilike(like)) | (Product.idprod.ilike(like)))
    products = q.all()
    return jsonify([p.to_dict() for p in products])


@api.post("/products")
@auth_required()
def create_product():
    data = request.get_json() or {}
    def _to_decimal(x):
        if x is None or x == '':
            return None
        try:
            return Decimal(str(x))
        except (InvalidOperation, ValueError, TypeError):
            return None

    p = Product(
        idprod=data.get("idprod"),
        nombre=data.get("nombre"),
        variable1=data.get("variable1"),
        variable2=data.get("variable2"),
        variable3=data.get("variable3"),
        peso_por_pieza=_to_decimal(data.get("peso_por_pieza")),
        imagen=data.get("imagen"),
    )
    db.session.add(p)
    db.session.commit()
    return jsonify(p.to_dict()), 201


@api.get("/products/<int:pid>")
@auth_required()
def get_product(pid):
    p = db.session.get(Product, pid)
    if not p:
        return jsonify({"error": "No encontrado"}), 404
    return jsonify(p.to_dict())


@api.put("/products/<int:pid>")
@auth_required()
def update_product(pid):
    p = db.session.get(Product, pid)
    if not p:
        return jsonify({"error": "No encontrado"}), 404
    data = request.get_json() or {}
    for field in [
        "idprod",
        "nombre",
        "variable1",
        "variable2",
        "variable3",
        "peso_por_pieza",
        "imagen",
    ]:
        if field in data:
            if field == "peso_por_pieza":
                v = data[field]
                val = None
                if v is not None and v != '':
                    try:
                        val = Decimal(str(v))
                    except (InvalidOperation, ValueError, TypeError):
                        val = None
                setattr(p, field, val)
            else:
                setattr(p, field, data[field])
    db.session.commit()
    return jsonify(p.to_dict())


@api.delete("/products/<int:pid>")
@auth_required()
def delete_product(pid):
    p = db.session.get(Product, pid)
    if not p:
        return jsonify({"error": "No encontrado"}), 404
    db.session.delete(p)
    db.session.commit()
    return jsonify({"status": "ok"})
