import uuid
from datetime import timedelta

from .conftest import JSON, add_activity, create_trip, days_from_today, trip_body, utc_today


def _details(response) -> dict:
    return {d["field"]: d["message"] for d in response.json()["error"]["details"]}


def test_create_trip_returns_trip_detail(user_client):
    trip = create_trip(user_client, start_in=10, length=5)
    assert trip["destination"] == "Paris, France"
    assert trip["durationDays"] == 5
    assert trip["tripType"] == "couple"
    assert trip["activities"] == []
    assert set(trip) == {
        "id", "destination", "startDate", "endDate", "tripType", "durationDays",
        "createdAt", "updatedAt", "activities",
    }  # fmt: skip


def test_create_trip_trims_destination(user_client):
    trip = create_trip(user_client, destination="  Kyoto, Japan  ")
    assert trip["destination"] == "Kyoto, Japan"


def test_trips_require_login(client):
    response = client.get("/api/v1/trips")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


def test_14_days_allowed_15_rejected(user_client):
    assert create_trip(user_client, length=14)["durationDays"] == 14
    response = user_client.post("/api/v1/trips", json=trip_body(length=15))
    assert response.status_code == 400
    assert _details(response) == {"endDate": "A trip can be at most 14 days long."}


def test_end_before_start_rejected(user_client):
    body = trip_body(endDate=days_from_today(5), startDate=days_from_today(9))
    response = user_client.post("/api/v1/trips", json=body)
    assert _details(response) == {"endDate": "The end date can't be before the start date."}


def test_start_date_one_day_of_slack_for_time_zones(user_client):
    # The server allows today (UTC) minus one day, because it doesn't know the user's time zone.
    yesterday = create_trip(user_client, start_in=-1, length=2)
    assert yesterday["startDate"] == days_from_today(-1)
    response = user_client.post("/api/v1/trips", json=trip_body(start_in=-3, length=2))
    assert _details(response) == {"startDate": "The start date can't be in the past."}


def test_invalid_fields(user_client):
    response = user_client.post(
        "/api/v1/trips",
        json={"destination": "   ", "startDate": "not-a-date", "tripType": "business"},
    )
    assert response.status_code == 400
    assert _details(response) == {
        "destination": "Enter a destination.",
        "startDate": "Enter a valid start date.",
        "endDate": "Enter a valid end date.",
        "tripType": "Choose a trip type.",
    }


def test_list_sorted_by_start_date_without_activities(user_client):
    later = create_trip(user_client, start_in=20, destination="Kyoto, Japan")
    sooner = create_trip(user_client, start_in=5, destination="Goa, India")
    trips = user_client.get("/api/v1/trips").json()["trips"]
    assert [t["id"] for t in trips] == [sooner["id"], later["id"]]
    assert "activities" not in trips[0]


def test_empty_list(user_client):
    assert user_client.get("/api/v1/trips").json() == {"trips": []}


def test_get_trip_and_unknown_or_invalid_ids_are_404(user_client):
    trip = create_trip(user_client)
    assert user_client.get(f"/api/v1/trips/{trip['id']}").json()["id"] == trip["id"]
    for bad in ("00000000-0000-0000-0000-000000000000", "not-a-uuid"):
        response = user_client.get(f"/api/v1/trips/{bad}")
        assert response.status_code == 404
        assert response.json()["error"]["code"] == "NOT_FOUND"


def test_patch_changes_only_sent_fields(user_client):
    trip = create_trip(user_client)
    response = user_client.patch(
        f"/api/v1/trips/{trip['id']}", json={"destination": "Lyon, France", "tripType": "solo"}
    )
    assert response.status_code == 200
    updated = response.json()
    assert (updated["destination"], updated["tripType"]) == ("Lyon, France", "solo")
    assert (updated["startDate"], updated["endDate"]) == (trip["startDate"], trip["endDate"])


