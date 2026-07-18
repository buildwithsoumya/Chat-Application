from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings


def get_engine_options(database_url: str) -> dict:
    """Return SQLAlchemy engine options for the configured database."""
    options: dict = {
        "pool_pre_ping": True,
    }
    if database_url.startswith("postgresql"):
        options["connect_args"] = {"connect_timeout": 10}
        options["pool_size"] = 10
        options["max_overflow"] = 20
        options["pool_recycle"] = 1800  # recycle connections every 30 minutes
    return options


engine = create_engine(
    settings.DATABASE_URL,
    **get_engine_options(settings.DATABASE_URL)
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)
