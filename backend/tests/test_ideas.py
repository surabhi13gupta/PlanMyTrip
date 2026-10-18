"""The Ideas panel endpoint. SerpApi is replaced by a fake; no real searches are spent."""

from datetime import UTC, datetime, timedelta

import httpx2
import pytest
from sqlalchemy import select, update

from app.config import get_settings
from app.models import IdeaSearch
from app.services import serpapi

from .conftest import create_trip

PLACE = {
    "place_id": "ChIJ7YvD6S5u5kcRhX3e0dXUMOc",
    "title": "Musée d'Orsay",
    "rating": 4.8,
    "reviews": 98214,
    "type": "Art museum",
    "address": "1 Rue de la Légion d'Honneur, 75007 Paris, France",
    "thumbnail": "https://lh5.googleusercontent.com/p/AF1Qip=w120-h120-k-no",
}


class FakeSerpApi:
    """Stands in for httpx2.get; records each search so tests can count them."""

    def __init__(self):
        self.queries: list[str] = []
        self.status = 200
        self.body: dict = {"local_results": [PLACE]}
        self.raise_error: Exception | None = None

    def __call__(self, url, params, timeout):
        self.queries.append(params["q"])
        if self.raise_error:
            raise self.raise_error
        return httpx2.Response(self.status, json=self.body, request=httpx2.Request("GET", url))


@pytest.fixture
def fake(monkeypatch) -> FakeSerpApi:
    fake = FakeSerpApi()
    monkeypatch.setattr(serpapi.httpx2, "get", fake)
    monkeypatch.setattr(get_settings(), "serpapi_key", "test-key")
    return fake


def _ideas(client, trip_id, category="museums"):
    return client.get(f"/api/v1/trips/{trip_id}/ideas", params={"category": category})


def test_ideas_shape(user_client, fake):
    trip = create_trip(user_client)
    response = _ideas(user_client, trip["id"])
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["category"] == "museums"
    assert body["query"] == "museums in Paris, France"
    assert body["fetchedAt"].endswith("Z")
    assert body["ideas"] == [
        {
            "id": "ChIJ7YvD6S5u5kcRhX3e0dXUMOc",
            "name": "Musée d'Orsay",
            "rating": 4.8,
            "reviews": 98214,
            "priceLevel": None,
            "type": "Art museum",
            "address": "1 Rue de la Légion d'Honneur, 75007 Paris, France",
            "thumbnailUrl": "https://lh5.googleusercontent.com/p/AF1Qip=w120-h120-k-no",
        }
    ]
    assert fake.queries == ["museums in Paris, France"]


def test_search_words_come_from_the_category(user_client, fake):
    trip = create_trip(user_client)
    _ideas(user_client, trip["id"], "zoos-aquariums")
    assert fake.queries == ["zoo aquarium in Paris, France"]


def test_saved_results_are_reused_across_trips_and_users(user_client, new_client, fake):
    _ideas(user_client, create_trip(user_client)["id"])
    other = new_client()
    other.post("/api/v1/auth/signup", json={"username": "asha", "password": "correct-horse-42"})
    trip = create_trip(other, destination="  paris,   FRANCE ")
    response = _ideas(other, trip["id"])
    assert response.status_code == 200
    assert response.json()["ideas"][0]["name"] == "Musée d'Orsay"
    assert len(fake.queries) == 1  # the second search was served from the saved row


def test_old_results_are_searched_again(user_client, db, fake):
    trip = create_trip(user_client)
    _ideas(user_client, trip["id"])
    db.execute(update(IdeaSearch).values(fetched_at=datetime.now(UTC) - timedelta(days=31)))
    fake.body = {"local_results": [{**PLACE, "title": "Musée Rodin", "place_id": "rodin"}]}
    response = _ideas(user_client, trip["id"])
    assert response.json()["ideas"][0]["name"] == "Musée Rodin"
    assert len(fake.queries) == 2
    assert len(db.scalars(select(IdeaSearch)).all()) == 1  # updated in place


