import sqlite3
from datetime import datetime, timezone

from backend.database import get_connection


def init_users_db() -> None:
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                photo_filename TEXT
            )
            """
        )


def public_user(user: dict) -> dict:
    """User data that is safe to send to the frontend (no password hash)."""
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "photo_filename": user["photo_filename"],
        "created_at": user["created_at"],
    }


def create_user(name: str, email: str, password_hash: str) -> dict | None:
    """Returns the new user, or None if this email is already registered."""
    created_at = datetime.now(timezone.utc).isoformat(timespec="seconds")

    try:
        with get_connection() as connection:
            cursor = connection.execute(
                "INSERT INTO users (created_at, name, email, password_hash) VALUES (?, ?, ?, ?)",
                (created_at, name, email, password_hash),
            )
            user_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        return None

    return get_user_by_id(user_id)


def find_user_by_email(email: str) -> dict | None:
    """Includes password_hash. Only use this for login checks."""
    with get_connection() as connection:
        row = connection.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    return dict(row) if row else None


def get_user_by_id(user_id: int) -> dict | None:
    with get_connection() as connection:
        row = connection.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return dict(row) if row else None