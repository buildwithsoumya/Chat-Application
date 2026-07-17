from jose import JWTError
from jose import jwt
from fastapi import Depends
from fastapi import HTTPException
from fastapi import status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from app.core.config import settings
from app.database.deps import get_db
from app.models.user import User
from app.services.user_service import get_user_by_id

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="auth/login"
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Return the current authenticated REST user."""
    return get_user_from_token(
        token=token,
        db=db
    )


def get_user_from_token(
    token: str,
    db: Session
) -> User:
    """Validate a JWT access token and return the authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        user_id = int(user_id)
    except JWTError:
        raise credentials_exception
    except ValueError:
        raise credentials_exception
    user = get_user_by_id(
        db,
        user_id
    )
    if not user:
        raise credentials_exception
    return user
