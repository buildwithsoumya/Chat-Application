from datetime import datetime
from datetime import timezone


def utc_now() -> datetime:
    """Return a naive UTC timestamp for storage in naive DateTime columns."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
