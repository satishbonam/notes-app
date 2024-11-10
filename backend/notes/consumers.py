from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
import json
from .models import Invite, SharedNote, Note


# Dictionary to keep track of active users per note (for simplicity)
connected_users = {}


class NoteConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.token = self.scope['url_route']['kwargs'].get('token')
        self.note_id = self.scope['url_route']['kwargs'].get('note_id')
        self.note_group_name = f'note_{self.note_id}'

        if await self.is_valid_connection():
            await self.channel_layer.group_add(self.note_group_name, self.channel_name)
            # Update the count of connected users for this note
            if self.note_id not in connected_users:
                connected_users[self.note_id] = 0
            connected_users[self.note_id] += 1
            await self.accept()
        else:
            if self.note_id in connected_users:
                connected_users[self.note_id] -= 1
                if connected_users[self.note_id] <= 0:
                    connected_users[self.note_id] = 0
            await self.close()

        await self.channel_layer.group_send(
            self.note_group_name,
            {
                'type': 'user_count_update',
                'count': connected_users[self.note_id] if self.note_id in connected_users else 0
            }
        )

    @database_sync_to_async
    def get_invite(self, token):
        try:
            return Invite.objects.get(token=token)
        except Invite.DoesNotExist:
            return None

    @database_sync_to_async
    def get_shared_note(self, note_id, user):
        try:
            return SharedNote.objects.get(note_id=note_id, user=user)
        except SharedNote.DoesNotExist:
            return None

    @database_sync_to_async
    def get_owner_note(self, note_id, user):
        try:
            return Note.objects.get(id=note_id, user=user)
        except Note.DoesNotExist:
            return None

    async def is_valid_connection(self):
        if self.token:
            invite = await self.get_invite(self.token)
            if invite and invite.expires_at > timezone.now():
                return True

        if self.scope['user'].is_authenticated:
            shared_note = await self.get_shared_note(self.note_id, self.scope['user'])
            if shared_note:
                return True

            owner_note = await self.get_owner_note(self.note_id, self.scope['user'])
            if owner_note:
                return True

        return False

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.note_group_name, self.channel_name)

        # Update the count of connected users for this note
        if self.note_id in connected_users:
            connected_users[self.note_id] -= 1
            if connected_users[self.note_id] <= 0:
                connected_users[self.note_id] = 0

            # Broadcast the updated user count to all subscribers
            await self.channel_layer.group_send(
                self.note_group_name,
                {
                    'type': 'user_count_update',
                    'count': connected_users.get(self.note_id, 0)
                }
            )

    async def user_count_update(self, event):
        # Send the updated user count to the WebSocket
        count = event['count']
        await self.send(text_data=json.dumps({
            'type': 'user_count',
            'count': count
        }))

    async def receive(self, text_data):
        data = json.loads(text_data)
        delta = data.get("delta")
        client_id = data.get("clientId")

        # Broadcast the message to other clients, including the clientId
        await self.channel_layer.group_send(
            self.note_group_name,
            {
                "type": "note_message",
                "delta": delta,
                "clientId": client_id
            }
        )

    async def note_message(self, event):
        delta = event["delta"]
        client_id = event["clientId"]

        # Send message to WebSocket including clientId
        await self.send(text_data=json.dumps({
            "type": "message",
            "delta": delta,
            "clientId": client_id
        }))
