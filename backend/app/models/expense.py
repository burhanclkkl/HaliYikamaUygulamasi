from datetime import datetime, date
from app.extensions import db

class Expense(db.Model):
    __tablename__ = 'expenses'

    id = db.Column(db.Integer, primary_key=True)
    # Harcama hangi işletmeye/patrona ait?
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    tutar = db.Column(db.Numeric(10, 2), nullable=False)
    kategori = db.Column(db.String(50), nullable=False)  # Örn: "Fatura", "Yakıt", "Malzeme", "Maaş"
    tur = db.Column(db.String(50), nullable=True) # Örn: "Elektrik", "Personel A", "Deterjan"
    aciklama = db.Column(db.String(255), nullable=True) # Not alanı
    tarih = db.Column(db.Date, default=date.today, nullable=False)
    durum = db.Column(db.String(20), nullable=False, default='ödendi') # 'ödendi', 'ödenecek'
    odeme_yontemi = db.Column(db.String(50), nullable=True) # Örn: 'nakit', 'kart', 'havale'
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # İsteğe bağlı olarak User modeliyle ilişki (User modeline backref olarak 'expenses' eklenebilir)
    # user = db.relationship('User', backref=db.backref('expenses', lazy='dynamic'))
