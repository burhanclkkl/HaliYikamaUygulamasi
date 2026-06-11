"""
=============================================================================
  SAHTE TEST VERİSİ — Halı Yıkama Uygulaması CRM
=============================================================================
  UI testini kolaylaştırmak için geçici sahte veri yükler. TÜM sahte hesaplar
  "@haliyikama.test" alan adını kullanır; böylece tek komutla temizlenebilir.

  Kullanım (backend/ klasöründe, venv aktifken):
      python seed_fake_data.py            # sahte veriyi yükle (önce eskisini temizler)
      python seed_fake_data.py --clear    # SADECE sahte veriyi sil, çık

  Giriş bilgileri (yükleme sonrası ekrana yazılır):
      Admin   : admin@haliyikama.test   / Admin1234!
      Patron  : patron@haliyikama.test  / Patron1234!
      Personel: <ad>.<soyad>@haliyikama.test / Personel1234!
=============================================================================
"""
import sys
import random
from decimal import Decimal
from datetime import datetime, timedelta

from werkzeug.security import generate_password_hash

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.customer import Customer
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.payment import Payment
from app.models.personnel import Personnel
from app.models.carpet_type import CarpetType
from app.models.user_log import UserLog
from app.models.expense import Expense
from app.models.expense_category import ExpenseCategory

FAKE_DOMAIN = "@haliyikama.test"
PW = lambda s: generate_password_hash(s, method="pbkdf2:sha256")

ADLAR = ["Ahmet", "Mehmet", "Mustafa", "Ayşe", "Fatma", "Emine", "Ali", "Hüseyin",
         "Hasan", "İbrahim", "Zeynep", "Elif", "Hatice", "Murat", "Özlem", "Burak",
         "Seda", "Kemal", "Derya", "Okan", "Gül", "Yusuf", "Merve", "Caner", "Pınar"]
SOYADLAR = ["Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldız", "Yıldırım", "Öztürk",
            "Aydın", "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Korkmaz", "Koç",
            "Kurt", "Özdemir", "Şimşek", "Polat"]
MAHALLELER = ["Bahçelievler", "Yenimahalle", "Cumhuriyet", "Fatih", "Atatürk", "İstiklal",
              "Gazi", "Mevlana", "Çamlıca", "Bağlar", "Kültür", "Yeşiltepe"]
HALI_TIPLERI = [
    ("Makine Halısı", 45), ("El Dokuma Halı", 90), ("Yün Halı", 75), ("İpek Halı", 180),
    ("Shaggy Halı", 60), ("Akrilik Halı", 40), ("Antik Halı", 150), ("Modern Halı", 55),
    ("Çocuk Halısı", 50), ("Yolluk", 35), ("Post / Kürk", 120), ("Bambu Halı", 70),
    ("Kilim", 65), ("Banyo Paspası", 30), ("Ofis Halısı", 48), ("Dış Mekan Halısı", 42),
]
DURUMLAR = ["teslim_alindi", "yikaniyor", "kurulaniyor", "paketlendi", "teslimata_cikti", "teslim_edildi"]
ODEME_TURLERI = ["nakit", "kart", "havale"]
HARCAMA_KATEGORILERI = [
    ("Fatura", ["Elektrik", "Su", "İnternet", "Doğalgaz"]),
    ("Maaş", ["Ali Personel", "Ayşe Personel", "Muhasebe"]),
    ("Malzeme", ["Deterjan", "Ambalaj", "Fırça"]),
    ("Yakıt", ["Kamyonet", "Servis Aracı"]),
    ("Kira", ["Dükkan", "Depo"]),
    ("Vergi", ["KDV", "Gelir Vergisi"]),
]


def tel():
    return "05" + str(random.randint(300000000, 559999999))


def now_minus(days):
    return datetime.utcnow() - timedelta(days=days)


def clear_fake():
    """Tüm @haliyikama.test verisini (ve bağlı loglarını) siler."""
    fake_users = User.query.filter(User.email.like(f"%{FAKE_DOMAIN}")).all()
    ids = [u.id for u in fake_users]
    if not ids:
        print("Temizlenecek sahte veri yok.")
        return
    UserLog.query.filter(
        db.or_(UserLog.user_id.in_(ids), UserLog.changed_by_id.in_(ids))
    ).delete(synchronize_session=False)
    Expense.query.filter(Expense.user_id.in_(ids)).delete(synchronize_session=False)
    ExpenseCategory.query.filter(ExpenseCategory.user_id.in_(ids)).delete(synchronize_session=False)
    for u in fake_users:
        db.session.delete(u)  # cascade: müşteri, sipariş, ödeme, personel, halı tipi
    db.session.commit()
    print(f"Temizlendi: {len(ids)} sahte hesap ve tüm bağlı verileri.")


def make_personnel(user_id, n):
    out = []
    for _ in range(n):
        ad = random.choice(ADLAR); soyad = random.choice(SOYADLAR)
        eposta = f"{ad.lower()}.{soyad.lower()}.{random.randint(100,999)}{FAKE_DOMAIN}"
        p = Personnel(user_id=user_id, ad=ad, soyad=soyad, email=eposta, telefon=tel(),
                      password_hash=PW("Personel1234!"), aktif=random.random() > 0.2,
                      created_at=now_minus(random.randint(1, 120)))
        db.session.add(p); out.append(p)
    return out


