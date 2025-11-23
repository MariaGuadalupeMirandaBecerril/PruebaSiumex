from database import db, TimestampMixin


class Client(db.Model, TimestampMixin):
    __tablename__ = "clientes"
    id = db.Column(db.Integer, primary_key=True)
    idclie = db.Column(db.String(20), unique=True, nullable=False)
    nombre = db.Column(db.String(50), nullable=False)
    observaciones = db.Column(db.String(50))
    # Dirección (campos opcionales)
    calle = db.Column(db.String(100))
    num_interior = db.Column(db.String(20))
    num_exterior = db.Column(db.String(20))
    colonia = db.Column(db.String(80))
    ciudad = db.Column(db.String(80))
    estado = db.Column(db.String(80))
    cp = db.Column(db.String(20))

    def to_dict(self):
        return {
            "id": self.id,
            "idclie": self.idclie,
            "nombre": self.nombre,
            "observaciones": self.observaciones,
            "calle": self.calle,
            "num_interior": self.num_interior,
            "num_exterior": self.num_exterior,
            "colonia": self.colonia,
            "ciudad": self.ciudad,
            "estado": self.estado,
            "cp": self.cp,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
