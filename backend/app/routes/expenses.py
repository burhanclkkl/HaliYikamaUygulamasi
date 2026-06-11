from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from datetime import datetime
from app.extensions import db
from app.models.expense import Expense
from app.models.expense_category import ExpenseCategory
from app.utils.auth_utils import get_owner_id

expenses_bp = Blueprint('expenses', __name__, url_prefix='/expenses')

@expenses_bp.route('', methods=['GET'])
@jwt_required()
def get_expenses():
    if get_jwt().get('role') == 'personnel':
        return jsonify({'hata': 'Bu işlemi yapmaya yetkiniz yok'}), 403
        
    owner_id = get_owner_id()
    # Harcamaları tarihe göre en yeniden eskiye doğru sıralayarak getiriyoruz
    harcamalar = Expense.query.filter_by(user_id=owner_id).order_by(Expense.tarih.desc(), Expense.created_at.desc()).all()
    
    sonuc = []
    for h in harcamalar:
        sonuc.append({
            'id': h.id,
            'tutar': str(h.tutar), # Numeric/Decimal olduğu için JSON'a parse edilebilsin diye string yapıyoruz
            'kategori': h.kategori,
            'tur': h.tur,
            'aciklama': h.aciklama,
            'tarih': h.tarih.isoformat(),
            'durum': h.durum,
            'odeme_yontemi': h.odeme_yontemi,
            'created_at': h.created_at.isoformat()
        })
    
    return jsonify({'harcamalar': sonuc}), 200

@expenses_bp.route('', methods=['POST'])
@jwt_required()
def create_expense():
    if get_jwt().get('role') == 'personnel':
        return jsonify({'hata': 'Bu işlemi yapmaya yetkiniz yok'}), 403
        
    owner_id = get_owner_id()
    data = request.get_json()
    
    if not data:
        return jsonify({'hata': 'Veri gönderilmedi'}), 400
    
    tutar = data.get('tutar')
    kategori = data.get('kategori')
    tur = data.get('tur', '')
    aciklama = data.get('aciklama', '')
    tarih_str = data.get('tarih') # "YYYY-MM-DD" formatında gelmeli
    durum = data.get('durum', 'ödendi')
    odeme_yontemi = data.get('odeme_yontemi')
    
    if not tutar:
        return jsonify({'hata': 'Tutar zorunludur'}), 400
    if not kategori:
        return jsonify({'hata': 'Kategori zorunludur'}), 400
    
    if durum not in ['ödendi', 'ödenecek']:
        return jsonify({'hata': 'Geçersiz durum. Sadece "ödendi" veya "ödenecek" olabilir.'}), 400
        
    try:
        # Eğer tarih gelmişse parse et, gelmemişse bugünün tarihi alınsın diye None bırak
        tarih_obj = datetime.strptime(tarih_str, '%Y-%m-%d').date() if tarih_str else None
    except ValueError:
        return jsonify({'hata': 'Geçersiz tarih formatı (YYYY-MM-DD olmalı)'}), 400

    yeni_harcama = Expense(
        user_id=owner_id,
        tutar=tutar,
        kategori=kategori,
        tur=tur,
        aciklama=aciklama,
        durum=durum,
        odeme_yontemi=odeme_yontemi
    )
    
    if tarih_obj:
        yeni_harcama.tarih = tarih_obj
        
    db.session.add(yeni_harcama)
    db.session.commit()
    
    return jsonify({
        'mesaj': 'Harcama başarıyla eklendi',
        'harcama': {
            'id': yeni_harcama.id,
            'tutar': str(yeni_harcama.tutar),
            'kategori': yeni_harcama.kategori,
            'tur': yeni_harcama.tur,
            'aciklama': yeni_harcama.aciklama,
            'tarih': yeni_harcama.tarih.isoformat(),
            'durum': yeni_harcama.durum,
            'odeme_yontemi': yeni_harcama.odeme_yontemi
        }
    }), 201

@expenses_bp.route('/<int:expense_id>', methods=['PUT'])
@jwt_required()
def update_expense(expense_id):
    if get_jwt().get('role') == 'personnel':
        return jsonify({'hata': 'Bu işlemi yapmaya yetkiniz yok'}), 403
        
    owner_id = get_owner_id()
    harcama = Expense.query.get(expense_id)
    
    if not harcama or harcama.user_id != owner_id:
        return jsonify({'hata': 'Harcama bulunamadı veya yetkiniz yok'}), 404
        
    data = request.get_json()
    if not data:
        return jsonify({'hata': 'Veri gönderilmedi'}), 400
        
    if 'tutar' in data: harcama.tutar = data['tutar']
    if 'kategori' in data: harcama.kategori = data['kategori']
    if 'tur' in data: harcama.tur = data['tur']
    if 'aciklama' in data: harcama.aciklama = data['aciklama']
    if 'durum' in data:
        if data['durum'] not in ['ödendi', 'ödenecek']:
            return jsonify({'hata': 'Geçersiz durum.'}), 400
        harcama.durum = data['durum']
    if 'odeme_yontemi' in data: harcama.odeme_yontemi = data['odeme_yontemi']
    if 'tarih' in data and data['tarih']:
        try:
            harcama.tarih = datetime.strptime(data['tarih'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'hata': 'Geçersiz tarih formatı'}), 400
            
    db.session.commit()
    return jsonify({'mesaj': 'Harcama güncellendi'}), 200

