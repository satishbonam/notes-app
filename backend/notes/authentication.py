import requests

from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from django.utils.functional import SimpleLazyObject
from jose import jwt
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
import json
from urllib.request import urlopen
from django.contrib.auth.models import User


class Auth0JSONWebTokenAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth = request.headers.get('Authorization', None)
        if not auth:
            return None

        parts = auth.split()
        if parts[0].lower() != 'bearer':
            raise AuthenticationFailed(
                'Authorization header must start with Bearer')
        elif len(parts) == 1:
            raise AuthenticationFailed('Token not found')
        elif len(parts) > 2:
            raise AuthenticationFailed(
                'Authorization header must be Bearer token')

        token = parts[1]
        try:
            jsonurl = urlopen(
                f"https://{settings.AUTH0_DOMAIN}/.well-known/jwks.json")
            jwks = json.loads(jsonurl.read())
            unverified_header = jwt.get_unverified_header(token)
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
            if rsa_key:
                payload = jwt.decode(
                    token,
                    rsa_key,
                    algorithms=settings.ALGORITHMS,
                    audience=settings.API_IDENTIFIER,
                    issuer=f"https://{settings.AUTH0_DOMAIN}/"
                )
                return (SimpleLazyObject(lambda: self.get_user(payload, token)), token)
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token is expired')
        except jwt.JWTClaimsError:
            raise AuthenticationFailed(
                'Incorrect claims, please check the audience and issuer')
        except Exception:
            raise AuthenticationFailed('Unable to parse authentication token.')

        raise AuthenticationFailed('Unable to find appropriate key')

    def get_user(self, payload, token):
        """
        Returns a user-like object from the payload.
        This object will pass the `is_authenticated` check.
        """
        try:
            username = payload['sub']

            user = User.objects.get(username=username)
            if user:
                return user

            headers = {'Authorization': f'Bearer {token}'}
            user_info_url = f"https://{settings.AUTH0_DOMAIN}/userinfo"
            response = requests.get(user_info_url, headers=headers)

            if response.status_code == 200:
                user_info = response.json()
                user, created = User.objects.get_or_create(
                    email=user_info.get("email"))
                if created:
                    user.username = username
                user.save()
            else:
                raise AuthenticationFailed(
                    'Failed to fetch user info from Auth0')

            return user
        except User.DoesNotExist:
            username = payload['sub']

            headers = {'Authorization': f'Bearer {token}'}
            user_info_url = f"https://{settings.AUTH0_DOMAIN}/userinfo"
            response = requests.get(user_info_url, headers=headers)

            if response.status_code == 200:
                user_info = response.json()
                user, created = User.objects.get_or_create(
                    email=user_info.get("email"))
                if created:
                    user.username = username
                user.save()
            else:
                raise AuthenticationFailed(
                    'Failed to fetch user info from Auth0')

            return user
        except Exception:
            return AnonymousUser()
