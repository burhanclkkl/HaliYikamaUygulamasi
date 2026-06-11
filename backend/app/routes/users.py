from datetime import datetime
from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash
from flask_jwt_extended import get_jwt_identity
from app.extensions import db
from app.models.user import User
from app.models.user_log import UserLog
from app.models.personnel import Personnel
from app.decorators import admin_required

users_bp = Blueprint('users', __name__, url_prefix='/users')


@users_bp.route('', methods=['GET'])
@admin_required
def get_users():
    kullanicilar = User.query.order_by(User.id).all()
    
    sonuc = []
    for u in kullanicilar:
        personel_sayisi = Personnel.query.filter_by(user_id=u.id).count()
        # personnel_limit None olabilir, bu yüzden kontrol ediyoruz.
        user_personnel_limit = u.personnel_limit if u.personnel_limit is not None else 0
        sonuc.append({
            'id': u.id,
            'email': u.email,
            'phone': u.phone,
            'role': u.role,
            'aktif': u.aktif,
            'personnel_limit': user_personnel_limit,
            'personnel_count': personel_sayisi,
            'gecerlilik_tarihi': u.gecerlilik_tarihi.isoformat() if u.gecerlilik_tarihi else None,
            'created_at': u.created_at.isoformat()
        })
    
    return jsonify({'kullanicilar': sonuc}), 200


