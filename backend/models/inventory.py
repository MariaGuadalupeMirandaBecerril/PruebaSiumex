from database import db, TimestampMixin


class Inventory(db.Model, TimestampMixin):
    __tablename__ = "inventario"
    id = db.Column(db.Integer, primary_key=True)
    fecha = db.Column(db.Date)
    codigo_mr = db.Column(db.String(30))
    descripcion = db.Column(db.String(100))
    cantidad = db.Column(db.Integer)
    producto_id = db.Column(db.Integer, db.ForeignKey("productos.id"))
    cliente_id = db.Column(db.Integer, db.ForeignKey("clientes.id"))

    producto = db.relationship("Product")
    cliente = db.relationship("Client")

    def to_dict(self):
        return {
            "id": self.id,
            "fecha": self.fecha.isoformat() if self.fecha else None,
            "codigo_mr": self.codigo_mr,
            "descripcion": self.descripcion,
            "cantidad": self.cantidad,
            "producto": self.producto.to_dict() if self.producto else None,
            "cliente": self.cliente.to_dict() if self.cliente else None,
        }

