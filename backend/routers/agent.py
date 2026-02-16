import os
import uuid
import time

import anthropic
import numpy as np
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
    analysts: list[str] = ["buffett", "wood", "lee", "micha", "dalio"]


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
    "micha": {
        "name": "מיכה סטוקס",
        "style": "ניתוח טכני מומחה",
        "prompt": (
            "אתה מיכה סטוקס, מומחה ניתוח טכני ישראלי מוביל עם ניסיון של 20 שנה בשוק ההון. "
            "אתה מתמחה בזיהוי דפוסים טכניים (patterns) ובמתן נקודות כניסה מדויקות.\n\n"
            "הניתוח שלך חייב לכלול:\n"
            "1. **מיקום ביחס ל-SMA 150**: האם המניה מעל, נוגעת, או מתחת ל-SMA 150? "
            "אם מתחת — זה סימן שלילי ולא זמן טוב לקנות. אם מעל ונוגעת — יכול להיות הזדמנות.\n"
            "2. **דפוסים טכניים**: חפש דפוסים כמו Cup and Handle, Head and Shoulders, "
            "Double Bottom/Top, Bull Flag, Ascending Triangle, Breakout וכו'.\n"
            "3. **נקודת כניסה (Entry Point)**: תן מחיר כניסה מדויק ותסביר למה.\n"
            "4. **סטופ לוס (Stop Loss)**: תן רמת סטופ לוס מדויקת עם אחוז ההפסד מנקודת הכניסה.\n"
            "5. **יעדי מחיר (Price Targets)**: תן 2-3 יעדי מחיר.\n"
            "6. **רמות תמיכה והתנגדות מפתח**.\n"
            "7. **מומנטום ונפח מסחר**: האם הנפח תומך במגמה?\n\n"
            "כתוב את כל התשובה בעברית. היה ישיר ופרקטי."
        ),
        "extra_data": True,
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

    # Fetch technical data for Micha
    technical_context = ""
    if "micha" in req.analysts:
        try:
            ticker_obj = yf.Ticker(req.ticker)
            hist = ticker_obj.history(period="1y", interval="1d")
            if not hist.empty:
                close = hist["Close"].values
                # SMA 150
                sma_150 = float(np.nanmean(close[-150:])) if len(close) >= 150 else None
                sma_50 = float(np.nanmean(close[-50:])) if len(close) >= 50 else None
                sma_20 = float(np.nanmean(close[-20:])) if len(close) >= 20 else None
                current = float(close[-1])

                technical_context = "\nTechnical Data:\n"
                technical_context += f"  Current Price: ${current:.2f}\n"
                if sma_20:
                    technical_context += f"  SMA 20: ${sma_20:.2f} ({'above' if current > sma_20 else 'below'})\n"
                if sma_50:
                    technical_context += f"  SMA 50: ${sma_50:.2f} ({'above' if current > sma_50 else 'below'})\n"
                if sma_150:
                    diff_pct = ((current - sma_150) / sma_150) * 100
                    position = "above" if current > sma_150 else "below"
                    technical_context += f"  SMA 150: ${sma_150:.2f} ({position} by {abs(diff_pct):.1f}%)\n"

                # Recent price action (last 20 days)
                recent = close[-20:]
                high_20 = float(np.max(recent))
                low_20 = float(np.min(recent))
                technical_context += f"  20-Day High: ${high_20:.2f}\n"
                technical_context += f"  20-Day Low: ${low_20:.2f}\n"

                # Volume trend
                vol = hist["Volume"].values
                avg_vol_20 = float(np.nanmean(vol[-20:]))
                avg_vol_50 = float(np.nanmean(vol[-50:])) if len(vol) >= 50 else avg_vol_20
                technical_context += f"  Avg Volume 20D: {int(avg_vol_20):,}\n"
                technical_context += f"  Avg Volume 50D: {int(avg_vol_50):,}\n"
                vol_ratio = avg_vol_20 / avg_vol_50 if avg_vol_50 > 0 else 1
                technical_context += f"  Volume Trend: {'increasing' if vol_ratio > 1.1 else 'decreasing' if vol_ratio < 0.9 else 'stable'}\n"
        except Exception:
            pass

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    results = []

    for analyst_key in req.analysts:
        persona = ANALYST_PERSONAS.get(analyst_key)
        if not persona:
            continue

        ctx = data_context
        max_tokens = 512
        word_limit = "under 200 words"

        # Micha gets extra data and more room
        if analyst_key == "micha":
            ctx = data_context + technical_context
            max_tokens = 1024
            word_limit = "under 400 words"

        system = f"{persona['prompt']}\n\n{ctx}\n\nKeep your analysis concise ({word_limit}). Give a clear verdict: Buy, Hold, or Sell."

        response = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": f"Analyze {req.ticker.upper()} for me."}],
        )

        results.append({
            "analyst": persona["name"],
            "style": persona["style"],
            "analysis": response.content[0].text,
        })

    return results
