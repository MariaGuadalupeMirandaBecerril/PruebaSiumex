from database import db, TimestampMixin


class Company(db.Model, TimestampMixin):
    __tablename__ = "empresa"
    id = db.Column(db.Integer, primary_key=True)
    rfc = db.Column(db.String(20))
    nombre = db.Column(db.String(50))
    calle = db.Column(db.String(50))
    colonia = db.Column(db.String(50))
    ciudad = db.Column(db.String(50))
    estado = db.Column(db.String(50))
    cp = db.Column(db.Integer)
    contacto = db.Column(db.String(50))
    correo = db.Column(db.String(50))
    telefono = db.Column(db.String(50))
    logotipo = db.Column(db.String(255))

    def to_dict(self):
        return {
            "id": self.id,
            "rfc": self.rfc,
            "nombre": self.nombre,
            "calle": self.calle,
            "colonia": self.colonia,
            "ciudad": self.ciudad,
            "estado": self.estado,
            "cp": self.cp,
            "contacto": self.contacto,
            "correo": self.correo,
            "telefono": self.telefono,
            "logotipo": self.logotipo,
        }

