from app.extensions import db


class OrderItem(db.Model):
    """Siparis detay (her bir hali) tablosu."""
    
    __tablename__ = 'order_items'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    hali_tipi = db.Column(db.String(50), nullable=False)
    en = db.Column(db.Numeric(5, 2), nullable=False)
    boy = db.Column(db.Numeric(5, 2), nullable=False)
    m2 = db.Column(db.Numeric(7, 2), nullable=False)
    m2_fiyat = db.Column(db.Numeric(10, 2), nullable=False)
    tutar = db.Column(db.Numeric(12, 2), nullable=False)
    
    order = db.relationship('Order', back_populates='items')
    
    def __repr__(self):
        return f'<OrderItem {self.hali_tipi} {self.en}x{self.boy}>'