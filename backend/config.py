import os


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
    # Preferir DATABASE_URL; si no existe, construir desde DB_* (SQL Server)
    _url = os.getenv("DATABASE_URL")
    if not _url:
        db_host = os.getenv("DB_HOST")
        db_user = os.getenv("DB_USER")
        db_pass = os.getenv("DB_PASS")
        db_name = os.getenv("DB_NAME")
        db_driver = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")
        if all([db_host, db_user, db_pass, db_name]):
            _url = (
                f"mssql+pyodbc://{db_user}:{db_pass}@{db_host}/{db_name}?driver="
                + db_driver.replace(" ", "+")
            )
    DATABASE_URL = _url or "sqlite:///sistema.db"
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    TOKEN_EXP_MINUTES = int(os.getenv("TOKEN_EXP_MINUTES", "120"))


def load_config():
    env = os.getenv("FLASK_ENV", "development")
    return Config()
