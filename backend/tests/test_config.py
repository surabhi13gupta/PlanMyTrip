import pytest

from app.config import Settings


@pytest.fixture(autouse=True)
def database_url(monkeypatch):
    # Settings needs a DATABASE_URL to load; these tests never connect to it.
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/unused")


def test_vercel_environment_is_detected_without_app_env(monkeypatch):
    # On Vercel, APP_ENV isn't set but VERCEL_ENV is: the cookie must be Secure there.
    monkeypatch.delenv("APP_ENV", raising=False)
    monkeypatch.setenv("VERCEL_ENV", "production")
    settings = Settings(_env_file=None)
    assert settings.app_env == "production"
    assert settings.cookie_secure is True


def test_app_env_wins_over_vercel_env(monkeypatch):
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("VERCEL_ENV", "preview")
    assert Settings(_env_file=None).app_env == "development"


def test_local_development_cookie_is_not_secure(monkeypatch):
    monkeypatch.delenv("APP_ENV", raising=False)
    monkeypatch.delenv("VERCEL_ENV", raising=False)
    settings = Settings(_env_file=None)
    assert settings.app_env == "development"
    assert settings.cookie_secure is False
