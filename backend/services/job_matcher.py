from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from backend.services.skill_extractor import extract_skills, preprocess_text

SKILL_WEIGHT = 0.7
TEXT_WEIGHT = 0.3


def calculate_text_similarity(resume_text: str, job_text: str) -> float:
    """TF-IDF + cosine similarity between resume and job description (0 to 1)."""
    resume_clean = preprocess_text(resume_text)
    job_clean = preprocess_text(job_text)

    if not resume_clean or not job_clean:
        return 0.0

    vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
    matrix = vectorizer.fit_transform([resume_clean, job_clean])
    score = cosine_similarity(matrix[0:1], matrix[1:2])[0][0]
    return float(score)


def analyze_match(resume_text: str, job_description: str) -> dict:
    resume_skills = extract_skills(resume_text)
    job_skills = extract_skills(job_description)

    matched = sorted(set(resume_skills) & set(job_skills))
    missing = sorted(set(job_skills) - set(resume_skills))
    extra = sorted(set(resume_skills) - set(job_skills))

    text_score = calculate_text_similarity(resume_text, job_description) * 100

    if job_skills:
        skill_score = len(matched) / len(job_skills) * 100
        overall = SKILL_WEIGHT * skill_score + TEXT_WEIGHT * text_score
    else:
        skill_score = None
        overall = text_score

    return {
        "match_score": round(overall, 1),
        "skill_match_score": round(skill_score, 1) if skill_score is not None else None,
        "text_similarity_score": round(text_score, 1),
        "matched_skills": matched,
        "missing_skills": missing,
        "extra_skills": extra,
        "job_skills_detected": len(job_skills),
        "note": "This score is an estimate, not a guarantee of selection.",
    }