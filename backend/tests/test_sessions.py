from datetime import UTC, datetime, timedelta

from app.models import UserSession
from app.security import hash_token

from .conftest import signup


def _session(db, client) -> UserSession:
    return db.get(UserSession, hash_token(client.cookies["session"]))


def test_new_session_has_12_hour_idle_timeout(client, db):
    signup(client)
    remaining = _session(db, client).expires_at - datetime.now(UTC)
    assert timedelta(hours=11, minutes=59) < remaining <= timedelta(hours=12)


def test_expired_session_is_rejected_and_deleted(client, db):
    signup(client)
    session = _session(db, client)
    session.expires_at = datetime.now(UTC) - timedelta(seconds=1)
    db.commit()
    assert client.get("/api/v1/auth/me").status_code == 401
    assert _session(db, client) is None


def test_activity_renews_session_at_most_once_an_hour(client, db):
    signup(client)
    session = _session(db, client)

    # Recently renewed: not written again.
    fresh = datetime.now(UTC) + timedelta(hours=11, minutes=30)
    session.expires_at = fresh
    db.commit()
    client.get("/api/v1/auth/me")
    db.refresh(session)
    assert session.expires_at == fresh

    # Over an hour since the last renewal: pushed back to 12 hours from now.
    session.expires_at = datetime.now(UTC) + timedelta(hours=5)
    db.commit()
    client.get("/api/v1/auth/me")
    db.refresh(session)
    assert session.expires_at - datetime.now(UTC) > timedelta(hours=11, minutes=59)
