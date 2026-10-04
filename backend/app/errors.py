"""The standard error shape from api-contract-spec.md §2, and the handlers that produce it."""

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic.alias_generators import to_camel
from sqlalchemy.exc import OperationalError
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


class ApiError(Exception):
    def __init__(self, status: int, code: str, message: str, details: list | None = None):
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message
        self.details = details or []


def error_response(
    status: int, code: str, message: str, details: list | None = None
) -> JSONResponse:
    return JSONResponse(
        status_code=status,
        content={"error": {"code": code, "message": message, "details": details or []}},
    )


def validation_error(details: list[dict], message: str = "Some fields need fixing.") -> ApiError:
    return ApiError(400, "VALIDATION_ERROR", message, details)


def field_error(field: str, message: str) -> ApiError:
    return validation_error([{"field": field, "message": message}])


def not_found() -> ApiError:
    return ApiError(404, "NOT_FOUND", "Not found.")


def unauthorized() -> ApiError:
    return ApiError(401, "UNAUTHORIZED", "Please log in.")


# Messages for errors Pydantic raises itself (missing field, wrong type, too long, …),
# taken from the validation table in api-contract-spec.md §4.
FIELD_MESSAGES = {
    "username": "Use 3–30 letters, numbers, or underscores.",
    "password": "Password must be 8–72 characters.",
    "destination": "Enter a destination.",
    "startDate": "Enter a valid start date.",
    "endDate": "Enter a valid end date.",
    "tripType": "Choose a trip type.",
    "dayNumber": "Choose a day within the trip.",
    "title": "Enter a title.",
    "time": "Use a time like 09:30.",
    "notes": "Notes can be at most 500 characters.",
    "confirmDeleteActivities": "Must be true or false.",
}


def _details_from_pydantic(exc: RequestValidationError) -> list[dict]:
    details: list[dict] = []
    seen: set[str] = set()
    for err in exc.errors():
        loc = [part for part in err["loc"] if part != "body"]
        field = to_camel(str(loc[0])) if loc else ""
        if field in seen:
            continue
        seen.add(field)
        if err["type"] == "extra_forbidden":
            message = "This field isn't allowed."
        elif err["type"] == "value_error":
            # Our own validators raise ValueError with the exact contract message.
            message = str(err.get("ctx", {}).get("error", err["msg"]))
        elif not field:
            message = "Send a JSON object."
        else:
            message = FIELD_MESSAGES.get(field, "This value isn't valid.")
        details.append({"field": field, "message": message})
    return details


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def handle_api_error(_: Request, exc: ApiError) -> JSONResponse:
        return error_response(exc.status, exc.code, exc.message, exc.details)

    @app.exception_handler(RequestValidationError)
    async def handle_validation(_: Request, exc: RequestValidationError) -> JSONResponse:
        # FastAPI's default is 422 with its own shape; the contract wants 400 VALIDATION_ERROR.
        err = validation_error(_details_from_pydantic(exc))
        return error_response(err.status, err.code, err.message, err.details)

    @app.exception_handler(StarletteHTTPException)
    async def handle_http(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        if exc.status_code == 404:
            return error_response(404, "NOT_FOUND", "Not found.")
        if exc.status_code == 405:
            return error_response(405, "METHOD_NOT_ALLOWED", "This method isn't allowed here.")
        return error_response(exc.status_code, "HTTP_ERROR", str(exc.detail))

    @app.exception_handler(OperationalError)
    async def handle_db_down(_: Request, exc: OperationalError) -> JSONResponse:
        logger.error("Database unavailable: %s", exc.__class__.__name__, exc_info=exc)
        return error_response(503, "SERVICE_UNAVAILABLE", "The database can't be reached.")

    @app.exception_handler(Exception)
    async def handle_unexpected(_: Request, exc: Exception) -> JSONResponse:
        logger.error("Unexpected error", exc_info=exc)
        return error_response(500, "INTERNAL_ERROR", "Something went wrong. Please try again.")
