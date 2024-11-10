from django.urls import path
from . import consumers

websocket_urlpatterns = [
    # For verified users
    path('ws/notes/<int:note_id>/', consumers.NoteConsumer.as_asgi()),
    # For guest users with token
    path('ws/notes/<int:note_id>/<str:token>/', consumers.NoteConsumer.as_asgi()),
]
