import os

from fastapi import Body
from fastapi.responses import Response
from backend.services.report import build_report_pdf
from typing import Literal

from pydantic import BaseModel, Field

from backend.services.chatbot import chat_reply

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from openai import APIError

from backend.applications import (
    create_application,
    delete_application,
    get_application_stats,
    init_applications_db,
    list_applications,
    update_application,
)

from backend.database import (
    delete_analysis,
    get_analysis,
    get_stats,
    init_db,
    list_analyses,
    save_analysis,
)
from backend.services.ai_feedback import generate_feedback
from backend.services.job_matcher import analyze_match
from backend.services.llm import LLMNotConfiguredError
from backend.services.resume_parser import ALLOWED_EXTENSIONS, extract_resume_text
from backend.services.roadmap import build_roadmap
from backend.services.skill_extractor import extract_skills

from backend.auth import (
    create_token,
    get_current_user,
    get_optional_user,
    hash_password,
    verify_password,
)
from backend.users import (
    create_user,
    find_user_by_email,
    init_users_db,
    public_user,
)

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
MIN_JOB_DESCRIPTION_LENGTH = 30

app = FastAPI(
    title="SkillMatrixAI",
    description="AI-powered Resume Analyzer and Skill Gap Analyzer",
    version="0.5.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()
init_users_db()


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
    user: dict | None = Depends(get_optional_user),
):
    if len(job_description.strip()) < MIN_JOB_DESCRIPTION_LENGTH:
        raise HTTPException(status_code=400, detail="Please provide a longer job description.")

    filename, text = await read_resume(file)
    result = analyze_match(text, job_description)
    roadmap = build_roadmap(result["missing_skills"])

    try:
        analysis_id = save_analysis(
            filename, job_description, result, user["id"] if user else None
        )
    except Exception:
        analysis_id = None

    return {"id": analysis_id, "filename": filename, **result, "roadmap": roadmap}

@app.post("/ai/feedback")
async def ai_feedback(
    file: UploadFile = File(...),
    job_description: str = Form(...),
):
    if len(job_description.strip()) < MIN_JOB_DESCRIPTION_LENGTH:
        raise HTTPException(status_code=400, detail="Please provide a longer job description.")

    filename, text = await read_resume(file)
    result = analyze_match(text, job_description)

    try:
        feedback = await run_in_threadpool(
            generate_feedback,
            text,
            job_description,
            result["matched_skills"],
            result["missing_skills"],
        )
    except LLMNotConfiguredError:
        raise HTTPException(status_code=503, detail="AI feedback is not configured on the server.")
    except ValueError:
        raise HTTPException(
            status_code=502, detail="The AI returned an unexpected answer. Please try again."
        )
    except APIError:
        raise HTTPException(
            status_code=502,
            detail="The AI service is busy or its free limit was reached. Please try again in a minute.",
        )

    return {"filename": filename, "feedback": feedback}


@app.get("/history")
def history(user: dict = Depends(get_current_user)):
    return list_analyses(user["id"])


@app.get("/history/{analysis_id}")
def history_detail(analysis_id: int, user: dict = Depends(get_current_user)):
    analysis = get_analysis(analysis_id)

    if analysis is None or analysis["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    analysis["roadmap"] = build_roadmap(analysis["missing_skills"])
    return analysis


@app.delete("/history/{analysis_id}")
def history_delete(analysis_id: int, user: dict = Depends(get_current_user)):
    if not delete_analysis(analysis_id, user["id"]):
        raise HTTPException(status_code=404, detail="Analysis not found.")

    return {"deleted": analysis_id}


@app.get("/stats")
def stats(user: dict = Depends(get_current_user)):
    return get_stats(user["id"])




class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=1000)


class ChatRequest(BaseModel):
    analysis_id: int
    messages: list[ChatMessage] = Field(min_length=1, max_length=20)


