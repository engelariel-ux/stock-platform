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


class AnalyzeRequest(BaseModel):
    ticker: str
    analysts: list[str] = ["buffett", "wood", "lee", "lynch", "dalio"]


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


ANALYST_PERSONAS = {
    "buffett": {
        "name": "Warren Buffett",
        "style": "Value Investing",
        "prompt": (
            "You are Warren Buffett. Analyze this stock from a value investing perspective. "
            "Focus on intrinsic value, competitive moats, management quality, and margin of safety. "
            "Use your folksy wisdom style. Would you buy this for Berkshire?"
        ),
    },
    "wood": {
        "name": "Cathie Wood",
        "style": "Disruptive Innovation",
        "prompt": (
            "You are Cathie Wood of ARK Invest. Analyze this stock from a disruptive innovation lens. "
            "Focus on technological disruption potential, TAM expansion, and 5-year exponential growth thesis. "
            "Be bold and forward-looking."
        ),
    },
    "lee": {
        "name": "Tom Lee",
        "style": "Macro Strategy",
        "prompt": (
            "You are Tom Lee of Fundstrat. Analyze this stock from a macro-strategic perspective. "
            "Focus on macro trends, sector rotation, earnings momentum, and market technicals. "
            "Be data-driven and constructively bullish where appropriate."
        ),
    },
    "lynch": {
        "name": "Peter Lynch",
        "style": "Growth at Reasonable Price",
        "prompt": (
            "You are Peter Lynch. Analyze this stock using GARP principles. "
            "Focus on PEG ratio, earnings growth, whether an average person can understand the business, "
            "and classify it (slow grower, stalwart, fast grower, cyclical, turnaround, asset play)."
        ),
    },
    "dalio": {
        "name": "Ray Dalio",
        "style": "Global Macro / Risk Parity",
        "prompt": (
            "You are Ray Dalio of Bridgewater. Analyze this stock from a macro risk perspective. "
            "Focus on economic cycles, debt cycles, currency risk, diversification, "
            "and how this fits in an all-weather portfolio."
        ),
    },
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


@router.post("/agent/analyze")
def analyze_stock(req: AnalyzeRequest):
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

    # Fetch overview info
    try:
        ticker = yf.Ticker(req.ticker)
        info = ticker.info
        overview = (
            f"Company: {info.get('shortName', req.ticker)}\n"
            f"Sector: {info.get('sector', 'N/A')}\n"
            f"Market Cap: ${info.get('marketCap', 0):,}\n"
            f"P/E: {info.get('trailingPE', 'N/A')}\n"
            f"EPS: {info.get('trailingEps', 'N/A')}\n"
            f"52W High: ${info.get('fiftyTwoWeekHigh', 'N/A')}\n"
            f"52W Low: ${info.get('fiftyTwoWeekLow', 'N/A')}\n"
        )
    except Exception:
        overview = ""

    data_context = f"Market Data:\n{quote_context}\n{overview}"

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    results = []

    for analyst_key in req.analysts:
        persona = ANALYST_PERSONAS.get(analyst_key)
        if not persona:
            continue

        system = f"{persona['prompt']}\n\n{data_context}\n\nKeep your analysis concise (under 200 words). Give a clear verdict: Buy, Hold, or Sell."

        response = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=512,
            system=system,
            messages=[{"role": "user", "content": f"Analyze {req.ticker.upper()} for me."}],
        )

        results.append({
            "analyst": persona["name"],
            "style": persona["style"],
            "analysis": response.content[0].text,
        })

    return results
