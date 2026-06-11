from datetime import datetime, timezone, timedelta
from decimal import Decimal
from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.extensions import db, limiter
from app.models.order import Order
from app.models.customer import Customer
from io import BytesIO
from app.services.pdf_service import order_to_pdf_bytes
from app.utils.auth_utils import get_owner_id # Import from utils
from app.models.order_item import OrderItem # Moved import

# Eski ve yeni tüm geçerli durumları kapsayan güvenlik listesi
GECERLI_DURUMLAR = [
    'alindi', 'teslim_alindi', 'temizleniyor', 'yikaniyor',
    'kurulaniyor', 'hazir', 'paketlendi', 'teslimata_cikti', 'teslim_edildi'
]

orders_bp = Blueprint('orders', __name__, url_prefix='/orders')

def _serialize_order(order, items=True):
    """Bir siparisi JSON-uyumlu dict'e cevirir."""
    
    kalan_gun = None
    if order.teslim_tarihi:
        delta = order.teslim_tarihi - datetime.now(timezone.utc).replace(tzinfo=None)
        kalan_gun = delta.days
    
    odenen = sum((p.tutar for p in order.payments), Decimal('0'))
    
    data = {
        'id': order.id,
        'customer_id': order.customer_id,
        'musteri_ad': f'{order.customer.ad} {order.customer.soyad}',
        'musteri_telefon': order.customer.telefon,
        'musteri_adres': order.customer.adres,
        'irsaliye_no': order.irsaliye_no,
        'teslim_tarihi': order.teslim_tarihi.isoformat() if order.teslim_tarihi else None,
        'kalan_gun': kalan_gun,
        'durum': order.durum,
        'created_at': order.created_at.isoformat(),
        'odenen': float(odenen)
    }
    
    if items:
        items_list = []
        toplam = Decimal('0')
        for it in order.items:
            items_list.append({
                'id': it.id,
                'hali_tipi': it.hali_tipi,
                'en': float(it.en),
                'boy': float(it.boy),
                'm2': float(it.m2),
                'm2_fiyat': float(it.m2_fiyat),
                'tutar': float(it.tutar)
            })
            toplam += it.tutar
        data['items'] = items_list
        data['toplam_tutar'] = float(toplam)
        data['kalan'] = float(toplam - odenen)
        data['tamamen_odendi'] = (toplam - odenen) == 0
    
    return data

@orders_bp.route('', methods=['POST'])
@jwt_required()
def create_order():
    owner_id = get_owner_id()
    data = request.get_json()
    
    if not data:
        return jsonify({'hata': 'Veri gönderilmedi'}), 400
    
    customer_id = data.get('customer_id')
    irsaliye_no = data.get('irsaliye_no')
    teslim_tarihi_str = data.get('teslim_tarihi')
    items_data = data.get('items')
    
    if not customer_id:
        return jsonify({'hata': 'customer_id zorunludur'}), 400
    if not items_data or not isinstance(items_data, list) or len(items_data) == 0:
        return jsonify({'hata': 'En az 1 halı eklemelisiniz (items listesi)'}), 400
    
    # Teslim tarihi parse
    teslim_tarihi = None
    if teslim_tarihi_str:
        try:
            teslim_tarihi = datetime.fromisoformat(teslim_tarihi_str)
        except ValueError:
            return jsonify({'hata': 'Geçersiz teslim_tarihi formatı (örn: 2026-06-15)'}), 400
    
    # Musteri bu user'a ait mi?
    musteri = Customer.query.get(customer_id)
    if not musteri:
        return jsonify({'hata': 'Müşteri bulunamadı'}), 404
    if musteri.user_id != owner_id:
        return jsonify({'hata': 'Bu müşteri size ait değil'}), 403
    
    # Her hali validation + hesaplama
    items_to_create = []
    for idx, item in enumerate(items_data, start=1):
        hali_tipi = item.get('hali_tipi')
        en = item.get('en')
        boy = item.get('boy')
        m2_fiyat = item.get('m2_fiyat')
        
        if not hali_tipi:
            return jsonify({'hata': f'{idx}. halıda hali_tipi zorunludur'}), 400
        if en is None or boy is None or m2_fiyat is None:
            return jsonify({'hata': f'{idx}. halıda en, boy, m2_fiyat zorunludur'}), 400
        
        try:
            en_d = Decimal(str(en))
            boy_d = Decimal(str(boy))
            m2_fiyat_d = Decimal(str(m2_fiyat))
        except Exception:
            return jsonify({'hata': f'{idx}. halıda geçersiz sayı'}), 400
        
        if en_d <= 0 or boy_d <= 0 or m2_fiyat_d <= 0:
            return jsonify({'hata': f'{idx}. halıda en/boy/m2_fiyat pozitif olmalıdır'}), 400
        
        m2 = en_d * boy_d
        tutar = m2 * m2_fiyat_d
        
        items_to_create.append({
            'hali_tipi': hali_tipi,
            'en': en_d,
            'boy': boy_d,
            'm2': m2,
            'm2_fiyat': m2_fiyat_d,
            'tutar': tutar
        })
    
    # TRANSACTION
    yeni_siparis = Order(
        customer_id=customer_id,
        user_id=owner_id,
        irsaliye_no=irsaliye_no,
        teslim_tarihi=teslim_tarihi
    )
    db.session.add(yeni_siparis)
    db.session.flush()
    
    # Eger irsaliye numarasi girilmemisse, essiz ID uzerinden otomatik ve sirali uret
    if not irsaliye_no or not str(irsaliye_no).strip():
        yeni_siparis.irsaliye_no = f"IRS-{1000 + yeni_siparis.id}"

    for item in items_to_create:
        order_item = OrderItem(order_id=yeni_siparis.id, **item)
        db.session.add(order_item)
    
    db.session.commit()
    
    return jsonify({
        'mesaj': 'Sipariş oluşturuldu',
        'siparis': _serialize_order(yeni_siparis)
    }), 201


