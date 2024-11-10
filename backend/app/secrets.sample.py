
from .settings import *

SECRET_KEY = 'SECRET_KEY'

DEBUG = True

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('REDIS_HOST', "REDIS_PORT")],
        },
    },
}

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'DATABASE_NAME',
        'USER': 'DATABASE_USER',
        'PASSWORD': 'DATABASE_PASSWORD',
        'HOST': 'DATABASE_HOST',
        'PORT': 'DATABASE_PORT',
    }
}

AUTH0_DOMAIN = 'AUTH0_DOMAIN'
API_IDENTIFIER = 'API_IDENTIFIER'
ALGORITHMS = ['RS256']

OPENAI_API_KEY = 'OPENAI_API_KEY'

# Anymail settings
ANYMAIL = {
    'MAILJET_API_KEY': 'MAILJET_API_KEY',
    'MAILJET_SECRET_KEY': 'MAILJET_SECRET',
}

DEFAULT_FROM_EMAIL = 'DEFAULT_FROM_EMAIL'

FRONTEND_URL = 'FRONTEND_URL'

CORS_ALLOWED_ORIGINS = [
    "*",
]
