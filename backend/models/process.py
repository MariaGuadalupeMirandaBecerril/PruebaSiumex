from database import db, TimestampMixin


class Process(db.Model, TimestampMixin):
    __tablename__ = "procesos"
    id = db.Column(db.Integer, primary_key=True)
    op = db.Column(db.String(20), unique=True, nullable=False)
    cliente_id = db.Column(db.Integer, db.ForeignKey("clientes.id"), nullable=False)
    producto_id = db.Column(db.Integer, db.ForeignKey("productos.id"), nullable=False)
    variable1 = db.Column(db.String(50))
    variable2 = db.Column(db.String(50))
    variable3 = db.Column(db.String(50))
    empaques = db.Column(db.Integer)
    piezas = db.Column(db.Integer)
    lote = db.Column(db.String(20))
    imagen = db.Column(db.String(255))

    cliente = db.relationship("Client")
    producto = db.relationship("Product")

    def to_dict(self):
        return {
            "id": self.id,
            "op": self.op,
            "cliente": self.cliente.to_dict() if self.cliente else None,
            "producto": self.producto.to_dict() if self.producto else None,
            "variable1": self.variable1,
            "variable2": self.variable2,
            "variable3": self.variable3,
            "empaques": self.empaques,
            "piezas": self.piezas,
            "lote": self.lote,
            "imagen": self.imagen,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

