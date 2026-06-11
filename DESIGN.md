---
name: Halı Yıkama Uygulaması CRM
description: Kurumsal operasyonlar için tasarlanmış, okunabilirliğin yüksek olduğu, profesyonel bir CRM tasarım sistemi konfigürasyonu.
colors:
  # GENEL UYGULAMA PALETİ — "Tech & Trust" (kanonik, MAVİ)
  # Token kaynağı: frontend/src/index.css ve frontend/src/pages/AdminDashboard.css :root
  # (AdminDashboard.css sonra yüklenir ve aksanı belirler; ikisi de aynı tutulur)
  bg: "#f1f5f9"             # uygulama gövde zemini (açık gri)
  surface: "#ffffff"        # kart, modal, tablo, dropdown
  surface-muted: "#f8fafc"  # tablo başlığı, input/ikincil buton zemini
  sidebar: "#0f172a"        # koyu sidebar
  primary: "#2563eb"        # MAVİ birincil aksan — CTA, aktif menü, link, ikon, seçili durum
  primary-hover: "#1d4ed8"
  primary-soft: "#60a5fa"
  primary-tint: "#dbeafe"   # rozet / avatar / çip zemini (mavinin en açık dokunuşu)
  border: "#e2e8f0"
  border-faint: "#f1f5f9"
  ink: "#1e293b"            # gövde metni
  ink-strong: "#0f172a"     # finansal vurgu / koyu başlık
  ink-muted: "#64748b"      # etiket / meta (gövde metni için DEĞİL)
  success: "#059669"        # ödendi / aktif toggle / WhatsApp / onay (tint #ecfdf5)
  warning: "#d97706"        # yaklaşan / bekleyen (amber, tint #fffbeb)
  danger: "#dc2626"         # silme / pasif / geciken / kalan bakiye (tint #fef2f2)
  info: "#0284c7"           # nötr bilgilendirme (tint #e0f2fe)
typography:
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "normal"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "normal"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.5px"
  data:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
    height: "42px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.surface}"
  button-secondary:
    backgroundColor: "{colors.surface-muted}"
    textColor: "#475569"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "28px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "12px 14px"
  badge:
    backgroundColor: "{colors.primary-tint}"
    textColor: "{colors.primary-hover}"
    rounded: "{rounded.sm}"
    padding: "4px 10px"
  status-toggle:
    backgroundColor: "#ecfdf5"
    textColor: "{colors.success}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
---

# Design System: Halı Yıkama Uygulaması CRM

Sistem stili CSS tokenları kullanılarak yapılandırılmıştır ve marka kimliğinin değişmez temel öğelerini kapsar.

## 1. Overview

**Tasarım Vizyonu: Dinamik Operasyon Merkezi**

Bu sistem, temizlik ve yıkama tesislerinin operasyonel yoğunluğunu yönetecek kapasitede kurumsal bir CRM platformudur. Günlük tekrarlayan veri girişi eylemlerini (sipariş yönetimi, finansal takipler ve müşteri işlemleri) güvenilir, hatasız ve hızlı bir altyapı üzerinde birleştirir. Odak noktası verilerin kesinliği ve görünürlüğüdür.

Finansal okunabilirlik mimarinin çekirdeğidir. Ödeme, bakiye ve tahsilat gibi veriler en üst seviye hiyerarşi ile vurgulanır ve okuma ergonomisini zorlaştıran düşük kontrastlardan kaçınılır. Arayüz bileşenleri profesyonel sadeliği, tutarlı geri bildirimleri ve kullanıcıyı yönlendiren tasarımları merkeze alır.

**Key Characteristics:**
- Açık gri zemin + tek mavi aksiyon rengi; canlılık renk-kodlu durumlardan gelir
- Finansal verilerin maksimum kontrast ve kalınlık ile işlenmesi
- Gelişmiş semantik durum bildirimleri: başarı, uyarı, tehlike, bilgi katmanları
- Tek aile, iyi ayarlanmış sistem sans; uygulama ve açılış sayfası aynı fontu paylaşır
- Kullanılabilirlik standartlarına tam uygun endüstriyel form öğeleri

