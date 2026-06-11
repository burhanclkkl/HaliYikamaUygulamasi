<div align="center">

# Halı Yıkama Uygulaması — Kurumsal CRM ve İşletme Otomasyonu

**Temizlik ve yıkama işletmeleri için uçtan uca müşteri, sipariş, finans ve personel yönetim sistemi.**

m² bazlı otomatik fiyatlandırma · 6 aşamalı sipariş takibi · otomatik PDF irsaliye · mesajlaşma entegrasyonları · tahsilat ve bakiye yönetimi · çok katmanlı yetkilendirme (Sistem Yöneticisi / İşletme Yöneticisi / Personel).

[![Backend](https://img.shields.io/badge/Backend-Flask%203-000000?logo=flask&logoColor=white)](#-backend-mimarisi)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react&logoColor=black)](#-frontend-mimarisi)
[![Vite](https://img.shields.io/badge/Build-Vite%208-646CFF?logo=vite&logoColor=white)](#-frontend-mimarisi)
[![Auth](https://img.shields.io/badge/Auth-JWT-FB015B?logo=jsonwebtokens&logoColor=white)](#-kimlik-doğrulama--yetkilendirme)
[![Dil](https://img.shields.io/badge/Arayüz-Türkçe-E30A17)](#)

</div>

---

## İçindekiler

- [Proje Hakkında](#proje-hakkında)
- [Açılış Sayfası (Landing Page)](#açılış-sayfası-landing-page)
- [Yönetici Paneli (Admin Dashboard)](#yönetici-paneli-admin-dashboard)
- [İşletme Paneli (User Dashboard)](#işletme-paneli-user-dashboard)
- [Sistem Mimarisi](#sistem-mimarisi)
- [Backend Mimarisi](#backend-mimarisi)
- [Frontend Mimarisi](#frontend-mimarisi)
- [Veri Modeli (Veritabanı Şeması)](#veri-modeli-veritabanı-şeması)
- [Kimlik Doğrulama ve Yetkilendirme](#kimlik-doğrulama-ve-yetkilendirme)
- [API Referansı](#api-referansı)
- [Kurulum ve Çalıştırma](#kurulum-ve-çalıştırma)
- [Test Verisi ve Giriş Bilgileri](#test-verisi-ve-giriş-bilgileri)
- [Proje Yapısı](#proje-yapısı)
- [Teknoloji Yığını](#teknoloji-yığını)

---

## Proje Hakkında

**Halı Yıkama Uygulaması**, işletmelerin operasyonel süreçlerini tek bir merkezden yönetmelerini sağlayan, kurumsal standartlarda bir CRM platformudur. Kullanıcı deneyimi, yoğun işlem hacmine sahip ofis ortamları göz önünde bulundurularak optimize edilmiştir. Finansal verilerin (tahsilat, bakiye, raporlama) bütünlüğü ve operasyonel hız ön planda tutularak tasarlanmıştır.

Uygulama **iki ayrı projeden** oluşan bir monorepo'dur:

| Katman | Teknoloji | Görev |
|---|---|---|
| **`backend/`** | Flask REST API (Python) | İş mantığı, kimlik doğrulama, PDF üretimi, otomatik loglama |
| **`frontend/`** | React 19 + Vite | Açılış sayfası + 3 ayrı kullanıcı paneli (admin / patron / personel) |

### Temel Özellikler

- **Dinamik Fiyatlandırma:** Ürün tipine göre m² ve fiyat oranlarının anlık olarak hesaplanması.
- **Sipariş Yaşam Döngüsü Yönetimi:** Operasyonun 6 aşamalı sistem üzerinden uçtan uca takibi (Teslim Alındı, Yıkanıyor, Kurulanıyor, Paketlendi, Teslimata Çıktı, Teslim Edildi).
- **Otomatik Belgelendirme:** Kurumsal kimliğe uygun, dinamik PDF irsaliye ve fatura üretimi.
- **Müşteri İletişim Entegrasyonu:** İşlem aşamalarına duyarlı, otomatik mesaj ve doküman paylaşımı.
- **Finans ve Tahsilat Yönetimi:** Gelişmiş bakiye takibi, çoklu ödeme tipleri ve cari hesap dökümleri.
- **Gelişmiş Yetki Mimarisi:** Sistem Yöneticisi, İşletme Yöneticisi ve Personel seviyelerinde erişim kontrolleri.
- **Veri Analitiği ve Raporlama:** Gelir grafikleri, operasyon dağılımları ve performans panoları.
- **Sistem Günlükleri (Audit Log):** Tüm veri modifikasyonlarının geriye dönük izlenebilirliği.
- **Lisans ve Kapasite Yönetimi:** İşletme hesaplarının, kullanım sürelerinin ve personel limitlerinin merkezi kontrolü.

---

## Açılış Sayfası (Landing Page)

Uygulamanın tanıtım ve müşteri edinimi odaklı arayüzüdür. Ürünün kurumsal yeteneklerini sergileyen vitrin görevini üstlenir. Modern web standartlarına uygun şekilde duyarlı (responsive) animasyonlar içerir.

**Sayfa Yapısı:**

1. **Hero (Komuta Paneli)** — Asimetrik düzen: solda başlık + güven rozetleri (*m² otomatik hesap, WhatsApp bildirimi, PDF irsaliye, tahsilat takibi*), sağda hafif eğik canlı bir sipariş kartı mockup'ı.
2. **İnteraktif Süreç** — 4 adımlı (Sipariş & Ölçüm → Yıkama Aşamaları → Anında Bildirim → Teslimat & Ödeme) tıklanabilir akış; 4 saniyede bir otomatik döngüye girer, kart görselleri canlı değişir.
3. **Yaşam Döngüsü Şeridi** — 6 aşamalı sipariş takibinin görsel anlatımı (stroke SVG ikonlarla).
4. **Modül Tanıtımları** — Dijital irsaliye, iletişim otomasyonu ve finansal raporlama modüllerinin detaylandırılması.
5. **Kapanış CTA** — İletişim çağrısı + giriş yönlendirmesi.

---

## Yönetici Paneli (Admin Dashboard)

Sistem Yöneticisi yetkisine sahip kullanıcıların, platforma kayıtlı tüm işletmeleri denetlediği ana kontrol merkezidir.

### Genel Bakış

Platform genelindeki operasyonel durumu özetleyen gösterge paneli:

- **Toplam Kullanıcı** — İşletme ve yönetici hesaplarının dağılımı.
- **Aktif Hesap** — aktif/pasif hesap sayısı.
- **Toplam Personel** — sistemdeki tüm personel / toplam kapasite.
- **Süre Uyarısı** — geçerlilik süresi dolan veya **7 güne** yaklaşan hesap sayısı (eşik tek satırda ayarlanabilir).

Altında iki panel:
- **Personel Kapasitesi** — İşletmeler bazında lisanslanmış personel kotalarının kullanım durumu.
- **Son Eklenen Kullanıcılar** — Yeni kayıt olan hesapların güncel durumu.

### Kullanıcılar

Platformdaki işletme hesaplarının listelendiği modüldür. Kapsamlı filtreleme özellikleri içerir.

| İşlem | Açıklama |
|-------|----------|
| **Aktif/Pasif Yapma** | Hesabı tek tıkla açıp kapatma (açıklama notuyla). Admin kendi hesabını pasif yapamaz. |
| **Personel Limiti** | İşletmelerin sisteme dahil edebileceği maksimum kullanıcı kotasının yönetimi. |
| **Geçerlilik Tarihi** | Aboneliğin bitiş tarihini ayarlama; boş = sınırsız lisans. |
| **İşlem Geçmişi (Log)** | O kullanıcıya ait tüm değişiklik kayıtlarını görme. |
| **Şifre Değiştirme** | Patronun şifresini sıfırlama (min. 8 karakter). |
| **Hesap Silme** | Kullanıcı ve bağlı tüm verilerin sistemden kalıcı olarak çıkarılması ve logların arşivlenmesi. |
| **Yeni Kullanıcı** | Yeni işletme hesaplarının sisteme tanımlanması. |

**Personel Yönetimi:** Seçilen işletmeye ait alt kullanıcıların detaylı olarak incelenmesi, yeni yetkilendirme veya kısıtlama yapılması işlemleri.

### Aktivite

Sistem genelinde yapılan modifikasyonların kronolojik dökümü. İşlem türü, güncellenen değer, ilgili işletme ve işlemi gerçekleştiren personel bilgisi yer alır.

---

## İşletme Paneli (User Dashboard)

İşletme Yöneticisi ve yetkili personellerin operasyonu yönettiği çalışma alanıdır. Kullanıcının erişim seviyesine göre modüller dinamik olarak kısıtlanır.

### Genel Bakış (DashboardTab)

- **Operasyonel kartlar:** Toplam Sipariş, Müşteri Sayısı.
- **Sipariş Durumları:** 6 aşamanın renk kodlu dağılım kutuları (eski durum kodları yeni sisteme otomatik eşlenir).
- **Finansal Özet:** Toplam Ciro ve Bekleyen Tahsilat takibi (sadece yetkili yöneticiler).
- **Tarih Filtresi:** Başlangıç–bitiş aralığı seçilince grafik **günlük ciroya**, seçilmezse **yıllık aylık ciroya** döner.
- **Ciro Grafiği:** Finansal gidişatı gösteren analiz modülü.

### Müşteriler (CustomersTab)

Kayıtlı cari ve müşteri listesi:
- **Veri Yönetimi** — Müşteri bilgilerinin standart formatta kayıt altına alınması.
- **WhatsApp** — tek tıkla isme özel mesajla sohbet açma.
- **Navigasyon** — Entegre harita yönlendirmesi.
- **Konum** — adresi Google Maps'te açma.
- **Veri Bütünlüğü Koruması** — Aktif siparişi bulunan müşterilerin sistemden silinmesinin engellenmesi.

### Siparişler (OrdersTab)

Sistemin ana operasyon modülüdür. 

**Filtreleme Seçenekleri:** Gelişmiş arama kriterleri, durum bazlı listeleme ve geciken işlemlere dair uyarı filtreleri.

**Sipariş Süreci:**
- Canlı veri tabanı sorgusu ile hızlı cari seçimi.
- İrsaliye no opsiyonel — boş bırakılırsa `IRS-{1000+id}` formatında **otomatik üretilir**.
- Çoklu halı kalemi eklenir; halı tipi seçilince **m² fiyatı otomatik dolar**; her satırda `m²` ve tutar anlık hesaplanır; genel toplam canlı güncellenir.
- Halı tipi tanımlı değilse sipariş oluşturma engellenir, kullanıcı Halı Tipleri sekmesine yönlendirilir.

**İşlem Seçenekleri:**

| Aksiyon | İşlev |
|---------|-------|
| **Durum Güncelle** | Açılır menüden 6 aşamadan birini seç; renk ve ikon anında değişir. |
| **WhatsApp** | İsme özel boş mesajla sohbet aç. |
| **Durum İlet** | Siparişin **güncel durumuna özel** profesyonel WhatsApp mesajı gönder (her aşama için ayrı şablon). |
| **İrsaliye** | PDF irsaliyeyi yeni sekmede aç/indir. |
| **İrsaliye İlet** | PDF'i `navigator.share` ile paylaş (mobil) veya indir + WhatsApp Web aç (masaüstü fallback). |
| **Ödeme** | Ödeme yönetimi modal'ı: kalan borç, yeni ödeme (nakit/kart/IBAN/havale), "Tümünü Öde", ödeme geçmişi ve silme. Tahsilat kalandan fazla olamaz. |
| **Sil** | Onay modal'ıyla siparişi sil. |

### Fiyatlandırma Yönetimi (CarpetTypesTab)

İşletmenin sunduğu hizmetlere özel kategorilerin ve m² bazlı birim fiyatlarının belirlendiği yönetim alanı. Bu modüle erişim sadece yöneticiler ile sınırlıdır.

### Personel Yönetimi (PersonnelTab)

İşletme bünyesinde çalışan personelin sisteme tanımlanması, yetkilendirmesi ve kısıtlamalarının ayarlandığı modüldür. Personel havuzu tek merkezden yönetilir.

---

## Sistem Mimarisi

```
┌──────────────────────────────┐         ┌───────────────────────────────┐
│        FRONTEND (Vite)       │  HTTP   │         BACKEND (Flask)       │
│      React 19 · port 5173    │ ◄─────► │       REST API · port 5001    │
│                              │  JSON   │                               │
│  • Landing  (tanıtım)        │  +JWT   │  • Blueprints (auth, users,   │
│  • Login                     │         │    customers, orders,         │
│  • AdminDashboard            │         │    payments, personnel,       │
│  • UserDashboard             │         │    carpet_types)              │
│  • axios + interceptor       │         │  • SQLAlchemy ORM + Migrate   │
│  • AuthContext (localStorage)│         │  • JWT · Limiter · CORS       │
│                              │         │  • ReportLab (PDF)            │
│                              │         │  • Otomatik audit log (events)│
└──────────────────────────────┘         └───────────────┬───────────────┘
                                                          │
                                                  ┌───────▼────────┐
                                                  │   Veritabanı   │
                                                  │ (SQLAlchemy DB)│
                                                  └────────────────┘
```

Modern uygulama standartlarına uygun şekilde Frontend ve Backend servisleri izole olarak çalışmaktadır.

---

## Backend Mimarisi

Flask **application factory** (`create_app`) deseni kullanılır. Her kaynak bir **blueprint**'tir.

### Sistem Modülleri

| Dosya | Görev |
|-------|-------|
| `app/__init__.py` | `create_app` factory: eklenti init, CORS, blueprint kaydı, `/` ve `/health` endpoint'leri, 429 hata yöneticisi. `app.json.ensure_ascii = False` (Türkçe karakter desteği). |
| `app/extensions.py` | Eklenti nesneleri: `db` (SQLAlchemy), `migrate`, `jwt`, `limiter` (varsayılan limit: 500/gün, 100/saat). |
| `config.py` | `.env`'den `SECRET_KEY`, `DATABASE_URL`, `JWT_SECRET_KEY` okur; `RATELIMIT_ENABLED` ile rate limit kapatılabilir. |
| `app/constants.py` | Geçerli sipariş durumları ve ödeme türleri. |
| `app/decorators.py` | `@admin_required` — JWT claim'inden rol kontrolü. |
| `app/events.py` | **Otomatik audit log:** SQLAlchemy `before_flush` event'i ile INSERT/UPDATE/DELETE işlemlerini `user_logs`'a yazar. Şifre hash'leri asla loglanmaz. |
| `app/utils/auth_utils.py` | `get_owner_id()` — personel ise patronun ID'sini, değilse kendi ID'sini döner (veri sahipliği bu fonksiyona dayanır). |
| `app/services/pdf_service.py` | ReportLab ile irsaliye PDF üretimi; `app/fonts/` altındaki Liberation Serif fontuyla Türkçe karakter desteği (yoksa Arial → Helvetica fallback). |

### Güvenlik ve İşlem Kayıtları (Audit Trail)

Veritabanı üzerinde gerçekleşen işlemler, oturumdaki kullanıcı yetkileri baz alınarak kurumsal şeffaflık ilkelerine uygun biçimde günlüklenir. Sistem, güvenlik bağlamında hassas verileri maskeler ve sadece gerekli işlem özetlerini kayıt altına alır.

### Otomatik Dokümantasyon (PDF)

Müşterilere sunulmak üzere, mali değerleri de kapsayan ve kurumsal font standartlarını destekleyen dinamik çıktı mekanizması.

---

## Frontend Mimarisi

React 19 + Vite. Yönlendirme `react-router-dom` v7, grafikler `recharts`, animasyonlar `framer-motion`.

### Yönlendirme (`App.jsx`)

| Yol | Koşul | Bileşen |
|-----|-------|---------|
| `/` | — | `Landing` |
| `/login` | giriş yapılmamışsa | `Login` (yapılmışsa → `/dashboard`) |
| `/dashboard` | `role === 'admin'` | `AdminDashboard` |
| `/dashboard` | diğer roller | `UserDashboard` |
| `*` | — | `/`'ye yönlendir |

### Uygulama Durum Yönetimi

- **`AuthContext`** — kullanıcı bilgisi ve token `localStorage`'da saklanır; `login()` / `logout()` / `loading` sağlar.
- **`api.js`** — axios instance; request interceptor token ekler, response interceptor 401'de oturumu temizler (login/register istekleri hariç).

### Bileşenler

- **Sayfalar:** `Landing`, `Login`, `AdminDashboard`, `UserDashboard`.
- **Sekmeler:** `DashboardTab`, `CustomersTab`, `OrdersTab`, `PaymentsTab` (Orders içinde), `PersonnelTab`, `CarpetTypesTab`.
- **Ortak:** `Modal`, `ErrorModal`, `ConfirmModal`, `PasswordModal`, `Footer`.
- **Yardımcılar (`utils/helpers.js`):** telefon formatlama (`formatTelefon`, `formatPhoneInput`, `getCleanPhoneNumber`), para formatlama (`formatPara`), tarih (`formatTarih`), Türkçe Title Case (`capitalize`).

---

## Veri Modeli (Veritabanı Şeması)

```
User (users) ─ admin / patron
 ├─ id, email*, password_hash, phone
 ├─ role ('admin'|'user'), aktif, personnel_limit (def. 3)
 ├─ gecerlilik_tarihi (abonelik bitişi), created_at
 │
 ├──< Personnel (personnel)        user_id FK · ad, soyad, email*, telefon, password_hash, aktif
 ├──< Customer  (customers)        user_id FK · ad, soyad, telefon, adres
 │     └──< Order (orders)         customer_id FK · irsaliye_no, teslim_tarihi, durum
 │           ├──< OrderItem        hali_tipi, en, boy, m2, m2_fiyat, tutar (Numeric)
 │           └──< Payment          tutar, odeme_turu, aciklama, created_at
 ├──< CarpetType (carpet_types)    user_id FK · name, price_per_m2
 └──< UserLog (user_logs)          user_id FK, changed_by_id FK · islem, eski_deger, yeni_deger, aciklama
```

**İlişki & bütünlük notları:**
- `User → Personnel/Customer/Order/CarpetType`: `cascade='all, delete-orphan'` — kullanıcı silinince tüm alt verileri temizlenir.
- `Order → OrderItem/Payment`: cascade ile sipariş silinince kalemleri ve ödemeleri silinir.
- Parasal ve ölçü alanları `Numeric` (Decimal) — kayan nokta hatası olmadan hassas para hesabı.
- `UserLog` aynı `users` tablosuna **iki FK** ile bağlanır (`user_id` = sahibi, `changed_by_id` = işlemi yapan); bu yüzden `foreign_keys` açıkça belirtilir.
- **Veri sahipliği:** Müşteri/sipariş/halı tipi sorguları daima `get_owner_id()` ile filtrelenir — bir patronun verisi başka patrona görünmez; personel patronunun havuzunu paylaşır.

### Sipariş Durumları (6 Aşama)

`teslim_alindi` → `yikaniyor` → `kurulaniyor` → `paketlendi` → `teslimata_cikti` → `teslim_edildi`

> Eski 4 aşamalı kodlar (`alindi`, `temizleniyor`, `hazir`) geriye uyumluluk için yeni sisteme otomatik eşlenir.

### Ödeme Türleri

`nakit` · `kart` · `iban` · `havale`

---

## 🔐 Kimlik Doğrulama & Yetkilendirme

- **JWT tabanlı** kimlik doğrulama (`flask-jwt-extended`). Token, `identity` (kullanıcı ID) ve `additional_claims` (`role`) taşır.
- **Tek giriş kapısı:** `/auth/login` önce `User` (admin/patron), bulamazsa `Personnel` (e-posta **veya** telefon ile) arar.
- **Üç güvenlik kapısı:** ① şifre doğrulama → ② hesap aktif mi → ③ geçerlilik tarihi dolmuş mu (patron/admin için).
- **Rate limiting:** Login `5/dakika`, PDF `10/dakika`, genel `500/gün · 100/saat`. Aşımında Türkçe 429 mesajı.
- **Roller:**
  - `admin` — tüm sistemi yönetir (`@admin_required` korumalı `/users` uçları).
  - `user` (patron) — kendi işletmesinin tüm verisini yönetir.
  - `personnel` — patronun ortak havuzunu paylaşır; finans ve yönetim sekmeleri kısıtlı.
- **Şifreler** `pbkdf2:sha256` ile hash'lenir; loglara asla yazılmaz.

---

## 📡 API Referansı

Tüm yanıtlar ve hata mesajları **Türkçe**dir. `🔒` = JWT gerekli, `👑` = admin gerekli.

### Kimlik (`/auth`)
| Method | Yol | Açıklama |
|--------|-----|----------|
| `POST` | `/auth/login` | Giriş (e-posta/telefon + şifre), JWT döner. |
| `GET` | `/auth/me` 🔒 | Mevcut kullanıcı bilgisi. |
| `PUT` | `/auth/sifre` 🔒 | Kendi şifresini değiştir (eski + yeni). |

### Kullanıcılar (`/users`) 👑
| Method | Yol | Açıklama |
|--------|-----|----------|
| `GET` | `/users` | Tüm kullanıcılar (+ personel sayısı). |
| `POST` | `/users` | Yeni patron oluştur. |
| `PUT` | `/users/<id>/aktif` | Aktif/pasif yap. |
| `PUT` | `/users/<id>/password` | Şifre sıfırla. |
| `PUT` | `/users/<id>/gecerlilik` | Geçerlilik tarihi ayarla. |
| `PUT` | `/users/<id>/limit` | Personel limiti ayarla. |
| `GET` | `/users/<id>/personnel` | Patronun personelleri. |
| `POST` | `/users/<id>/personnel` | Patrona personel ekle. |
| `PUT/DELETE` | `/users/personnel/<pid>` | Personel düzenle/sil. |
| `PUT` | `/users/personnel/<pid>/aktif` | Personel aktif/pasif. |
| `PUT` | `/users/personnel/<pid>/password` | Personel şifre. |
| `DELETE` | `/users/<id>` | Kullanıcıyı sil (loglar arşivlenir). |
| `GET` | `/users/<id>/logs` | Kullanıcının değişiklik geçmişi. |

### Müşteriler (`/customers`) 🔒
`GET /customers` · `GET /customers/<id>` · `POST /customers` · `PUT /customers/<id>` · `DELETE /customers/<id>`

### Siparişler (`/orders`) 🔒
| Method | Yol | Açıklama |
|--------|-----|----------|
| `POST` | `/orders` | Sipariş oluştur (items ile, tutar otomatik hesaplanır). |
| `GET` | `/orders` | Sipariş listesi (kalan gün, ödenen, kalan dahil). |
| `GET` | `/orders/<id>` | Tek sipariş detayı. |
| `PUT` | `/orders/<id>/durum` | Durum güncelle. |
| `DELETE` | `/orders/<id>` | Sipariş sil. |
| `GET` | `/orders/<id>/pdf` | İrsaliye PDF indir. |
| `GET` | `/orders/stats` | Pano istatistikleri (ciro, durum dağılımı, aylık/günlük grafik). |

### Ödemeler (`/orders/<id>/payments`) 🔒
`POST` (ödeme ekle) · `GET` (ödeme geçmişi + toplam/ödenen/kalan) · `DELETE /<payment_id>`

### Halı Tipleri (`/carpet_types`) 🔒
`GET` · `POST` · `PUT /<id>` · `DELETE /<id>` — *yazma işlemleri personel için 403.*

### Personel (`/personnel`) 🔒 *(patron tarafı)*
`GET` · `POST` · `PUT /<id>` · `DELETE /<id>` · `PUT /<id>/aktif` · `PUT /<id>/password`

---

## 🚀 Kurulum & Çalıştırma

### Ön Koşullar
- Python 3.10+
- Node.js 18+
- Bir veritabanı (SQLite ile çalışır; `DATABASE_URL` ile PostgreSQL vb. de kullanılabilir)

### 1. Backend

```powershell
cd backend

# Sanal ortam (ilk kurulumda)
python -m venv venv
.\venv\Scripts\Activate.ps1      # Windows
# source venv/bin/activate       # macOS/Linux

# Bağımlılıklar
pip install -r requirements.txt

# .env dosyası oluştur (aşağıdaki "Ortam Değişkenleri")
# Veritabanı migration
flask db upgrade

# Sunucuyu başlat (port 5001)
python run.py
```

API `http://127.0.0.1:5001` adresinde çalışır. Sağlık kontrolü: `GET /health`.

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev      # geliştirme sunucusu → http://localhost:5173
npm run build    # üretim derlemesi
npm run lint     # ESLint
```

### Ortam Değişkenleri (`backend/.env`)

`.env` git'e dahil **değildir**; `config.py` `python-dotenv` ile okur:

```ini
SECRET_KEY=degistir-beni
DATABASE_URL=sqlite:///instance/app.db
JWT_SECRET_KEY=degistir-beni-de
RATELIMIT_ENABLED=True        # geliştirmede False ile kapatılabilir
```

### Şema Değişiklikleri

```powershell
flask db migrate -m "açıklama"
flask db upgrade
```

> Yeni bir model eklerken `app/__init__.py` içindeki model import satırına eklemeyi unutmayın — aksi halde migration onu görmez.

---

## 🌱 Test Verisi & Giriş Bilgileri

Geliştirme/demo için **sahte veri yükleyici** (`backend/seed_fake_data.py`) hazırdır. Tüm sahte hesaplar `@haliyikama.test` alan adını kullanır; bu sayede tek komutla temizlenebilir ve gerçek veriye dokunmaz.

```powershell
cd backend
.\venv\Scripts\Activate.ps1

python seed_fake_data.py            # sahte veriyi yükle (önce eskisini temizler — idempotent)
python seed_fake_data.py --clear    # SADECE sahte veriyi sil
```

Yükleme sonrası **zengin demo veri** (16 kullanıcı, ~80 müşteri, ~70 sipariş, ödemeler, personel, halı tipleri, loglar) oluşur.

### Giriş Bilgileri

| Rol | E-posta | Şifre |
|-----|---------|-------|
| **Admin** | `admin@haliyikama.test` | `Admin1234!` |
| **Patron** (zengin demo veri burada) | `patron@haliyikama.test` | `Patron1234!` |
| Diğer patronlar | `isletme01@haliyikama.test` … `isletme14@haliyikama.test` | `Patron1234!` |
| Personel | `<ad>.<soyad>.<n>@haliyikama.test` | `Personel1234!` |

---

## 📂 Proje Yapısı

```
Halı Yıkama/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # create_app factory
│   │   ├── constants.py         # durumlar, ödeme türleri
│   │   ├── decorators.py        # @admin_required
│   │   ├── events.py            # otomatik audit log
│   │   ├── extensions.py        # db, migrate, jwt, limiter
│   │   ├── fonts/               # Liberation Serif (PDF Türkçe font)
│   │   ├── models/              # user, personnel, customer, order,
│   │   │                        # order_item, payment, carpet_type, user_log
│   │   ├── routes/              # auth, users, customers, orders,
│   │   │                        # payments, personnel, carpet_types (blueprints)
│   │   ├── services/pdf_service.py
│   │   └── utils/auth_utils.py  # get_owner_id()
│   ├── migrations/              # Flask-Migrate (Alembic)
│   ├── config.py
│   ├── requirements.txt
│   ├── run.py                   # giriş noktası (port 5001)
│   └── seed_fake_data.py        # test verisi yükleyici
│
├── frontend/
│   ├── src/
│   │   ├── pages/               # Landing, Login, AdminDashboard, UserDashboard
│   │   ├── components/          # *Tab.jsx + Modal'lar + Footer
│   │   ├── context/AuthContext.jsx
│   │   ├── services/api.js      # axios + interceptor
│   │   ├── utils/helpers.js     # format yardımcıları
│   │   └── App.jsx              # router
│   ├── package.json
│   └── vite.config.js
│
├── docs/                        # README görselleri (GIF)
├── CLAUDE.md                    # proje notları / geliştirici rehberi
├── PRODUCT.md                   # ürün & tasarım ilkeleri
├── DESIGN.md
└── README.md
```

---

## 🧰 Teknoloji Yığını

**Backend:** Flask 3 · Flask-SQLAlchemy · Flask-Migrate (Alembic) · Flask-JWT-Extended · Flask-CORS · Flask-Limiter · ReportLab · python-dotenv · Werkzeug (pbkdf2 hashing)

**Frontend:** React 19 · Vite 8 · React Router 7 · Axios · Recharts · Framer Motion · ESLint

**Diğer:** JWT kimlik doğrulama · m² bazlı Decimal hesaplama · SQLAlchemy event-driven audit log · WhatsApp Web/Share API entegrasyonu

---

<div align="center">

**Halı Yıkama** — modern, canlı, markalı; ama her zaman profesyonel ve güven veren.

📧 Destek: [hali.temizleme@protonmail.com](mailto:hali.temizleme@protonmail.com)

</div>
