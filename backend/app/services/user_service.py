from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from app.models.user import User


def get_user_by_id(
        db: Session,
        user_id: int
):
    return(
        db.query(User)
        .filter(User.id==user_id)
        .first()
    )


def get_user_by_email(
        db: Session,
        email: str
):
    return(
        db.query(User)
        .filter(User.email==email)
        .first()
    )


def get_user_by_username(
        db: Session,
        username: str
):
    return(
        db.query(User)
        .filter(User.username==username)
        .first()
    )


def create_user(
        db: Session,
        username: str,
        email: str,
        password_hash: str
):
    user = User(
        username=username,
        email=email,
        password_hash=password_hash
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user_profile(
        db: Session,
        user: User,
        username: str | None = None,
        bio: str | None = None,
        avatar: str | None = None
) -> User:
    """Update the current user's profile fields."""
    if username is not None and username != user.username:
        existing = get_user_by_username(db, username)
        if existing and existing.id != user.id:
            raise ValueError("Username already exists")
        user.username = username

    if bio is not None:
        user.bio = bio.strip() if bio.strip() else None

    if avatar is not None:
        user.avatar = avatar if avatar else None

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ValueError("Username already exists")
    db.refresh(user)
    return user
