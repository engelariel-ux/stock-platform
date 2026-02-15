import uuid
import time
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class AskRequest(BaseModel):
    message: str
    ticker: str


CANNED_RESPONSES = [
    "Based on recent price action, {ticker} is showing interesting momentum. I'd watch the volume closely for confirmation.",
    "Looking at {ticker}'s fundamentals, there are a few things worth noting. Let me dig deeper once I'm fully connected.",
    "{ticker} has been in the news lately. I'll be able to provide more detailed analysis once my backend is fully wired up.",
    "That's a great question about {ticker}. I'm still in early development, but soon I'll have real-time analysis capabilities!",
]


@router.post("/agent/ask")
def ask_agent(req: AskRequest):
    idx = hash(req.message) % len(CANNED_RESPONSES)
    content = CANNED_RESPONSES[idx].format(ticker=req.ticker.upper())

    return {
        "id": str(uuid.uuid4()),
        "role": "agent",
        "content": content,
        "timestamp": int(time.time() * 1000),
    }
