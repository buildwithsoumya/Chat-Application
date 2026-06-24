from fastapi import FastAPI
from app.api.auth import router as auth_router
from app.api.users import router as user_router
from app.api.conversations import (
    router as conversation_router
)
app = FastAPI(title="ChatSphere API")
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(conversation_router)
@app.get("/")
def root():
    return{
        "message": "ChatSphere API Running"
    }
