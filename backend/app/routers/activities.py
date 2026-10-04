from fastapi import APIRouter, status

from ..deps import DB, CurrentUser
from ..schemas.trip import ActivityCreateIn, ActivityOut, ActivityUpdateIn
from ..services import activity_service

router = APIRouter(prefix="/trips/{trip_id}/activities", tags=["activities"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=ActivityOut)
def create_activity(trip_id: str, body: ActivityCreateIn, db: DB, user: CurrentUser):
    return activity_service.create_activity(db, user, trip_id, body)


@router.patch("/{activity_id}", response_model=ActivityOut)
def update_activity(
    trip_id: str, activity_id: str, body: ActivityUpdateIn, db: DB, user: CurrentUser
):
    return activity_service.update_activity(db, user, trip_id, activity_id, body)


@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity(trip_id: str, activity_id: str, db: DB, user: CurrentUser):
    activity_service.delete_activity(db, user, trip_id, activity_id)