@app.post("/ai/chat")
async def ai_chat(request: ChatRequest, user: dict | None = Depends(get_optional_user)):
    if request.messages[-1].role != "user":
        raise HTTPException(status_code=400, detail="The last message must be from the user.")

    analysis = get_analysis(request.analysis_id)

    # a saved analysis that belongs to someone can only be used by that person
    owner_id = analysis["user_id"] if analysis else None
    if analysis is None or (owner_id is not None and (user is None or user["id"] != owner_id)):
        raise HTTPException(status_code=404, detail="Analysis not found.")

    try:
        reply = await run_in_threadpool(
            chat_reply,
            analysis,
            [message.model_dump() for message in request.messages],
        )
    except LLMNotConfiguredError:
        raise HTTPException(status_code=503, detail="The chatbot is not configured on the server.")
    except ValueError:
        raise HTTPException(
            status_code=502, detail="The AI returned an unexpected answer. Please try again."
        )
    except APIError:
        raise HTTPException(
            status_code=502,
            detail="The AI service is busy or its free limit was reached. Please try again in a minute.",
        )

    return {"reply": reply}
init_applications_db()


class ApplicationIn(BaseModel):
    company: str = Field(min_length=1, max_length=100)
    role: str = Field(min_length=1, max_length=100)
    status: Literal["saved", "applied", "interview", "offer", "rejected"] = "saved"
    applied_date: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    job_link: str | None = Field(default=None, max_length=500, pattern=r"^https?://\S+$")
    notes: str | None = Field(default=None, max_length=1000)
    analysis_id: int | None = None


def clean_application(application: ApplicationIn, user: dict) -> dict:
    data = application.model_dump()
    data["company"] = data["company"].strip()
    data["role"] = data["role"].strip()

    if not data["company"] or not data["role"]:
        raise HTTPException(status_code=400, detail="Company and role cannot be empty.")

    if data["notes"] is not None:
        data["notes"] = data["notes"].strip() or None

    # a linked analysis must belong to this user
    if data["analysis_id"] is not None:
        analysis = get_analysis(data["analysis_id"])
        if analysis is None or analysis["user_id"] != user["id"]:
            raise HTTPException(status_code=400, detail="The selected analysis was not found.")

    return data


@app.get("/applications/stats")
def applications_stats(user: dict = Depends(get_current_user)):
    return get_application_stats(user["id"])


@app.get("/applications")
def applications_list(status: str | None = None, user: dict = Depends(get_current_user)):
    return list_applications(user["id"], status)


@app.post("/applications")
def applications_create(application: ApplicationIn, user: dict = Depends(get_current_user)):
    return create_application(user["id"], clean_application(application, user))


@app.put("/applications/{application_id}")
def applications_update(
    application_id: int, application: ApplicationIn, user: dict = Depends(get_current_user)
):
    updated = update_application(
        user["id"], application_id, clean_application(application, user)
    )

    if updated is None:
        raise HTTPException(status_code=404, detail="Application not found.")

    return updated


@app.delete("/applications/{application_id}")
def applications_delete(application_id: int, user: dict = Depends(get_current_user)):
    if not delete_application(user["id"], application_id):
        raise HTTPException(status_code=404, detail="Application not found.")

    return {"deleted": application_id}

@app.post("/report/download")
def download_report(data: dict = Body(...)):
    pdf_bytes = build_report_pdf(data)
    filename = f"SkillMatrixAI_Report_{data.get('id', 'analysis')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

class SignupIn(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    email: str = Field(max_length=120, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(min_length=8, max_length=72)


class LoginIn(BaseModel):
    email: str = Field(max_length=120)
    password: str = Field(max_length=72)


@app.post("/auth/signup")
def auth_signup(data: SignupIn):
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name cannot be empty.")

    user = create_user(name, data.email.strip().lower(), hash_password(data.password))
    if user is None:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    return {"token": create_token(user["id"]), "user": public_user(user)}


@app.post("/auth/login")
def auth_login(data: LoginIn):
    user = find_user_by_email(data.email.strip().lower())

    # same message for wrong email and wrong password, so nobody can check which emails exist
    if user is None or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    return {"token": create_token(user["id"]), "user": public_user(user)}


@app.get("/auth/me")
def auth_me(user: dict = Depends(get_current_user)):
    return user