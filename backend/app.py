import os

from fastapi import FastAPI, File, Form, HTTPException, UploadFile

from backend.services.job_matcher import analyze_match
from backend.services.resume_parser import ALLOWED_EXTENSIONS, extract_resume_text
from backend.services.roadmap import build_roadmap
from backend.services.skill_extractor import extract_skills

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
MIN_JOB_DESCRIPTION_LENGTH = 30

app = FastAPI(
    title="SkillMatrixAI",
    description="AI-powered Resume Analyzer and Skill Gap Analyzer",
    version="0.3.0",
)


async def read_resume(file: UploadFile) -> tuple[str, str]:
    filename = file.filename or ""
    extension = os.path.splitext(filename.lower())[1]

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are allowed.")

    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File is too large. Maximum size is 5 MB.")

    try:
        text = extract_resume_text(filename, file_bytes)
    except Exception:
        raise HTTPException(status_code=422, detail="Could not read this file. It may be corrupted.")

    if not text:
        raise HTTPException(
            status_code=422,
            detail="No text found. If this is a scanned PDF, text extraction will not work.",
        )

    return filename, text


@app.get("/")
def root():
    return {"message": "SkillMatrixAI backend is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/analyze/resume")
async def analyze_resume(file: UploadFile = File(...)):
    filename, text = await read_resume(file)
    skills = extract_skills(text)

    return {
        "filename": filename,
        "characters": len(text),
        "skills_found": skills,
        "skills_count": len(skills),
        "preview": text[:300],
    }


@app.post("/analyze/match")
async def match_resume_to_job(
    file: UploadFile = File(...),
    job_description: str = Form(...),
):
    if len(job_description.strip()) < MIN_JOB_DESCRIPTION_LENGTH:
        raise HTTPException(status_code=400, detail="Please provide a longer job description.")

    filename, text = await read_resume(file)
    result = analyze_match(text, job_description)
    roadmap = build_roadmap(result["missing_skills"])

    return {"filename": filename, **result, "roadmap": roadmap}