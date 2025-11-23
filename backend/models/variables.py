from database import db, TimestampMixin


class Variables(db.Model, TimestampMixin):
    __tablename__ = "variables"
    id = db.Column(db.Integer, primary_key=True)
    variable_prov1 = db.Column(db.String(50))
    variable_prov2 = db.Column(db.String(50))
    variable_prov3 = db.Column(db.String(50))
    variable_clie1 = db.Column(db.String(50))
    variable_clie2 = db.Column(db.String(50))
    variable_clie3 = db.Column(db.String(50))

    def to_dict(self):
        return {
            "id": self.id,
            "variable_prov1": self.variable_prov1,
            "variable_prov2": self.variable_prov2,
            "variable_prov3": self.variable_prov3,
            "variable_clie1": self.variable_clie1,
            "variable_clie2": self.variable_clie2,
            "variable_clie3": self.variable_clie3,
        }

