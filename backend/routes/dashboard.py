from flask import jsonify, request
from routes import api
from utils.auth import auth_required
from database import db
from models.process import Process
from models.product import Product
from models.client import Client
from sqlalchemy import text
from utils import sqlserver_queries as mssqlq


@api.get("/dashboard/summary")
@auth_required()
def dashboard_summary():
    # Filtros de fecha (placeholders, sin campos de fecha en modelos actuales)
    _ = request.args.get("from")
    _ = request.args.get("to")

    # Si hay configuración de SQL Server y tablas mapeadas, usar consultas MS SQL
    try:
        if db.engine.url.get_backend_name() == "mssql" and mssqlq.available():
            return jsonify(mssqlq.dashboard_summary(db.engine))
    except Exception:
        pass

    total_processes = db.session.query(db.func.count(Process.id)).scalar() or 0
    total_pieces = db.session.query(db.func.coalesce(db.func.sum(Process.piezas), 0)).scalar() or 0
    total_products = db.session.query(db.func.count(Product.id)).scalar() or 0
    total_clients = db.session.query(db.func.count(Client.id)).scalar() or 0

    # Serie para grafico simple: piezas por producto
    rows = (
        db.session.query(Process.producto_id, db.func.sum(Process.piezas))
        .group_by(Process.producto_id)
        .all()
    )
    series = [{"producto_id": r[0], "piezas": int(r[1] or 0)} for r in rows]

    return jsonify(
        {
            "cards": {
                "procesos_totales": int(total_processes),
                "piezas_totales": int(total_pieces),
                "productos_registrados": int(total_products),
                "clientes_registrados": int(total_clients),
            },
            "series_piezas_por_producto": series,
        }
    )
