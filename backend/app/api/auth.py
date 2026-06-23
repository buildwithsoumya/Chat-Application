from fastapi import APIRouter
router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)
from fastapi import Depends
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.database.deps import get_db
from app.schemas.user import UserCreate
from app.schemas.user import UserResponse
from app.services.user_service import (
    get_user_by_email,
    get_user_by_username,
    create_user
)
from app.core.security import hash_password
@router.post(
    "/register",
    response_model=UserResponse
)
def register(
    payload: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = get_user_by_email(
        db,
        payload.email
    )
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )
    existing_username = get_user_by_username(
        db,
        payload.username
    )
    if existing_username:
        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )
    try:
        password_hash = hash_password(
            payload.password
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc)
        ) from exc
    try:
        user = create_user(
            db=db,
            username=payload.username,
            email=payload.email,
            password_hash=password_hash
        )
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Username or email already exists"
        ) from exc
    return user
