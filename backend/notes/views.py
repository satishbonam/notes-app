from django.utils import timezone
from django.core.mail import send_mail
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import viewsets
from django.conf import settings
from .models import Note, Invite, SharedNote, Category
from django.contrib.auth.models import User
import uuid
from .serializers import NoteSerializer, CategorySerializer
from .utils import generate_or_get_category_from_content
from django.db.models import Q
from rest_framework.exceptions import NotFound, PermissionDenied
from .permissions import TokenOrIsAuthenticated


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = [TokenOrIsAuthenticated]

    def get_queryset(self):
        user = self.request.user if self.request.user.is_authenticated else None
        token = self.request.query_params.get("token")

        # If a valid token is provided, filter by invited notes
        if token:
            try:
                invite = Invite.objects.get(
                    token=token, expires_at__gt=timezone.now())
                # Return only the invited note if accessed via a valid invite token
                return Note.objects.filter(id=invite.note_id)
            except Invite.DoesNotExist:
                raise NotFound("Invalid or expired token.")

        # Default queryset if the user is authenticated (owned and shared notes)
        if user:
            queryset = Note.objects.filter(
                Q(user=user) | Q(shared_with__user=user)
            ).distinct()
        else:
            queryset = Note.objects.none()  # No results if unauthenticated and no token

        # Apply category filter if provided
        category_name = self.request.query_params.get('category')
        if category_name:
            queryset = queryset.filter(
                Q(user_updated_category__name=category_name) |
                Q(ai_generated_category__name=category_name)
            )

        return queryset

    def get_object(self):
        """Override get_object to allow token-based access."""
        token = self.request.query_params.get("token")
        if token:
            try:
                invite = Invite.objects.get(
                    token=token, expires_at__gt=timezone.now())
                return invite.note
            except Invite.DoesNotExist:
                raise NotFound("Invalid or expired token.")

        # Fall back to the default get_object behavior (authentication-based)
        return super().get_object()

    def perform_create(self, serializer):
        user = self.request.user
        content = serializer.validated_data.get('content')
        user_category_id = serializer.validated_data.get(
            'user_updated_category')

        if user_category_id:
            ai_generated_category = None
        else:
            ai_generated_category = generate_or_get_category_from_content(
                content, user)

        serializer.save(user=user, ai_generated_category=ai_generated_category)

    def perform_update(self, serializer):
        token = self.request.query_params.get("token")
        user = self.request.user if not token else None

        if token:
            try:
                invite = Invite.objects.get(
                    token=token, expires_at__gt=timezone.now())
                if invite.note != serializer.instance:
                    raise PermissionDenied("Invalid token for this note.")
            except Invite.DoesNotExist:
                raise PermissionDenied("Invalid or expired token.")
        elif not user.is_authenticated:
            raise PermissionDenied(
                "Authentication credentials were not provided.")

        content = serializer.validated_data.get('content')
        user_category_id = serializer.validated_data.get(
            'user_updated_category')

        if user_category_id:
            ai_generated_category = None
        else:
            ai_generated_category = generate_or_get_category_from_content(
                content, user)

        serializer.save(ai_generated_category=ai_generated_category)

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Returns all categories available to the user (AI-generated and user-defined)"""
        categories = Category.objects.filter(user=request.user)
        user_categories = CategorySerializer(categories, many=True).data
        ai_generated_categories = list(Note.objects.filter(user=request.user)
                                       .values_list('ai_generated_category__name', flat=True).distinct())
        return Response({
            "user_categories": user_categories,
            "ai_generated_categories": ai_generated_categories
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def invite_guest(request, note_id):
    try:
        note = Note.objects.get(id=note_id, user=request.user)
        email = request.data.get("email")

        # Find or create the user based on the provided email
        user, created = User.objects.get_or_create(email=email)

        # Check if the user is the owner of the note
        if note.user == user:
            return Response({"message": "User is the owner of the note."}, status=400)

        # Create a guest invite with a unique token
        invite = Invite.objects.create(
            note=note, email=email, token=uuid.uuid4())

        # Share the note with the user
        SharedNote.objects.get_or_create(note=note, user=user)

        # Generate invite link
        invite_link = f"{settings.FRONTEND_URL}/note/{note_id}/?token={invite.token}"

        # Send the invitation email
        send_mail(
            subject="You've been invited to collaborate on a note!",
            message=f"Hello,\n\nYou've been invited to collaborate on the note titled '{note.title}'. Access it using this link:\n{invite_link}\n\nBest regards,\nYour Team",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
        )

        return Response({"message": "Guest invitation sent!", "invite_link": invite_link})
    except Note.DoesNotExist:
        return Response({"message": "Note not found."}, status=404)
    except Exception as e:
        return Response({"message": f"Error sending invite: {str(e)}"}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def share_note_with_user(request, note_id):
    try:
        # Get the note that the user wants to share
        note = Note.objects.get(id=note_id, user=request.user)
        email = request.data.get("email")

        # Find or create the user based on the provided email
        user, created = User.objects.get_or_create(email=email)

        # Check if the user is the owner of the note
        if note.user == user:
            return Response({"message": "User is the owner of the note."}, status=400)

        # Check if the note has already been shared with this user
        shared_note, shared_created = SharedNote.objects.get_or_create(
            note=note, user=user)
        if not shared_created:
            return Response({"message": "User already has access to this note."}, status=400)

        # Prepare the note link for the shared user
        note_link = f"{settings.FRONTEND_URL}/note/{note_id}"

        # Send a notification email to the shared user
        send_mail(
            subject="A note has been shared with you!",
            message=f"Hello,\n\nA note titled '{note.title}' has been shared with you. Access it here:\n{note_link}\n\nBest regards,\nYour Team",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
        )

        return Response({"message": "Note shared with user!"})
    except Note.DoesNotExist:
        return Response({"message": "Note not found."}, status=404)
    except Exception as e:
        return Response({"message": f"Error sharing note: {str(e)}"}, status=500)
