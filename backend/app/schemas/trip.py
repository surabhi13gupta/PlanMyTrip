import re
import uuid
from datetime import date
from datetime import time as TimeOfDay
from typing import Literal

from pydantic import field_validator

from .common import HourMinute, RequestModel, ResponseModel, UtcTimestamp

TripType = Literal["solo", "couple", "family", "friends"]
TIME_RE = re.compile(r"^([01][0-9]|2[0-3]):[0-5][0-9]$")


def _destination(value: str | None) -> str:
    if not value or len(value) > 100:
        raise ValueError("Enter a destination.")
    return value


def _title(value: str | None) -> str:
    if not value or len(value) > 100:
        raise ValueError("Enter a title.")
    return value


def _time(value: str | None) -> TimeOfDay | None:
    if value is None or value == "":
        return None
    if not TIME_RE.fullmatch(value):
        raise ValueError("Use a time like 09:30.")
    return TimeOfDay.fromisoformat(value)


def _notes(value: str | None) -> str | None:
    if value is None or value == "":
        return None
    if len(value) > 500:
        raise ValueError("Notes can be at most 500 characters.")
    return value


# ---- Trips ----


class TripCreateIn(RequestModel):
    destination: str
    start_date: date
    end_date: date
    trip_type: TripType

    check_destination = field_validator("destination")(_destination)


class TripUpdateIn(RequestModel):
    destination: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    trip_type: TripType | None = None
    confirm_delete_activities: bool = False

    check_destination = field_validator("destination")(_destination)

    @field_validator("start_date", "end_date", "trip_type")
    @classmethod
    def not_null(cls, value, info):
        # Fields may be left out of a PATCH, but sending null for them isn't allowed.
        if value is None:
            messages = {
                "start_date": "Enter a valid start date.",
                "end_date": "Enter a valid end date.",
                "trip_type": "Choose a trip type.",
            }
            raise ValueError(messages[info.field_name])
        return value


class ActivityOut(ResponseModel):
    id: uuid.UUID
    day_number: int
    title: str
    time: HourMinute | None
    notes: str | None
    created_at: UtcTimestamp
    updated_at: UtcTimestamp


class TripOut(ResponseModel):
    id: uuid.UUID
    destination: str
    start_date: date
    end_date: date
    trip_type: TripType
    duration_days: int
    created_at: UtcTimestamp
    updated_at: UtcTimestamp


class TripDetailOut(TripOut):
    activities: list[ActivityOut]


class TripListOut(ResponseModel):
    trips: list[TripOut]


# ---- Activities ----


class ActivityCreateIn(RequestModel):
    day_number: int
    title: str
    time: str | None = None
    notes: str | None = None

    check_title = field_validator("title")(_title)
    check_time = field_validator("time")(_time)
    check_notes = field_validator("notes")(_notes)


class ActivityUpdateIn(RequestModel):
    # dayNumber is deliberately absent: activities can't move days, and extra="forbid" rejects it.
    title: str | None = None
    time: str | None = None
    notes: str | None = None

    check_title = field_validator("title")(_title)
    check_time = field_validator("time")(_time)
    check_notes = field_validator("notes")(_notes)
