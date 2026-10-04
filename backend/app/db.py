from collections.abc import Iterator
from functools import lru_cache

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import NullPool

from .config import get_settings


@lru_cache
def get_engine() -> Engine:
    # NullPool: on Vercel each function instance is short-lived and Neon's pooler does the pooling.
    # prepare_threshold=None: Neon's pooler (PgBouncer, transaction mode) can't use prepared statements.
    return create_engine(
        get_settings().sqlalchemy_url,
        poolclass=NullPool,
        connect_args={"prepare_threshold": None},
    )


def get_db() -> Iterator[Session]:
    session = sessionmaker(bind=get_engine())()
    try:
        yield session
    finally:
        session.close()
