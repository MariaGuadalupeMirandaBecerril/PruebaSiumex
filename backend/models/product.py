from database import db, TimestampMixin


class Product(db.Model, TimestampMixin):
    __tablename__ = "productos"
    id = db.Column(db.Integer, primary_key=True)
    idprod = db.Column(db.String(20), unique=True, nullable=False)
    nombre = db.Column(db.String(50), nullable=False)
    variable1 = db.Column(db.String(50))
    variable2 = db.Column(db.String(50))
    variable3 = db.Column(db.String(50))
    peso_por_pieza = db.Column(db.Numeric(10, 2))
    # Usar Text para mapear NVARCHAR(MAX) en SQL Server y admitir data-URIs largas
    imagen = db.Column(db.Text)

    def to_dict(self):
        return {
            "id": self.id,
            "idprod": self.idprod,
            "nombre": self.nombre,
            "variable1": self.variable1,
            "variable2": self.variable2,
            "variable3": self.variable3,
            "peso_por_pieza": float(self.peso_por_pieza) if self.peso_por_pieza is not None else None,
            "imagen": self.imagen,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