@orders_bp.route('', methods=['GET'])
@jwt_required()
def get_orders():
    owner_id = get_owner_id()
    siparisler = Order.query.filter_by(user_id=owner_id).order_by(Order.created_at.desc()).all()
    
    sonuc = [_serialize_order(s) for s in siparisler]
    return jsonify({'siparisler': sonuc}), 200


@orders_bp.route('/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    owner_id = get_owner_id()
    siparis = Order.query.get(order_id)
    
    if not siparis:
        return jsonify({'hata': 'Sipariş bulunamadı'}), 404
    if siparis.user_id != owner_id:
        return jsonify({'hata': 'Bu işlem için yetkiniz yok'}), 403
    
    return jsonify({'siparis': _serialize_order(siparis)}), 200


@orders_bp.route('/<int:order_id>/durum', methods=['PUT'])
@jwt_required()
def update_durum(order_id):
    owner_id = get_owner_id()
    siparis = Order.query.get(order_id)
    
    if not siparis:
        return jsonify({'hata': 'Sipariş bulunamadı'}), 404
    if siparis.user_id != owner_id:
        return jsonify({'hata': 'Bu işlem için yetkiniz yok'}), 403
    
    data = request.get_json()
    if not data or 'durum' not in data:
        return jsonify({'hata': 'durum alanı zorunludur'}), 400
    
    yeni_durum = data['durum']
    if yeni_durum not in GECERLI_DURUMLAR:
        return jsonify({
            'hata': f'Geçersiz durum. Olası değerler: {", ".join(GECERLI_DURUMLAR)}'
        }), 400
    
    if siparis.durum == yeni_durum:
        return jsonify({'mesaj': 'Değişiklik yapılmadı (aynı durum)'}), 200
    
    siparis.durum = yeni_durum
    db.session.commit()
    
    return jsonify({
        'mesaj': 'Durum güncellendi',
        'siparis': {'id': siparis.id, 'durum': siparis.durum}
    }), 200


@orders_bp.route('/<int:order_id>', methods=['DELETE'])
@jwt_required()
def delete_order(order_id):
    owner_id = get_owner_id()
    siparis = Order.query.get(order_id)
    
    if not siparis:
        return jsonify({'hata': 'Sipariş bulunamadı'}), 404
    if siparis.user_id != owner_id:
        return jsonify({'hata': 'Bu işlem için yetkiniz yok'}), 403
    
    db.session.delete(siparis)
    db.session.commit()
    
    return jsonify({'mesaj': 'Sipariş silindi'}), 200

@orders_bp.route('/<int:order_id>/pdf', methods=['GET'])
@jwt_required()
@limiter.limit("10 per minute")
def get_order_pdf(order_id):
    owner_id = get_owner_id()
    siparis = Order.query.get(order_id)
    
    if not siparis:
        return jsonify({'hata': 'Sipariş bulunamadı'}), 404
    if siparis.user_id != owner_id:
        return jsonify({'hata': 'Bu işlem için yetkiniz yok'}), 403
    
    pdf_bytes = order_to_pdf_bytes(siparis)
    filename = f'irsaliye-{siparis.irsaliye_no or siparis.id}.pdf'
    return send_file(
        BytesIO(pdf_bytes),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=filename
    )

@orders_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    from app.models.payment import Payment
    
    owner_id = get_owner_id()
    claims = get_jwt()
    is_patron = claims.get('role') != 'personnel'
    
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    
    start_date = None
    end_date = None
    if start_date_str and end_date_str:
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            # Bitiş gününün son saniyesini dahil ediyoruz (23:59:59)
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').replace(hour=23, minute=59, second=59)
        except ValueError:
            pass

    siparisler = Order.query.filter_by(user_id=owner_id).all()
    
    toplam_siparis = 0
    durum_counts = {
        'alindi': 0, 'teslim_alindi': 0,
        'temizleniyor': 0, 'yikaniyor': 0,
        'kurulaniyor': 0,
        'hazir': 0, 'paketlendi': 0,
        'teslimata_cikti': 0,
        'teslim_edildi': 0
    }
    toplam_ciro = Decimal('0')
    bekleyen_tahsilat = Decimal('0')
    
    current_year = datetime.now(timezone.utc).year
    aylik_ciro = {i: Decimal('0') for i in range(1, 13)}
    TR_AYLAR = ["", "Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]

    gunluk_ciro = {}
    if start_date and end_date:
        curr = start_date
        while curr <= end_date:
            day_str = f"{curr.day} {TR_AYLAR[curr.month]}"
            gunluk_ciro[day_str] = Decimal('0')
            curr += timedelta(days=1)

    for s in siparisler:
        # Tarih aralığında mı kontrolü (Sipariş sayıları için)
        is_in_range = True
        if start_date and end_date:
            if not (s.created_at and start_date <= s.created_at <= end_date):
                is_in_range = False
                
        if is_in_range:
            toplam_siparis += 1
            if s.durum in durum_counts:
                durum_counts[s.durum] += 1
                
        tutar = sum((it.tutar for it in s.items), Decimal('0'))
        odenen = sum((p.tutar for p in s.payments), Decimal('0'))
        # Bekleyen tahsilat her zaman tüm zamanları gösterir
        bekleyen_tahsilat += (tutar - odenen)

        for p in s.payments:
            if start_date and end_date:
                # Filtrelenen aralıktaki tahsilatları topla
                if p.created_at and start_date <= p.created_at <= end_date:
                    toplam_ciro += p.tutar
                    day_str = f"{p.created_at.day} {TR_AYLAR[p.created_at.month]}"
                    if day_str in gunluk_ciro:
                        gunluk_ciro[day_str] += p.tutar
            else:
                # Filtre yoksa tüm tahsilatları ve aylık grafiği hesapla
                toplam_ciro += p.tutar
                if p.created_at and p.created_at.year == current_year:
                    aylik_ciro[p.created_at.month] += p.tutar

    if start_date and end_date:
        aylik_grafik = None
        gunluk_grafik = [{"gun": k, "ciro": float(v)} for k, v in gunluk_ciro.items()]
    else:
        aylik_grafik = [{"ay": TR_AYLAR[m], "ciro": float(aylik_ciro[m])} for m in range(1, 13)]
        gunluk_grafik = None
    
    # Müşteri sayısı
    from app.models.customer import Customer
    musteri_sayisi = Customer.query.filter_by(user_id=owner_id).count()
    
    return jsonify({
        'toplam_siparis': toplam_siparis,
        'durum_counts': durum_counts,
        'toplam_ciro': float(toplam_ciro) if is_patron else 0,
        'bekleyen_tahsilat': float(bekleyen_tahsilat) if is_patron else 0,
        'musteri_sayisi': musteri_sayisi,
        'aylik_grafik': aylik_grafik if is_patron else None,
        'gunluk_grafik': gunluk_grafik if is_patron else None
    }), 200