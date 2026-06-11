from datetime import datetime, timezone
from app.extensions import db


class UserLog(db.Model):
    """Kullanici degisiklik kayitlari (audit log)."""
    
    __tablename__ = 'user_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    changed_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    islem = db.Column(db.String(50), nullable=False)
    eski_deger = db.Column(db.String(255), nullable=True)
    yeni_deger = db.Column(db.String(255), nullable=True)
    aciklama = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relationships - aynı tabloya iki FK var, foreign_keys belirtmek SART
    user = db.relationship('User', foreign_keys=[user_id], backref='loglar')
    changed_by = db.relationship('User', foreign_keys=[changed_by_id])
    
    def __repr__(self):
        return f'<UserLog {self.islem} - user_id={self.user_id}>'