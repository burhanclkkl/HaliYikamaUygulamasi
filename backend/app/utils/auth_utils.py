from flask_jwt_extended import get_jwt_identity, get_jwt
from app.models.personnel import Personnel

def get_owner_id():
    """İşlem yapan kişi personel ise patronunun ID'sini, değilse kendi ID'sini döner."""
    identity = get_jwt_identity()
    if not identity:
        return None
    current_id = int(identity)
    claims = get_jwt()
    if claims.get('role') == 'personnel':
        p = Personnel.query.get(current_id)
        return p.user_id if p else None
    return current_id