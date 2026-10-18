import logging
from datetime import UTC, datetime, time, timedelta

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from ..config import get_settings
from ..errors import ApiError, field_error
from ..models import IdeaSearch, User
from . import serpapi
from .idea_categories import SEARCH_WORDS
from .trip_service import get_trip

logger = logging.getLogger(__name__)


def query_key(query: str) -> str:
    return " ".join(query.lower().split())


def get_ideas(db: Session, user: User, trip_id: str, category: str | None) -> dict:
    words = SEARCH_WORDS.get(category or "")
    if words is None:
        raise field_error("category", "Choose an idea category.")
    trip = get_trip(db, user, trip_id)  # 404 unless the trip is the user's own
    query = f"{words} in {trip.destination}"
    key = query_key(query)
    settings = get_settings()
    now = datetime.now(UTC)

    saved = db.scalar(select(IdeaSearch).where(IdeaSearch.query_key == key))
    if saved and saved.fetched_at > now - timedelta(days=settings.ideas_cache_days):
        return _response(category, query, saved.fetched_at, saved.results)

    # One user can't use up the month's free searches for everyone.
    start_of_day = datetime.combine(now.date(), time.min, tzinfo=UTC)
    used_today = db.scalar(
        select(func.count())
        .select_from(IdeaSearch)
        .where(IdeaSearch.fetched_by == user.id, IdeaSearch.fetched_at >= start_of_day)
    )
    if used_today >= settings.ideas_daily_searches_per_user:
        raise ApiError(
            429,
            "IDEAS_DAILY_LIMIT",
            f"You've looked up {settings.ideas_daily_searches_per_user} new idea lists today.",
        )

    try:
        ideas = serpapi.search_places(query)
    except serpapi.SerpApiError as exc:
        logger.warning("SerpApi search failed for %r: %s", key, exc)
        if saved:  # an old answer beats no answer
            return _response(category, query, saved.fetched_at, saved.results)
        raise ApiError(503, "IDEAS_UNAVAILABLE", "Ideas aren't available right now.") from None

    # Insert or update in one statement: two people searching the same thing at once is fine.
    values = {"category": category, "results": ideas, "fetched_at": now, "fetched_by": user.id}
    db.execute(
        insert(IdeaSearch)
        .values(query_key=key, **values)
        .on_conflict_do_update(index_elements=[IdeaSearch.query_key], set_=values)
    )
    db.commit()
    return _response(category, query, now, ideas)


def _response(category: str, query: str, fetched_at: datetime, ideas: list[dict]) -> dict:
    return {"category": category, "query": query, "fetched_at": fetched_at, "ideas": ideas}
