from datetime import UTC, datetime, timedelta

from sqlalchemy import delete
from sqlalchemy.orm import Session

from ..config import get_settings
from ..models import User, UserSession
from ..security import hash_token, new_session_token

# Renew at most once an hour: only push expires_at back when less than (idle - 1h) remains.
RENEW_MARGIN = timedelta(hours=1)


def _idle() -> timedelta:
    return timedelta(hours=get_settings().session_idle_hours)


def create_session(db: Session, user: User) -> str:
    """Starts a session and returns the token for the cookie."""
    token = new_session_token()
    db.add(
        UserSession(id=hash_token(token), user_id=user.id, expires_at=datetime.now(UTC) + _idle())
    )
    db.commit()
    return token


def user_for_token(db: Session, token: str | None) -> User | None:
    """The logged-in user for a cookie token, renewing the idle timeout; None if not valid."""
    if not token:
        return None
    session = db.get(UserSession, hash_token(token))
    if session is None:
        return None
    now = datetime.now(UTC)
    if session.expires_at <= now:
        db.delete(session)
        db.commit()
        return None
    if session.expires_at - now < _idle() - RENEW_MARGIN:
        session.expires_at = now + _idle()
        db.commit()
    return session.user


def end_session(db: Session, token: str | None) -> None:
    if token:
        db.execute(delete(UserSession).where(UserSession.id == hash_token(token)))
        db.commit()
