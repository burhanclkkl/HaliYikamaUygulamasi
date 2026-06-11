from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.extensions import db
from app.models.personnel import Personnel
from app.models.user import User
from app.models.user_log import UserLog
from app.utils.auth_utils import get_owner_id

personnel_bp = Blueprint('personnel', __name__, url_prefix='/personnel')

# GET /personnel
@personnel_bp.route('', methods=['GET'])
@jwt_required()
def get_personnels():
    owner_id = get_owner_id()
    personeller = Personnel.query.filter_by(user_id=owner_id).all()
    return jsonify([{
        'id': p.id,
        'ad': p.ad,
        'soyad': p.soyad,
        'email': p.email,
        'telefon': p.telefon,
        'aktif': p.aktif
    } for p in personeller]), 200

# POST /personnel  <-- Hatalı olan URL düzeltildi ('/personnel' kaldırıldı)
@personnel_bp.route('', methods=['POST'])
@jwt_required()
def create_personnel():
    owner_id = get_owner_id()
    user = User.query.get(owner_id)
    
    if not user:
        return jsonify({"hata": "Kullanıcı bulunamadı"}), 404

    data = request.get_json()

    # Limit Kontrolü
    limit = user.personnel_limit if user.personnel_limit is not None else 0
    current_count = Personnel.query.filter_by(user_id=owner_id).count()
    if current_count >= limit:
        return jsonify({"hata": f"Personel limitinize ({limit}) ulaştınız. Artırmak için yöneticiyle iletişime geçin."}), 403

    # Veri ve email doğrulama (NotNullViolation hatasını engellemek için)
    if not data or 'email' not in data or not data['email'].strip():
        return jsonify({"hata": "E-posta adresi zorunludur"}), 400
        
    if 'password' not in data or not data['password'].strip():
        return jsonify({"hata": "Şifre zorunludur"}), 400

    new_personnel = Personnel(
        user_id=owner_id,
        ad=data.get('ad'),
        soyad=data.get('soyad'),
        email=data.get('email'),
        telefon=data.get('telefon'),
        password_hash=generate_password_hash(data.get('password'), method='pbkdf2:sha256'),
        aktif=data.get('aktif', True)  # Gönderilmezse varsayılan olarak True set edilir
    )

    try:
        db.session.add(new_personnel)
        db.session.flush() # ID'yi alabilmek için önce veritabanına yansıtıyoruz
        
        log = UserLog(
            user_id=owner_id,
            changed_by_id=owner_id,
            islem=f"Yeni Personel Eklendi (#{new_personnel.id})",
            eski_deger="",
            yeni_deger="Sisteme Kaydedildi",
            aciklama=f"İşlemi Yapan: [ID: {user.id}] {user.email} (Patron) | Patron: [ID: {user.id}] {user.email}"
        )
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"hata": "Personel kaydedilirken bir hata oluştu", "detay": str(e)}), 500

    return jsonify({"mesaj": "Personel başarıyla oluşturuldu"}), 201

# PUT /personnel/<id>/password
@personnel_bp.route('/<int:p_id>/password', methods=['PUT'])
@jwt_required()
def change_personnel_password(p_id):
    user_id = int(get_jwt_identity())
    personel = Personnel.query.filter_by(id=p_id, user_id=user_id).first()
    
    if not personel:
        return jsonify({'hata': 'Personel bulunamadı'}), 404
        
    data = request.get_json()
    yeni_sifre = data.get('yeni_sifre')
    
    if not yeni_sifre or len(yeni_sifre) < 8:
        return jsonify({'hata': 'Şifre en az 8 karakter olmalıdır'}), 400
        
    personel.password_hash = generate_password_hash(yeni_sifre, method='pbkdf2:sha256')
    
    patron = User.query.get(user_id)
    log = UserLog(
        user_id=user_id,
        changed_by_id=user_id,
        islem=f'Personel Şifresi Güncellendi (#{personel.id})',
        eski_deger='****',
        yeni_deger='****',
        aciklama=f"İşlemi Yapan: [ID: {patron.id}] {patron.email} (Patron) | Patron: [ID: {patron.id}] {patron.email}"
    )
    db.session.add(log)
    db.session.commit()
    return jsonify({'mesaj': 'Personel şifresi başarıyla güncellendi'}), 200

