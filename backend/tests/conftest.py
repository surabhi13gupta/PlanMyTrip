import os

# Point the app at the test database before any app module reads its settings.
os.environ["DATABASE_URL"] = os.environ.get(
    "TEST_DATABASE_URL", "postgresql://planmytrip:planmytrip@localhost:5432/planmytrip_test"
)
os.environ.pop("DATABASE_URL_UNPOOLED", None)
os.environ["APP_ENV"] = "development"

from collections.abc import Callable, Iterator
from datetime import UTC, date, datetime, timedelta

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db import get_db, get_engine
from app.main import app

JSON = {"Content-Type": "application/json"}


@pytest.fixture(scope="session", autouse=True)
def migrated_test_db():
    """Run all migrations against the test database once per test session."""
    cfg = Config("alembic.ini")
    cfg.set_main_option("sqlalchemy.url", get_settings().migrations_url)
    command.upgrade(cfg, "head")


@pytest.fixture
def db() -> Iterator[Session]:
    """A session inside a transaction that is rolled back after the test.

    Services call commit(); with create_savepoint those commits only release savepoints,
    so nothing a test writes survives it.
    """
    connection = get_engine().connect()
    outer = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")
    app.dependency_overrides[get_db] = lambda: session
    try:
        yield session
    finally:
        app.dependency_overrides.clear()
        session.close()
        outer.rollback()
        connection.close()


@pytest.fixture
def client(db) -> TestClient:
    return TestClient(app)


@pytest.fixture
def new_client(db) -> Callable[[], TestClient]:
    """Extra clients with their own cookie jars, e.g. a second user for ownership tests."""
    return lambda: TestClient(app)


def signup(client: TestClient, username: str = "surabhi", password: str = "correct-horse-42"):
    response = client.post("/api/v1/auth/signup", json={"username": username, "password": password})
    assert response.status_code == 201, response.text
    return response.json()["user"]


@pytest.fixture
def user_client(new_client) -> TestClient:
    """A client already signed up and logged in as 'surabhi'."""
    c = new_client()
    signup(c)
    return c


def utc_today() -> date:
    """The server judges \"today\" in UTC, so tests must too (or they'd fail around midnight)."""
    return datetime.now(UTC).date()


def days_from_today(n: int) -> str:
    return (utc_today() + timedelta(days=n)).isoformat()


def trip_body(start_in: int = 10, length: int = 5, **overrides) -> dict:
    body = {
        "destination": "Paris, France",
        "startDate": days_from_today(start_in),
        "endDate": days_from_today(start_in + length - 1),
        "tripType": "couple",
    }
    body.update(overrides)
    return body


def create_trip(client: TestClient, **kwargs) -> dict:
    response = client.post("/api/v1/trips", json=trip_body(**kwargs))
    assert response.status_code == 201, response.text
    return response.json()


def add_activity(client: TestClient, trip_id: str, day: int, title: str, **extra) -> dict:
    response = client.post(
        f"/api/v1/trips/{trip_id}/activities", json={"dayNumber": day, "title": title, **extra}
    )
    assert response.status_code == 201, response.text
    return response.json()
