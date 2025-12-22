import os


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
    # Requerir SQL Server: construir URL desde DATABASE_URL o variables DB_*
    _url = os.getenv("DATABASE_URL")
    if not _url:
        db_host = os.getenv("DB_HOST")  # puede incluir instancia: HOST\\SQLEXPRESS
        db_user = os.getenv("DB_USER")
        db_pass = os.getenv("DB_PASS")
        db_name = os.getenv("DB_NAME")
        db_driver = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")
        db_trusted = os.getenv("DB_TRUSTED", "0").lower() in ("1", "true", "yes")
        driver_q = db_driver.replace(" ", "+")
        if db_trusted and db_host and db_name:
            _url = f"mssql+pyodbc://@{db_host}/{db_name}?driver={driver_q}&Trusted_Connection=yes"
        elif all([db_host, db_user, db_pass, db_name]):
            _url = (
                f"mssql+pyodbc://{db_user}:{db_pass}@{db_host}/{db_name}?driver="
                + driver_q
            )
    # No permitir fallback a SQLite
    if not _url or not _url.startswith("mssql+"):
        raise RuntimeError(
            "DATABASE_URL/DB_* no configurado para SQL Server. Configure mssql+pyodbc."
        )
    DATABASE_URL = _url
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    TOKEN_EXP_MINUTES = int(os.getenv("TOKEN_EXP_MINUTES", "120"))


def load_config():
    env = os.getenv("FLASK_ENV", "development")
    return Config()
