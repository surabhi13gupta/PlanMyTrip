import secrets
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..errors import not_found
from ..models import Trip, User
from .trip_service import get_trip


def share_trip(db: Session, user: User, trip_id: str) -> Trip:
    """Turn the read-only link on. An existing link is kept, so one already sent keeps working."""
    trip = get_trip(db, user, trip_id)
    if trip.share_token is None:
        trip.share_token = secrets.token_urlsafe(16)  # 22 characters, 128 random bits
        trip.shared_at = datetime.now(UTC)
        db.commit()
    return trip


def unshare_trip(db: Session, user: User, trip_id: str) -> None:
    """Turn the link off. Its code is gone for good; sharing again makes a new one."""
    trip = get_trip(db, user, trip_id)
    trip.share_token = None
    trip.shared_at = None
    db.commit()


def get_shared_trip(db: Session, share_token: str) -> Trip:
    """The trip behind a share code, for anyone who has it. Unknown or turned-off codes are 404."""
    trip = db.scalar(
        select(Trip).where(Trip.share_token == share_token).options(selectinload(Trip.activities))
    )
    if trip is None:
        raise not_found()
    return trip
