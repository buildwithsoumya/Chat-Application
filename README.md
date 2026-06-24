# ChatSphere 

A production-style real-time chat application built to learn backend engineering, system design concepts, database design, authentication, messaging systems, CI/CD, and cloud deployment.

## Overview

ChatSphere is being developed incrementally, following industry-style software engineering practices instead of building everything at once.

The project currently supports:

* User Registration
* User Authentication (JWT)
* Protected Routes
* Conversation Creation
* Conversation Membership Management
* Message Sending
* Message History Retrieval
* Message Editing
* Message Deletion
* Pagination
* Authorization Checks
* PostgreSQL Database (Supabase)
* Alembic Database Migrations

Future phases will include:

* WebSockets
* Real-Time Messaging
* Typing Indicators
* Online Presence Tracking
* Redis Pub/Sub
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
* Passlib (Password Hashing)

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
└── alembic.ini
```

---

## Features Implemented

### Authentication

* User Registration
* User Login
* JWT Access Tokens
* Password Hashing
* Protected Endpoints

### Conversations

* Create Conversation
* List User Conversations
* Add Members to Conversations
* View Conversation Members

### Messaging

* Send Messages
* Retrieve Message History
* Pagination Support
* Edit Messages
* Delete Messages

### Security

* JWT Authentication
* Authorization Checks
* Membership Validation
* Message Ownership Validation

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
cd Chat-Application/backend
```

### Create Virtual Environment

```bash
python -m venv venv
```

### Activate Environment

Windows:

```bash
venv\Scripts\activate
```

Linux / macOS:

```bash
source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Configure Environment Variables

Create a `.env` file:

```env
DATABASE_URL=your_database_url
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Run Migrations

```bash
alembic upgrade head
```

### Start Server

```bash
uvicorn app.main:app --reload
```

Server:

```text
http://127.0.0.1:8000
```

Swagger Docs:

```text
http://127.0.0.1:8000/docs
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

* WebSockets ⏳

### Phase 5

* Typing Indicators & Presence ⏳

### Phase 6

* Redis Integration ⏳

### Phase 7

* Dockerization ⏳

### Phase 8

* GitHub Actions CI/CD ⏳

### Phase 9

* AWS Deployment ⏳

---