def test_old_results_are_used_when_serpapi_fails(user_client, db, fake):
    trip = create_trip(user_client)
    _ideas(user_client, trip["id"])
    db.execute(update(IdeaSearch).values(fetched_at=datetime.now(UTC) - timedelta(days=31)))
    fake.raise_error = httpx2.ConnectTimeout("timed out")
    response = _ideas(user_client, trip["id"])
    assert response.status_code == 200
    assert response.json()["ideas"][0]["name"] == "Musée d'Orsay"


def test_daily_limit(user_client, monkeypatch, fake):
    monkeypatch.setattr(get_settings(), "ideas_daily_searches_per_user", 2)
    trip = create_trip(user_client)
    assert _ideas(user_client, trip["id"], "museums").status_code == 200
    assert _ideas(user_client, trip["id"], "parks").status_code == 200
    response = _ideas(user_client, trip["id"], "cafes")
    assert response.status_code == 429
    assert response.json()["error"]["code"] == "IDEAS_DAILY_LIMIT"
    assert _ideas(user_client, trip["id"], "museums").status_code == 200  # saved still works
    assert len(fake.queries) == 2


@pytest.mark.parametrize(
    "setup",
    [
        lambda f: setattr(f, "raise_error", httpx2.ConnectTimeout("timed out")),
        lambda f: (
            setattr(f, "status", 429),
            setattr(f, "body", {"error": "Your account has run out of searches."}),
        ),
        lambda f: setattr(f, "status", 500),
    ],
    ids=["timeout", "out-of-searches", "server-error"],
)
def test_serpapi_failures_are_503(user_client, fake, setup, caplog):
    setup(fake)
    response = _ideas(user_client, create_trip(user_client)["id"])
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "IDEAS_UNAVAILABLE"
    assert "test-key" not in caplog.text


def test_no_key_is_503_without_calling_serpapi(user_client, monkeypatch, fake):
    monkeypatch.setattr(get_settings(), "serpapi_key", None)
    response = _ideas(user_client, create_trip(user_client)["id"])
    assert response.status_code == 503
    assert fake.queries == []


def test_nothing_found_is_an_empty_list(user_client, fake):
    fake.body = {"error": "Google hasn't returned any results for this query."}
    response = _ideas(user_client, create_trip(user_client)["id"])
    assert response.status_code == 200
    assert response.json()["ideas"] == []


def test_places_are_cleaned_up(user_client, fake):
    places = [
        {"title": "No id", "thumbnail": "http://insecure.example/x.jpg", "rating": "4.5"},
        {"title": "  "},  # no name: skipped
        PLACE,
        PLACE,  # duplicate: skipped
        *({"title": f"Place {n}", "place_id": f"p{n}"} for n in range(20)),
    ]
    fake.body = {"local_results": places}
    ideas = _ideas(user_client, create_trip(user_client)["id"]).json()["ideas"]
    assert len(ideas) == 10
    assert ideas[0] == {
        "id": "No id",
        "name": "No id",
        "rating": None,
        "reviews": None,
        "priceLevel": None,
        "type": None,
        "address": None,
        "thumbnailUrl": None,
    }
    assert ideas[1]["name"] == "Musée d'Orsay" and ideas[2]["name"] == "Place 0"


def test_category_must_be_known(user_client, fake):
    trip = create_trip(user_client)
    for params in ({"category": "casinos"}, {}):
        response = user_client.get(f"/api/v1/trips/{trip['id']}/ideas", params=params)
        assert response.status_code == 400
        assert response.json()["error"]["details"] == [
            {"field": "category", "message": "Choose an idea category."}
        ]


def test_other_users_trip_is_not_found(user_client, new_client, fake):
    trip = create_trip(user_client)
    other = new_client()
    other.post("/api/v1/auth/signup", json={"username": "asha", "password": "correct-horse-42"})
    assert _ideas(other, trip["id"]).status_code == 404
    assert fake.queries == []


def test_requires_login(client, fake):
    response = _ideas(client, "00000000-0000-0000-0000-000000000000")
    assert response.status_code == 401
