from fastapi import APIRouter, status

from ..deps import DB, CurrentUser
from ..schemas.trip import TripCreateIn, TripDetailOut, TripListOut, TripUpdateIn
from ..services import trip_service

router = APIRouter(prefix="/trips", tags=["trips"])


@router.get("", response_model=TripListOut)
def list_trips(db: DB, user: CurrentUser):
    return {"trips": trip_service.list_trips(db, user)}


@router.post("", status_code=status.HTTP_201_CREATED, response_model=TripDetailOut)
def create_trip(body: TripCreateIn, db: DB, user: CurrentUser):
    return trip_service.create_trip(db, user, body)


# trip_id is a plain string: an invalid UUID must be a 404, not a validation error (contract §1).
@router.get("/{trip_id}", response_model=TripDetailOut)
def get_trip(trip_id: str, db: DB, user: CurrentUser):
    return trip_service.get_trip(db, user, trip_id)


@router.patch("/{trip_id}", response_model=TripDetailOut)
def update_trip(trip_id: str, body: TripUpdateIn, db: DB, user: CurrentUser):
    return trip_service.update_trip(db, user, trip_id, body)


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(trip_id: str, db: DB, user: CurrentUser):
    trip_service.delete_trip(db, user, trip_id)
