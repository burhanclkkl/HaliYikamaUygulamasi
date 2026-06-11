from datetime import datetime, timezone
from app.extensions import db


class Payment(db.Model):
    """Siparis odeme kayitlari."""
    
    __tablename__ = 'payments'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    tutar = db.Column(db.Numeric(12, 2), nullable=False)
    odeme_turu = db.Column(db.String(20), nullable=False)
    aciklama = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    order = db.relationship('Order', back_populates='payments')
    
    def __repr__(self):
        return f'<Payment {self.tutar} TL ({self.odeme_turu})>'