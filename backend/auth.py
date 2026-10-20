import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.users import get_user_by_id, public_user

load_dotenv(Path(__file__).resolve().parent / ".env")

ALGORITHM = "HS256"
TOKEN_DAYS = 30  # user stays logged in for 30 days

bearer = HTTPBearer(auto_error=False)


def _secret() -> str:
    secret = os.getenv("JWT_SECRET")
    if not secret:
        raise RuntimeError("JWT_SECRET is not set in backend/.env")
    return secret


def hash_password(password: str) -> str:
    # bcrypt only reads the first 72 bytes
    return bcrypt.hashpw(password.encode()[:72], bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode()[:72], password_hash.encode())
    except ValueError:
        return False


def create_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(days=TOKEN_DAYS),
    }
    return jwt.encode(payload, _secret(), algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> dict:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Please log in to continue.")

    try:
        payload = jwt.decode(credentials.credentials, _secret(), algorithms=[ALGORITHM])
        user_id = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Your session expired. Please log in again.")

    user = get_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Account not found. Please log in again.")

    return public_user(user)


def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> dict | None:
    """Logged-in user if a valid token is sent, otherwise None (used for the free analysis)."""
    if credentials is None:
        return None

    try:
        return get_current_user(credentials)
    except HTTPException:
        return None