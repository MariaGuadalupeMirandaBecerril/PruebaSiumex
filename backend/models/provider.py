from database import db, TimestampMixin


class Provider(db.Model, TimestampMixin):
    __tablename__ = "proveedores"
    id = db.Column(db.Integer, primary_key=True)
    idprov = db.Column(db.String(20), unique=True, nullable=False)
    nombre = db.Column(db.String(50), nullable=False)
    observaciones = db.Column(db.String(50))

    def to_dict(self):
        return {
            "id": self.id,
            "idprov": self.idprov,
            "nombre": self.nombre,
            "observaciones": self.observaciones,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

