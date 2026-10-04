from typing import Annotated

from fastapi import Cookie, Depends
from sqlalchemy.orm import Session

from .db import get_db
from .errors import unauthorized
from .models import User
from .services import session_service

SESSION_COOKIE = "session"

DB = Annotated[Session, Depends(get_db)]


def get_current_user(
    db: DB, session: Annotated[str | None, Cookie(alias=SESSION_COOKIE)] = None
) -> User:
    user = session_service.user_for_token(db, session)
    if user is None:
        raise unauthorized()
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
