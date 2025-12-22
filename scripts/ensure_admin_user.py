from dotenv import load_dotenv
import os
from sqlalchemy import create_engine, text
from werkzeug.security import generate_password_hash


def main():
    # Cargar .env del backend
    load_dotenv(os.path.join('backend', '.env'), override=True)
    url = os.getenv('DATABASE_URL')
    if not url:
        raise SystemExit('DATABASE_URL no configurado')
    engine = create_engine(url, future=True)
    correo = os.getenv('ADMIN_CORREO', 'admin@so.local')
    nombre = os.getenv('ADMIN_NOMBRE', 'Admin SO')
    password = os.getenv('ADMIN_PASSWORD', 'admin123')
    rol = 'Administrador'
    pwd_hash = generate_password_hash(password)
    with engine.begin() as conn:
        exists = conn.execute(text('SELECT 1 FROM dbo.usuarios WHERE correo=:c'), {'c': correo}).scalar()
        if exists:
            print('Usuario admin ya existe:', correo)
            return
        conn.execute(text('''
            INSERT INTO dbo.usuarios (rfid, nombre, correo, rol, password_hash, created_at, updated_at)
            VALUES (:rfid, :nombre, :correo, :rol, :pwd, SYSUTCDATETIME(), SYSUTCDATETIME())
        '''), {'rfid': 'RF-ADMIN-0001', 'nombre': nombre, 'correo': correo, 'rol': rol, 'pwd': pwd_hash})
        print('Usuario admin creado:', correo)


if __name__ == '__main__':
    main()
