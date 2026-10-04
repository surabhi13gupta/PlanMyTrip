from typing import Annotated

from fastapi import APIRouter, Cookie, Response, status

from ..config import get_settings
from ..deps import DB, SESSION_COOKIE, CurrentUser
from ..schemas.user import LoginIn, SignupIn, UserEnvelope, UserOut
from ..services import auth_service, session_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_session_cookie(response: Response, token: str) -> None:
    # No max_age/expires: a browser-session cookie, deleted when the browser closes (contract §7).
    response.set_cookie(
        SESSION_COOKIE,
        token,
        httponly=True,
        secure=get_settings().cookie_secure,
        samesite="lax",
        path="/",
    )


@router.post("/signup", status_code=status.HTTP_201_CREATED, response_model=UserEnvelope)
def signup(body: SignupIn, db: DB, response: Response):
    user = auth_service.signup(db, body.username, body.password)
    _set_session_cookie(response, session_service.create_session(db, user))
    return {"user": UserOut.model_validate(user)}


@router.post("/login", response_model=UserEnvelope)
def login(body: LoginIn, db: DB, response: Response):
    user = auth_service.login(db, body.username, body.password)
    _set_session_cookie(response, session_service.create_session(db, user))
    return {"user": UserOut.model_validate(user)}


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    db: DB,
    response: Response,
    session: Annotated[str | None, Cookie(alias=SESSION_COOKIE)] = None,
):
    session_service.end_session(db, session)
    response.delete_cookie(
        SESSION_COOKIE,
        httponly=True,
        secure=get_settings().cookie_secure,
        samesite="lax",
        path="/",
    )


@router.get("/me", response_model=UserEnvelope)
def me(user: CurrentUser):
    return {"user": UserOut.model_validate(user)}
