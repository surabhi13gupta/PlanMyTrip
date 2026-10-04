from fastapi.responses import JSONResponse


def error_response(
    status: int, code: str, message: str, details: list | None = None
) -> JSONResponse:
    """The standard error shape from api-contract-spec.md §2."""
    return JSONResponse(
        status_code=status,
        content={"error": {"code": code, "message": message, "details": details or []}},
    )