def test_patch_needs_at_least_one_trip_field(user_client):
    trip = create_trip(user_client)
    response = user_client.patch(
        f"/api/v1/trips/{trip['id']}", json={"confirmDeleteActivities": True}
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_patch_checks_dates_against_existing_values(user_client):
    trip = create_trip(user_client, start_in=10, length=5)
    response = user_client.patch(
        f"/api/v1/trips/{trip['id']}", json={"endDate": days_from_today(30)}
    )
    assert _details(response) == {"endDate": "A trip can be at most 14 days long."}


def test_started_trip_can_be_edited_if_start_unchanged(user_client, db):
    from app.models import Trip

    trip = create_trip(user_client, start_in=10, length=5)
    # Pretend the trip started three days ago.
    row = db.get(Trip, uuid.UUID(trip["id"]))
    row.start_date = utc_today() - timedelta(days=3)
    row.end_date = utc_today() + timedelta(days=1)
    db.commit()

    ok = user_client.patch(f"/api/v1/trips/{trip['id']}", json={"destination": "Nice, France"})
    assert ok.status_code == 200
    moved = user_client.patch(
        f"/api/v1/trips/{trip['id']}", json={"startDate": days_from_today(-2)}
    )
    assert _details(moved) == {"startDate": "The start date can't be in the past."}


def test_shortening_needs_confirmation_then_deletes_in_one_go(user_client):
    trip = create_trip(user_client, start_in=10, length=5)
    tid = trip["id"]
    add_activity(user_client, tid, 2, "Louvre")
    add_activity(user_client, tid, 4, "Versailles")
    add_activity(user_client, tid, 5, "Shopping")
    add_activity(user_client, tid, 5, "Dinner")

    new_end = days_from_today(12)  # 5 days -> 3 days
    refused = user_client.patch(f"/api/v1/trips/{tid}", json={"endDate": new_end})
    assert refused.status_code == 409
    assert refused.json()["error"]["code"] == "ACTIVITIES_WOULD_BE_DELETED"
    assert refused.json()["error"]["details"] == [{"activitiesToDelete": 3, "newDurationDays": 3}]
    unchanged = user_client.get(f"/api/v1/trips/{tid}").json()
    assert unchanged["endDate"] == trip["endDate"] and len(unchanged["activities"]) == 4

    confirmed = user_client.patch(
        f"/api/v1/trips/{tid}", json={"endDate": new_end, "confirmDeleteActivities": True}
    )
    assert confirmed.status_code == 200
    body = confirmed.json()
    assert body["durationDays"] == 3
    assert [a["title"] for a in body["activities"]] == ["Louvre"]


def test_moving_dates_keeps_activities_on_their_day_numbers(user_client):
    trip = create_trip(user_client, start_in=10, length=5)
    add_activity(user_client, trip["id"], 5, "Last day lunch")
    moved = user_client.patch(
        f"/api/v1/trips/{trip['id']}",
        json={"startDate": days_from_today(20), "endDate": days_from_today(24)},
    )
    assert moved.status_code == 200
    assert [(a["dayNumber"], a["title"]) for a in moved.json()["activities"]] == [
        (5, "Last day lunch")
    ]


def test_delete_trip_deletes_activities(user_client, db):
    from sqlalchemy import func, select

    from app.models import Activity

    trip = create_trip(user_client)
    add_activity(user_client, trip["id"], 1, "Arrive")
    response = user_client.delete(f"/api/v1/trips/{trip['id']}", headers=JSON)
    assert response.status_code == 204
    assert user_client.get(f"/api/v1/trips/{trip['id']}").status_code == 404
    assert db.scalar(select(func.count()).select_from(Activity)) == 0


def test_writes_without_json_content_type_are_rejected(user_client):
    trip = create_trip(user_client)
    for response in (
        user_client.delete(f"/api/v1/trips/{trip['id']}"),
        user_client.post("/api/v1/trips", content="destination=Paris"),
    ):
        assert response.status_code == 415
        assert response.json()["error"]["code"] == "UNSUPPORTED_MEDIA_TYPE"
    # Nothing was deleted.
    assert user_client.get(f"/api/v1/trips/{trip['id']}").status_code == 200
