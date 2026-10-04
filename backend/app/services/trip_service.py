import uuid
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session, selectinload

from ..errors import ApiError, not_found, validation_error
from ..models import MAX_TRIP_DAYS, Activity, Trip, User
from ..schemas.trip import TripCreateIn, TripUpdateIn


def earliest_allowed_start() -> date:
    """The server can't know the user's time zone, so it allows one day of slack (contract §4)."""
    return datetime.now(UTC).date() - timedelta(days=1)


def parse_id(value: str) -> uuid.UUID:
    """An ID that isn't a valid UUID is simply not found (contract §1)."""
    try:
        return uuid.UUID(value)
    except ValueError:
        raise not_found() from None


def _check_dates(start: date, end: date, *, check_start: bool) -> None:
    details: list[dict] = []
    if check_start and start < earliest_allowed_start():
        details.append({"field": "startDate", "message": "The start date can't be in the past."})
    if end < start:
        details.append(
            {"field": "endDate", "message": "The end date can't be before the start date."}
        )
    elif (end - start).days + 1 > MAX_TRIP_DAYS:
        details.append({"field": "endDate", "message": "A trip can be at most 14 days long."})
    if details:
        raise validation_error(details)


def list_trips(db: Session, user: User) -> list[Trip]:
    return list(
        db.scalars(
            select(Trip).where(Trip.user_id == user.id).order_by(Trip.start_date, Trip.created_at)
        )
    )


def get_trip(db: Session, user: User, trip_id: str) -> Trip:
    """The user's own trip with its activities; another user's trip is 'not found'."""
    trip = db.scalar(
        select(Trip)
        .where(Trip.id == parse_id(trip_id), Trip.user_id == user.id)
        .options(selectinload(Trip.activities))
    )
    if trip is None:
        raise not_found()
    return trip


def create_trip(db: Session, user: User, data: TripCreateIn) -> Trip:
    _check_dates(data.start_date, data.end_date, check_start=True)
    trip = Trip(
        user_id=user.id,
        destination=data.destination,
        start_date=data.start_date,
        end_date=data.end_date,
        trip_type=data.trip_type,
    )
    db.add(trip)
    db.commit()
    return get_trip(db, user, str(trip.id))


def update_trip(db: Session, user: User, trip_id: str, data: TripUpdateIn) -> Trip:
    sent = data.model_fields_set - {"confirm_delete_activities"}
    if not sent:
        raise validation_error(
            [], "Send at least one of destination, startDate, endDate, or tripType."
        )
    trip = get_trip(db, user, trip_id)

    new_start = data.start_date if "start_date" in sent else trip.start_date
    new_end = data.end_date if "end_date" in sent else trip.end_date
    # A trip that has already started can still be edited, as long as its start isn't moved.
    _check_dates(new_start, new_end, check_start=new_start != trip.start_date)

    # Activities belong to day numbers, so only shortening the trip removes any.
    new_duration = (new_end - new_start).days + 1
    removed = db.scalar(
        select(func.count())
        .select_from(Activity)
        .where(Activity.trip_id == trip.id, Activity.day_number > new_duration)
    )
    if removed and not data.confirm_delete_activities:
        raise ApiError(
            409,
            "ACTIVITIES_WOULD_BE_DELETED",
            f"Your new dates remove days that have {removed} "
            f"{'activity' if removed == 1 else 'activities'}.",
            [{"activitiesToDelete": removed, "newDurationDays": new_duration}],
        )
    if removed:
        db.execute(
            delete(Activity).where(Activity.trip_id == trip.id, Activity.day_number > new_duration)
        )

    if "destination" in sent:
        trip.destination = data.destination
    if "trip_type" in sent:
        trip.trip_type = data.trip_type
    trip.start_date, trip.end_date = new_start, new_end
    db.commit()  # the trip change and any activity deletion succeed or fail together
    db.expire(trip)
    return get_trip(db, user, trip_id)


def delete_trip(db: Session, user: User, trip_id: str) -> None:
    trip = get_trip(db, user, trip_id)
    db.delete(trip)  # activities go with it (ON DELETE CASCADE)
    db.commit()
