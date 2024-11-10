import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "app.secrets")
django.setup()

import notes.routing
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from .middleware import JWTAuthMiddleware


application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTAuthMiddleware(
        URLRouter(
            notes.routing.websocket_urlpatterns
        )
    ),
})
