import logging
import time
import uuid

from starlette.types import ASGIApp, Message, Receive, Scope, Send

from .errors import error_response

logger = logging.getLogger("planmytrip.requests")

WRITE_METHODS = {"POST", "PATCH", "PUT", "DELETE"}


class RequestLogMiddleware:
    """One log line per request: method, path, status, duration, request ID. Never cookies."""

    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        request_id = uuid.uuid4().hex[:8]
        started = time.perf_counter()
        status_code = 500

        async def send_wrapper(message: Message) -> None:
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
                message.setdefault("headers", []).append((b"x-request-id", request_id.encode()))
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            duration_ms = (time.perf_counter() - started) * 1000
            level = logging.ERROR if status_code >= 500 else logging.INFO
            logger.log(
                level,
                "%s %s %s %.0fms rid=%s",
                scope["method"],
                scope["path"],
                status_code,
                duration_ms,
                request_id,
            )


class RequireJsonMiddleware:
    """CSRF protection (backend-spec §6): writes to the API must declare Content-Type: application/json.

    An ordinary form on another website can't send that header, and a script on another website
    can't either without a CORS preflight, which this API never allows.
    """

    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if (
            scope["type"] == "http"
            and scope["method"] in WRITE_METHODS
            and scope["path"].startswith("/api/")
        ):
            headers = dict(scope["headers"])
            content_type = headers.get(b"content-type", b"").decode("latin-1").lower()
            if not content_type.startswith("application/json"):
                response = error_response(
                    415,
                    "UNSUPPORTED_MEDIA_TYPE",
                    "Requests that change data must send Content-Type: application/json.",
                )
                await response(scope, receive, send)
                return
        await self.app(scope, receive, send)
