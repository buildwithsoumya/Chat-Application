from datetime import datetime
from datetime import timedelta
from datetime import timezone
from typing import Any

from jose import jwt

from app.core.config import settings


def create_access_token(data: dict[str, Any]) -> str:
    """Create a signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update(
        {
            "exp": expire
        }
    )
    return jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
