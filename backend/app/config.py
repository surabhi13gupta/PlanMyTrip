from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


def to_sqlalchemy_url(url: str) -> str:
    """Neon and Docker give plain postgres:// URLs; SQLAlchemy needs the psycopg (v3) driver named."""
    for prefix in ("postgresql+psycopg://", "postgresql://", "postgres://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url.removeprefix(prefix)
    return url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    database_url_unpooled: str | None = None
    app_env: str = "development"
    log_level: str = "INFO"
    session_cookie_secure: bool | None = None
    session_idle_hours: int = 12

    @property
    def sqlalchemy_url(self) -> str:
        return to_sqlalchemy_url(self.database_url)

    @property
    def migrations_url(self) -> str:
        """Migrations use Neon's direct (unpooled) connection when it is available."""
        return to_sqlalchemy_url(self.database_url_unpooled or self.database_url)

    @property
    def cookie_secure(self) -> bool:
        # Local development runs on plain http://localhost, where a Secure cookie would be dropped.
        if self.session_cookie_secure is not None:
            return self.session_cookie_secure
        return self.app_env != "development"


@lru_cache
def get_settings() -> Settings:
    return Settings()
