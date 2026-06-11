from app.extensions import db

class ExpenseCategory(db.Model):
    __tablename__ = 'expense_categories'
    
    id = db.Column(db.Integer, primary_key=True)
    # Kategorinin hangi işletmeye (patrona) ait olduğunu tutar
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    ad = db.Column(db.String(100), nullable=False)
    turler = db.Column(db.Text, nullable=True, default="") # Virgülle ayrılmış tür isimleri