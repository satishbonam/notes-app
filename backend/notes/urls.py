from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NoteViewSet, CategoryViewSet
from .views import invite_guest, share_note_with_user


router = DefaultRouter()
router.register(r'notes', NoteViewSet, basename='notes')
router.register(r'categories', CategoryViewSet, basename='categories')

urlpatterns = [
    path('', include(router.urls)),
    path('notes/<int:note_id>/invite_guest/', invite_guest, name='invite_guest'),
    path('notes/<int:note_id>/share_note_with_user/', share_note_with_user, name='share_note_with_user'),
]