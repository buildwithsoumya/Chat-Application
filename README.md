# ChatSphere

A production-style real-time chat application built to learn backend engineering, system design concepts, database design, authentication, messaging systems, CI/CD, and cloud deployment.

## Overview

ChatSphere is being developed incrementally, following industry-style software engineering practices instead of building everything at once.

The project currently supports:

* User Registration
* User Authentication (JWT)
* Protected Routes
* User Search by Username
* Direct and Group Conversation Creation
* Conversation Membership Management
* Message Sending via WebSocket (real-time)
* Message History Retrieval
* Message Editing
* Message Deletion
* Pagination
* Authorization Checks
* Typing Indicators
* Online Presence Tracking
* PostgreSQL Database (Supabase)
* Alembic Database Migrations

Future phases will include:

* Redis Pub/Sub for WebSocket scaling
* Docker
* GitHub Actions CI/CD
* AWS Deployment

---

## Tech Stack

### Backend

* FastAPI
* SQLAlchemy 2.0
* Alembic
* PostgreSQL (Supabase)
* Pydantic
* JWT Authentication
* OAuth2 Password Flow
* bcrypt (Password Hashing)

### Frontend

* Vite
* React 19
* TypeScript
* React Router
* Zustand
* Axios
* Tailwind CSS
* shadcn/ui components

### Database

* PostgreSQL
* Alembic Migrations

### DevOps (Upcoming)

* Docker
* GitHub Actions
* AWS

---

## Project Structure

```text
backend/
│
├── app/
│   ├── api/
│   ├── core/
│   ├── database/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   ├── websocket/
│   └── main.py
│
├── alembic/
├── requirements.txt
├── .env
├── .env.example
├── pytest.ini
├── tests/
└── alembic.ini

frontend/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── routes/
│   ├── services/
│   ├── store/
│   ├── lib/
│   └── types/
├── package.json
├── .env
├── .env.example
└── README.md
```

---

## Features Implemented

### Authentication

* User Registration
* User Login
* JWT Access Tokens
* Password Hashing
* Protected Endpoints
* Token Validation on App Reload (`/users/me`)

### Conversations

* Create Direct and Group Conversations
* List User Conversations
* Add Members to Conversations
* View Conversation Members
* User Search by Username Prefix

### Messaging

* Send Messages via WebSocket (real-time)
* Receive Messages in Real Time
* Retrieve Message History
* Pagination Support
* Edit Messages
* Delete Messages
* Optimistic Message Updates

### Real-Time

* WebSocket Connection per Conversation
* Message Broadcasting to Room Members
* Typing Indicators
* Online Presence Tracking

### Security

* JWT Authentication
* Authorization Checks
* Membership Validation
* Message Ownership Validation
* Server-Side Input Validation

---

## Database Schema

### Users

```text
users
├── id
├── username
├── email
└── password_hash
```

### Conversations

```text
conversations
├── id
├── name
├── is_group
├── created_by
└── created_at
```

### Conversation Members

```text
conversation_members
├── conversation_id
├── user_id
└── joined_at
```

### Messages

```text
messages
├── id
├── conversation_id
├── sender_id
├── content
├── created_at
└── updated_at
```

---

## Running Locally

### Clone Repository

```bash
git clone https://github.com/buildwithsoumya/Chat-Application.git
cd Chat-Application
```

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Linux/macOS)
source venv/bin/activate
# Activate (Windows)
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database URL and secret key

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

Backend runs at `http://127.0.0.1:8000` and Swagger docs at `http://127.0.0.1:8000/docs`.

### Backend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/chatsphere` |
| `SECRET_KEY` | JWT signing secret | `openssl rand -hex 32` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime | `30` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:5173` |

### Backend Tests

```bash
cd backend
pytest
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# VITE_API_URL defaults to http://localhost:8000

# Start dev server
npm run dev
```

Frontend runs at `http://localhost:5173`.

### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend REST API base URL | `http://localhost:8000` |
| `VITE_WS_URL` | Backend WebSocket base URL | derived from `VITE_API_URL` |

### Frontend Build

```bash
cd frontend
npm run build
```

---

## Development Roadmap

### Phase 1

* Authentication System ✅

### Phase 2

* Conversations & Memberships ✅

### Phase 3

* Messaging System ✅

### Phase 3.5

* Message Management & Pagination ✅

### Phase 4

* WebSockets & Real-Time Messaging ✅

### Phase 5

* Typing Indicators & Presence ✅

### Phase 6

* Redis Integration (WebSocket scaling) ⏳

### Phase 7

* Dockerization ⏳

### Phase 8

* GitHub Actions CI/CD ⏳

### Phase 9

* AWS Deployment ⏳

---

## Known Limitations

* WebSocket state is currently in-memory, so scaling beyond a single process requires Redis Pub/Sub.
* JWT tokens are stored in `localStorage`. For production, consider HttpOnly `SameSite=Strict` cookies with CSRF protection.
* WebSocket authentication passes the token in the query string. For production, consider a short-lived ticket exchange or cookie-based auth.
* No rate limiting is implemented yet.

---

## License

This project is for learning purposes.

---

## Contributing

This is a personal learning project. Feel free to fork and experiment.
