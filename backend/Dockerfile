# Use a base Python image
FROM python:3.10

# Set environment variables to avoid Python buffering and ensure UTF-8 encoding
ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1

# Set the working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy the entire Django project to the container
COPY . .

# Set environment variables for Django settings
ENV DJANGO_SETTINGS_MODULE=app.secrets

# Expose the port Django will run on
EXPOSE 8000

# Run migrations and start Daphne server
CMD ["sh", "-c", "python manage.py migrate && daphne -b 0.0.0.0 -p 8000 --application-close-timeout 30 --ping-interval 20 app.asgi:application"]