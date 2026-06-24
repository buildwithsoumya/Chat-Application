from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from fastapi import status
from fastapi.security import OAuth2PasswordRequestForm
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
from app.core.security import verify_password
from app.core.jwt import create_access_token

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


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


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    email = form_data.username
    user = get_user_by_email(
        db,
        email
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    if not verify_password(
        form_data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    access_token = create_access_token(
        {
            "sub": str(user.id)
        }
    )
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
