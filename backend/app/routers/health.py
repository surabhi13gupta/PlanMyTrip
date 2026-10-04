import logging
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from ..db import get_db
from ..errors import error_response

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/health")
def health(db: Annotated[Session, Depends(get_db)]):
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError:
        logger.exception("Health check could not reach the database")
        return error_response(503, "SERVICE_UNAVAILABLE", "The database can't be reached.")
    return {"status": "ok"}
