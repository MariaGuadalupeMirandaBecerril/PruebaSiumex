from flask import jsonify, request
from routes import api
from utils.auth import auth_required
from database import db
from sqlalchemy import text
from utils import sqlserver_queries as mssqlq


@api.get("/db/ping")
@auth_required()
def db_ping():
    try:
        with db.engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return jsonify({"status": "ok", "dialect": db.engine.url.get_backend_name()})
    except Exception as e:
        return jsonify({"status": "error", "dialect": db.engine.url.get_backend_name(), "error": str(e)}), 500


@api.get("/db/tables")
@auth_required()
def db_tables():
    try:
        with db.engine.begin() as conn:
            rows = conn.execute(text("SELECT TABLE_SCHEMA AS schema_name, TABLE_NAME AS table_name FROM INFORMATION_SCHEMA.TABLES ORDER BY TABLE_SCHEMA, TABLE_NAME")).mappings().all()
        return jsonify([f"{r['schema_name']}.{r['table_name']}" for r in rows])
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500


@api.get("/db/peek")
@auth_required()
def db_peek():
    tbl = request.args.get("table")
    if not tbl:
        return jsonify({"error": "Falta parámetro 'table'"}), 400
    # Validar identificador
    try:
        ident = mssqlq._ident(tbl)  # reuse validador
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    try:
        with db.engine.begin() as conn:
            rows = conn.execute(text(f"SELECT TOP 5 * FROM {ident}"))
            cols = rows.keys()
            data = [dict(zip(cols, r)) for r in rows.fetchall()]
        return jsonify({"columns": list(cols), "rows": data})
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500


@api.get("/db/auto-map")
@auth_required()
def db_auto_map():
    try:
        # Buscar candidatos en INFORMATION_SCHEMA.COLUMNS
        with db.engine.begin() as conn:
            cols = conn.execute(text(
                """
                SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, DATA_TYPE
                FROM INFORMATION_SCHEMA.COLUMNS
                ORDER BY TABLE_SCHEMA, TABLE_NAME
                """
            )).mappings().all()
        # Heurísticas simples
        def match(name: str, *tokens: str) -> bool:
            n = name.lower()
            return all(t in n for t in [tkn.lower() for tkn in tokens])

        from collections import defaultdict
        table_cols = defaultdict(list)
        for r in cols:
            key = f"{r['TABLE_SCHEMA']}.{r['TABLE_NAME']}"
            table_cols[key].append((r['COLUMN_NAME'], (r['DATA_TYPE'] or '').lower()))

        cards_table = None
        num_col = act_col = bal_init_col = bal_curr_col = None
        movs_table = None
        date_col = type_col = None

        for t, cl in table_cols.items():
            names = [c[0] for c in cl]
            # candidatos tarjetas
            if any(match(c, 'tarjeta') or match(c, 'card') for c in names) and any(match(c,'saldo') for c in names):
                cards_table = cards_table or t
                for c, _ in cl:
                    if not num_col and (match(c,'tarjeta') or match(c,'card')):
                        num_col = c
                    if not act_col and (match(c,'activa') or match(c,'activo') or match(c,'estado')):
                        act_col = c
                    if not bal_init_col and (match(c,'saldo','inicial') or match(c,'saldo','ini')):
                        bal_init_col = c
                    if not bal_curr_col and (match(c,'saldo','actual') or match(c,'saldo')):
                        bal_curr_col = c
            # candidatos movimientos
            if any(match(c, 'mov') or match(c,'entrada') or match(c,'salida') for c in names):
                movs_table = movs_table or t
                for c, dt in cl:
                    if not date_col and (match(c,'fecha') or 'date' in dt):
                        date_col = c
                    if not type_col and (match(c,'tipo') or match(c,'mov')):
                        type_col = c

        if not cards_table and not movs_table:
            return jsonify({"status": "no-match", "hint": "No se detectaron tablas candidatas"}), 404

        mapping = {}
        if cards_table:
            mapping.update({
                "MSSQL_TBL_CARDS": cards_table,
                "MSSQL_COL_CARD_NUMBER": num_col,
                "MSSQL_COL_CARD_ACTIVE": act_col,
                "MSSQL_COL_BAL_INIT": bal_init_col,
                "MSSQL_COL_BAL_CURR": bal_curr_col,
            })
        if movs_table:
            mapping.update({
                "MSSQL_TBL_MOVS": movs_table,
                "MSSQL_COL_MOV_DATE": date_col,
                "MSSQL_COL_MOV_TYPE": type_col,
            })

        return jsonify({"status": "ok", "mapping": mapping})
    except Exception as e:
        return jsonify({"status": "error", "error": str(e)}), 500
