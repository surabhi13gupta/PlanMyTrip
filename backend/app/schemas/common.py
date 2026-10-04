from datetime import UTC, datetime
from datetime import time as TimeOfDay
from typing import Annotated

from pydantic import BaseModel, ConfigDict, PlainSerializer
from pydantic.alias_generators import to_camel


class RequestModel(BaseModel):
    """Request bodies: camelCase in JSON, trimmed text, and no unknown fields."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        extra="forbid",
        str_strip_whitespace=True,
    )


class ResponseModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)


def _utc_iso(value: datetime) -> str:
    return value.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


# "2026-10-04T14:30:00Z" and "09:00", as the contract shows them.
UtcTimestamp = Annotated[datetime, PlainSerializer(_utc_iso, return_type=str)]
HourMinute = Annotated[TimeOfDay, PlainSerializer(lambda t: t.strftime("%H:%M"), return_type=str)]
