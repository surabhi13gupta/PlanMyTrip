import uuid
from datetime import date
from datetime import time as TimeOfDay

from sqlalchemy import (
    CheckConstraint,
    Date,
    ForeignKey,
    Index,
    SmallInteger,
    String,
    Time,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, Timestamps, UUIDPrimaryKey

TRIP_TYPES = ("solo", "couple", "family", "friends")
MAX_TRIP_DAYS = 14


class Trip(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "trips"
    __table_args__ = (
        CheckConstraint("end_date >= start_date", name="trips_end_after_start"),
        CheckConstraint(f"end_date - start_date <= {MAX_TRIP_DAYS - 1}", name="trips_max_length"),
        CheckConstraint(
            "trip_type IN (" + ", ".join(f"'{t}'" for t in TRIP_TYPES) + ")", name="trips_type"
        ),
        Index("ix_trips_user_id_start_date", "user_id", "start_date"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    destination: Mapped[str] = mapped_column(String(100))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    trip_type: Mapped[str] = mapped_column(String(10))

    activities: Mapped[list[Activity]] = relationship(
        back_populates="trip",
        # Activities belong to their trip: deleting the trip deletes them (also ON DELETE CASCADE).
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by=lambda: (
            Activity.day_number,
            Activity.time.asc().nulls_last(),
            Activity.created_at,
        ),
    )

    @property
    def duration_days(self) -> int:
        return (self.end_date - self.start_date).days + 1


class Activity(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "activities"
    __table_args__ = (
        CheckConstraint("day_number >= 1", name="activities_day_number_positive"),
        Index("ix_activities_trip_id_day_number", "trip_id", "day_number"),
    )

    trip_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"))
    day_number: Mapped[int] = mapped_column(SmallInteger)
    title: Mapped[str] = mapped_column(String(100))
    # Optional; NULL means "no time". (TimeOfDay alias: a field named `time` hides the type.)
    time: Mapped[TimeOfDay | None] = mapped_column(Time, nullable=True)
    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)

    trip: Mapped[Trip] = relationship(back_populates="activities")
