import json

import jwt
import requests

from django.conf import settings
from openai import OpenAI
from bs4 import BeautifulSoup
from django.conf import settings
from .models import Category
from django.db.utils import IntegrityError
import logging

open_ai_client = OpenAI(
    api_key=settings.OPENAI_API_KEY,
)

logger = logging.getLogger(__name__)



def jwt_decode_token(token):
    header = jwt.get_unverified_header(token)
    jwks = requests.get(
        'https://{}/.well-known/jwks.json'.format(settings.AUTH0_DOMAIN)).json()
    public_key = None
    for jwk in jwks['keys']:
        if jwk['kid'] == header['kid']:
            public_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(jwk))

    if public_key is None:
        raise Exception('Public key not found.')

    issuer = 'https://{}/'.format(settings.AUTH0_DOMAIN)
    return jwt.decode(token, public_key, audience=settings['JWT_AUTH']['JWT_AUDIENCE'], issuer=issuer, algorithms=['RS256'])




def extract_text_from_rich_content(rich_content):
    """Extracts readable text from rich content (HTML)."""
    soup = BeautifulSoup(rich_content, "html.parser")
    return soup.get_text(separator=" ", strip=True)


def generate_or_get_category_from_content(rich_content, user):
    """Generates a category name using OpenAI ChatCompletion or retrieves an existing category."""
    return None  # Remove this line and implement the function
    plain_text_content = extract_text_from_rich_content(rich_content)

    try:
        # Generate category name using OpenAI's ChatCompletion API
        response = open_ai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that categorizes note content."},
                {"role": "user", "content": f"Categorize the following note content: '{plain_text_content}'"}
            ],
            max_tokens=10,
            temperature=0.3
        )
        category_name = response.choices[0].message.content.strip()

    except Exception as e:
        logger.error(f"OpenAI API error: {e}")
        return None  # Return None or handle the fallback in your application

    # Check if the category already exists for the user or create it
    try:
        category, created = Category.objects.get_or_create(name=category_name, user=user)
        return category
    except IntegrityError as e:
        logger.error(f"Database error creating category '{category_name}' for user '{user.id}': {e}")
        return None  # Return None or handle the fallback in your application
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return None