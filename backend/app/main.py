from fastapi import FastAPI
from app.api.auth import router as auth_router
from app.api.messages import router as message_router
from app.api.users import router as user_router
from app.websocket.routes import router as websocket_router

app = FastAPI(title="ChatSphere API")
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(message_router)
app.include_router(websocket_router)


@app.get("/")
def root():
    return{
        "message": "ChatSphere API Running"
    }
