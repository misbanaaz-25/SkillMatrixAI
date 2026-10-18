import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


class LLMNotConfiguredError(Exception):
    pass


def _get_client() -> OpenAI:
    api_key = os.getenv("LLM_API_KEY")
    if not api_key:
        raise LLMNotConfiguredError("LLM_API_KEY is not set in backend/.env")

    base_url = os.getenv("LLM_BASE_URL") or None
    return OpenAI(api_key=api_key, base_url=base_url)


def _get_model() -> str:
    model = os.getenv("LLM_MODEL")
    if not model:
        raise LLMNotConfiguredError("LLM_MODEL is not set in backend/.env")
    return model


def chat_completion(
    messages: list[dict], temperature: float = 0.4, max_tokens: int = 1000
) -> str:
    client = _get_client()
    response = client.chat.completions.create(
        model=_get_model(),
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return (response.choices[0].message.content or "").strip()  