from rest_framework.permissions import BasePermission
from django.utils import timezone
from .models import Invite

class TokenOrIsAuthenticated(BasePermission):
    """
    Custom permission to allow access if the user is authenticated or
    if a valid invite token is provided.
    """

    def has_permission(self, request, view):
        # If the user is authenticated, allow access
        if request.user and request.user.is_authenticated:
            return True

        # If a token is provided, check if it's a valid invite token
        token = request.query_params.get("token")
        if token:
            try:
                invite = Invite.objects.get(token=token, expires_at__gt=timezone.now())
                request.invite = invite  # Attach the invite to the request for later use
                return True
            except Invite.DoesNotExist:
                return False

        # Deny access if neither authentication nor a valid token is present
        return False

    def has_object_permission(self, request, view, obj):
        # If authenticated, or a valid token invite exists, allow access
        return self.has_permission(request, view)