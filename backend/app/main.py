import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError

from app.api.auth import router as auth_router
from app.api.conversations import router as conversation_router
from app.api.messages import router as message_router
from app.api.users import router as user_router
from app.core.errors import database_exception_handler
from app.websocket.routes import router as websocket_router

# ---------------------------------------------------------------------------
# CORS origins: prefer the env variable for production deployments.
# Falls back to the local dev origin so the project runs out of the box.
# ---------------------------------------------------------------------------
_cors_env = os.getenv("CORS_ORIGINS", "")
if _cors_env.strip():
    allowed_origins = [origin.strip() for origin in _cors_env.split(",") if origin.strip()]
else:
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

app = FastAPI(
    title="ChatSphere API",
    description="Real-time chat backend for ChatSphere",
    version="1.0.0"
)

app.add_exception_handler(SQLAlchemyError, database_exception_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(message_router)
app.include_router(conversation_router)
app.include_router(websocket_router)


@app.get("/")
def root():
    return {
        "message": "ChatSphere API Running",
        "version": "1.0.0"
    }


@app.get("/health")
def health():
    """Health check endpoint for load balancers and monitoring."""
    return {"status": "ok"}
