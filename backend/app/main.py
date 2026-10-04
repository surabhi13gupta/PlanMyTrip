import logging

from fastapi import APIRouter, FastAPI

from .config import get_settings
from .routers import health

logging.basicConfig(level=get_settings().log_level)

app = FastAPI(title="PlanMyTrip API", docs_url="/api/v1/docs", openapi_url="/api/v1/openapi.json")

api_v1 = APIRouter(prefix="/api/v1")
api_v1.include_router(health.router)
app.include_router(api_v1)
