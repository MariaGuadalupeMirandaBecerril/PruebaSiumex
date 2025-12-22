from flask import jsonify, request
from routes import api
from utils.auth import auth_required
from database import db
from sqlalchemy import text


@api.get("/maintenance/procesos/peek")
@auth_required()
def procesos_peek():
    def fetch(sql: str):
        with db.engine.begin() as conn:
            rs = conn.execute(text(sql))
            cols = rs.keys()
            rows = [dict(zip(cols, r)) for r in rs.fetchall()]
        return {"columns": list(cols), "rows": rows}
    out = {}
    out["procesos"] = fetch("SELECT TOP 5 * FROM dbo.procesos ORDER BY id DESC")
    out["estaciones"] = fetch("SELECT TOP 5 * FROM dbo.estaciones ORDER BY id DESC")
    out["usuarios"] = fetch("SELECT TOP 5 * FROM dbo.usuarios ORDER BY id DESC")
    return jsonify(out)


@api.post("/maintenance/procesos/ensure-relations")
@auth_required()
def procesos_ensure_relations():
    stmts = [
        "IF COL_LENGTH('dbo.procesos','estacion_id') IS NULL ALTER TABLE dbo.procesos ADD estacion_id INT NULL;",
        "IF COL_LENGTH('dbo.procesos','usuario_id') IS NULL ALTER TABLE dbo.procesos ADD usuario_id INT NULL;",
        # FKs (en try/catch para no fallar si no existen tablas destino)
        "BEGIN TRY ALTER TABLE dbo.procesos ADD CONSTRAINT FK_procesos_estaciones_estacion_id FOREIGN KEY(estacion_id) REFERENCES dbo.estaciones(id); END TRY BEGIN CATCH END CATCH;",
        "BEGIN TRY ALTER TABLE dbo.procesos ADD CONSTRAINT FK_procesos_usuarios_usuario_id FOREIGN KEY(usuario_id) REFERENCES dbo.usuarios(id); END TRY BEGIN CATCH END CATCH;",
        "BEGIN TRY CREATE INDEX IX_procesos_estacion_id ON dbo.procesos(estacion_id); END TRY BEGIN CATCH END CATCH;",
        "BEGIN TRY CREATE INDEX IX_procesos_usuario_id ON dbo.procesos(usuario_id); END TRY BEGIN CATCH END CATCH;",
    ]
    try:
        with db.engine.begin() as conn:
            for s in stmts:
                conn.execute(text(s))
        return jsonify({"status": "ok"})
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500


@api.post("/maintenance/procesos/seed-relations")
@auth_required()
def procesos_seed_relations():
    # Actualiza hasta 5 procesos sin estación/usuario con IDs válidos existentes
    try:
        with db.engine.begin() as conn:
            est_id = conn.execute(text("SELECT TOP 1 id FROM dbo.estaciones ORDER BY id")).scalar()
            usu_id = conn.execute(text("SELECT TOP 1 id FROM dbo.usuarios ORDER BY id")).scalar()
            if not est_id or not usu_id:
                return jsonify({"status": "skip", "reason": "Faltan registros en estaciones/usuarios"}), 400
            conn.execute(text(
                """
                UPDATE p SET p.estacion_id = COALESCE(p.estacion_id, :est), p.usuario_id = COALESCE(p.usuario_id, :usu)
                FROM dbo.procesos p
                WHERE (p.estacion_id IS NULL OR p.usuario_id IS NULL)
                AND p.id IN (SELECT TOP 5 id FROM dbo.procesos ORDER BY id DESC)
                """
            ), {"est": est_id, "usu": usu_id})
        return jsonify({"status": "ok", "estacion_id": est_id, "usuario_id": usu_id})
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500

