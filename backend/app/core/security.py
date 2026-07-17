import bcrypt


def _password_bytes(password: str) -> bytes:
    encoded_password = password.encode("utf-8")
    if len(encoded_password) > 72:
        raise ValueError("Password must be 72 bytes or fewer")
    return encoded_password


def hash_password(password: str) -> str:
    return bcrypt.hashpw(
        _password_bytes(password),
        bcrypt.gensalt()
    ).decode("utf-8")


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    try:
        return bcrypt.checkpw(
            _password_bytes(plain_password),
            hashed_password.encode("utf-8")
        )
    except ValueError:
        return False
