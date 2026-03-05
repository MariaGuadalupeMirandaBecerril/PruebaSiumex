import os
import sys
import csv
from datetime import datetime, date, time
from decimal import Decimal
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import inspect
from dotenv import load_dotenv
import argparse


def _load_env(path: Path | None = None):
    here = Path(__file__).resolve().parent
    # Preferir ruta provista o backend/.env si existe
    env_path = path or (here.parent / "backend" / ".env")
    if env_path.exists():
        load_dotenv(env_path.as_posix(), override=True)
    else:
        load_dotenv(override=True)


def _build_url_from_vars() -> str | None:
    host = os.getenv("DB_HOST")
    user = os.getenv("DB_USER")
    pwd = os.getenv("DB_PASS")
    name = os.getenv("DB_NAME")
    if all([host, user, pwd, name]):
        driver = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server").replace(" ", "+")
        return f"mssql+pyodbc://{user}:{pwd}@{host}/{name}?driver={driver}"
    return os.getenv("DATABASE_URL")


def _quote_ident(ident: str) -> str:
    ident = ident.replace("]", "]]")
    return f"[{ident}]"


def _literal(value):
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "1" if value else "0"
    if isinstance(value, (int, float, Decimal)):
        return str(value)
    if isinstance(value, (datetime, date, time)):
        return f"'{value.isoformat(sep=' ')}'"
    # cadenas y otros
    s = str(value).replace("'", "''")
    return f"'{s}'"


def export(engine: Engine, out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)
    sql_path = out_dir / f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql"
    csv_dir = out_dir / "csv"
    csv_dir.mkdir(exist_ok=True)

    insp = inspect(engine)
    tables = insp.get_table_names(schema=None)
    if not tables:
        raise SystemExit("No se encontraron tablas para exportar")

    with sql_path.open("w", encoding="utf-8", newline="\n") as fsql:
        fsql.write("-- Backup lógico generado por scripts/backup_sqlserver_dump.py\n")
        fsql.write("SET NOCOUNT ON;\nGO\n")

        with engine.connect() as conn:
            for table in tables:
                cols = [col["name"] for col in insp.get_columns(table)]
                col_list = ", ".join(_quote_ident(c) for c in cols)

                # Data a CSV
                csv_path = csv_dir / f"{table}.csv"
                result = conn.execute(text(f"SELECT * FROM {_quote_ident(table)}"))
                rows = result.fetchall()
                # CSV
                with csv_path.open("w", encoding="utf-8", newline="") as fcsv:
                    writer = csv.writer(fcsv)
                    writer.writerow(cols)
                    for r in rows:
                        m = getattr(r, "_mapping", None)
                        if m is None:
                            writer.writerow(list(r))
                        else:
                            writer.writerow([m[c] for c in cols])

                # SQL: TRUNCATE/DELETE + INSERTs
                fsql.write(f"-- Tabla: {table}\n")
                fsql.write(f"DELETE FROM {_quote_ident(table)};\nGO\n")
                if rows:
                    for r in rows:
                        m = getattr(r, "_mapping", None)
                        if m is None:
                            seq = list(r)
                        else:
                            seq = [m[c] for c in cols]
                        values = ", ".join(_literal(v) for v in seq)
                        fsql.write(
                            f"INSERT INTO {_quote_ident(table)} ({col_list}) VALUES ({values});\n"
                        )
                    fsql.write("GO\n")

    print({
        "status": "ok",
        "sql_file": sql_path.as_posix(),
        "csv_dir": csv_dir.as_posix(),
        "tables": tables,
    })


def main():
    parser = argparse.ArgumentParser(description="Backup lógico SQL Server a SQL+CSV")
    parser.add_argument("--url", help="SQLAlchemy URL (mssql+pyodbc://...)")
    parser.add_argument("--env", help="Ruta a archivo .env a cargar", default=None)
    parser.add_argument("--out", help="Directorio de salida", default="backups")
    args = parser.parse_args()

    env_path = Path(args.env) if args.env else None
    _load_env(env_path)

    url = args.url or os.getenv("DATABASE_URL") or _build_url_from_vars()
    if not url:
        raise SystemExit(
            "No hay DATABASE_URL ni variables DB_* suficientes. Configure conexión a SQL Server."
        )
    out_dir = Path(args.out).resolve()
    try:
        engine = create_engine(url)
        export(engine, out_dir)
    except SQLAlchemyError as e:
        print(f"Error de SQLAlchemy: {e}", file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
