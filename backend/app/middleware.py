import json
from urllib.parse import parse_qs
from urllib.request import urlopen

import httpx
from asgiref.sync import sync_to_async
from channels.middleware import BaseMiddleware
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from jose import jwt
from rest_framework.exceptions import AuthenticationFailed

User = get_user_model()

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Parse the token from the query string
        query_string = parse_qs(scope["query_string"].decode())
        tokens = query_string.get("authToken")
        token = tokens[0] if tokens else None

        if token:
            try:
                # Fetch JWKS and decode JWT
                rsa_key = await self.get_rsa_key(token)
                if rsa_key:
                    payload = jwt.decode(
                        token,
                        rsa_key,
                        algorithms=settings.ALGORITHMS,
                        audience=settings.API_IDENTIFIER,
                        issuer=f"https://{settings.AUTH0_DOMAIN}/"
                    )
                    scope["user"] = await self.get_user(payload, token)
                else:
                    scope["user"] = AnonymousUser()
            except (jwt.ExpiredSignatureError, jwt.JWTClaimsError, Exception):
                scope["user"] = AnonymousUser()
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)

    async def get_rsa_key(self, token):
        """Fetches the RSA key needed to decode the JWT."""
        unverified_header = jwt.get_unverified_header(token)
        jsonurl = urlopen(f"https://{settings.AUTH0_DOMAIN}/.well-known/jwks.json")
        jwks = json.loads(jsonurl.read())
        
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
        return rsa_key

    async def get_user(self, payload, token):
        """
        Returns a user object from the payload.
        This object will pass the `is_authenticated` check.
        """
        username = payload["sub"]
        user = await sync_to_async(User.objects.get)(username=username)
        if user:
            return user

       
        return await self.update_user_info(user, token)


    async def update_user_info(self, user, token,username):
        """
        Fetches user info from Auth0 and updates the User instance.
        """
        user_info_url = f"https://{settings.AUTH0_DOMAIN}/userinfo"
        headers = {"Authorization": f"Bearer {token}"}

        async with httpx.AsyncClient() as client:
            response = await client.get(user_info_url, headers=headers)

        if response.status_code == 200:
            user_info = response.json()
            user, created =await sync_to_async(User.objects.get_or_create)(email=user_info.get("email"), username=username)
            if created:
                user.username = username
            await sync_to_async(user.save)()
            return user
        else:
            raise AuthenticationFailed("Failed to fetch user info from Auth0")
