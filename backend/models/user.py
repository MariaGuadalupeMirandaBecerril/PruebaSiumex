from database import db, TimestampMixin
from werkzeug.security import generate_password_hash, check_password_hash


class User(db.Model, TimestampMixin):
    __tablename__ = "usuarios"
    id = db.Column(db.Integer, primary_key=True)
    rfid = db.Column(db.String(20), unique=True, nullable=True)
    nombre = db.Column(db.String(50), nullable=False)
    correo = db.Column(db.String(50), unique=True, nullable=False)
    rol = db.Column(db.String(20), nullable=False, default="Operador")
    password_hash = db.Column(db.String(255), nullable=False)

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "rfid": self.rfid,
            "nombre": self.nombre,
            "correo": self.correo,
            "rol": self.rol,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

