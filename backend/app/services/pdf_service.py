import os
from io import BytesIO
from datetime import datetime
from decimal import Decimal

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Font kayitlari (modul yuklenirken bir kez)
_FONTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'fonts'))

print(f"[PDF] Fonts dir: {_FONTS_DIR}")

# Türkçe karakter desteği için font yükleme mekanizması
FONT_NORMAL = 'Helvetica'
FONT_BOLD = 'Helvetica-Bold'

lib_reg_path = os.path.join(_FONTS_DIR, 'LiberationSerif-Regular.ttf')
lib_bold_path = os.path.join(_FONTS_DIR, 'LiberationSerif-Bold.ttf')

arial_reg_path = "C:\\Windows\\Fonts\\arial.ttf" if os.name == 'nt' else "/usr/share/fonts/truetype/msttcorefonts/Arial.ttf"
arial_bold_path = "C:\\Windows\\Fonts\\arialbd.ttf" if os.name == 'nt' else "/usr/share/fonts/truetype/msttcorefonts/Arial_Bold.ttf"

try:
    if os.path.exists(lib_reg_path) and os.path.exists(lib_bold_path):
        pdfmetrics.registerFont(TTFont('LibSerif', lib_reg_path))
        pdfmetrics.registerFont(TTFont('LibSerif-Bold', lib_bold_path))
        FONT_NORMAL = 'LibSerif'
        FONT_BOLD = 'LibSerif-Bold'
        print("[PDF] Liberation Serif başarıyla yüklendi.")
    elif os.path.exists(arial_reg_path) and os.path.exists(arial_bold_path):
        pdfmetrics.registerFont(TTFont('Arial', arial_reg_path))
        pdfmetrics.registerFont(TTFont('Arial-Bold', arial_bold_path))
        FONT_NORMAL = 'Arial'
        FONT_BOLD = 'Arial-Bold'
        print("[PDF] Sistemden Arial fontu başarıyla yüklendi.")
    else:
        print("[PDF] UYARI: Standart Helvetica'ya dönülüyor.")
except Exception as e:
    print(f"[PDF] HATA, Font yüklenirken sorun oluştu: {e}")


def _tr_title(metin):
    if not metin:
        return '-'
    metin = metin.strip()
    if not metin:
        return ''
    ilk_harf = metin[0].upper().replace('I', 'İ')
    kalan = metin[1:].lower().replace('İ', 'i').replace('I', 'ı')
    return ilk_harf + kalan


def _format_tarih(dt, with_time=True):
    if not dt:
        return '-'
    fmt = '%d.%m.%Y %H:%M' if with_time else '%d.%m.%Y'
    return dt.strftime(fmt)


def _format_para(tutar):
    if tutar is None:
        return '-'
    return f'{float(tutar):,.2f} TL'.replace(',', 'X').replace('.', ',').replace('X', '.')


def _durum_label(durum):
    labels = {
        'alindi': 'Alındı',
        'temizleniyor': 'Temizleniyor',
        'hazir': 'Hazır',
        'teslim_edildi': 'Teslim Edildi'
    }
    return labels.get(durum, _tr_title(durum))


