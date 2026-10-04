from .conftest import JSON, add_activity, create_trip


def _details(response) -> dict:
    return {d["field"]: d["message"] for d in response.json()["error"]["details"]}


def test_create_activity_shape(user_client):
    trip = create_trip(user_client)
    activity = add_activity(
        user_client, trip["id"], 2, "  Visit the Louvre ", time="09:00", notes="Denon wing"
    )
    assert activity["title"] == "Visit the Louvre"
    assert activity["time"] == "09:00"
    assert activity["notes"] == "Denon wing"
    assert activity["dayNumber"] == 2
    assert set(activity) == {
        "id", "dayNumber", "title", "time", "notes", "createdAt", "updatedAt",
    }  # fmt: skip


def test_optional_fields_empty_become_null(user_client):
    trip = create_trip(user_client)
    activity = add_activity(user_client, trip["id"], 1, "Walk", time="", notes="  ")
    assert activity["time"] is None and activity["notes"] is None


def test_day_number_must_be_within_trip(user_client):
    trip = create_trip(user_client, length=3)
    for day in (0, 4):
        response = user_client.post(
            f"/api/v1/trips/{trip['id']}/activities", json={"dayNumber": day, "title": "X"}
        )
        assert response.status_code == 400
        assert _details(response) == {"dayNumber": "Choose a day within the trip."}


def test_activity_validation_messages(user_client):
    trip = create_trip(user_client)
    response = user_client.post(
        f"/api/v1/trips/{trip['id']}/activities",
        json={"dayNumber": 1, "title": "", "time": "25:00", "notes": "x" * 501},
    )
    assert _details(response) == {
        "title": "Enter a title.",
        "time": "Use a time like 09:30.",
        "notes": "Notes can be at most 500 characters.",
    }


def test_sorting_timed_first_then_by_creation(user_client):
    trip = create_trip(user_client)
    tid = trip["id"]
    add_activity(user_client, tid, 2, "Walk along the Seine")
    add_activity(user_client, tid, 2, "Dinner", time="19:30")
    add_activity(user_client, tid, 1, "Arrive")
    add_activity(user_client, tid, 2, "Louvre", time="09:00")
    add_activity(user_client, tid, 2, "Buy postcards")
    titles = [a["title"] for a in user_client.get(f"/api/v1/trips/{tid}").json()["activities"]]
    assert titles == ["Arrive", "Louvre", "Dinner", "Walk along the Seine", "Buy postcards"]


def test_patch_changes_sent_fields_and_null_clears(user_client):
    trip = create_trip(user_client)
    activity = add_activity(user_client, trip["id"], 1, "Louvre", time="09:00", notes="Tickets")
    url = f"/api/v1/trips/{trip['id']}/activities/{activity['id']}"
    response = user_client.patch(url, json={"title": "Louvre and Tuileries", "notes": None})
    assert response.status_code == 200
    updated = response.json()
    assert (updated["title"], updated["time"], updated["notes"]) == (
        "Louvre and Tuileries",
        "09:00",
        None,
    )


def test_patch_cannot_move_day_or_be_empty(user_client):
    trip = create_trip(user_client)
    activity = add_activity(user_client, trip["id"], 1, "Louvre")
    url = f"/api/v1/trips/{trip['id']}/activities/{activity['id']}"
    moved = user_client.patch(url, json={"dayNumber": 2})
    assert moved.status_code == 400
    assert _details(moved) == {"dayNumber": "This field isn't allowed."}
    assert user_client.patch(url, json={}).status_code == 400
    assert user_client.patch(url, json={"title": None}).status_code == 400


def test_delete_activity(user_client):
    trip = create_trip(user_client)
    activity = add_activity(user_client, trip["id"], 1, "Louvre")
    url = f"/api/v1/trips/{trip['id']}/activities/{activity['id']}"
    assert user_client.delete(url, headers=JSON).status_code == 204
    assert user_client.delete(url, headers=JSON).status_code == 404


def test_activity_must_belong_to_the_trip_in_the_url(user_client):
    paris = create_trip(user_client)
    kyoto = create_trip(user_client, destination="Kyoto, Japan")
    activity = add_activity(user_client, paris["id"], 1, "Louvre")
    wrong = f"/api/v1/trips/{kyoto['id']}/activities/{activity['id']}"
    assert user_client.patch(wrong, json={"title": "X"}).status_code == 404
    assert user_client.delete(wrong, headers=JSON).status_code == 404