def make_carpet_types(user_id, tipler):
    out = []
    for ad, fiyat in tipler:
        ct = CarpetType(user_id=user_id, name=ad, price_per_m2=Decimal(str(fiyat)),
                        created_at=now_minus(random.randint(5, 200)))
        db.session.add(ct); out.append(ct)
    return out


def make_customers(user_id, n):
    out = []
    for _ in range(n):
        ad = random.choice(ADLAR); soyad = random.choice(SOYADLAR)
        adres = f"{random.choice(MAHALLELER)} Mah. {random.randint(1,80)}. Sokak No:{random.randint(1,120)}/{random.randint(1,20)}"
        c = Customer(user_id=user_id, ad=ad, soyad=soyad, telefon=tel(), adres=adres,
                     created_at=now_minus(random.randint(1, 150)))
        db.session.add(c); out.append(c)
    return out


def make_orders(user_id, customers, carpet_types, n):
    db.session.flush()  # customers/carpet_types id alsın
    fiyatlar = [(ct.name, ct.price_per_m2) for ct in carpet_types]
    for i in range(n):
        c = random.choice(customers)
        durum = random.choice(DURUMLAR)
        olusturma = now_minus(random.randint(0, 60))
        # teslim tarihi: bazıları geçmişte (geciken), bazıları gelecekte, bazıları yok
        secim = random.random()
        if secim < 0.3:
            teslim = olusturma + timedelta(days=random.randint(1, 4))   # geçmişte → geciken
        elif secim < 0.7:
            teslim = datetime.utcnow() + timedelta(days=random.randint(1, 7))  # gelecek
        else:
            teslim = None
        order = Order(user_id=user_id, customer_id=c.id, durum=durum,
                      irsaliye_no=f"IRS-{1000 + i}", teslim_tarihi=teslim, created_at=olusturma)
        db.session.add(order); db.session.flush()

        toplam = Decimal("0")
        for _ in range(random.randint(1, 3)):
            ad, m2_fiyat = random.choice(fiyatlar)
            en = Decimal(str(round(random.uniform(1.5, 4.0), 2)))
            boy = Decimal(str(round(random.uniform(1.5, 3.5), 2)))
            m2 = (en * boy).quantize(Decimal("0.01"))
            tutar = (m2 * m2_fiyat).quantize(Decimal("0.01"))
            toplam += tutar
            db.session.add(OrderItem(order_id=order.id, hali_tipi=ad, en=en, boy=boy,
                                     m2=m2, m2_fiyat=m2_fiyat, tutar=tutar))

        # Ödemeler: kimi tam, kimi kısmi, kimi ödenmemiş
        durum_secim = random.random()
        if durum == "teslim_edildi" or durum_secim < 0.4:
            odenen = toplam  # tam ödeme
        elif durum_secim < 0.75:
            odenen = (toplam * Decimal(str(round(random.uniform(0.3, 0.7), 2)))).quantize(Decimal("0.01"))
        else:
            odenen = Decimal("0")
        if odenen > 0:
            # 1-2 parça halinde
            if odenen == toplam and random.random() < 0.5:
                yari = (odenen / 2).quantize(Decimal("0.01"))
                db.session.add(Payment(order_id=order.id, tutar=yari, odeme_turu=random.choice(ODEME_TURLERI),
                                       aciklama="Kapora", created_at=olusturma))
                db.session.add(Payment(order_id=order.id, tutar=odenen - yari, odeme_turu=random.choice(ODEME_TURLERI),
                                       aciklama="Bakiye", created_at=olusturma + timedelta(days=1)))
            else:
                db.session.add(Payment(order_id=order.id, tutar=odenen, odeme_turu=random.choice(ODEME_TURLERI),
                                       aciklama="Tahsilat", created_at=olusturma))


def make_expenses(user_id, n):
    out = []
    for _ in range(n):
        kategori, turler = random.choice(HARCAMA_KATEGORILERI)
        tur = random.choice(turler)
        tutar = Decimal(str(random.randint(50, 2500)))
        durum = random.choice(['ödendi', 'ödendi', 'ödendi', 'ödenecek']) # 'ödendi' daha sık çıksın
        odeme_yontemi = random.choice(ODEME_TURLERI) if durum == 'ödendi' else None
        aciklama = f"{tur} için yapılan harcama." if random.random() > 0.5 else ""
        tarih = now_minus(random.randint(0, 90)).date()

        e = Expense(
            user_id=user_id,
            tutar=tutar,
            kategori=kategori,
            tur=tur,
            aciklama=aciklama,
            tarih=tarih,
            durum=durum,
            odeme_yontemi=odeme_yontemi,
        )
        db.session.add(e)
        out.append(e)
    return out

