from decimal import Decimal
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from app.extensions import db
from app.constants import GECERLI_ODEME_TURLERI
from app.models.order import Order
from app.models.payment import Payment
from app.utils.auth_utils import get_owner_id # Import from utils

payments_bp = Blueprint('payments', __name__, url_prefix='/orders')

@payments_bp.route('/<int:order_id>/payments', methods=['POST'])
@jwt_required()
def create_payment(order_id):
    owner_id = get_owner_id()
    siparis = Order.query.get(order_id)
    
    if not siparis:
        return jsonify({'hata': 'Sipariş bulunamadı'}), 404
    if siparis.user_id != owner_id:
        return jsonify({'hata': 'Bu işlem için yetkiniz yok'}), 403
    
    data = request.get_json()
    if not data:
        return jsonify({'hata': 'Veri gönderilmedi'}), 400
    
    tutar = data.get('tutar')
    odeme_turu = data.get('odeme_turu')
    aciklama = data.get('aciklama')
    
    if tutar is None:
        return jsonify({'hata': 'tutar zorunludur'}), 400
    if not odeme_turu:
        return jsonify({'hata': 'odeme_turu zorunludur'}), 400
    if odeme_turu not in GECERLI_ODEME_TURLERI:
        return jsonify({
            'hata': f'Geçersiz ödeme türü. Olası değerler: {", ".join(GECERLI_ODEME_TURLERI)}'
        }), 400
    
    try:
        tutar_d = Decimal(str(tutar))
    except Exception:
        return jsonify({'hata': 'Geçersiz tutar'}), 400
    
    if tutar_d <= 0:
        return jsonify({'hata': 'Tutar pozitif olmalıdır'}), 400
    
    toplam = sum((it.tutar for it in siparis.items), Decimal('0'))
    odenen = sum((p.tutar for p in siparis.payments), Decimal('0'))
    kalan = toplam - odenen
    
    if tutar_d > kalan:
        return jsonify({
            'hata': f'Ödeme tutarı kalan borçtan fazla. Kalan: {float(kalan)} TL',
            'toplam': float(toplam),
            'odenen': float(odenen),
            'kalan': float(kalan)
        }), 400
    
    yeni_odeme = Payment(
        order_id=order_id,
        tutar=tutar_d,
        odeme_turu=odeme_turu,
        aciklama=aciklama
    )
    db.session.add(yeni_odeme)
    db.session.commit()
    
    yeni_odenen = odenen + tutar_d
    yeni_kalan = toplam - yeni_odenen
    
    return jsonify({
        'mesaj': 'Ödeme kaydedildi',
        'odeme': {
            'id': yeni_odeme.id,
            'tutar': float(yeni_odeme.tutar),
            'odeme_turu': yeni_odeme.odeme_turu,
            'aciklama': yeni_odeme.aciklama,
            'created_at': yeni_odeme.created_at.isoformat()
        },
        'siparis_durumu': {
            'toplam': float(toplam),
            'odenen': float(yeni_odenen),
            'kalan': float(yeni_kalan),
            'tamamen_odendi': yeni_kalan == 0
        }
    }), 201


@payments_bp.route('/<int:order_id>/payments', methods=['GET'])
@jwt_required()
def get_payments(order_id):
    owner_id = get_owner_id()
    siparis = Order.query.get(order_id)
    
    if not siparis:
        return jsonify({'hata': 'Sipariş bulunamadı'}), 404
    if siparis.user_id != owner_id:
        return jsonify({'hata': 'Bu işlem için yetkiniz yok'}), 403
    
    odemeler = sorted(siparis.payments, key=lambda p: p.created_at)
    
    sonuc = []
    for p in odemeler:
        sonuc.append({
            'id': p.id,
            'tutar': float(p.tutar),
            'odeme_turu': p.odeme_turu,
            'aciklama': p.aciklama,
            'created_at': p.created_at.isoformat()
        })
    
    toplam = sum((it.tutar for it in siparis.items), Decimal('0'))
    odenen = sum((p.tutar for p in siparis.payments), Decimal('0'))
    
    return jsonify({
        'siparis_id': siparis.id,
        'toplam': float(toplam),
        'odenen': float(odenen),
        'kalan': float(toplam - odenen),
        'tamamen_odendi': (toplam - odenen) == 0,
        'odemeler': sonuc
    }), 200


@payments_bp.route('/<int:order_id>/payments/<int:payment_id>', methods=['DELETE'])
@jwt_required()
def delete_payment(order_id, payment_id):
    owner_id = get_owner_id()
    siparis = Order.query.get(order_id)
    
    if not siparis:
        return jsonify({'hata': 'Sipariş bulunamadı'}), 404
    if siparis.user_id != owner_id:
        return jsonify({'hata': 'Bu işlem için yetkiniz yok'}), 403
    
    odeme = Payment.query.get(payment_id)
    if not odeme or odeme.order_id != order_id:
        return jsonify({'hata': 'Ödeme bulunamadı'}), 404
    
    db.session.delete(odeme)
    db.session.commit()
    
    return jsonify({'mesaj': 'Ödeme silindi'}), 200