@expenses_bp.route('/<int:expense_id>', methods=['DELETE'])
@jwt_required()
def delete_expense(expense_id):
    if get_jwt().get('role') == 'personnel':
        return jsonify({'hata': 'Bu işlemi yapmaya yetkiniz yok'}), 403
        
    owner_id = get_owner_id()
    harcama = Expense.query.get(expense_id)
    
    if not harcama or harcama.user_id != owner_id:
        return jsonify({'hata': 'Harcama bulunamadı veya yetkiniz yok'}), 404
        
    db.session.delete(harcama)
    db.session.commit()
    return jsonify({'mesaj': 'Harcama başarıyla silindi'}), 200

@expenses_bp.route('/categories', methods=['GET'])
@jwt_required()
def get_categories():
    if get_jwt().get('role') == 'personnel':
        return jsonify({'hata': 'Bu işlemi yapmaya yetkiniz yok'}), 403
        
    owner_id = get_owner_id()
    kategoriler = ExpenseCategory.query.filter_by(user_id=owner_id).all()
    
    # Kullanıcının hiç kategorisi yoksa, varsayılan bir set tanımlayarak ona yardımcı olalım
    if not kategoriler:
        defaults = [
            ExpenseCategory(user_id=owner_id, ad='Fatura', turler='Elektrik,Su,İnternet,Doğalgaz,Telefon'),
            ExpenseCategory(user_id=owner_id, ad='Maaş', turler='Personel Avansı,Aylık Maaş,Prim,Muhasebe'),
            ExpenseCategory(user_id=owner_id, ad='Malzeme', turler='Deterjan,Ambalaj,Fırça,Yedek Parça,Ofis Malzemesi'),
            ExpenseCategory(user_id=owner_id, ad='Yakıt', turler='Kamyonet,Servis Aracı,Binek Araç'),
            ExpenseCategory(user_id=owner_id, ad='Kira', turler='Dükkan,Depo,Araç Kirası'),
            ExpenseCategory(user_id=owner_id, ad='Vergi', turler='KDV,Gelir Vergisi,SGK / Bağkur,Stopaj'),
            ExpenseCategory(user_id=owner_id, ad='Diğer', turler='Yemek,Kırtasiye,Kargo,Bakım Onarım')
        ]
        db.session.add_all(defaults)
        db.session.commit()
        kategoriler = defaults
        
    sonuc = []
    for k in kategoriler:
        t_list = [t.strip() for t in k.turler.split(',')] if k.turler else []
        sonuc.append({'id': k.id, 'ad': k.ad, 'turler': [t for t in t_list if t]})
        
    return jsonify({'kategoriler': sonuc}), 200

@expenses_bp.route('/categories', methods=['POST'])
@jwt_required()
def create_category():
    if get_jwt().get('role') == 'personnel':
        return jsonify({'hata': 'Bu işlemi yapmaya yetkiniz yok'}), 403
        
    owner_id = get_owner_id()
    data = request.get_json()
    
    if not data or not data.get('ad'):
        return jsonify({'hata': 'Kategori adı zorunludur'}), 400
        
    yeni = ExpenseCategory(
        user_id=owner_id,
        ad=data.get('ad').strip(),
        turler=",".join(data.get('turler', []))
    )
    db.session.add(yeni)
    db.session.commit()
    
    return jsonify({'mesaj': 'Kategori eklendi'}), 201

@expenses_bp.route('/categories/<int:cat_id>', methods=['PUT'])
@jwt_required()
def update_category(cat_id):
    owner_id = get_owner_id()
    kategori = ExpenseCategory.query.get(cat_id)
    if not kategori or kategori.user_id != owner_id:
        return jsonify({'hata': 'Kategori bulunamadı'}), 404
        
    data = request.get_json()
    if 'ad' in data: kategori.ad = data['ad']
    if 'turler' in data: kategori.turler = ",".join(data['turler'])
        
    db.session.commit()
    return jsonify({'mesaj': 'Kategori güncellendi'}), 200

@expenses_bp.route('/categories/<int:cat_id>', methods=['DELETE'])
@jwt_required()
def delete_category(cat_id):
    owner_id = get_owner_id()
    kategori = ExpenseCategory.query.get(cat_id)
    if not kategori or kategori.user_id != owner_id:
        return jsonify({'hata': 'Kategori bulunamadı'}), 404
        
    db.session.delete(kategori)
    db.session.commit()
    return jsonify({'mesaj': 'Kategori silindi'}), 200
