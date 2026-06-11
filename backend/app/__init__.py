from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from app.extensions import db, migrate, jwt, limiter

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    app.json.ensure_ascii = False
    
    CORS(app, resources={
        r"/*": {
            "origins": "*",
            "allow_headers": ["Content-Type", "Authorization", "Access-Control-Allow-Credentials"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
        }
    }, supports_credentials=True)
    
    db.init_app(app)
    migrate.init_app(app, db)        # ← db parametresini unutma!
    jwt.init_app(app)
    limiter.init_app(app)

    # Modelleri import et (Adim 3'te ekleyecegiz)
    from app.models import user, user_log, customer, order, order_item, payment, personnel, carpet_type, expense, expense_category  # noqa: F401

    # Otomatik Loglama (SQLAlchemy Events) sistemini devreye sok
    from app import events

    from app.routes.auth import auth_bp
    app.register_blueprint(auth_bp)

    from app.routes.users import users_bp
    app.register_blueprint(users_bp)


    from app.routes.customers import customers_bp
    app.register_blueprint(customers_bp)

    from app.routes.orders import orders_bp
    app.register_blueprint(orders_bp)

    from app.routes.payments import payments_bp
    app.register_blueprint(payments_bp)

    from app.routes.personnel import personnel_bp
    app.register_blueprint(personnel_bp)

    from app.routes.carpet_types import carpet_types_bp
    app.register_blueprint(carpet_types_bp)
    
    from app.routes.expenses import expenses_bp
    app.register_blueprint(expenses_bp)
    
    @app.route('/')
    def index():
        return jsonify({'mesaj': 'Halı Temizleme API çalışıyor 🧼'})
    
    @app.route('/health')
    def health():
        return jsonify({'durum': 'çalışıyor', 'versiyon': '1.0.0'})
    
    # Rate Limiter (Çok fazla istek) için özel Türkçe hata mesajı
    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({'hata': 'Çok fazla giriş denemesi yaptınız. Lütfen 1 dakika bekleyip tekrar deneyin.'}), 429

    return app