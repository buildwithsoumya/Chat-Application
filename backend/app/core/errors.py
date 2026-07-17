from fastapi import Request
from fastapi import status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError


async def database_exception_handler(
    request: Request,
    exc: SQLAlchemyError
) -> JSONResponse:
    """Return a stable response when the database is unavailable."""
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "detail": "Database service is temporarily unavailable"
        }
    )
