from sqlalchemy import event
from flask import has_request_context
from flask_jwt_extended import get_jwt_identity, get_jwt
from app.extensions import db
from app.models.user_log import UserLog
from app.utils.auth_utils import get_owner_id
import logging

MODEL_NAMES = {
    'Order': 'Sipariş',
    'Customer': 'Müşteri',
    'Payment': 'Ödeme',
    'User': 'Kullanıcı',
    'CarpetType': 'Halı Tipi',
    'Expense': 'Harcama'
}

def get_target_name(obj):
    try:
        name = obj.__class__.__name__
        if name == 'User': return f"Kullanıcı ({obj.email})"
        if name == 'Personnel': return f"Personel ({obj.ad} {obj.soyad})"
        if name == 'Customer': return f"Müşteri ({obj.ad} {obj.soyad})"
        if name == 'Order': return f"Sipariş (#{obj.id})"
        if name == 'Payment': return f"Tahsilat (Sipariş #{obj.order_id})"
        if name == 'CarpetType': return f"Halı Tipi ({obj.name})"
        if name == 'Expense': return f"Harcama ({getattr(obj, 'kategori', 'Belirtilmemiş')})"
    except:
        pass
    return "Kayıt"

def translate_value(val):
    if val == "True": return "Aktif / Evet"
    if val == "False": return "Pasif / Hayır"
    if val == "None": return "Belirtilmemiş"
    return val[:50]

@event.listens_for(db.session, 'before_flush')
def log_automatic_changes(session, flush_context, instances):
    # Eğer sistemde bir HTTP isteği yoksa (örneğin sunucu kendi içinde işlem yapıyorsa) atla
    if not has_request_context():
        return
        
    try:
        kullanici_id = get_jwt_identity()
        if not kullanici_id:
            return
            
        claims = get_jwt()
        role = claims.get('role', 'user')
        owner_id = get_owner_id()
        
        rol_isim = "Admin" if role == 'admin' else ("Personel" if role == 'personnel' else "Patron")
        
        # İşlemi yapanın e-posta bilgisini veritabanından al
        from app.models.user import User
        from app.models.personnel import Personnel
        
        actor_email = "Bilinmiyor"
        patron_email = "Bilinmiyor"
        with db.session.no_autoflush:
            patron = db.session.get(User, int(owner_id))
            if patron:
                patron_email = patron.email

            if role == 'personnel':
                p = db.session.get(Personnel, int(kullanici_id))
                if p:
                    actor_email = p.email
            else:
                actor_email = patron_email
                
        # Logu kimin yaptığını belirten detaylı etiket
        aktor_detay = f"İşlemi Yapan: [ID: {kullanici_id}] {actor_email} ({rol_isim}) | Patron: [ID: {owner_id}] {patron_email}"
    except:
        return

    # Silinmekte olan kullanıcıların ID'lerini bul (Log kirliliğini ve FK hatasını önlemek için)
    deleted_user_ids = {obj.id for obj in session.deleted if obj.__class__.__name__ == 'User'}

    kolon_isimleri = {
        'aktif': 'Hesap Durumu',
        'personnel_limit': 'Personel Limiti',
        'gecerlilik_tarihi': 'Abonelik Bitiş Tarihi',
        'durum': 'Sipariş Durumu',
        'teslim_tarihi': 'Teslim Durumu',
        'irsaliye_no': 'İrsaliye Numarası',
        'ad': 'Ad', 'soyad': 'Soyad', 'telefon': 'Telefon', 'adres': 'Adres',
        'price_per_m2': 'm² Fiyatı', 'tutar': 'Tutar', 'kategori': 'Kategori',
        'tarih': 'Tarih', 'aciklama': 'Açıklama', 'tur': 'Tür', 'durum': 'Ödeme Durumu', 'odeme_yontemi': 'Ödeme Yöntemi'
    }

    # 1. GÜNCELLENEN VERİLER (UPDATE)
    for obj in session.dirty:
        model_name = obj.__class__.__name__
        if model_name not in MODEL_NAMES:
            continue
            
        target_name = get_target_name(obj)
        target_user_id = obj.id if model_name == 'User' else getattr(obj, 'user_id', owner_id)

        # Eğer bu verinin sahibi olan kullanıcı da şu an siliniyorsa alt verileri tek tek loglama
        if int(target_user_id) in deleted_user_ids:
            continue

        for attr in db.inspect(obj).attrs:
            # Güvenlik: Şifre hash'lerini asla loglama!
            if attr.key in ['password_hash', 'updated_at', 'created_at']:
                continue

            hist = attr.history
            if hist.has_changes():
                eski = str(hist.deleted[0]) if hist.deleted else ""
                yeni = str(hist.added[0]) if hist.added else ""
                
                if eski != yeni:
                    try:
                        kolon_adi = kolon_isimleri.get(attr.key, attr.key.capitalize())
                        yeni_log = UserLog(
                            user_id=int(target_user_id),
                            changed_by_id=int(owner_id),
                            islem=f"{target_name} Güncellendi"[:50],
                            eski_deger=f"{kolon_adi}: {translate_value(eski)}",
                            yeni_deger=translate_value(yeni),
                            aciklama=aktor_detay
                        )
                        session.add(yeni_log)
                    except Exception as e:
                        logging.warning(f"Otomatik log hatası: {e}")

    # 2. YENİ EKLENEN VERİLER (INSERT)
    for obj in session.new:
        model_name = obj.__class__.__name__
        if model_name not in MODEL_NAMES:
            continue
            
        # Yeni kullanıcı ekleme anında obj.id henüz oluşmadığından, işlemi users.py içinde manuel yapacağız
        if model_name == 'User':
            continue
            
        target_name = get_target_name(obj)
        target_user_id = getattr(obj, 'user_id', owner_id)
        
        # Eğer bu verinin sahibi olan kullanıcı da şu an siliniyorsa alt verileri tek tek loglama
        if int(target_user_id) in deleted_user_ids:
            continue
        
        try:
            yeni_log = UserLog(
                user_id=int(target_user_id),
                changed_by_id=int(owner_id),
                islem=f"Yeni {target_name} Eklendi"[:50],
                eski_deger="",
                yeni_deger="Sisteme Kaydedildi",
                aciklama=aktor_detay
            )
            session.add(yeni_log)
        except Exception:
            pass

    # 3. SİLİNEN VERİLER (DELETE)
    for obj in session.deleted:
        # User silme işlemi özel arşivleme mantığı içerdiği için burada atlıyoruz
        model_name = obj.__class__.__name__
        if model_name not in MODEL_NAMES:
            continue
        if model_name == 'User':
            continue
            
        target_name = get_target_name(obj)
        target_user_id = getattr(obj, 'user_id', owner_id)
        
        # Eğer bu verinin sahibi olan kullanıcı da şu an siliniyorsa alt verileri tek tek loglama
        if int(target_user_id) in deleted_user_ids:
            continue
        
        try:
            yeni_log = UserLog(
                user_id=int(target_user_id),
                changed_by_id=int(owner_id),
                islem=f"{target_name} Silindi"[:50],
                eski_deger="Mevcut Kayıt",
                yeni_deger="Kalıcı Olarak Silindi",
                aciklama=aktor_detay
            )
            session.add(yeni_log)
        except Exception:
            pass