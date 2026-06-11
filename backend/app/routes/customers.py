from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.extensions import db
from app.models.customer import Customer
from app.utils.auth_utils import get_owner_id # Import from utils

customers_bp = Blueprint('customers', __name__, url_prefix='/customers')

@customers_bp.route('', methods=['GET'])
@jwt_required()
def get_customers():
    owner_id = get_owner_id()
    musteriler = Customer.query.filter_by(user_id=owner_id).order_by(Customer.created_at.desc()).all()
    
    sonuc = []
    for m in musteriler:
        sonuc.append({
            'id': m.id,
            'ad': m.ad,
            'soyad': m.soyad,
            'telefon': m.telefon,
            'adres': m.adres,
            'created_at': m.created_at.isoformat()
        })
    
    return jsonify({'musteriler': sonuc}), 200


@customers_bp.route('/<int:customer_id>', methods=['GET'])
@jwt_required()
def get_customer(customer_id):
    owner_id = get_owner_id()
    musteri = Customer.query.get(customer_id)
    
    if not musteri:
        return jsonify({'hata': 'Müşteri bulunamadı'}), 404
    if musteri.user_id != owner_id:
        return jsonify({'hata': 'Bu işlem için yetkiniz yok'}), 403
    
    return jsonify({
        'id': musteri.id,
        'ad': musteri.ad,
        'soyad': musteri.soyad,
        'telefon': musteri.telefon,
        'adres': musteri.adres,
        'created_at': musteri.created_at.isoformat()
    }), 200


@customers_bp.route('', methods=['POST'])
@jwt_required()
def create_customer():
    owner_id = get_owner_id()
    data = request.get_json()
    
    if not data:
        return jsonify({'hata': 'Veri gönderilmedi'}), 400
    
    ad = data.get('ad')
    soyad = data.get('soyad')
    telefon = data.get('telefon')
    adres = data.get('adres')
    
    if not ad:
        return jsonify({'hata': 'Ad zorunludur'}), 400
    if not soyad:
        return jsonify({'hata': 'Soyad zorunludur'}), 400
    if not telefon:
        return jsonify({'hata': 'Telefon zorunludur'}), 400
    
    mevcut = Customer.query.filter_by(user_id=owner_id, telefon=telefon).first()
    if mevcut:
        return jsonify({'hata': 'Bu telefon numarasıyla zaten bir müşteri kayıtlı'}), 409
    
    yeni_musteri = Customer(
        user_id=owner_id,
        ad=ad,
        soyad=soyad,
        telefon=telefon,
        adres=adres
    )
    db.session.add(yeni_musteri)
    db.session.commit()
    
    return jsonify({
        'mesaj': 'Müşteri eklendi',
        'musteri': {
            'id': yeni_musteri.id,
            'ad': yeni_musteri.ad,
            'soyad': yeni_musteri.soyad,
            'telefon': yeni_musteri.telefon,
            'adres': yeni_musteri.adres
        }
    }), 201


@customers_bp.route('/<int:customer_id>', methods=['PUT'])
@jwt_required()
def update_customer(customer_id):
    owner_id = get_owner_id()
    musteri = Customer.query.get(customer_id)
    
    if not musteri:
        return jsonify({'hata': 'Müşteri bulunamadı'}), 404
    if musteri.user_id != owner_id:
        return jsonify({'hata': 'Bu işlem için yetkiniz yok'}), 403
    
    data = request.get_json()
    if not data:
        return jsonify({'hata': 'Veri gönderilmedi'}), 400
    
    if 'ad' in data:
        musteri.ad = data['ad']
    if 'soyad' in data:
        musteri.soyad = data['soyad']
    if 'telefon' in data:
        baska = Customer.query.filter_by(user_id=owner_id, telefon=data['telefon']).first()
        if baska and baska.id != musteri.id:
            return jsonify({'hata': 'Bu telefon numarası başka bir müşteride kayıtlı'}), 409
        musteri.telefon = data['telefon']
    if 'adres' in data:
        musteri.adres = data['adres']
    
    db.session.commit()
    
    return jsonify({
        'mesaj': 'Müşteri güncellendi',
        'musteri': {
            'id': musteri.id,
            'ad': musteri.ad,
            'soyad': musteri.soyad,
            'telefon': musteri.telefon,
            'adres': musteri.adres
        }
    }), 200


@customers_bp.route('/<int:customer_id>', methods=['DELETE'])
@jwt_required()
def delete_customer(customer_id):
    owner_id = get_owner_id()
    musteri = Customer.query.get(customer_id)
    
    if not musteri:
        return jsonify({'hata': 'Müşteri bulunamadı'}), 404
    if musteri.user_id != owner_id:
        return jsonify({'hata': 'Bu işlem için yetkiniz yok'}), 403
    
    # Siparis kontrolu (henuz orders tablosu yok ama hazir olsun)
    # Adim 8'de orders gelince bu calisacak
    if hasattr(musteri, 'orders') and len(musteri.orders) > 0:
        return jsonify({
            'hata': f'Bu müşterinin {len(musteri.orders)} adet siparişi var. Önce siparişleri silmelisiniz.',
            'siparis_sayisi': len(musteri.orders)
        }), 409
    
    db.session.delete(musteri)
    db.session.commit()
    
    return jsonify({'mesaj': 'Müşteri silindi'}), 200