# Place Review API

REST API for reviewing places (shops, doctors, restaurants, etc.) built with Django and PostgreSQL.

## Requirements

- Python 3.8+
- PostgreSQL 14+

## Setup Instructions

1. **Create virtual environment and install dependencies:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Create PostgreSQL database:**
```bash
createdb place_review_db
```

3. **Configure environment variables:**
```bash
cp .env.example .env
```
Edit `.env` file with your database credentials:
```
DB_NAME=place_review_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
SECRET_KEY=your-secret-key-here
DEBUG=True
```

4. **Run migrations:**
```bash
python manage.py migrate
```

5. **Create superuser (optional):**
```bash
python manage.py createsuperuser
```

6. **Populate sample data:**
```bash
python manage.py populate_data --users=50 --places=100 --reviews=500
```

7. **Start development server:**
```bash
python manage.py runserver
```

API available at `http://localhost:8000/`

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user (name, phone_number, password)
- `POST /api/auth/login/` - Login and get JWT token
- `POST /api/auth/refresh/` - Refresh JWT token

### Reviews
- `POST /api/reviews/` - Create review (requires authentication)
  - Body: `place_name`, `place_address`, `rating` (1-5), `text`

### Places
- `GET /api/places/search/` - Search places (requires authentication)
  - Query params: `name` (optional), `min_rating` (optional)
- `GET /api/places/{id}/` - Get place details with reviews (requires authentication)

1. **Register a user:**
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+1234567890",
    "name": "John Doe",
    "password": "SecurePass123!",
    "password_confirm": "SecurePass123!"
  }'
```

2. **Login:**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "+1234567890",
    "password": "SecurePass123!"
  }'
```

3. **Create a review (use token from login):**
```bash
curl -X POST http://localhost:8000/api/reviews/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "place_name": "Pizza Palace",
    "place_address": "123 Main St",
    "rating": 5,
    "text": "Great pizza!"
  }'
```

4. **Search places:**
```bash
curl -X GET "http://localhost:8000/api/places/search/?name=pizza&min_rating=4" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Database Schema

### User
- phone_number (unique)
- name
- password (hashed)

### Place
- name
- address
- average_rating (calculated)
- Unique constraint: LOWER(name) + LOWER(address)

### Review
- user (foreign key)
- place (foreign key)
- rating (1-5)
- text
- created_at
