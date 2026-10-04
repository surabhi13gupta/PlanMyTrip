from sqlalchemy import select
from sqlalchemy.orm import Session

from ..errors import field_error, not_found
from ..models import Activity, User
from ..schemas.trip import ActivityCreateIn, ActivityUpdateIn
from .trip_service import get_trip, parse_id


def create_activity(db: Session, user: User, trip_id: str, data: ActivityCreateIn) -> Activity:
    trip = get_trip(db, user, trip_id)
    if not 1 <= data.day_number <= trip.duration_days:
        raise field_error("dayNumber", "Choose a day within the trip.")
    activity = Activity(
        trip_id=trip.id,
        day_number=data.day_number,
        title=data.title,
        time=data.time,
        notes=data.notes,
    )
    db.add(activity)
    db.commit()
    return activity


def _get_activity(db: Session, user: User, trip_id: str, activity_id: str) -> Activity:
    trip = get_trip(db, user, trip_id)  # 404 unless the trip is the user's own
    activity = db.scalar(
        select(Activity).where(Activity.id == parse_id(activity_id), Activity.trip_id == trip.id)
    )
    if activity is None:
        raise not_found()
    return activity


def update_activity(
    db: Session, user: User, trip_id: str, activity_id: str, data: ActivityUpdateIn
) -> Activity:
    if not data.model_fields_set:
        raise field_error("title", "Send at least one of title, time, or notes.")
    activity = _get_activity(db, user, trip_id, activity_id)
    for field in ("title", "time", "notes"):
        if field in data.model_fields_set:
            setattr(activity, field, getattr(data, field))
    db.commit()
    return activity


def delete_activity(db: Session, user: User, trip_id: str, activity_id: str) -> None:
    db.delete(_get_activity(db, user, trip_id, activity_id))
    db.commit()
