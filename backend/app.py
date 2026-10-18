import os
from typing import Literal

from pydantic import BaseModel, Field

from backend.services.chatbot import chat_reply

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from openai import APIError

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

    try:
        analysis_id = save_analysis(filename, job_description, result)
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
def history():
    return list_analyses()


@app.get("/history/{analysis_id}")
def history_detail(analysis_id: int):
    analysis = get_analysis(analysis_id)

    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    analysis["roadmap"] = build_roadmap(analysis["missing_skills"])
    return analysis


@app.delete("/history/{analysis_id}")
def history_delete(analysis_id: int):
    if not delete_analysis(analysis_id):
        raise HTTPException(status_code=404, detail="Analysis not found.")

    return {"deleted": analysis_id}


@app.get("/stats")
def stats():
    return get_stats()

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=1000)


class ChatRequest(BaseModel):
    analysis_id: int
    messages: list[ChatMessage] = Field(min_length=1, max_length=20)


@app.post("/ai/chat")
async def ai_chat(request: ChatRequest):
    if request.messages[-1].role != "user":
        raise HTTPException(status_code=400, detail="The last message must be from the user.")

    analysis = get_analysis(request.analysis_id)
    if analysis is None:
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