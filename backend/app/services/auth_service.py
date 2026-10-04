from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..errors import ApiError
from ..models import User
from ..security import hash_password, verify_password


def _username_taken() -> ApiError:
    return ApiError(
        409,
        "USERNAME_TAKEN",
        "This username is already taken.",
        [{"field": "username", "message": "This username is already taken."}],
    )


def signup(db: Session, username: str, password: str) -> User:
    username = username.lower()
    if db.scalar(select(User.id).where(User.username == username)) is not None:
        raise _username_taken()
    user = User(username=username, password_hash=hash_password(password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        # Someone else signed up with the same name between our check and our insert.
        db.rollback()
        raise _username_taken() from None
    return user


def login(db: Session, username: str, password: str) -> User:
    user = db.scalar(select(User).where(User.username == username.lower()))
    # verify_password checks a dummy hash when the user doesn't exist, so timing doesn't leak.
    if not verify_password(user.password_hash if user else None, password) or user is None:
        raise ApiError(401, "INVALID_CREDENTIALS", "Invalid username or password.")
    return user
