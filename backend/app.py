import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from config import load_config
from database import db
from routes import api
from dotenv import load_dotenv
from sqlalchemy import text


def create_app():
    # Cargar variables desde .env si existe
    load_dotenv()
    app = Flask(__name__)
    app.config.from_object(load_config())
    CORS(app)

    db.init_app(app)

    @app.get("/")
    def index():
        return (
            {
                "message": "Backend API del Sistema Administrativo",
                "status": "ok",
                "health": "/health",
                "api_base": "/api",
                "note": "La UI está en frontend/index.html (abrir en el navegador)",
            },
            200,
        )

    @app.get("/health")
    def health():
        return jsonify({"status": "ok"})

    # Servir frontend estático bajo /ui
    FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))

    @app.get("/ui")
    def ui_index_no_slash():
        # Redirigir para que las rutas relativas funcionen (css/js)
        from flask import redirect
        return redirect("/ui/", code=308)

    @app.get("/ui/")
    def ui_index():
        return send_from_directory(FRONTEND_DIR, "index.html")

    @app.get("/ui/<path:path>")
    def ui_static(path):
        return send_from_directory(FRONTEND_DIR, path)

    # Registrar rutas
    from routes import auth as auth_routes
    from routes import users as users_routes
    from routes import products as products_routes
    from routes import clients as clients_routes
    from routes import stations as stations_routes
    from routes import operators as operators_routes
    from routes import company as company_routes
    from routes import variables as variables_routes
    from routes import processes as processes_routes
    from routes import providers as providers_routes
    from routes import dashboard as dashboard_routes
    from routes import reports as reports_routes
    from routes import export as export_routes
    from routes import inventory as inventory_routes
    from routes import perms as perms_routes
    import routes.db as db_routes

    app.register_blueprint(api)

    # Static serving for uploaded files (e.g., company logo)
    UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "uploads"))

    @app.get("/uploads/<path:path>")
    def uploads_static(path):
        return send_from_directory(UPLOAD_DIR, path)

    # Crear tablas y seeds solo en SQLite (dev)
    with app.app_context():
        try:
            if db.engine.url.get_backend_name() == "sqlite":
                db.create_all()
                # Asegurar columnas nuevas en clientes (modo dev sin migrador)
                try:
                    cols = [row[1] for row in db.session.execute(text("PRAGMA table_info('clientes')")).fetchall()]
                    wanted = [
                        ("calle", "TEXT"), ("num_interior", "TEXT"), ("num_exterior", "TEXT"),
                        ("colonia", "TEXT"), ("ciudad", "TEXT"), ("estado", "TEXT"), ("cp", "TEXT"),
                    ]
                    for col, ctype in wanted:
                        if col not in cols:
                            db.session.execute(text(f"ALTER TABLE clientes ADD COLUMN {col} {ctype}"))
                    db.session.commit()
                except Exception:
                    db.session.rollback()
                from models.user import User
                from models.product import Product
                from models.client import Client
                from models.station import Station
                from models.company import Company
                from models.variables import Variables
                from models.process import Process
                from models.inventory import Inventory
                from models.permarekel import Permarekel
                if db.session.query(User).count() == 0:
                    admin = User(nombre="Admin", correo="admin@local", rol="Administrador")
                    admin.set_password("admin123")
                    db.session.add(admin)
                    db.session.commit()

                if db.session.query(Product).count() == 0:
                    p1 = Product(idprod="P-001", nombre="Producto A", variable1="VarA1", variable2="VarA2", variable3="VarA3", peso_por_pieza=12.5)
                    p2 = Product(idprod="P-002", nombre="Producto B", variable1="VarB1", variable2="VarB2", variable3="VarB3", peso_por_pieza=8.0)
                    db.session.add_all([p1, p2])
                    db.session.commit()

                if db.session.query(Client).count() == 0:
                    c1 = Client(idclie="C-001", nombre="Cliente Uno", observaciones="Preferente")
                    c2 = Client(idclie="C-002", nombre="Cliente Dos", observaciones="")
                    db.session.add_all([c1, c2])
                    db.session.commit()

                if db.session.query(Station).count() == 0:
                    s1 = Station(idest="E-01", nombre="Corte", observaciones="")
                    s2 = Station(idest="E-02", nombre="Empaque", observaciones="")
                    db.session.add_all([s1, s2])
                    db.session.commit()

                if db.session.query(Company).count() == 0:
                    comp = Company(rfc="EMP123456789", nombre="Mi Empresa", ciudad="CDMX", estado="CDMX", correo="contacto@empresa.local", telefono="555-0000")
                    db.session.add(comp)
                    db.session.commit()

                if db.session.query(Variables).count() == 0:
                    vars = Variables(variable_prov1="Color", variable_prov2="Tamaño", variable_prov3="Material", variable_clie1="Región", variable_clie2="Segmento", variable_clie3="Canal")
                    db.session.add(vars)
                    db.session.commit()

                if db.session.query(Process).count() == 0:
                    prod = db.session.query(Product).first()
                    cli = db.session.query(Client).first()
                    if prod and cli:
                        pr = Process(op="OP-0001", cliente_id=cli.id, producto_id=prod.id, variable1=prod.variable1, variable2=prod.variable2, variable3=prod.variable3, empaques=10, piezas=200, lote="L-01")
                        db.session.add(pr)
                        db.session.commit()
                if db.session.query(Inventory).count() == 0:
                    import datetime as _dt
                    prod = db.session.query(Product).first()
                    cli = db.session.query(Client).first()
                    sample = Inventory(fecha=_dt.date.today(), codigo_mr="MR-001", descripcion="Ingreso inicial", cantidad=100, producto_id=prod.id if prod else None, cliente_id=cli.id if cli else None)
                    db.session.add(sample)
                    db.session.commit()
                if db.session.query(Permarekel).count() == 0:
                    p = Permarekel(nombre="default", config="{}")
                    db.session.add(p)
                    db.session.commit()
        except Exception:
            # Evitar que el seed rompa el arranque si hay un problema de migraciones
            db.session.rollback()

    return app


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app = create_app()
    app.run(host="0.0.0.0", port=port, debug=True)
