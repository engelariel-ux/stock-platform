import os
import uuid
import time

import anthropic
import yfinance as yf
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")


class AskRequest(BaseModel):
    message: str
    ticker: str


def _fetch_quote(symbol: str) -> dict:
    ticker = yf.Ticker(symbol)
    info = ticker.info

    if not info or "regularMarketPrice" not in info:
        return {}

    price = info.get("regularMarketPrice", 0)
    prev_close = info.get("regularMarketPreviousClose", price)
    change = round(price - prev_close, 2)
    change_pct = round((change / prev_close) * 100, 2) if prev_close else 0

    return {
        "symbol": symbol.upper(),
        "price": price,
        "change": change,
        "changePercent": change_pct,
        "high": info.get("regularMarketDayHigh", 0),
        "low": info.get("regularMarketDayLow", 0),
        "volume": info.get("regularMarketVolume", 0),
    }


SYSTEM_PROMPT = (
    "You are Engelus, the AI stock analyst assistant for EngeluStocks. "
    "You provide concise, insightful analysis of stocks based on the live quote data provided. "
    "Be helpful, professional, and data-driven. Keep responses focused and under 200 words. "
    "Reply in the same language the user writes in — if they write in Hebrew, respond in Hebrew; "
    "if they write in English, respond in English."
)


@router.post("/agent/ask")
def ask_agent(req: AskRequest):
    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY is not configured")

    quote = _fetch_quote(req.ticker)
    if quote:
        quote_context = (
            f"Live quote for {quote['symbol']}:\n"
            f"  Price: ${quote['price']}\n"
            f"  Change: {quote['change']} ({quote['changePercent']}%)\n"
            f"  Day High: ${quote['high']}\n"
            f"  Day Low: ${quote['low']}\n"
            f"  Volume: {quote['volume']:,}\n"
        )
    else:
        quote_context = f"Could not fetch live data for {req.ticker.upper()}."

    system = f"{SYSTEM_PROMPT}\n\nCurrent market data:\n{quote_context}"

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    response = client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=1024,
        system=system,
        messages=[{"role": "user", "content": req.message}],
    )

    content = response.content[0].text

    return {
        "id": str(uuid.uuid4()),
        "role": "agent",
        "content": content,
        "timestamp": int(time.time() * 1000),
    }
