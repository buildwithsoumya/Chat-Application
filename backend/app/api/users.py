from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import Query
from fastapi import status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database.deps import get_db
from app.models.user import User
from app.schemas.user import UserResponse
from app.schemas.user import UserSearchResult
from app.schemas.user import UserUpdate
from app.services.user_service import update_user_profile

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get(
    "/me",
    response_model=UserResponse
)
def get_me(
    current_user=Depends(get_current_user)
):
    return current_user


@router.patch(
    "/me",
    response_model=UserResponse
)
def update_profile(
    payload: UserUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update the current user's profile (username, bio, avatar)."""
    try:
        updated_user = update_user_profile(
            db=db,
            user=current_user,
            username=payload.username,
            bio=payload.bio,
            avatar=payload.avatar
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        ) from exc
    return updated_user


@router.get(
    "/search",
    response_model=list[UserSearchResult]
)
def search_users(
    q: str = Query(min_length=1, max_length=50),
    limit: int = Query(default=10, ge=1, le=50),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search for users by username prefix, excluding the current user."""
    return (
        db.query(User)
        .filter(
            User.username.ilike(f"{q}%"),
            User.id != current_user.id
        )
        .order_by(User.username.asc())
        .limit(limit)
        .all()
    )