## 2. Colors

Renk sistemi, odak ve işlem noktalarını hiyerarşik biçimde işaret eden açık-koyu kurumsal kontrast temeline dayanır.

### Birincil Renk Skalası (Kurumsal Aksan)
- **Birincil Aksan** (`#2563eb`): Ana fonksiyon bileşenleri (eyleme çağrı - CTA butonları, bağlantılar ve aktif öğeler). Renk yoğunluğu işlemleri vurgular ve salt dekorasyon amaçlı kullanılmaz.
- **Koyu Mavi** (`#1d4ed8`): Hover ve basılı haller; rozet metni (`badge-admin`), dolu kapasite.
- **Açık Mavi** (`#60a5fa`): İkincil mavi vurgu.
- **Mavi Sis** (`#dbeafe`): Rozet, avatar, çip ve hafif vurgu zeminleri; mavinin en açık dokunuşu.

### İkincil Semantik Renkler
- **Yeşil / Başarı** (`#059669`, tint `#ecfdf5`): Ödenen tutar, "teslim edildi", aktif toggle,
  hızlı aksiyon entegrasyonu, onay.
- **Amber / Uyarı** (`#d97706`, tint `#fffbeb`): Yaklaşan geçerlilik, bekleyen, dikkat gerektiren.
- **Kırmızı / Tehlike** (`#dc2626`, tint `#fef2f2`): Silme, pasif hesap, geciken sipariş, kalan
  bakiye, süresi dolmuş geçerlilik, çıkış.
- **Gök / Bilgi** (`#0284c7`, tint `#e0f2fe`): Nötr bilgilendirme, ikincil aksiyonlar.

### Operasyonel Süreç Zinciri (Üçüncül Spektrum)
Durum bileşenleri zemin ve metin eşleşmesiyle tasarlanmış olup her bir durum ilgili operasyonun kritiklik seviyesini bildirir. Kullanılabilirlik (WCAG) gereği renk yalnızca destekleyici bir parametredir, ikonlar ve metinler ana bilgi taşıyıcıdır.

### Neutral
- **Gri Zemin** (`#f1f5f9`): Uygulama arka planı; içerik yüzeyinden bir kademe geri.
- **Yüzey** (`#ffffff`): Kartlar, modallar, tablolar, dropdown.
- **Sönük Yüzey** (`#f8fafc`): Tablo başlıkları, ikincil buton, input zeminleri, panel içi.
- **Koyu Sidebar** (`#0f172a`): Admin/User panosu sol menüsü; beyaz metin taşır.
- **Kenarlık** (`#e2e8f0`) ve **Soluk Kenarlık** (`#f1f5f9`): Ayraçlar; ana ve içsel bölme.
- **Mürekkep** (`#1e293b`) / **Koyu Mürekkep** (`#0f172a`): Gövde metni / finansal vurgu.
- **Sönük Mürekkep** (`#64748b`): Etiketler, ikincil metin, meta. Gövde metni için kullanma.

### Temel Kurallar
**Tutarlı Aksan Uygulaması:** Ana vurgu rengi yalnızca etkileşim alanlarına tahsis edilerek platformun işlevsel kalması sağlanır.

**Finansal Vurgu Politikası:** Maddi bütünlüğe sahip veriler arayüz hiyerarşisinde daima en okunaklı formda yer alır.

## 3. Typography

