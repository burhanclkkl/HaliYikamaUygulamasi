from datetime import datetime
from app.extensions import db

class CarpetType(db.Model):
    __tablename__ = 'carpet_types'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    price_per_m2 = db.Column(db.Numeric(10, 2), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', back_populates='carpet_types')

    def __repr__(self):
        return f"<CarpetType {self.name} - {self.price_per_m2} TL/m²>"