# Halı Yıkama Uygulaması — Kurumsal CRM

Sektörel işletmeler için geliştirilmiş; müşteri, operasyon, finans ve kurumsal yetki kontrolü sağlayan entegre bir CRM çözümüdür.
Sistem arayüzü ve iletişim bileşenleri endüstri standardı Türkçe kullanılarak yapılandırılmıştır.

## Mimari

İki ayrı uygulama:

- **backend/** — Flask REST API
  - `create_app` factory deseni (`app/__init__.py`)
  - Eklentiler `app/extensions.py` içinde tanımlı: SQLAlchemy (`db`), Migrate, JWT, Limiter
  - Her kaynak bir **blueprint**: `app/routes/` (auth, users, customers, orders, payments, personnel, carpet_types)
  - Modeller `app/models/` (user, user_log, customer, order, order_item, payment, personnel, carpet_type)
  - `app/events.py` — Veri modifikasyonlarının merkezi ve kurumsal audit loglaması (`user_log`)
  - `app/services/pdf_service.py` — Formata uygun dijital fatura/irsaliye üretimi
  - Modern JWT tabanlı doğrulama ve DDOS önleyici limit mekanizmaları.

- **frontend/** — React 19 + Vite
  - Yönlendirme: `react-router-dom` v7
  - HTTP: `axios` (`src/services/api.js`)
  - Grafikler: `recharts`
  - Kimlik durumu: `src/context/AuthContext.jsx`
  - Sayfalar: `src/pages/` (Landing, Login, AdminDashboard, UserDashboard)
  - Sekme bileşenleri: `src/components/` (CustomersTab, OrdersTab, PaymentsTab, PersonnelTab, CarpetTypesTab, DashboardTab + modal'lar)

## Çalıştırma

### Backend
```powershell
cd backend
# Sanal ortam (ilk kurulumda)
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install flask flask-sqlalchemy flask-migrate flask-jwt-extended flask-cors flask-limiter python-dotenv
# Veritabanı
flask db upgrade
# Sunucu (port 5001 — macOS AirPlay çakışmasını önlemek için)
python run.py
```

### Frontend
```powershell
cd frontend
npm install
npm run dev      # geliştirme sunucusu (Vite)
npm run build    # üretim derlemesi
npm run lint     # ESLint
```

## Çevresel Değişkenler (Environment Variables)

`backend/.env` yapılandırması (güvenlik amaçlı versiyon kontrolüne dahil edilmemiştir):
- `SECRET_KEY`
- `DATABASE_URL` — Veritabanı bağlantı konfigürasyonu
- `JWT_SECRET_KEY`

## Veritabanı

Veritabanı yapısal modifikasyonları için **Flask-Migrate** yönergelerini izleyin:
```powershell
flask db migrate -m "versiyon_notu"
flask db upgrade
```
ORM senkronizasyonu için, yeni tanımlanan modellerin `app/__init__.py` içerisine aktarıldığından emin olun.

## Geliştirme Standartları

- Sisteme entegre edilecek yeni modüller belirlenmiş desen yönergelerini izlemelidir: `models/<ad>.py` ve `routes/<ad>.py`.
- Servis iletişimleri, sunucu-istemci uyumluluğunu en üst düzeye taşıyacak şekilde optimize edilmiştir (`app.json.ensure_ascii = False`).
- İstemci tarafı HTTP talepleri standart mimari üzerinden kontrol edilmeli ve doğrudan bileşen içinden gerçekleştirilmemelidir.

## Teknik Borçlar ve Geliştirmeler

- Proje dizininde yer alan konfigürasyon dosyaları isimlendirmeleri revize edilmelidir.
- Sunucu tarafı bağımlılıkları (dependencies) düzenli bir liste halinde standardize edilerek otomatize edilmelidir.
