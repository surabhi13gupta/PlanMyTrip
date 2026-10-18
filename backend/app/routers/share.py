from fastapi import APIRouter, Response, status

from ..deps import DB, CurrentUser
from ..schemas.trip import SharedTripOut, ShareOut
from ..services import share_service

# The owner turns a trip's read-only link on and off.
router = APIRouter(prefix="/trips/{trip_id}/share", tags=["sharing"])
# Anyone with the link reads the trip; no login.
public_router = APIRouter(prefix="/shared", tags=["sharing"])


@router.post("", response_model=ShareOut)
def share_trip(trip_id: str, db: DB, user: CurrentUser):
    return share_service.share_trip(db, user, trip_id)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def unshare_trip(trip_id: str, db: DB, user: CurrentUser):
    share_service.unshare_trip(db, user, trip_id)


@public_router.get("/{share_token}", response_model=SharedTripOut)
def get_shared_trip(share_token: str, db: DB, response: Response):
    # Never cached, so a turned-off link stops working at once; and kept out of search engines.
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Robots-Tag"] = "noindex"
    return share_service.get_shared_trip(db, share_token)
