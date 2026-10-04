"""User B must get 404 for every endpoint touching user A's trip or activities (backend-spec §13)."""

import pytest

from .conftest import JSON, add_activity, create_trip, days_from_today, signup


@pytest.fixture
def setup(new_client):
    alice, bob = new_client(), new_client()
    signup(alice, username="alice")
    signup(bob, username="bob")
    trip = create_trip(alice)
    activity = add_activity(alice, trip["id"], 1, "Louvre")
    return alice, bob, trip, activity


def test_other_users_trip_is_not_found_everywhere(setup):
    alice, bob, trip, activity = setup
    t = f"/api/v1/trips/{trip['id']}"
    a = f"{t}/activities/{activity['id']}"
    attempts = [
        bob.get(t),
        bob.patch(t, json={"destination": "Hacked"}),
        bob.patch(t, json={"endDate": days_from_today(10), "confirmDeleteActivities": True}),
        bob.delete(t, headers=JSON),
        bob.post(f"{t}/activities", json={"dayNumber": 1, "title": "Sneaky"}),
        bob.patch(a, json={"title": "Hacked"}),
        bob.delete(a, headers=JSON),
    ]
    for response in attempts:
        assert response.status_code == 404, response.request.method
        assert response.json()["error"]["code"] == "NOT_FOUND"

    # Alice's data is untouched, and Bob's list is empty.
    still = alice.get(t).json()
    assert still["destination"] == "Paris, France"
    assert [x["title"] for x in still["activities"]] == ["Louvre"]
    assert bob.get("/api/v1/trips").json() == {"trips": []}
