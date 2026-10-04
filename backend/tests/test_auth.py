from sqlalchemy import select

from app.models import User, UserSession
from app.security import hash_token

from .conftest import JSON, signup


def test_signup_lowercases_username_and_logs_in(client, db):
    user = signup(client, username="Surabhi")
    assert user["username"] == "surabhi"
    assert user["createdAt"].endswith("Z")
    assert set(user) == {"id", "username", "createdAt"}
    assert client.get("/api/v1/auth/me").json()["user"]["username"] == "surabhi"
    # The password is stored only as an Argon2id hash.
    stored = db.scalar(select(User).where(User.username == "surabhi"))
    assert stored.password_hash.startswith("$argon2id$")


def test_signup_cookie_is_httponly_lax_and_has_no_expiry(client):
    response = client.post(
        "/api/v1/auth/signup", json={"username": "surabhi", "password": "correct-horse-42"}
    )
    cookie = response.headers["set-cookie"].lower()
    assert cookie.startswith("session=")
    assert "httponly" in cookie and "samesite=lax" in cookie and "path=/" in cookie
    assert "max-age" not in cookie and "expires" not in cookie
    assert "secure" not in cookie  # local development runs on plain http


def test_session_stores_only_a_hash_of_the_token(client, db):
    signup(client)
    token = client.cookies["session"]
    assert db.get(UserSession, token) is None
    assert db.get(UserSession, hash_token(token)) is not None


def test_username_taken_in_any_case(client, new_client):
    signup(client, username="surabhi")
    response = new_client().post(
        "/api/v1/auth/signup", json={"username": "SURABHI", "password": "another-pass-1"}
    )
    assert response.status_code == 409
    assert response.json()["error"] == {
        "code": "USERNAME_TAKEN",
        "message": "This username is already taken.",
        "details": [{"field": "username", "message": "This username is already taken."}],
    }


def test_signup_validation_errors(client):
    response = client.post("/api/v1/auth/signup", json={"username": "a b", "password": "short"})
    assert response.status_code == 400
    error = response.json()["error"]
    assert error["code"] == "VALIDATION_ERROR"
    assert {d["field"]: d["message"] for d in error["details"]} == {
        "username": "Use 3–30 letters, numbers, or underscores.",
        "password": "Password must be 8–72 characters.",
    }


def test_signup_rejects_unknown_fields(client):
    response = client.post(
        "/api/v1/auth/signup",
        json={"username": "surabhi", "password": "correct-horse-42", "confirmPassword": "x"},
    )
    assert response.status_code == 400
    assert response.json()["error"]["details"] == [
        {"field": "confirmPassword", "message": "This field isn't allowed."}
    ]


def test_login_logout_cycle(client, new_client):
    signup(client)
    other = new_client()
    response = other.post(
        "/api/v1/auth/login", json={"username": "SuRaBhI", "password": "correct-horse-42"}
    )
    assert response.status_code == 200
    assert response.json()["user"]["username"] == "surabhi"
    assert other.get("/api/v1/auth/me").status_code == 200

    logout = other.post("/api/v1/auth/logout", headers=JSON)
    assert logout.status_code == 204
    assert "max-age=0" in logout.headers["set-cookie"].lower()
    # The session row is gone, so even the old token no longer works.
    assert other.get("/api/v1/auth/me").status_code == 401


def test_logout_works_without_a_session(client):
    assert client.post("/api/v1/auth/logout", headers=JSON).status_code == 204


def test_wrong_password_and_unknown_user_look_the_same(client):
    signup(client)
    wrong_password = client.post(
        "/api/v1/auth/login", json={"username": "surabhi", "password": "nope-nope-nope"}
    )
    unknown_user = client.post(
        "/api/v1/auth/login", json={"username": "nobody", "password": "nope-nope-nope"}
    )
    for response in (wrong_password, unknown_user):
        assert response.status_code == 401
        assert response.json()["error"]["code"] == "INVALID_CREDENTIALS"
        assert response.json()["error"]["message"] == "Invalid username or password."


def test_login_requires_both_fields(client):
    response = client.post("/api/v1/auth/login", json={"username": " ", "password": ""})
    assert response.status_code == 400
    assert {d["field"]: d["message"] for d in response.json()["error"]["details"]} == {
        "username": "Enter your username.",
        "password": "Enter your password.",
    }


def test_me_without_session_is_unauthorized(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"
