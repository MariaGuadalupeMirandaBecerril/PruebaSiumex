import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from sqlalchemy import text

from database import db
from routes import api


def create_app():
    # Load environment variables
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    load_dotenv(env_path, override=True)

    from config import load_config

    app = Flask(__name__)
    app.config.from_object(load_config())
    CORS(app)

    # Initialize DB
    db.init_app(app)
    # Enforce SQL Server (mssql) and SOConteo DB
    with app.app_context():
        try:
            dialect = db.engine.url.get_backend_name()
            if dialect != "mssql":
                raise RuntimeError("La aplicacion debe usar SQL Server (mssql) unicamente")
            # Validate active DB name (SOConteo)
            try:
                from sqlalchemy import text as _text
                with db.engine.connect() as conn:
                    dbname = conn.execute(_text("SELECT DB_NAME()")).scalar()
                if not dbname or str(dbname).lower() != "soconteo":
                    raise RuntimeError(f"Base de datos activa invalida: {dbname}. Se requiere SOConteo")
            except Exception:
                raise
        except Exception:
            raise

    # Base routes
    @app.get("/")
    def index():
        return (
            {
                "message": "Backend API del Sistema Administrativo",
                "status": "ok",
                "health": "/health",
                "api_base": "/api",
                "note": "La UI esta en frontend/index.html (abrir en el navegador)",
            },
            200,
        )

    @app.get("/health")
    def health():
        return jsonify({"status": "ok"})

    # Static frontend
    FRONTEND_DIR = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "frontend")
    )

    @app.get("/ui")
    def ui_index_no_slash():
        from flask import redirect
        return redirect("/ui/", code=308)

    @app.get("/ui/")
    def ui_index():
        return send_from_directory(FRONTEND_DIR, "index.html")

    @app.get("/ui/<path:path>")
    def ui_static(path):
        return send_from_directory(FRONTEND_DIR, path)

    # Register routes (Blueprints)
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
    from routes import maintenance as maintenance_routes
    from routes import inventory as inventory_routes
    from routes import perms as perms_routes
    import routes.db as db_routes

    app.register_blueprint(api)

    # Uploads
    UPLOAD_DIR = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "uploads")
    )

    @app.get("/uploads/<path:path>")
    def uploads_static(path):
        return send_from_directory(UPLOAD_DIR, path)

    # Optional initializations (disabled)
    if False:
        try:
            if db.engine.url.get_backend_name() == "mssql":
                try:
                    db.session.execute(text("IF COL_LENGTH('dbo.procesos','piezas') IS NULL ALTER TABLE dbo.procesos ADD piezas FLOAT NULL;"))
                except Exception:
                    pass
                try:
                    db.session.execute(text("BEGIN TRY ALTER TABLE dbo.procesos ALTER COLUMN piezas FLOAT NULL; END TRY BEGIN CATCH END CATCH;"))
                except Exception:
                    pass
                try:
                    db.session.execute(text("BEGIN TRY ALTER TABLE dbo.procesos ALTER COLUMN imagen NVARCHAR(MAX) NULL; END TRY BEGIN CATCH END CATCH;"))
                except Exception:
                    pass
                try:
                    db.session.commit()
                except Exception:
                    db.session.rollback()
            if db.engine.url.get_backend_name() == "sqlite":
                db.create_all()
        except Exception:
            db.session.rollback()

    return app


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app = create_app()
    app.run(host="0.0.0.0", port=port, debug=True)
