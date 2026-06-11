from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt


def admin_required(fn):
    """Sadece admin role'une sahip kullanicilarin erisebilecegi endpoint'ler icin."""
    @wraps(fn)
    def decorated_function(*args, **kwargs):
        verify_jwt_in_request()
        
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'hata': 'Bu işlem için admin yetkisi gerekir'}), 403
        
        return fn(*args, **kwargs)
    return decorated_function