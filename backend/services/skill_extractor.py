import json
import re
from pathlib import Path

SKILLS_FILE = Path(__file__).resolve().parent.parent / "data" / "skills.json"


def load_skills() -> dict:
    with open(SKILLS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def preprocess_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _alias_pattern(alias: str) -> re.Pattern:
    # Whole-word match, so "java" does not match inside "javascript".
    # + # . are treated as part of a word so C++, C# and Node.js work.
    escaped = re.escape(alias.lower())
    return re.compile(rf"(?<![a-z0-9+#.]){escaped}(?![a-z0-9+#])")


def extract_skills(text: str) -> list[str]:
    cleaned = preprocess_text(text)
    skills = load_skills()
    found = []

    for skill_name, aliases in skills.items():
        for alias in aliases:
            if _alias_pattern(alias).search(cleaned):
                found.append(skill_name)
                break

    return sorted(found)