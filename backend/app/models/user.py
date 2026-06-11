from datetime import datetime, timezone
from app.extensions import db


class User(db.Model):
    """Kullanici tablosu."""
    
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20))
    personnel_limit = db.Column(db.Integer, default=3)
    role = db.Column(db.String(20), default='user', nullable=False)
    aktif = db.Column(db.Boolean, default=True, nullable=False)
    gecerlilik_tarihi = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # İlişkiler (Relationships)
    personnel = db.relationship('Personnel', back_populates='user', lazy=True, cascade='all, delete-orphan')
    customers = db.relationship('Customer', back_populates='user', lazy=True, cascade='all, delete-orphan')
    orders = db.relationship('Order', back_populates='user', lazy=True, cascade='all, delete-orphan')
    carpet_types = db.relationship('CarpetType', back_populates='user', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<User {self.email} ({self.role})>'