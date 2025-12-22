from pathlib import Path
import os
from dotenv import load_dotenv

# Ensure backend in path
BASE = Path(__file__).resolve().parents[1]
BACK = BASE / "backend"
os.sys.path.insert(0, str(BACK))

load_dotenv(BACK / ".env", override=True)

from app import create_app  # type: ignore


def try_login(correo: str, password: str):
    app = create_app()
    with app.test_client() as client:
        r = client.post("/api/auth/login", json={"correo": correo, "password": password})
        print(correo, r.status_code, r.get_json())


if __name__ == "__main__":
    # Probar candidatos comunes
    for correo in [
        'admin@so.local',
        'admin@local.com',
        'admin@local',
        'eguzman@siaumex.com',
        'manuel@local.com',
    ]:
        for pw in ['admin123', '123456', 'password', 'Admin123!']:
            try_login(correo, pw)

