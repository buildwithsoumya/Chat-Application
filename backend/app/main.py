from fastapi import FastAPI
from app.api.auth import router as auth_router
from app.api.users import router as user_router
app = FastAPI(title="ChatSphere API")
app.include_router(auth_router)
app.include_router(user_router)
@app.get("/")
def root():
    return{
        "message": "ChatSphere API Running"
    }