**UI/Body Font:** Sistem sans (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`)

Sistem genelinde tek bir yazı tipi ailesi kullanılarak estetik ve kurumsal okunabilirlik bütünlüğü sağlanmıştır.

### Hierarchy
- **Headline** (700, 1.75rem/28px, 1.1): Büyük istatistik değerleri, durum sayıları; bir bakışta
  okunan ana rakamlar.
- **Title** (700, 1.25rem/20px, 1.25): Kart başlıkları, modal başlıkları, müşteri/kullanıcı adı.
- **Body** (400–500, 0.875rem/14px, 1.5): Genel metin, tablo hücreleri, form değerleri.
  Düzyazı 65–75ch ile sınırlanır; tablolar daha yoğun akabilir.
- **Label** (700, 0.75rem/12px, 0.5px tracking, UPPERCASE): Para etiketleri, istatistik etiketleri,
  sipariş No, tablo başlıkları, kart meta etiketleri. Yalnızca ≤4 kelimelik kısa etiketler için.
- **Data** (800, 1rem/16px+): Para değerleri ve finansal rakamlar; en yüksek ağırlık.

Tüm isimlendirme formatları kurumsal yazım standartlarına uyar. Büyük harf kullanımları tamamen spesifik vurgu noktalarına sınırlandırılmıştır.

## 4. Elevation

Gölgeleme sistemi modüllerin arayüz içerisindeki bağlamını belirginleştirmek için katmanlandırılmış ve hafif tasarlanmıştır.

### Shadow Vocabulary
- **Taban** (`box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08)`): Kartlar, header, modal, istatistik
  kutuları. Varsayılan dinlenme gölgesi.
- **Kart Hover** (`box-shadow: 0 10px 24px -12px rgba(15, 23, 42, 0.22)`): Varlık kartı (müşteri/
  kullanıcı) üzerine gelince hafif yükselme + mavi kenarlık ipucu.
- **Dropdown** (`box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)`):
  Kullanıcı menüsü; içeriğin üstünde net katman.
- **Renkli Hover Parıltısı** (`box-shadow: 0 4px 12px rgba(<accent>, 0.25)` / mavi için
  `rgba(37, 99, 235, ...)`): Yalnızca buton/aktif öğe hover'ı; öğenin kendi renginin yumuşak halesi.

**Görsel Derinlik Prensibi:** Gölgelendirme yalnızca etkileşimi bildirmek için devreye alınır, bilgi kirliliğinden kaçınılır.

## 5. Components

Her etkileşimli bileşen endüstriyel standartlara ve işlevselliğe uygun olarak kodlanmış standart durumlarını kapsar.

### Buttons
- **Shape:** Yumuşak köşe (8px), min yükseklik 42px (sm: 36px), `inline-flex` ikon+metin (8px gap).
- **Primary:** Mavi zemin (`#2563eb`) + beyaz metin, 10px 20px padding. Hover koyu mavi
  (`#1d4ed8`) + mavi parıltı.
- **Secondary:** Sönük yüzey (`#f8fafc`) + slate metin + `#cbd5e1` kenarlık. İkincil aksiyon.
- **Semantik varyantlar:** `success` (yeşil), `danger` (kırmızı), `warning` (amber), `info` (gök);
  hover'da kendi renginde parıltı.
- **Active:** `transform: scale(0.97)` — dokunsal basma geri bildirimi.

### Badges & Status
- **Badge** (rol etiketi): Hafif tint zemin + koyu eş-hue metin + ince kenarlık, 6px köşe,
  UPPERCASE 12px 700.
- **Status Toggle** (aktif/pasif): Pill (9999px) köşe, tint zemin + eş-hue metin + ince kenarlık.
  Aktif=yeşil aile (`#ecfdf5`/`#059669`), pasif=kırmızı aile (`#fef2f2`/`#e11d48`). Hover'da hafif
  koyulaşma + `scale(0.97)`.
- **Geçerlilik etiketi:** Sınırsız/geçerli=nötr gri, yaklaşan=amber (`#fffbeb`/`#b45309`),
  süresi doldu=solid kırmızı (`#dc2626`). Her zaman metinle birlikte.

