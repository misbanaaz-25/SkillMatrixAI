from datetime import datetime, timezone

from backend.database import get_connection

STATUSES = ["saved", "applied", "interview", "offer", "rejected"]


def init_applications_db() -> None:
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                company TEXT NOT NULL,
                role TEXT NOT NULL,
                status TEXT NOT NULL,
                applied_date TEXT,
                job_link TEXT,
                notes TEXT,
                analysis_id INTEGER
            )
            """
        )


def _row_to_dict(row) -> dict:
    return {
        "id": row["id"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "company": row["company"],
        "role": row["role"],
        "status": row["status"],
        "applied_date": row["applied_date"],
        "job_link": row["job_link"],
        "notes": row["notes"],
        "analysis_id": row["analysis_id"],
    }


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def create_application(data: dict) -> dict:
    now = _now()

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO applications (
                created_at, updated_at, company, role, status,
                applied_date, job_link, notes, analysis_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                now,
                now,
                data["company"],
                data["role"],
                data["status"],
                data["applied_date"],
                data["job_link"],
                data["notes"],
                data["analysis_id"],
            ),
        )
        row = connection.execute(
            "SELECT * FROM applications WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
        return _row_to_dict(row)


def list_applications(status: str | None = None) -> list[dict]:
    with get_connection() as connection:
        if status:
            rows = connection.execute(
                "SELECT * FROM applications WHERE status = ? ORDER BY updated_at DESC, id DESC",
                (status,),
            ).fetchall()
        else:
            rows = connection.execute(
                "SELECT * FROM applications ORDER BY updated_at DESC, id DESC"
            ).fetchall()
    return [_row_to_dict(row) for row in rows]


def update_application(application_id: int, data: dict) -> dict | None:
    with get_connection() as connection:
        existing = connection.execute(
            "SELECT id FROM applications WHERE id = ?", (application_id,)
        ).fetchone()
        if existing is None:
            return None

        connection.execute(
            """
            UPDATE applications
            SET updated_at = ?, company = ?, role = ?, status = ?,
                applied_date = ?, job_link = ?, notes = ?, analysis_id = ?
            WHERE id = ?
            """,
            (
                _now(),
                data["company"],
                data["role"],
                data["status"],
                data["applied_date"],
                data["job_link"],
                data["notes"],
                data["analysis_id"],
                application_id,
            ),
        )
        row = connection.execute(
            "SELECT * FROM applications WHERE id = ?", (application_id,)
        ).fetchone()
        return _row_to_dict(row)


def delete_application(application_id: int) -> bool:
    with get_connection() as connection:
        cursor = connection.execute(
            "DELETE FROM applications WHERE id = ?", (application_id,)
        )
        return cursor.rowcount > 0


def get_application_stats() -> dict:
    counts = {status: 0 for status in STATUSES}

    with get_connection() as connection:
        rows = connection.execute(
            "SELECT status, COUNT(*) AS total FROM applications GROUP BY status"
        ).fetchall()

    for row in rows:
        if row["status"] in counts:
            counts[row["status"]] = row["total"]

    total = sum(counts.values())

    return {
        **counts,
        "total": total,
        "applied_total": total - counts["saved"],
        "to_apply": counts["saved"],
    }