def order_to_pdf_bytes(order):
    """Verilen Order nesnesinden ultra sade ve minimalist bir PDF olusturur."""
    buffer = BytesIO()
    
    # Geniş kenar boşlukları belgenin daha elit ve sade durmasını sağlar
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=2.0*cm, leftMargin=2.0*cm,
        topMargin=2.0*cm, bottomMargin=2.0*cm,
        title=f'Irsaliye-{order.irsaliye_no or order.id}'
    )
    
    # Ultra Sade / Monokrom Renk Paleti
    COLOR_TEXT_MAIN = colors.HexColor('#1E293B')  # Koyu Kömür Gri (Sert siyah yerine)
    COLOR_TEXT_MUTED = colors.HexColor('#64748B') # Açık Gri Yazı
    COLOR_BORDER_LIGHT = colors.HexColor('#E2E8F0') # Çok İnce Çizgi Rengi
    
    # Minimalist Stiller
    title_style = ParagraphStyle('Title', fontName=FONT_BOLD, fontSize=14,
                                 alignment=TA_LEFT, textColor=COLOR_TEXT_MAIN, spaceAfter=2)
    subtitle_style = ParagraphStyle('Subtitle', fontName=FONT_NORMAL, fontSize=8,
                                    alignment=TA_LEFT, textColor=COLOR_TEXT_MUTED, spaceAfter=20)
    section_style = ParagraphStyle('Section', fontName=FONT_BOLD, fontSize=9,
                                   textColor=COLOR_TEXT_MAIN, spaceBefore=15, spaceAfter=6)
    
    story = []
    
    # BAŞLIK & DÜZENLEME TARİHİ
    story.append(Paragraph('Halı Temizleme İrsaliyesi', title_style))
    story.append(Paragraph(f'Düzenleme Tarihi: {_format_tarih(datetime.utcnow())}', subtitle_style))
    
    # ÜST BİLGİ (Blok Düzeni)
    sol_data = [
        ['İrsaliye No:', order.irsaliye_no or '-'],
        ['Sipariş No:', f'#{order.id}'],
        ['Sipariş Tarihi:', _format_tarih(order.created_at)],
    ]
    sag_data = [
        ['Durum:', _durum_label(order.durum)],
        ['Teslim Tarihi:', _format_tarih(order.teslim_tarihi, with_time=False)],
        ['Personel:', order.user.email if order.user else '-'],
    ]
    ust_data = [[sol_data[i][0], sol_data[i][1], '', sag_data[i][0], sag_data[i][1]] for i in range(3)]
    
    ust_table = Table(ust_data, colWidths=[2.5*cm, 4.5*cm, 1.5*cm, 2.5*cm, 6.0*cm])
    ust_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), FONT_NORMAL),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('TEXTCOLOR', (0, 0), (0, -1), COLOR_TEXT_MUTED),
        ('TEXTCOLOR', (3, 0), (3, -1), COLOR_TEXT_MUTED),
        ('FONTNAME', (1, 0), (1, -1), FONT_BOLD),
        ('FONTNAME', (4, 0), (4, -1), FONT_BOLD),
        ('TEXTCOLOR', (1, 0), (1, -1), COLOR_TEXT_MAIN),
        ('TEXTCOLOR', (4, 0), (4, -1), COLOR_TEXT_MAIN),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
    ]))
    story.append(ust_table)
    
    # MÜŞTERİ BİLGİLERİ
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph('Müşteri Bilgileri', section_style))
    
    musteri_data = [
        ['Ad Soyad:', f'{order.customer.ad} {order.customer.soyad}'],
        ['Telefon:', order.customer.telefon],
        ['Adres:', order.customer.adres or '-'],
    ]
    musteri_table = Table(musteri_data, colWidths=[2.5*cm, 14.5*cm])
    musteri_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), FONT_NORMAL),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('TEXTCOLOR', (0, 0), (0, -1), COLOR_TEXT_MUTED),
        ('FONTNAME', (1, 0), (1, -1), FONT_BOLD),
        ('TEXTCOLOR', (1, 0), (1, -1), COLOR_TEXT_MAIN),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
    ]))
    story.append(musteri_table)
    
    # HALI DETAYLARI TABLOSU
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph('Halı Detayları', section_style))
    
    hali_data = [['#', 'Halı Tipi', 'En (m)', 'Boy (m)', 'm²', 'm² Fiyat', 'Tutar']]
    toplam = Decimal('0')
    for idx, item in enumerate(order.items, start=1):
        hali_data.append([
            str(idx),
            _tr_title(item.hali_tipi),
            f'{float(item.en):.2f}',
            f'{float(item.boy):.2f}',
            f'{float(item.m2):.2f}',
            _format_para(item.m2_fiyat),
            _format_para(item.tutar),
        ])
        toplam += item.tutar
    
    hali_table = Table(hali_data, colWidths=[0.8*cm, 4.2*cm, 1.8*cm, 1.8*cm, 1.8*cm, 3.2*cm, 3.4*cm])
    hali_table.setStyle(TableStyle([
        # Saf ve İnce Tablo Başlığı (Arka plan renksiz, sadece ince bir çizgi)
        ('FONTNAME', (0, 0), (-1, 0), FONT_BOLD),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('TEXTCOLOR', (0, 0), (-1, 0), COLOR_TEXT_MAIN),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('ALIGN', (1, 0), (1, 0), 'LEFT'),
        ('LINEBELOW', (0, 0), (-1, 0), 0.5, COLOR_TEXT_MAIN), # Başlık altı ince çizgi
        
        # Tablo İçeriği (Arka plan renksiz)
        ('FONTNAME', (0, 1), (-1, -1), FONT_NORMAL),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('TEXTCOLOR', (0, 1), (-1, -1), COLOR_TEXT_MAIN),
        ('ALIGN', (0, 1), (0, -1), 'CENTER'),
        ('ALIGN', (1, 1), (1, -1), 'LEFT'),
        ('ALIGN', (2, 1), (-1, -1), 'RIGHT'),
        
        # Satır aralarına çok hafif ayıraç çizgiler
        ('LINEBELOW', (0, 1), (-1, -1), 0.3, COLOR_BORDER_LIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(hali_table)
    
    # ÖZET VE HESAPLAMALAR
    story.append(Spacer(1, 0.1*cm))
    odenen = sum((p.tutar for p in order.payments), Decimal('0'))
    kalan = toplam - odenen
    
    ozet_data = [
        ['', 'Toplam:', _format_para(toplam)],
        ['', 'Ödenen:', _format_para(odenen)],
        ['', 'Kalan Borç:', _format_para(kalan)],
    ]
    ozet_table = Table(ozet_data, colWidths=[10.4*cm, 3.2*cm, 3.4*cm])
    ozet_table.setStyle(TableStyle([
        ('FONTNAME', (1, 0), (-1, -1), FONT_NORMAL),
        ('FONTSIZE', (1, 0), (-1, -1), 8.5),
        ('TEXTCOLOR', (1, 0), (-1, -1), COLOR_TEXT_MAIN),
        ('FONTNAME', (1, -1), (-1, -1), FONT_BOLD), # Kalan borç vurgusu için bold
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('LINEABOVE', (1, 0), (-1, 0), 0.5, COLOR_TEXT_MAIN), # Özet üstü sınır çizgisi
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(ozet_table)
    
    # ÖDEME GEÇMİŞİ (Eğer varsa)
    payments_list = list(order.payments)
    if len(payments_list) > 0:
        story.append(Spacer(1, 0.3*cm))
        story.append(Paragraph('Ödeme Geçmişi', section_style))
        
        odeme_data = [['Tarih', 'Ödeme Türü', 'Tutar', 'Açıklama']]
        for p in sorted(payments_list, key=lambda x: x.created_at):
            odeme_data.append([
                _format_tarih(p.created_at),
                _tr_title(p.odeme_turu),
                _format_para(p.tutar),
                p.aciklama or '-'
            ])
        
        odeme_table = Table(odeme_data, colWidths=[3.8*cm, 3.2*cm, 3.2*cm, 6.8*cm])
        odeme_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), FONT_BOLD),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('TEXTCOLOR', (0, 0), (-1, 0), COLOR_TEXT_MAIN),
            ('LINEBELOW', (0, 0), (-1, 0), 0.5, COLOR_TEXT_MAIN),
            ('FONTNAME', (0, 1), (-1, -1), FONT_NORMAL),
            ('TEXTCOLOR', (0, 1), (-1, -1), COLOR_TEXT_MAIN),
            ('ALIGN', (2, 1), (2, -1), 'RIGHT'),
            ('LINEBELOW', (0, 1), (-1, -1), 0.3, COLOR_BORDER_LIGHT),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        story.append(odeme_table)
    
    # PDF dökümanını oluştur ve gönder
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()