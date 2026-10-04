import os

# Point the app at the test database before any app module reads its settings.
os.environ["DATABASE_URL"] = os.environ.get(
    "TEST_DATABASE_URL", "postgresql://planmytrip:planmytrip@localhost:5432/planmytrip_test"
)
os.environ.pop("DATABASE_URL_UNPOOLED", None)

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient

from app.config import get_settings
from app.main import app


@pytest.fixture(scope="session", autouse=True)
def migrated_test_db():
    """Run all migrations against the test database once per test session."""
    cfg = Config("alembic.ini")
    cfg.set_main_option("sqlalchemy.url", get_settings().migrations_url)
    command.upgrade(cfg, "head")


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)
