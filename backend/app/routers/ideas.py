from fastapi import APIRouter

from ..deps import DB, CurrentUser
from ..schemas.idea import IdeasOut
from ..services import idea_service

router = APIRouter(prefix="/trips/{trip_id}/ideas", tags=["ideas"])


# `category` is optional here so a missing one gets the contract's message, not FastAPI's.
@router.get("", response_model=IdeasOut)
def get_ideas(trip_id: str, db: DB, user: CurrentUser, category: str | None = None):
    return idea_service.get_ideas(db, user, trip_id, category)
