from datetime import datetime, timezone
from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from app.extensions import db, limiter
from app.models.user import User
from app.models.personnel import Personnel
from app.models.user_log import UserLog

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    data = request.get_json()
    
    if not data:
        return jsonify({'hata': 'Veri gönderilmedi'}), 400
    
    identifier = data.get('email', '').strip() # Hem email hem telefon gelebilir
    password = data.get('password', '')
    
    if not identifier or not password:
        return jsonify({'hata': 'Email ve şifre zorunludur'}), 400
    
    # Önce User (Patron) kontrolü
    kullanici = User.query.filter_by(email=identifier).first()
    
    if kullanici:
        role = kullanici.role
    else: # Eğer User bulunamazsa Personnel kontrolü
        # User bulunamadıysa Personnel (Çalışan) kontrolü
        # Hem email hem telefon ile ara
        kullanici = Personnel.query.filter(
            (Personnel.email == identifier) |
            (Personnel.telefon == identifier.replace(" ", ""))
        ).first()
        if not kullanici:
            return jsonify({'hata': 'Giriş bilgileri hatalı'}), 401
        role = 'personnel'

    if not check_password_hash(kullanici.password_hash, password):
        return jsonify({'hata': 'Giriş bilgileri hatalı'}), 401
    
    # 2. Kapi: Aktif mi?
    if not kullanici.aktif:
        return jsonify({'hata': 'Hesabınız pasif durumda. Yöneticinize başvurun.'}), 403
    
    # 3. Kapi: Gecerlilik tarihi (Sadece User/Admin için)
    if role != 'personnel':
        if kullanici.gecerlilik_tarihi and kullanici.gecerlilik_tarihi < datetime.now(timezone.utc).replace(tzinfo=None):
            return jsonify({
                'hata': 'Hesabınızın geçerlilik süresi dolmuştur.',
                'gecerlilik_tarihi': kullanici.gecerlilik_tarihi.isoformat()
            }), 403
    
    access_token = create_access_token(
        identity=str(kullanici.id),
        additional_claims={'role': role}
    )
    
    # Response verisini rol bazlı hazırla
    res_user = {
        'id': kullanici.id,
        'role': role,
        'aktif': kullanici.aktif
    }
    
    if role == 'personnel':
        res_user['email'] = f"{kullanici.ad} {kullanici.soyad}"
    else:
        res_user['email'] = kullanici.email
        res_user['gecerlilik_tarihi'] = kullanici.gecerlilik_tarihi.isoformat() if kullanici.gecerlilik_tarihi else None

    # Başarılı girişi logla
    owner_id = kullanici.user_id if role == 'personnel' else kullanici.id
    isim = kullanici.email
    patron = db.session.get(User, owner_id)
    patron_email = patron.email if patron else "Bilinmiyor"
    log = UserLog(
        user_id=owner_id,
        changed_by_id=owner_id, # Veritabanı kısıtlamasını aşmak için Patron ID'si verilir
        islem=f'Sisteme Başarılı Giriş',
        eski_deger='',
        yeni_deger='Giriş Yapıldı',
        aciklama=f"İşlemi Yapan: [ID: {kullanici.id}] {isim} ({'Personel' if role == 'personnel' else 'Patron'}) | Patron: [ID: {owner_id}] {patron_email}"
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        'mesaj': 'Giriş başarılı',
        'access_token': access_token,
        'kullanici': res_user
    }), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    role = claims.get('role')

    if role == 'personnel':
        kullanici = Personnel.query.get(user_id)
    else:
        kullanici = User.query.get(user_id)
    
    if not kullanici:
        return jsonify({'hata': 'Kullanıcı bulunamadı'}), 404
    
    res_data = {
        'id': kullanici.id,
        'role': role,
        'aktif': kullanici.aktif
    }

    if role == 'personnel':
        res_data['email'] = f"{kullanici.ad} {kullanici.soyad}"
    else:
        res_data['email'] = kullanici.email
        res_data['gecerlilik_tarihi'] = kullanici.gecerlilik_tarihi.isoformat() if kullanici.gecerlilik_tarihi else None

    return jsonify(res_data), 200

@auth_bp.route('/sifre', methods=['PUT'])
@jwt_required()
def update_password():
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    role = claims.get('role')

    if role == 'personnel':
        kullanici = Personnel.query.get(user_id)
    else:
        kullanici = User.query.get(user_id)
    
    if not kullanici:
        return jsonify({'hata': 'Kullanıcı bulunamadı'}), 404
    
    data = request.get_json()
    if not data:
        return jsonify({'hata': 'Veri gönderilmedi'}), 400
    
    eski_sifre = data.get('eski_sifre')
    yeni_sifre = data.get('yeni_sifre')
    
    if not eski_sifre:
        return jsonify({'hata': 'Eski şifre zorunludur'}), 400
    if not yeni_sifre:
        return jsonify({'hata': 'Yeni şifre zorunludur'}), 400
    if len(yeni_sifre) < 8:
        return jsonify({'hata': 'Yeni şifre en az 8 karakter olmalıdır'}), 400
    if eski_sifre == yeni_sifre:
        return jsonify({'hata': 'Yeni şifre eskisiyle aynı olamaz'}), 400
    
    if not check_password_hash(kullanici.password_hash, eski_sifre):
        return jsonify({'hata': 'Eski şifre hatalı'}), 401
    
    kullanici.password_hash = generate_password_hash(yeni_sifre, method='pbkdf2:sha256')
    
    owner_id = kullanici.user_id if role == 'personnel' else kullanici.id
    isim = kullanici.email
    patron = db.session.get(User, owner_id)
    patron_email = patron.email if patron else "Bilinmiyor"
    log = UserLog(
        user_id=owner_id,
        changed_by_id=owner_id, # Veritabanı kısıtlamasını aşmak için Patron ID'si verilir
        islem='Güvenlik: Kendi Şifresini Değiştirdi',
        eski_deger='****',
        yeni_deger='****',
        aciklama=f"İşlemi Yapan: [ID: {kullanici.id}] {isim} ({'Personel' if role == 'personnel' else 'Patron'}) | Patron: [ID: {owner_id}] {patron_email}"
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({'mesaj': 'Şifre başarıyla güncellendi'}), 200