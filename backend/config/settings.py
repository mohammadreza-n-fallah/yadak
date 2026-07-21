from pathlib import Path
from datetime import timedelta
import os

BASE_DIR = Path(__file__).resolve().parent.parent

# Override all of these via environment variables in production (see backend/.env.example).
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-yadakstorage-shop-change-in-production-xxxxx')

# Defaults to True for local dev; set DEBUG=false in the production .env.
DEBUG = os.environ.get('DEBUG', 'true').lower() == 'true'

# In production set ALLOWED_HOSTS=example.com,www.example.com
ALLOWED_HOSTS = [h.strip() for h in os.environ.get('ALLOWED_HOSTS', '*').split(',') if h.strip()]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    # Local apps
    'accounts',
    'vehicles',
    'shop',
    'orders',
    'blog',
    'core',
    'admin_panel',
    'support',
    'callcenter',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# PostgreSQL (set USE_SQLITE=true env var to use SQLite for development)
if os.environ.get('USE_SQLITE', 'false').lower() == 'true':
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME', 'yadakstorage_shop'),
            'USER': os.environ.get('DB_USER', 'postgres'),
            'PASSWORD': os.environ.get('DB_PASSWORD', 'postgres'),
            'HOST': os.environ.get('DB_HOST', 'localhost'),
            'PORT': os.environ.get('DB_PORT', '5432'),
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Tehran'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'accounts.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
}

# Dev allows all origins. In production set CORS_ALLOWED_ORIGINS (comma-separated,
# e.g. https://example.com) to lock the API down to your real domain.
_cors_origins = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if _cors_origins:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_origins.split(',') if o.strip()]
else:
    CORS_ALLOW_ALL_ORIGINS = True

# Required for Django admin login / CSRF when served over HTTPS behind your domain.
_csrf_origins = os.environ.get('CSRF_TRUSTED_ORIGINS', '')
if _csrf_origins:
    CSRF_TRUSTED_ORIGINS = [o.strip() for o in _csrf_origins.split(',') if o.strip()]

# Zarinpal
ZARINPAL_MERCHANT_ID = os.environ.get('ZARINPAL_MERCHANT_ID', 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX')
# Defaults to sandbox. To accept live payments set ZARINPAL_SANDBOX=false in the
# production .env together with a real ZARINPAL_MERCHANT_ID from zarinpal.ir.
ZARINPAL_SANDBOX = os.environ.get('ZARINPAL_SANDBOX', 'true').lower() == 'true'
ZARINPAL_BASE_URL = (
    'https://sandbox.zarinpal.com/pg/v4/payment/'
    if ZARINPAL_SANDBOX
    else 'https://api.zarinpal.com/pg/v4/payment/'
)
ZARINPAL_START_URL = (
    'https://sandbox.zarinpal.com/pg/StartPay/'
    if ZARINPAL_SANDBOX
    else 'https://www.zarinpal.com/pg/StartPay/'
)

SITE_URL = os.environ.get('SITE_URL', 'http://localhost:8000')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# ─── Google Sign-In ───────────────────────────────────────────────────────
# OAuth 2.0 Web client ID from https://console.cloud.google.com/apis/credentials
# The same value must be set in the frontend as NEXT_PUBLIC_GOOGLE_CLIENT_ID.
# Leave empty to disable Google login (the password login still works).
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')

# ─── AI Customer Support Chatbot ──────────────────────────────────────────
# Provider-agnostic. Pick any FREE provider and set its key. Leave the key
# empty to run the smart offline keyword fallback (the widget still works).
#   groq       → console.groq.com  (default, fast, free)        AI_API_KEY or GROQ_API_KEY
#   gemini     → aistudio.google.com (free tier)                AI_API_KEY or GEMINI_API_KEY
#   openrouter → openrouter.ai  (many free models)              AI_API_KEY or OPENROUTER_API_KEY
#   ollama     → a local model, no key needed (AI_PROVIDER=ollama)
AI_PROVIDER = os.environ.get('AI_PROVIDER', 'groq')   # groq | gemini | openrouter | openai | ollama
AI_API_KEY = os.environ.get('AI_API_KEY', '')         # empty → provider env var or offline fallback
AI_MODEL = os.environ.get('AI_MODEL', '')             # empty → provider default model
AI_BASE_URL = os.environ.get('AI_BASE_URL', '')       # empty → provider default endpoint
AI_TEMPERATURE = float(os.environ.get('AI_TEMPERATURE', '0.4'))
AI_MAX_TOKENS = int(os.environ.get('AI_MAX_TOKENS', '900'))
SUPPORT_BOT_NAME = os.environ.get('SUPPORT_BOT_NAME', 'دستیار هوشمند')

# Admin customization
ADMIN_SITE_HEADER = 'پنل مدیریت فروشگاه قطعات خودرو'
ADMIN_SITE_TITLE = 'مدیریت فروشگاه'
ADMIN_INDEX_TITLE = 'داشبورد مدیریت'
