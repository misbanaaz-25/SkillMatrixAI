import json
import sqlite3
from collections import Counter
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "data" / "skillmatrix.db"
JOB_PREVIEW_LENGTH = 300


@contextmanager
def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def init_db() -> None:
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS analyses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                filename TEXT NOT NULL,
                job_preview TEXT NOT NULL,
                match_score REAL NOT NULL,
                skill_match_score REAL,
                text_similarity_score REAL NOT NULL,
                matched_skills TEXT NOT NULL,
                missing_skills TEXT NOT NULL,
                extra_skills TEXT NOT NULL
            )
            """
        )


def _row_to_dict(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "created_at": row["created_at"],
        "filename": row["filename"],
        "job_preview": row["job_preview"],
        "match_score": row["match_score"],
        "skill_match_score": row["skill_match_score"],
        "text_similarity_score": row["text_similarity_score"],
        "matched_skills": json.loads(row["matched_skills"]),
        "missing_skills": json.loads(row["missing_skills"]),
        "extra_skills": json.loads(row["extra_skills"]),
    }


def save_analysis(filename: str, job_description: str, result: dict) -> int:
    created_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    job_preview = " ".join(job_description.split())[:JOB_PREVIEW_LENGTH]

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO analyses (
                created_at, filename, job_preview, match_score, skill_match_score,
                text_similarity_score, matched_skills, missing_skills, extra_skills
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                created_at,
                filename,
                job_preview,
                result["match_score"],
                result["skill_match_score"],
                result["text_similarity_score"],
                json.dumps(result["matched_skills"]),
                json.dumps(result["missing_skills"]),
                json.dumps(result["extra_skills"]),
            ),
        )
        return cursor.lastrowid


def list_analyses(limit: int = 50) -> list[dict]:
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT * FROM analyses ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
    return [_row_to_dict(row) for row in rows]


def get_analysis(analysis_id: int) -> dict | None:
    with get_connection() as connection:
        row = connection.execute(
            "SELECT * FROM analyses WHERE id = ?", (analysis_id,)
        ).fetchone()
    return _row_to_dict(row) if row else None


def delete_analysis(analysis_id: int) -> bool:
    with get_connection() as connection:
        cursor = connection.execute("DELETE FROM analyses WHERE id = ?", (analysis_id,))
        return cursor.rowcount > 0


def get_stats() -> dict:
    with get_connection() as connection:
        rows = connection.execute("SELECT * FROM analyses ORDER BY id ASC").fetchall()

    analyses = [_row_to_dict(row) for row in rows]

    if not analyses:
        return {
            "total_analyses": 0,
            "average_match_score": None,
            "best_match_score": None,
            "top_matched_skills": [],
            "top_missing_skills": [],
            "score_trend": [],
        }

    matched_counter = Counter()
    missing_counter = Counter()
    for analysis in analyses:
        matched_counter.update(analysis["matched_skills"])
        missing_counter.update(analysis["missing_skills"])

    scores = [analysis["match_score"] for analysis in analyses]

    return {
        "total_analyses": len(analyses),
        "average_match_score": round(sum(scores) / len(scores), 1),
        "best_match_score": max(scores),
        "top_matched_skills": [
            {"skill": skill, "count": count} for skill, count in matched_counter.most_common(5)
        ],
        "top_missing_skills": [
            {"skill": skill, "count": count} for skill, count in missing_counter.most_common(5)
        ],
        "score_trend": [
            {
                "id": analysis["id"],
                "created_at": analysis["created_at"],
                "match_score": analysis["match_score"],
            }
            for analysis in analyses[-10:]
        ],
    }