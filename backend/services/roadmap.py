import json
from pathlib import Path

ROADMAP_FILE = Path(__file__).resolve().parent.parent / "data" / "roadmap_data.json"

DEFAULT_PRIORITY = 6


def load_roadmap_data() -> dict:
    with open(ROADMAP_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def _default_entry(skill: str) -> dict:
    return {
        "priority": DEFAULT_PRIORITY,
        "steps": [
            f"Beginner: learn the core concepts of {skill}",
            f"Intermediate: build small exercises using {skill}",
            f"Advanced: use {skill} in a real project and read its best practices",
        ],
        "practice_project": f"Build a small project that uses {skill}",
        "resources": [f"Official documentation of {skill}"],
    }


def build_roadmap(missing_skills: list[str]) -> list[dict]:
    data = load_roadmap_data()
    items = []

    for skill in missing_skills:
        info = data.get(skill) or _default_entry(skill)
        items.append(
            {
                "skill": skill,
                "priority": info["priority"],
                "steps": info["steps"],
                "practice_project": info["practice_project"],
                "resources": info["resources"],
            }
        )

    items.sort(key=lambda item: (item["priority"], item["skill"]))
    return items