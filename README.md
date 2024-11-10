
# Project Setup

This guide provides comprehensive instructions for setting up and running the frontend (Next.js) and backend (Django) applications in this project using Docker.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Docker](https://www.docker.com/products/docker-desktop): Required to build and run the application containers.
- Clone this repository to your local machine.

## Project Structure

- **Frontend**: Next.js (port 3000)
- **Backend**: Django (port 8000)

## Setup Instructions

### Step 1: Configure Environment Variables

To ensure proper configuration, set up environment variables for both the frontend and backend applications as follows:

1. **Frontend (Next.js)**:
   - Navigate to the `frontend` directory.
   - Copy `.env.sample` to create `.env.local` and `.env.production`.
   - Fill in the necessary values in both `.env.local` and `.env.production` based on your environment requirements.
     - Example values may include:
       - `NEXT_PUBLIC_API_URL` - the URL for the backend API.
       - `NEXT_PUBLIC_ENV` - environment designation, such as `development` or `production`.

   ```bash
   cp frontend/.env.sample frontend/.env.local
   cp frontend/.env.sample frontend/.env.production
   ```

2. **Backend (Django)**:
   - Navigate to the `backend` directory.
   - Copy `secrets.sample.py` to create `secrets.py`.
   - Update the placeholders in `secrets.py` with the appropriate values:
     - `SECRET_KEY`: A secret key for Django's cryptographic signing. Generate a new one if deploying to production.
     - `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_HOST`, and `DATABASE_PORT`: Configure these if connecting to a database like PostgreSQL or MySQL.
     - `ALLOWED_HOSTS`: List of allowed hostnames for your Django app.
     - `DEBUG`: Set to `True` for development; use `False` in production.

   ```bash
   cp backend/secrets.sample.py backend/secrets.py
   ```

### Step 2: Run the Application with Docker

To start both the frontend and backend applications using Docker, execute the following command from the root directory of the project:

```bash
docker-compose -f dev-docker-compose.yml up --build
```

This command will:

- Build and run the frontend and backend applications as specified in `dev-docker-compose.yml`.
- Launch the development environment for both Next.js and Django.

### Step 3: Access the Applications

Once the Docker containers are running, you can access the applications through the following URLs:

- **Frontend (Next.js)**: [http://localhost:3000](http://localhost:3000)
- **Backend (Django)**: [http://localhost:8000](http://localhost:8000)

### Step 4: Stopping the Application

To stop the running containers, use `Ctrl + C` in your terminal or run the following command:

```bash
docker-compose -f dev-docker-compose.yml down
```

This will stop and remove the containers.

## Additional Notes

### Development Tips

- **Frontend**:
  - Any changes made to the Next.js codebase should reflect automatically if hot reloading is enabled.
  - For production builds, update the `.env.production` file with appropriate API URLs and other production-ready configurations.

- **Backend**:
  - Django migrations are automatically handled in the Docker setup. However, if you need to manually run migrations or create a superuser for admin access, use:
  
    ```bash
    docker-compose -f dev-docker-compose.yml exec web python manage.py migrate
    docker-compose -f dev-docker-compose.yml exec web python manage.py createsuperuser
    ```

### Troubleshooting

- **Docker Issues**:
  - If containers fail to start, check that no other services are running on ports 3000 or 8000.
  - Run `docker-compose logs` to view container logs for debugging.

- **Environment Variables**:
  - Missing or incorrect environment variables may cause runtime errors. Double-check the `.env` files and `secrets.py` to ensure all required values are provided.


## Contact

For any further questions or issues, please contact satish.b.s.kumar@gmail.com.

---

This README should cover all necessary setup steps to get your project up and running. Happy coding!
