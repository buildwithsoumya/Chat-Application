from fastapi import APIRouter
from fastapi import Depends
from app.api.dependencies import get_current_user
from app.schemas.user import UserResponse
router = APIRouter(
    prefix="/users",
    tags=["Users"]
)
@router.get(
    "/me",
    response_model=UserResponse
)
def get_me(
    current_user = Depends(get_current_user)
):
    return current_user