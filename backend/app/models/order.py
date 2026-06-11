from datetime import datetime
from app.extensions import db


class Order(db.Model):
    """Siparis tablosu."""
    
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    irsaliye_no = db.Column(db.String(50), nullable=True)
    teslim_tarihi = db.Column(db.DateTime, nullable=True)
    durum = db.Column(db.String(20), default='alindi', nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    customer = db.relationship('Customer', back_populates='orders_list') # Sadece 'orders' ismi User ile çakışabilir, daha spesifik yaptık
    user = db.relationship('User', back_populates='orders')
    items = db.relationship('OrderItem', back_populates='order', lazy=True,
                           cascade='all, delete-orphan') # lazy=True eklendi

    payments = db.relationship('Payment', back_populates='order', lazy=True,
                          cascade='all, delete-orphan') # lazy=True eklendi
    def __repr__(self):
        return f'<Order id={self.id} customer_id={self.customer_id} durum={self.durum}>'