# PUT /personnel/<id>/aktif
@personnel_bp.route('/<int:p_id>/aktif', methods=['PUT'])
@jwt_required()
def toggle_personnel(p_id):
    user_id = int(get_jwt_identity())
    personel = Personnel.query.filter_by(id=p_id, user_id=user_id).first()
    if not personel: 
        return jsonify({'hata': 'Personel bulunamadı'}), 404
    
    personel.aktif = not personel.aktif
    
    patron = db.session.get(User, user_id)
    log = UserLog(
        user_id=user_id,
        changed_by_id=user_id,
        islem=f'Personel Durumu Güncellendi (#{personel.id})',
        eski_deger='Aktif / Evet' if not personel.aktif else 'Pasif / Hayır',
        yeni_deger='Aktif / Evet' if personel.aktif else 'Pasif / Hayır',
        aciklama=f"İşlemi Yapan: [ID: {patron.id}] {patron.email} (Patron) | Patron: [ID: {patron.id}] {patron.email}"
    )
    db.session.add(log)
    db.session.commit()
    return jsonify({'mesaj': 'Durum güncellendi', 'aktif': personel.aktif}), 200

# PUT /personnel/<id>
@personnel_bp.route('/<int:p_id>', methods=['PUT'])
@jwt_required()
def update_personnel(p_id):
    user_id = int(get_jwt_identity())
    personel = Personnel.query.filter_by(id=p_id, user_id=user_id).first()
    if not personel:
        return jsonify({'hata': 'Personel bulunamadı'}), 404
        
    data = request.get_json()
    if not data:
        return jsonify({'hata': 'Veri gönderilmedi'}), 400
        
    email = data.get('email', '').strip()
    if email and email != personel.email:
        if User.query.filter_by(email=email).first() or Personnel.query.filter_by(email=email).first():
            return jsonify({'hata': 'Bu e-posta adresi zaten kullanımda'}), 409
        personel.email = email
        
    ad = data.get('ad', '').strip()
    soyad = data.get('soyad', '').strip()
    telefon = data.get('telefon', '').strip()
    
    if ad: personel.ad = ad
    if soyad: personel.soyad = soyad
    if telefon is not None: personel.telefon = telefon
    
    patron = db.session.get(User, user_id)
    log = UserLog(
        user_id=user_id,
        changed_by_id=user_id,
        islem=f"Personel Güncellendi (#{personel.id})",
        eski_deger="Mevcut Bilgiler",
        yeni_deger="Yeni Bilgiler",
        aciklama=f"İşlemi Yapan: [ID: {patron.id}] {patron.email} (Patron) | Patron: [ID: {patron.id}] {patron.email}"
    )
    db.session.add(log)
    db.session.commit()
    return jsonify({'mesaj': 'Personel başarıyla güncellendi'}), 200

# DELETE /personnel/<id>
@personnel_bp.route('/<int:p_id>', methods=['DELETE'])
@jwt_required()
def delete_personnel(p_id):
    user_id = int(get_jwt_identity())
    personel = Personnel.query.filter_by(id=p_id, user_id=user_id).first()
    if not personel: 
        return jsonify({'hata': 'Personel bulunamadı'}), 404
        
    patron = db.session.get(User, user_id)
    log = UserLog(
        user_id=user_id,
        changed_by_id=user_id,
        islem=f"Personel Silindi (#{personel.id})",
        eski_deger="Mevcut Kayıt",
        yeni_deger="Kalıcı Olarak Silindi",
        aciklama=f"İşlemi Yapan: [ID: {patron.id}] {patron.email} (Patron) | Patron: [ID: {patron.id}] {patron.email}"
    )
    db.session.add(log)
    db.session.delete(personel)
    db.session.commit()
    return jsonify({'mesaj': 'Personel silindi'}), 200