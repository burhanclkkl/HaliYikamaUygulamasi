from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from app.extensions import db
from app.models.carpet_type import CarpetType
from app.utils.auth_utils import get_owner_id # Import from utils
from decimal import Decimal

carpet_types_bp = Blueprint('carpet_types', __name__, url_prefix='/carpet_types')

def _serialize_carpet_type(ct):
    return {
        'id': ct.id,
        'name': ct.name,
        'price_per_m2': float(ct.price_per_m2),
        'created_at': ct.created_at.isoformat(),
        'updated_at': ct.updated_at.isoformat()
    }

@carpet_types_bp.route('', methods=['GET'])
@jwt_required()
def get_carpet_types():
    owner_id = get_owner_id()
    if owner_id is None:
        return jsonify({'hata': 'Yetkisiz erişim'}), 403

    carpet_types = CarpetType.query.filter_by(user_id=owner_id).order_by(CarpetType.name).all()
    return jsonify([_serialize_carpet_type(ct) for ct in carpet_types]), 200

@carpet_types_bp.route('', methods=['POST'])
@jwt_required()
def create_carpet_type():
    owner_id = get_owner_id()
    if owner_id is None:
        return jsonify({'hata': 'Yetkisiz erişim'}), 403

    # Personel halı tipi ekleyemez
    claims = get_jwt()
    if claims.get('role') == 'personnel':
        return jsonify({'hata': 'Halı tipi ekleme yetkiniz yok'}), 403

    data = request.get_json()
    name = data.get('name', '').strip()
    price_per_m2 = data.get('price_per_m2')

    if not name:
        return jsonify({'hata': 'Halı tipi adı zorunludur'}), 400
    if price_per_m2 is None:
        return jsonify({'hata': 'm² fiyatı zorunludur'}), 400

    try:
        price_d = Decimal(str(price_per_m2))
        if price_d <= 0:
            return jsonify({'hata': 'm² fiyatı pozitif olmalıdır'}), 400
    except Exception:
        return jsonify({'hata': 'Geçersiz m² fiyatı'}), 400

    # Check for duplicate name for the same user
    existing_ct = CarpetType.query.filter_by(user_id=owner_id, name=name).first()
    if existing_ct:
        return jsonify({'hata': f"'{name}' adında bir halı tipi zaten mevcut."}), 409

    new_ct = CarpetType(
        user_id=owner_id,
        name=name,
        price_per_m2=price_d
    )
    db.session.add(new_ct)
    db.session.commit()
    return jsonify(_serialize_carpet_type(new_ct)), 201

@carpet_types_bp.route('/<int:ct_id>', methods=['PUT'])
@jwt_required()
def update_carpet_type(ct_id):
    owner_id = get_owner_id()
    if owner_id is None:
        return jsonify({'hata': 'Yetkisiz erişim'}), 403

    # Personel halı tipi güncelleyemez
    claims = get_jwt()
    if claims.get('role') == 'personnel':
        return jsonify({'hata': 'Halı tipi güncelleme yetkiniz yok'}), 403

    carpet_type = CarpetType.query.filter_by(id=ct_id, user_id=owner_id).first()
    if not carpet_type:
        return jsonify({'hata': 'Halı tipi bulunamadı'}), 404

    data = request.get_json()
    name = data.get('name', '').strip()
    price_per_m2 = data.get('price_per_m2')

    if not name:
        return jsonify({'hata': 'Halı tipi adı zorunludur'}), 400
    if price_per_m2 is None:
        return jsonify({'hata': 'm² fiyatı zorunludur'}), 400

    try:
        price_d = Decimal(str(price_per_m2))
        if price_d <= 0:
            return jsonify({'hata': 'm² fiyatı pozitif olmalıdır'}), 400
    except Exception:
        return jsonify({'hata': 'Geçersiz m² fiyatı'}), 400

    # Check for duplicate name (excluding current carpet type)
    existing_ct = CarpetType.query.filter(
        CarpetType.user_id == owner_id,
        CarpetType.name == name,
        CarpetType.id != ct_id
    ).first()
    if existing_ct:
        return jsonify({'hata': f"'{name}' adında bir halı tipi zaten mevcut."}), 409

    carpet_type.name = name
    carpet_type.price_per_m2 = price_d
    db.session.commit()
    return jsonify(_serialize_carpet_type(carpet_type)), 200

@carpet_types_bp.route('/<int:ct_id>', methods=['DELETE'])
@jwt_required()
def delete_carpet_type(ct_id):
    owner_id = get_owner_id()
    if owner_id is None:
        return jsonify({'hata': 'Yetkisiz erişim'}), 403

    # Personel halı tipi silemez
    claims = get_jwt()
    if claims.get('role') == 'personnel':
        return jsonify({'hata': 'Halı tipi silme yetkiniz yok'}), 403

    carpet_type = CarpetType.query.filter_by(id=ct_id, user_id=owner_id).first()
    if not carpet_type:
        return jsonify({'hata': 'Halı tipi bulunamadı'}), 404

    # NOTE: Halı tipi siparişlerde kullanılmış olsa bile silinebilir.
    # Sipariş kalemlerindeki hali_tipi string olduğu için doğrudan FK kontrolü yok.
    # Eğer bu kontrolü istersen, OrderItem tablosunda hali_tipi alanını CarpetType'a FK yapman gerekir.

    db.session.delete(carpet_type)
    db.session.commit()
    return jsonify({'mesaj': 'Halı tipi başarıyla silindi'}), 200