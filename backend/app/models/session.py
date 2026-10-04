import uuid
from datetime import datetime

from sqlalchemy import CHAR, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, utcnow
from .user import User


class UserSession(Base):
    """A login session. Named UserSession to avoid confusion with SQLAlchemy's Session."""

    __tablename__ = "sessions"

    # SHA-256 hash of the token in the user's cookie; the token itself is never stored.
    id: Mapped[str] = mapped_column(CHAR(64), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    user: Mapped[User] = relationship(lazy="joined")
