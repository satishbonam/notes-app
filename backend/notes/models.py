from django.db import models
from django.contrib.auth.models import User
import uuid
from django.utils import timezone
from datetime import timedelta


from django.db import models
from django.contrib.auth.models import User


class Category(models.Model):
    name = models.CharField(max_length=100)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="categories")

    def __str__(self):
        return self.name


class Note(models.Model):
    title = models.CharField(max_length=255, blank=True, default="Untitled")
    content = models.TextField(blank=True)
    ai_generated_category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="ai_notes")
    user_updated_category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="user_notes")
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notes")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_owner(self, user):
        return self.user == user

    @property
    def category(self):
        return self.user_updated_category.name if self.user_updated_category else self.ai_generated_category.name if self.ai_generated_category else None

    def __str__(self):
        return self.title


def default_expiration():
    return timezone.now() + timedelta(days=7)


class Invite(models.Model):
    note = models.ForeignKey(
        Note, on_delete=models.CASCADE, related_name='invites')
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    email = models.EmailField()
    is_verified = models.BooleanField(default=False)
    expires_at = models.DateTimeField(
        default=default_expiration)
    created_at = models.DateTimeField(auto_now_add=True)


class SharedNote(models.Model):
    note = models.ForeignKey(
        Note, on_delete=models.CASCADE, related_name='shared_with')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
