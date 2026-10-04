import logging

from fastapi import APIRouter, FastAPI

from .config import get_settings
from .errors import install_error_handlers
from .middleware import RequestLogMiddleware, RequireJsonMiddleware
from .routers import activities, auth, health, trips

logging.basicConfig(level=get_settings().log_level, format="%(levelname)s %(name)s %(message)s")

app = FastAPI(title="PlanMyTrip API", docs_url="/api/v1/docs", openapi_url="/api/v1/openapi.json")
install_error_handlers(app)
# Added last runs first: logging wraps everything, including 415 rejections.
app.add_middleware(RequireJsonMiddleware)
app.add_middleware(RequestLogMiddleware)

api_v1 = APIRouter(prefix="/api/v1")
api_v1.include_router(health.router)
api_v1.include_router(auth.router)
api_v1.include_router(trips.router)
api_v1.include_router(activities.router)
app.include_router(api_v1)