def make_logs(patron, admin):
    """Admin 'Aktivite' / 'Geçmiş' sekmesi boş kalmasın diye birkaç gerçekçi log."""
    ornekler = [
        ("Hesap Durumu Güncellendi", "Hesap Durumu: Pasif / Hayır", "Aktif / Evet"),
        ("Abonelik Bitiş Tarihi Güncellendi", "Belirtilmemiş", "2026-12-31"),
        ("Personel Limiti Güncellendi", "Personel Limiti: 3", "10"),
    ]
    for islem, eski, yeni in ornekler:
        db.session.add(UserLog(
            user_id=patron.id, changed_by_id=admin.id, islem=islem,
            eski_deger=eski, yeni_deger=yeni,
            aciklama=f"İşlemi Yapan: [ID: {admin.id}] {admin.email} (Admin) | Patron: [ID: {patron.id}] {patron.email}",
            created_at=now_minus(random.randint(0, 30))
        ))


def seed():
    random.seed(42)

    # --- ADMIN ---
    admin = User(email=f"admin{FAKE_DOMAIN}", password_hash=PW("Admin1234!"), phone=tel(),
                 role="admin", aktif=True, personnel_limit=99, created_at=now_minus(300))
    db.session.add(admin); db.session.flush()

    # --- PRIMARY PATRON (zengin veri) ---
    patron = User(email=f"patron{FAKE_DOMAIN}", password_hash=PW("Patron1234!"), phone=tel(),
                  role="user", aktif=True, personnel_limit=20,
                  gecerlilik_tarihi=datetime.utcnow() + timedelta(days=200), created_at=now_minus(180))
    db.session.add(patron); db.session.flush()

    cts = make_carpet_types(patron.id, HALI_TIPLERI)          # 16 halı tipi
    make_personnel(patron.id, 15)                              # 15 personel
    custs = make_customers(patron.id, 18)                      # 18 müşteri
    make_orders(patron.id, custs, cts, 20)                    # 20 sipariş (+item+ödeme)
    make_expenses(patron.id, 25)                               # 25 harcama
    make_logs(patron, admin)

    # --- 14 EK PATRON (admin Kullanıcılar listesi ≥15 olsun) ---
    durumlar = [
        dict(aktif=True, gun=None),          # sınırsız
        dict(aktif=True, gun=45),            # aktif
        dict(aktif=True, gun=6),             # uyarı (yaklaşan)
        dict(aktif=True, gun=2),             # kritik
        dict(aktif=False, gun=-5),           # pasif + süresi dolmuş
        dict(aktif=True, gun=120),
        dict(aktif=False, gun=None),         # pasif
        dict(aktif=True, gun=30),
    ]
    for i in range(1, 15):
        cfg = durumlar[(i - 1) % len(durumlar)]
        gecer = None if cfg["gun"] is None else datetime.utcnow() + timedelta(days=cfg["gun"])
        u = User(email=f"isletme{i:02d}{FAKE_DOMAIN}", password_hash=PW("Patron1234!"), phone=tel(),
                 role="user", aktif=cfg["aktif"], personnel_limit=random.choice([3, 5, 8, 10]),
                 gecerlilik_tarihi=gecer, created_at=now_minus(random.randint(10, 250)))
        db.session.add(u); db.session.flush()
        u_cts = make_carpet_types(u.id, random.sample(HALI_TIPLERI, k=random.randint(3, 6)))
        make_personnel(u.id, random.randint(2, 4))
        u_custs = make_customers(u.id, random.randint(3, 6))
        make_orders(u.id, u_custs, u_cts, random.randint(2, 5))
        make_expenses(u.id, random.randint(5, 10))
        if i <= 5:
            make_logs(u, admin)

    db.session.commit()

    # --- ÖZET ---
    print("\n================  SAHTE VERİ YÜKLENDİ  ================")
    print(f"  Kullanıcı (patron+admin) : {User.query.filter(User.email.like('%'+FAKE_DOMAIN)).count()}")
    print(f"  Müşteri                  : {Customer.query.count()}")
    print(f"  Sipariş                  : {Order.query.count()}")
    print(f"  Sipariş kalemi           : {OrderItem.query.count()}")
    print(f"  Ödeme                    : {Payment.query.count()}")
    print(f"  Harcama                  : {Expense.query.count()}")
    print(f"  Personel                 : {Personnel.query.count()}")
    print(f"  Halı tipi                : {CarpetType.query.count()}")
    print(f"  Log                      : {UserLog.query.count()}")
    print("------------------------------------------------------")
    print("  GİRİŞ BİLGİLERİ")
    print("    Admin   : admin@haliyikama.test   / Admin1234!")
    print("    Patron  : patron@haliyikama.test  / Patron1234!")
    print("    (diğer patronlar: isletme01..14@haliyikama.test / Patron1234!)")
    print("  Temizlemek için: python seed_fake_data.py --clear")
    print("======================================================\n")


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        db.create_all()           # tablo yoksa oluştur (migration gerektirmez)
        clear_fake()              # önce eski sahte veriyi temizle (idempotent)
        if "--clear" in sys.argv:
            print("Yalnızca temizleme istendi. Çıkılıyor.")
        else:
            seed()