### Cards / Containers
- **Corner Style:** 16px ana kartlar (`card`, `ent-card`, `modern-order-card`), 12px ikincil kutular.
- **Background:** Beyaz yüzey; içsel kutular sönük yüzey (`#f8fafc`) veya gri zemin.
- **Shadow Strategy:** Taban gölgesi dinlenirken; hover'da yükselme + mavi kenarlık ipucu.
- **Border:** İnce `#f1f5f9`–`#e2e8f0` tam kenarlık. Bölümler tam kenarlıkla ayrılır
  (yan-şerit kenarlık değil).
- **Internal Padding:** 16–28px ana kart, 12–20px içsel kutular.

### Temel Obje Bileşeni (Entity Card)
Modüller arası veri sunum standardizasyonu sağlanmıştır. Veri listeleri sistematik şekilde oluşturulur, bileşen bütünlüğü ve duyarlılık esas alınır. 
Objelerin aşırı uzun metin girişlerinde dahi görsel formasyonu bozulmaz.

### Inputs / Fields
- **Style:** Beyaz/sönük zemin, `#cbd5e1`–`#e2e8f0` 1px kenarlık, 10–12px köşe, 12px 14px padding.
- **Focus:** Mavi kenarlık + `box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12)` odak halkası.
- **Otomatik alan:** `input-auto-gen` — kesik kenarlık (`dashed`) + italik placeholder, sistem
  tarafından üretilen (irsaliye no) alanları işaret eder.

### Navigation
- **Sidebar (Admin/User panosu):** Koyu zemin (`#0f172a`), beyaz metin; aktif öğe mavi zemin +
  mavi parıltı, sayaç rozeti beyaz pill. Altta kullanıcı kartı (avatar + e-posta + rol).
- **Tab bar (eski kabuk):** Yatay sekmeler, alt çizgi göstergesi; aktif sekme mavi. Mobilde 2'li grid.
- **Üst Yönetim Çubuğu:** Beyaz yüzey + taban gölgesi; sol başlık, sağ kullanıcı menüsü.
- **User menu (dropdown):** Beyaz, 12px köşe, dropdown gölgesi, dikey öğe listesi. Z-index 1050.

### Data Table
- Beyaz yüzey, 14px gövde; başlık satırı sönük yüzey (`#f8fafc`) + UPPERCASE 12px etiket.
- Satır hover `#fcfcfd`; hücre alt ayraç `#f1f5f9`. Mobilde yatay scroll. *Kullanıcı ve müşteri
  listeleri verimlilik amacıyla yeni nesil kart gridleri üzerinden yapılandırılmıştır.*

### Modern Operasyon Bileşenleri
Veri yönetiminde karmaşıklığı azaltmak adına bilgilerin fonksiyonlarına ve bağlamlarına göre modüllere ayrıldığı arayüz kartları.

## 6. Do's and Don'ts

### Do:
- **Do** maviyi (`#2563eb`) yalnızca aksiyon, aktif sekme ve seçili durum için kullan; herhangi
  bir modülün küçük yüzdelerinde tut.
- **Do** finansal değerleri tam opaklıkta sun.
- **Do** sipariş/ödeme/hesap durumunu renk **ve** metin/ikonla birlikte göster; renk tek başına
  anlam taşımaz (WCAG, renk körlüğü).
- **Do** tek sistem sans kullan; hiyerarşiyi ölçek + ağırlık kontrastıyla kur.
- **Do** yumuşak taban gölgesini dinlenme halinde tut; renkli parıltıyı yalnızca hover'a sakla.

### Don't:
- **Don't** kurumsal ciddiyeti bozacak karmaşık renk paletleri ile sistem uyumluluğunu ihlal etme.
- **Don't** estetik endişeler ile gövde metnini okunamayacak soluk tonda kullanma.
- **Don't** objelerde işlevden yoksun gereksiz görsel karmaşıklıklar, gradyanlar dahil etme.
- **Don't** kullanıcı deneyimini zayıflatan genel geçer UI kuralları dışında konfigürasyonlara başvurma.