@users_bp.route('', methods=['POST'])
@admin_required
def create_user():
    data = request.get_json()
    if not data:
        return jsonify({'hata': 'Veri gönderilmedi'}), 400
    
    email = data.get('email')
    password = data.get('password')
    phone = data.get('phone')
    
    if not email or not password or not phone:
        return jsonify({'hata': 'Email, şifre ve telefon zorunludur'}), 400
    if '@' not in email:
        return jsonify({'hata': 'Geçerli bir email giriniz'}), 400
    if len(password) < 8:
        return jsonify({'hata': 'Şifre en az 8 karakter olmalıdır'}), 400
        
    mevcut = User.query.filter_by(email=email).first()
    if mevcut:
        return jsonify({'hata': 'Bu email zaten kayıtlı'}), 409
        
    hashed = generate_password_hash(password, method='pbkdf2:sha256')
    yeni_kullanici = User(email=email, password_hash=hashed, phone=phone, aktif=True, personnel_limit=3)
    
    db.session.add(yeni_kullanici)
    db.session.flush() # ID'yi alabilmek için
    
    admin_id = int(get_jwt_identity())
    admin = User.query.get(admin_id)
    log = UserLog(
        user_id=yeni_kullanici.id,
        changed_by_id=admin_id,
        islem=f"Yeni Kullanıcı (ID: {yeni_kullanici.id} | {email}) Eklendi",
        eski_deger="",
        yeni_deger="Sisteme Kaydedildi",
        aciklama=f"İşlemi Yapan: [ID: {admin.id}] {admin.email} (Admin) | Patron: [ID: {yeni_kullanici.id}] {yeni_kullanici.email}"
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({
        'mesaj': 'Kullanıcı başarıyla oluşturuldu',
        'kullanici': {
            'id': yeni_kullanici.id,
            'email': yeni_kullanici.email
        }
    }), 201


@users_bp.route('/<int:user_id>/aktif', methods=['PUT'])
@admin_required
def update_aktif(user_id):
    kullanici = User.query.get(user_id)
    if not kullanici:
        return jsonify({'hata': 'Kullanıcı bulunamadı'}), 404
    
    data = request.get_json()
    if not data or 'aktif' not in data:
        return jsonify({'hata': 'aktif alanı zorunludur (true/false)'}), 400
    
    yeni_aktif = data['aktif']
    if not isinstance(yeni_aktif, bool):
        return jsonify({'hata': 'aktif true veya false olmalıdır'}), 400
    
    admin_id = int(get_jwt_identity())
    if kullanici.id == admin_id and not yeni_aktif:
        return jsonify({'hata': 'Kendi hesabınızı pasif yapamazsınız'}), 400
    
    if kullanici.aktif == yeni_aktif:
        return jsonify({'mesaj': 'Değişiklik yapılmadı (aynı değer)'}), 200
    
    kullanici.aktif = yeni_aktif
    db.session.commit()
    
    return jsonify({
        'mesaj': 'Aktiflik durumu güncellendi',
        'kullanici': {
            'id': kullanici.id,
            'email': kullanici.email,
            'aktif': kullanici.aktif
        }
    }), 200


@users_bp.route('/<int:user_id>/password', methods=['PUT'])
@admin_required
def change_user_password(user_id):
    kullanici = db.session.get(User, user_id)
    if not kullanici:
        return jsonify({'hata': 'Kullanıcı bulunamadı'}), 404
    
    data = request.get_json()
    yeni_sifre = data.get('yeni_sifre')
    if not yeni_sifre or len(yeni_sifre) < 8:
        return jsonify({'hata': 'Şifre en az 8 karakter olmalıdır'}), 400
        
    kullanici.password_hash = generate_password_hash(yeni_sifre, method='pbkdf2:sha256')
    
    admin_id = int(get_jwt_identity())
    admin = db.session.get(User, admin_id)
    log = UserLog(
        user_id=kullanici.id,
        changed_by_id=admin_id,
        islem=f'Kullanıcı ({kullanici.email}) Şifre Güncelleme',
        eski_deger='****',
        yeni_deger='****',
        aciklama=f"İşlemi Yapan: [ID: {admin.id}] {admin.email} (Admin) | Patron: [ID: {kullanici.id}] {kullanici.email}"
    )
    db.session.add(log)
    db.session.commit()
    return jsonify({'mesaj': 'Kullanıcı şifresi başarıyla güncellendi'}), 200


@users_bp.route('/<int:user_id>/gecerlilik', methods=['PUT'])
@admin_required
def update_gecerlilik(user_id):
    kullanici = User.query.get(user_id)
    if not kullanici:
        return jsonify({'hata': 'Kullanıcı bulunamadı'}), 404
    
    data = request.get_json()
    if not data:
        return jsonify({'hata': 'Veri gönderilmedi'}), 400
    
    yeni_tarih_str = data.get('gecerlilik_tarihi')
    
    yeni_tarih = None
    if yeni_tarih_str:
        try:
            yeni_tarih = datetime.fromisoformat(yeni_tarih_str)
        except ValueError:
            return jsonify({'hata': 'Geçersiz tarih formatı (örn: 2026-12-31)'}), 400
    
    if kullanici.gecerlilik_tarihi == yeni_tarih:
        return jsonify({'mesaj': 'Değişiklik yapılmadı (aynı değer)'}), 200
    
    kullanici.gecerlilik_tarihi = yeni_tarih
    db.session.commit()
    
    return jsonify({
        'mesaj': 'Geçerlilik tarihi güncellendi',
        'kullanici': {
            'id': kullanici.id,
            'email': kullanici.email,
            'gecerlilik_tarihi': kullanici.gecerlilik_tarihi.isoformat() if kullanici.gecerlilik_tarihi else None
        }
    }), 200


@users_bp.route('/<int:user_id>/limit', methods=['PUT'])
@admin_required
def update_personnel_limit(user_id):
    kullanici = User.query.get(user_id)
    if not kullanici:
        return jsonify({'hata': 'Kullanıcı bulunamadı'}), 404
    
    data = request.get_json()
    yeni_limit = data.get('personnel_limit')
    
    if yeni_limit is None or not isinstance(yeni_limit, int) or yeni_limit < 0:
        return jsonify({'hata': 'Geçerli bir limit sayısı giriniz'}), 400
        
    kullanici.personnel_limit = yeni_limit
    db.session.commit()
    return jsonify({
        'mesaj': 'Personel limiti güncellendi', 
        'personnel_limit': kullanici.personnel_limit
    }), 200


@users_bp.route('/<int:user_id>/personnel', methods=['GET'])
@admin_required
def get_user_personnels_admin(user_id):
    kullanici = User.query.get(user_id)
    if not kullanici:
        return jsonify({'hata': 'Kullanıcı bulunamadı'}), 404
    
    personeller = Personnel.query.filter_by(user_id=user_id).all()
    return jsonify([{
        'id': p.id,
        'ad': p.ad,
        'soyad': p.soyad,
        'email': p.email,
        'telefon': p.telefon,
        'aktif': p.aktif,
        'created_at': p.created_at.isoformat()
    } for p in personeller]), 200

@users_bp.route('/personnel/<int:p_id>/aktif', methods=['PUT'])
@admin_required
def toggle_personnel_admin(p_id):
    p = Personnel.query.get(p_id)
    if not p: return jsonify({'hata': 'Personel bulunamadı'}), 404
    p.aktif = not p.aktif
    
    admin_id = int(get_jwt_identity())
    admin = db.session.get(User, admin_id)
    patron = db.session.get(User, p.user_id)
    log = UserLog(
        user_id=p.user_id,
        changed_by_id=admin_id,
        islem=f'Personel (ID: {p.id} | {p.ad} {p.soyad}) Güncellendi',
        eski_deger='Aktif / Evet' if not p.aktif else 'Pasif / Hayır',
        yeni_deger='Aktif / Evet' if p.aktif else 'Pasif / Hayır',
        aciklama=f"İşlemi Yapan: [ID: {admin.id}] {admin.email} (Admin) | Patron: [ID: {patron.id}] {patron.email}"
    )
    db.session.add(log)
    db.session.commit()
    return jsonify({'mesaj': 'Durum güncellendi', 'aktif': p.aktif}), 200

@users_bp.route('/personnel/<int:p_id>/password', methods=['PUT'])
@admin_required
def change_personnel_password_admin(p_id):
    p = Personnel.query.get(p_id)
    if not p: return jsonify({'hata': 'Personel bulunamadı'}), 404
    
    data = request.get_json()
    yeni_sifre = data.get('yeni_sifre')
    if not yeni_sifre or len(yeni_sifre) < 8:
        return jsonify({'hata': 'Şifre en az 8 karakter olmalıdır'}), 400
        
    p.password_hash = generate_password_hash(yeni_sifre, method='pbkdf2:sha256')
    
    admin_id = int(get_jwt_identity())
    admin = db.session.get(User, admin_id)
    patron = db.session.get(User, p.user_id)
    log = UserLog(
        user_id=p.user_id,
        changed_by_id=admin_id,
        islem=f'Personel (ID: {p.id} | {p.ad} {p.soyad}) Şifre Güncelleme',
        eski_deger='****',
        yeni_deger='****',
        aciklama=f"İşlemi Yapan: [ID: {admin.id}] {admin.email} (Admin) | Patron: [ID: {patron.id}] {patron.email}"
    )
    db.session.add(log)
    db.session.commit()
    return jsonify({'mesaj': 'Şifre güncellendi'}), 200

@users_bp.route('/<int:user_id>/personnel', methods=['POST'])
@admin_required
def admin_add_personnel(user_id):
    kullanici = User.query.get(user_id)
    if not kullanici:
        return jsonify({'hata': 'Kullanıcı bulunamadı'}), 404
        
    # Limit Kontrolü (Admin eklerken de geçerli olsun)
    limit = kullanici.personnel_limit if kullanici.personnel_limit is not None else 0
    current_count = Personnel.query.filter_by(user_id=user_id).count()
    if current_count >= limit:
        return jsonify({"hata": f"Bu kullanıcının personel limiti ({limit}) dolmuş. Önce limiti artırmalısınız."}), 403

    data = request.get_json()
    ad = data.get('ad')
    soyad = data.get('soyad')
    email = data.get('email')
    telefon = data.get('telefon')
    password = data.get('password')

    if not all([ad, soyad, email, password]):
        return jsonify({'hata': 'Ad, soyad, email ve şifre zorunludur'}), 400

    if Personnel.query.filter_by(email=email).first():
        return jsonify({'hata': 'Bu email adresi zaten bir personelde kayıtlı'}), 409

    yeni_p = Personnel(
        user_id=user_id,
        ad=ad,
        soyad=soyad,
        email=email,
        telefon=telefon,
        password_hash=generate_password_hash(password, method='pbkdf2:sha256'),
        aktif=True
    )
    db.session.add(yeni_p)
    db.session.flush() # ID'yi alabilmek için
    
    admin_id = int(get_jwt_identity())
    admin = db.session.get(User, admin_id)
    patron = db.session.get(User, user_id)
    log = UserLog(
        user_id=user_id,
        changed_by_id=admin_id,
        islem=f"Yeni Personel (ID: {yeni_p.id} | {yeni_p.ad} {yeni_p.soyad}) Eklendi",
        eski_deger="",
        yeni_deger="Sisteme Kaydedildi",
        aciklama=f"İşlemi Yapan: [ID: {admin.id}] {admin.email} (Admin) | Patron: [ID: {patron.id}] {patron.email}"
    )
    db.session.add(log)
    db.session.commit()
    return jsonify({'mesaj': 'Personel başarıyla eklendi'}), 201

@users_bp.route('/personnel/<int:p_id>', methods=['PUT'])
@admin_required
def update_personnel_admin(p_id):
    p = Personnel.query.get(p_id)
    if not p:
        return jsonify({'hata': 'Personel bulunamadı'}), 404
        
    data = request.get_json()
    if not data:
        return jsonify({'hata': 'Veri gönderilmedi'}), 400
        
    email = data.get('email', '').strip()
    if email and email != p.email:
        existing_user = User.query.filter_by(email=email).first()
        existing_personnel = Personnel.query.filter(Personnel.email == email).first()
        if existing_user or existing_personnel:
            return jsonify({'hata': 'Bu e-posta adresi zaten kullanımda'}), 409
        p.email = email
        
    ad = data.get('ad', '').strip()
    soyad = data.get('soyad', '').strip()
    telefon = data.get('telefon', '').strip()
    
    if ad: p.ad = ad
    if soyad: p.soyad = soyad
    if telefon is not None: p.telefon = telefon
    
    admin_id = int(get_jwt_identity())
    admin = db.session.get(User, admin_id)
    patron = db.session.get(User, p.user_id)
    log = UserLog(
        user_id=p.user_id,
        changed_by_id=admin_id,
        islem=f"Personel (ID: {p.id} | {p.ad} {p.soyad}) Güncellendi",
        eski_deger="Mevcut Bilgiler",
        yeni_deger="Yeni Bilgiler",
        aciklama=f"İşlemi Yapan: [ID: {admin.id}] {admin.email} (Admin) | Patron: [ID: {patron.id}] {patron.email}"
    )
    db.session.add(log)
    db.session.commit()
    return jsonify({'mesaj': 'Personel başarıyla güncellendi'}), 200

@users_bp.route('/personnel/<int:p_id>', methods=['DELETE'])
@admin_required
def delete_personnel_admin(p_id):
    p = Personnel.query.get(p_id)
    if not p: return jsonify({'hata': 'Personel bulunamadı'}), 404
    
    admin_id = int(get_jwt_identity())
    admin = db.session.get(User, admin_id)
    patron = db.session.get(User, p.user_id)
    log = UserLog(
        user_id=p.user_id,
        changed_by_id=admin_id,
        islem=f"Personel (ID: {p.id} | {p.ad} {p.soyad}) Silindi",
        eski_deger="Mevcut Kayıt",
        yeni_deger="Kalıcı Olarak Silindi",
        aciklama=f"İşlemi Yapan: [ID: {admin.id}] {admin.email} (Admin) | Patron: [ID: {patron.id}] {patron.email}"
    )
    db.session.add(log)
    db.session.delete(p)
    db.session.commit()
    return jsonify({'mesaj': 'Personel silindi'}), 200


@users_bp.route('/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    kullanici = db.session.get(User, user_id)
    if not kullanici:
        return jsonify({'hata': 'Kullanıcı bulunamadı'}), 404
        
    admin_id = int(get_jwt_identity())
    if kullanici.id == admin_id:
        return jsonify({'hata': 'Kendi hesabınızı silemezsiniz.'}), 400
        
    # Silinmekte olan kullanıcıya ait alt verilerin sayısını çıkarıyoruz
    from app.models.customer import Customer
    from app.models.order import Order
    
    musteri_sayisi = Customer.query.filter_by(user_id=user_id).count()
    siparis_sayisi = Order.query.filter_by(user_id=user_id).count()
    personel_sayisi = Personnel.query.filter_by(user_id=user_id).count()

    # Logları silmek yerine Admin hesabına devrediyoruz (Geçmişi kaybetmemek için Arşivleme)
    eski_loglar = UserLog.query.filter((UserLog.user_id == user_id) | (UserLog.changed_by_id == user_id)).all()
    for log in eski_loglar:
        if log.user_id == user_id:
            log.user_id = admin_id
            log.aciklama = f"[Silinen Kullanıcı: {kullanici.email}] " + (log.aciklama or "")
        if log.changed_by_id == user_id:
            log.changed_by_id = admin_id

    # Değişiklikleri DB'ye yansıt ki kullanıcı silinirken Yabancı Anahtar (FK) hatası çıkmasın
    db.session.flush()

    admin = db.session.get(User, admin_id)
    # Silme işleminin kendisini de logluyoruz
    silme_logu = UserLog(
        user_id=admin_id,
        changed_by_id=admin_id,
        islem=f'Kullanıcı ({kullanici.email}) Silindi',
        eski_deger=f"{musteri_sayisi} Müşteri, {siparis_sayisi} Sipariş, {personel_sayisi} Personel",
        yeni_deger="Kalıcı Olarak Silindi",
        aciklama=f"İşlemi Yapan: [ID: {admin.id}] {admin.email} (Admin) | Patron: [ID: {kullanici.id}] {kullanici.email} (Tüm veriler temizlendi)"
    )
    db.session.add(silme_logu)

    db.session.delete(kullanici)
    db.session.commit()
    return jsonify({'mesaj': 'Kullanıcı silindi ve geçmişi arşivlendi'}), 200


@users_bp.route('/<int:user_id>/logs', methods=['GET'])
@admin_required
def get_user_logs(user_id):
    kullanici = User.query.get(user_id)
    if not kullanici:
        return jsonify({'hata': 'Kullanıcı bulunamadı'}), 404
    
    loglar = UserLog.query.filter_by(user_id=user_id).order_by(
        UserLog.created_at.desc()
    ).all()
    
    sonuc = []
    for log in loglar:
        sonuc.append({
            'id': log.id,
            'islem': log.islem,
            'eski_deger': log.eski_deger,
            'yeni_deger': log.yeni_deger,
            'aciklama': log.aciklama,
            'changed_by_email': log.changed_by.email,
            'created_at': log.created_at.isoformat()
        })
    
    return jsonify({
        'kullanici': kullanici.email,
        'loglar': sonuc
    }), 200