import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, UUIDPrimaryKey, utcnow


class IdeaSearch(UUIDPrimaryKey, Base):
    """A saved SerpApi answer, reused for 30 days so the free 250 searches a month go further.

    Not linked to trips: two trips to "Paris, France" share the same saved results.
    """

    __tablename__ = "idea_searches"
    __table_args__ = (Index("ix_idea_searches_fetched_by_fetched_at", "fetched_by", "fetched_at"),)

    # The search as sent, lowercased with spaces collapsed: "museums in paris, france".
    query_key: Mapped[str] = mapped_column(String(250), unique=True)
    category: Mapped[str] = mapped_column(String(30))
    # The `ideas` list exactly as the API returns it.
    results: Mapped[list[dict]] = mapped_column(JSONB)
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, server_default=func.now()
    )
    # Who triggered the search, for the daily limit. Kept (as NULL) if the user is deleted.
    fetched_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
