import hashlib
import secrets

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError

_hasher = PasswordHasher()  # Argon2id with argon2-cffi's default settings

# Checked against when a username doesn't exist, so a failed login takes the same time either way
# and response timing doesn't reveal which usernames exist.
_DUMMY_HASH = _hasher.hash("not-a-real-password")


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password_hash: str | None, password: str) -> bool:
    try:
        return _hasher.verify(password_hash or _DUMMY_HASH, password) and password_hash is not None
    except VerifyMismatchError, InvalidHashError:
        return False


def new_session_token() -> str:
    """32 random bytes, URL-safe. Lives only in the user's cookie."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """What the database stores instead of the token (64 hex characters)."""
    return hashlib.sha256(token.encode()).hexdigest()
