"""Read-only share links (contract §6.15–6.17)."""

from .conftest import JSON, add_activity, create_trip, signup


def _share(client, trip_id):
    return client.post(f"/api/v1/trips/{trip_id}/share", headers=JSON)


def test_share_returns_a_code_and_shows_on_the_trip(user_client):
    trip = create_trip(user_client)
    response = _share(user_client, trip["id"])
    assert response.status_code == 200, response.text
    body = response.json()
    assert set(body) == {"shareToken", "sharedAt"}
    assert len(body["shareToken"]) == 22
    assert body["sharedAt"].endswith("Z")
    detail = user_client.get(f"/api/v1/trips/{trip['id']}").json()
    assert detail["shareToken"] == body["shareToken"]


def test_sharing_twice_keeps_the_same_code(user_client):
    trip = create_trip(user_client)
    first = _share(user_client, trip["id"]).json()["shareToken"]
    assert _share(user_client, trip["id"]).json()["shareToken"] == first


def test_anyone_can_read_the_shared_copy_without_logging_in(user_client, new_client):
    trip = create_trip(user_client, length=3)
    add_activity(user_client, trip["id"], 2, "Louvre", time="09:00", notes="Denon wing")
    add_activity(user_client, trip["id"], 1, "Arrive")
    code = _share(user_client, trip["id"]).json()["shareToken"]

    response = new_client().get(f"/api/v1/shared/{code}")
    assert response.status_code == 200, response.text
    assert response.headers["cache-control"] == "no-store"
    assert response.headers["x-robots-tag"] == "noindex"
    body = response.json()
    assert set(body) == {
        "destination", "startDate", "endDate", "tripType", "durationDays", "activities",
    }  # fmt: skip
    assert body["durationDays"] == 3
    assert body["activities"] == [
        {"dayNumber": 1, "title": "Arrive", "time": None, "notes": None},
        {"dayNumber": 2, "title": "Louvre", "time": "09:00", "notes": "Denon wing"},
    ]


def test_turning_off_stops_the_link_and_a_new_share_makes_a_new_code(user_client, new_client):
    trip = create_trip(user_client)
    old = _share(user_client, trip["id"]).json()["shareToken"]

    response = user_client.delete(f"/api/v1/trips/{trip['id']}/share", headers=JSON)
    assert response.status_code == 204
    assert user_client.get(f"/api/v1/trips/{trip['id']}").json()["shareToken"] is None
    assert new_client().get(f"/api/v1/shared/{old}").status_code == 404

    new = _share(user_client, trip["id"]).json()["shareToken"]
    assert new != old
    assert new_client().get(f"/api/v1/shared/{old}").status_code == 404
    assert new_client().get(f"/api/v1/shared/{new}").status_code == 200


def test_turning_off_twice_is_fine(user_client):
    trip = create_trip(user_client)
    for _ in range(2):
        response = user_client.delete(f"/api/v1/trips/{trip['id']}/share", headers=JSON)
        assert response.status_code == 204


def test_unknown_code_is_not_found(client):
    response = client.get("/api/v1/shared/not-a-real-code")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


def test_deleting_the_trip_kills_the_link(user_client, new_client):
    trip = create_trip(user_client)
    code = _share(user_client, trip["id"]).json()["shareToken"]
    user_client.delete(f"/api/v1/trips/{trip['id']}", headers=JSON)
    assert new_client().get(f"/api/v1/shared/{code}").status_code == 404


def test_only_the_owner_can_share_or_unshare(user_client, new_client):
    trip = create_trip(user_client)
    other = new_client()
    signup(other, "asha")
    assert _share(other, trip["id"]).status_code == 404
    assert other.delete(f"/api/v1/trips/{trip['id']}/share", headers=JSON).status_code == 404


def test_sharing_needs_login(client):
    assert _share(client, "00000000-0000-0000-0000-000000000000").status_code == 401


def test_share_codes_stay_out_of_the_logs(user_client, new_client, caplog):
    trip = create_trip(user_client)
    code = _share(user_client, trip["id"]).json()["shareToken"]
    caplog.set_level("INFO", logger="planmytrip.requests")
    new_client().get(f"/api/v1/shared/{code}")
    assert "/api/v1/shared/***" in caplog.text
    assert code not in caplog.text
