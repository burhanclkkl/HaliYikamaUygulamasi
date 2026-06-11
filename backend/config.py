import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    # Rate limiting: prod'da açık (varsayılan), geliştirme/test için .env ile kapatılabilir.
    RATELIMIT_ENABLED = os.environ.get('RATELIMIT_ENABLED', 'True').lower() != 'false'