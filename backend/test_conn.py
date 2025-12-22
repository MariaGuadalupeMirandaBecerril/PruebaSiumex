from pathlib import Path
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv


def _load_env():
    here = Path(__file__).resolve().parent
    env_path = here / ".env"
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
    return None


def main():
    _load_env()
    url = os.getenv("DATABASE_URL") or _build_url_from_vars()
    if not url:
        raise SystemExit("No hay DATABASE_URL ni variables DB_* suficientes en .env")

    engine = create_engine(url)
    with engine.connect() as conn:
        one = conn.execute(text("SELECT 1")).scalar()
        dialect = conn.engine.url.get_backend_name()
    print({"status": "ok", "dialect": dialect, "select1": int(one or 0)})


if __name__ == "__main__":
    main()

