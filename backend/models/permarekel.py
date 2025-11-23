from database import db, TimestampMixin
import json


class Permarekel(db.Model, TimestampMixin):
    __tablename__ = "permarekel"
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(50), nullable=False, unique=True)
    config = db.Column(db.Text, nullable=False, default="{}")

    def to_dict(self):
        try:
            cfg = json.loads(self.config or "{}")
        except Exception:
            cfg = {}
        return {
            "id": self.id,
            "nombre": self.nombre,
            "config": cfg,
        }

