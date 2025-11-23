from database import db, TimestampMixin


class Station(db.Model, TimestampMixin):
    __tablename__ = "estaciones"
    id = db.Column(db.Integer, primary_key=True)
    idest = db.Column(db.String(20), unique=True, nullable=False)
    nombre = db.Column(db.String(50), nullable=False)
    observaciones = db.Column(db.String(50))

    def to_dict(self):
        return {
            "id": self.id,
            "idest": self.idest,
            "nombre": self.nombre,
            "observaciones": self.observaciones,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

