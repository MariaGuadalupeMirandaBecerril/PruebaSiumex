from database import db, TimestampMixin


class Operator(db.Model, TimestampMixin):
    __tablename__ = "operadores"
    id = db.Column(db.Integer, primary_key=True)
    # Mapeo a columnas existentes en SOConteo
    rfid = db.Column('RFID', db.String(20), nullable=False)
    nombre = db.Column('Nombre', db.String(50), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    estacion = db.Column(db.String(20))  # texto; relación lógica con estaciones.idest
    # Columnas legadas obligatorias adicionales
    legacy_contrasena = db.Column('Contraseña', db.String(20), nullable=False)
    legacy_idest = db.Column('IdEst', db.String(20), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "rfid": self.rfid,
            "nombre": self.nombre,
            "estacion": self.estacion,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

