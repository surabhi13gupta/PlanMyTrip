import re
import uuid

from pydantic import field_validator

from .common import RequestModel, ResponseModel, UtcTimestamp

USERNAME_RE = re.compile(r"^[A-Za-z0-9_]{3,30}$")


class SignupIn(RequestModel):
    username: str
    password: str
    name: str | None = None

    @field_validator("name")
    @classmethod
    def check_name(cls, value: str | None) -> str | None:
        # Optional: left out, null, or empty (after trimming) are all stored as "no name".
        if not value:
            return None
        if len(value) > 50:
            raise ValueError("Name can be at most 50 characters.")
        return value

    @field_validator("username")
    @classmethod
    def check_username(cls, value: str) -> str:
        if not USERNAME_RE.fullmatch(value):
            raise ValueError("Use 3–30 letters, numbers, or underscores.")
        return value

    @field_validator("password")
    @classmethod
    def check_password(cls, value: str) -> str:
        if not 8 <= len(value) <= 72:
            raise ValueError("Password must be 8–72 characters.")
        return value


class LoginIn(RequestModel):
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def username_required(cls, value: str) -> str:
        if not value:
            raise ValueError("Enter your username.")
        return value

    @field_validator("password")
    @classmethod
    def password_required(cls, value: str) -> str:
        if not value:
            raise ValueError("Enter your password.")
        return value


class UserOut(ResponseModel):
    id: uuid.UUID
    username: str
    name: str | None
    created_at: UtcTimestamp


class UserEnvelope(ResponseModel):
    user: UserOut
