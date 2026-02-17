import os
import uuid
import time
import datetime
import logging

import anthropic
import numpy as np
import yfinance as yf

logger = logging.getLogger(__name__)
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


def _fetch_chart_data(symbol: str) -> str:
    """Fetch historical OHLC data and technical indicators for chart pattern analysis."""
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="1y", interval="1d")
        if hist.empty:
            return ""

        close = hist["Close"].values
        high = hist["High"].values
        low = hist["Low"].values
        volume = hist["Volume"].values

        # --- Technical Indicators ---
        lines = ["\nChart & Technical Analysis Data:"]

        # SMAs
        for period in [20, 50, 150]:
            if len(close) >= period:
                sma = float(np.nanmean(close[-period:]))
                pos = "above" if close[-1] > sma else "below"
                diff = ((close[-1] - sma) / sma) * 100
                lines.append(f"  SMA {period}: ${sma:.2f} ({pos} by {abs(diff):.1f}%)")

        # RSI (14-period)
        if len(close) >= 15:
            deltas = np.diff(close[-15:])
            gains = np.where(deltas > 0, deltas, 0)
            losses = np.where(deltas < 0, -deltas, 0)
            avg_gain = np.mean(gains)
            avg_loss = np.mean(losses)
            if avg_loss > 0:
                rs = avg_gain / avg_loss
                rsi = 100 - (100 / (1 + rs))
            else:
                rsi = 100
            lines.append(f"  RSI (14): {rsi:.1f}")

        # 52-week and 20-day ranges
        if len(close) >= 252:
            lines.append(f"  52W High: ${float(np.max(high[-252:])):.2f}")
            lines.append(f"  52W Low: ${float(np.min(low[-252:])):.2f}")
        high_20 = float(np.max(high[-20:]))
        low_20 = float(np.min(low[-20:]))
        lines.append(f"  20-Day High: ${high_20:.2f}")
        lines.append(f"  20-Day Low: ${low_20:.2f}")

        # Volume trend
        avg_vol_20 = float(np.nanmean(volume[-20:]))
        avg_vol_50 = float(np.nanmean(volume[-50:])) if len(volume) >= 50 else avg_vol_20
        vol_ratio = avg_vol_20 / avg_vol_50 if avg_vol_50 > 0 else 1
        lines.append(f"  Avg Volume 20D: {int(avg_vol_20):,}")
        lines.append(f"  Volume Trend: {'increasing' if vol_ratio > 1.1 else 'decreasing' if vol_ratio < 0.9 else 'stable'}")

        # --- Weekly OHLC summary (last 6 months ~ 26 weeks) for pattern recognition ---
        lines.append("\nWeekly OHLC (last 6 months):")
        weekly = ticker.history(period="6mo", interval="1wk")
        if not weekly.empty:
            for date, row in weekly.iterrows():
                d = date.strftime("%Y-%m-%d")
                lines.append(
                    f"  {d}: O={row['Open']:.2f} H={row['High']:.2f} "
                    f"L={row['Low']:.2f} C={row['Close']:.2f} V={int(row['Volume']):,}"
                )

        # --- Daily OHLC (last 30 days) for recent patterns ---
        lines.append("\nDaily OHLC (last 30 trading days):")
        recent = hist.tail(30)
        for date, row in recent.iterrows():
            d = date.strftime("%Y-%m-%d")
            lines.append(
                f"  {d}: O={row['Open']:.2f} H={row['High']:.2f} "
                f"L={row['Low']:.2f} C={row['Close']:.2f} V={int(row['Volume']):,}"
            )

        return "\n".join(lines)
    except Exception as e:
        logger.error(f"Error fetching chart data for {symbol}: {e}")
        return ""


def _fetch_quote(symbol: str) -> dict:
    ticker = yf.Ticker(symbol)
    info = ticker.info

    if not info or "regularMarketPrice" not in info:
        return {}

    price = info.get("regularMarketPrice", 0)
    prev_close = info.get("regularMarketPreviousClose", price)
    change = round(price - prev_close, 2)
    change_pct = round((change / prev_close) * 100, 2) if prev_close else 0

    result = {
        "symbol": symbol.upper(),
        "price": price,
        "change": change,
        "changePercent": change_pct,
        "high": info.get("regularMarketDayHigh", 0),
        "low": info.get("regularMarketDayLow", 0),
        "volume": info.get("regularMarketVolume", 0),
    }

    # Pre-market data from info (available during pre-market session)
    pre_price = info.get("preMarketPrice")
    if pre_price:
        pre_change = info.get("preMarketChange", 0)
        pre_change_pct = info.get("preMarketChangePercent", 0)
        result["preMarketPrice"] = pre_price
        result["preMarketChange"] = round(pre_change, 2) if pre_change else 0
        result["preMarketChangePercent"] = round(pre_change_pct * 100, 2) if pre_change_pct else 0

    # Post-market data from info (available during post-market session)
    post_price = info.get("postMarketPrice")
    if post_price:
        post_change = info.get("postMarketChange", 0)
        post_change_pct = info.get("postMarketChangePercent", 0)
        result["postMarketPrice"] = post_price
        result["postMarketChange"] = round(post_change, 2) if post_change else 0
        result["postMarketChangePercent"] = round(post_change_pct * 100, 2) if post_change_pct else 0

    # Fallback: fetch extended hours data from intraday history if info didn't have it
    if "preMarketPrice" not in result or "postMarketPrice" not in result:
        try:
            ext_hist = ticker.history(period="5d", interval="1m", prepost=True)
            if not ext_hist.empty:
                ext_hist.index = ext_hist.index.tz_localize(None) if ext_hist.index.tz is None else ext_hist.index.tz_convert("America/New_York")
                today = ext_hist.index[-1].date()
                today_data = ext_hist[ext_hist.index.date == today]

                if not today_data.empty:
                    # Pre-market: 4:00 AM - 9:30 AM ET
                    pre_market = today_data.between_time("04:00", "09:29")
                    if not pre_market.empty and "preMarketPrice" not in result:
                        pm_last = float(pre_market["Close"].iloc[-1])
                        pm_high = float(pre_market["High"].max())
                        pm_low = float(pre_market["Low"].min())
                        pm_vol = int(pre_market["Volume"].sum())
                        pm_change = round(pm_last - prev_close, 2)
                        pm_change_pct = round((pm_change / prev_close) * 100, 2) if prev_close else 0
                        result["preMarketPrice"] = pm_last
                        result["preMarketChange"] = pm_change
                        result["preMarketChangePercent"] = pm_change_pct
                        result["preMarketHigh"] = pm_high
                        result["preMarketLow"] = pm_low
                        result["preMarketVolume"] = pm_vol

                    # Post-market: 4:00 PM - 8:00 PM ET
                    post_market = today_data.between_time("16:00", "19:59")
                    if not post_market.empty and "postMarketPrice" not in result:
                        am_last = float(post_market["Close"].iloc[-1])
                        am_change = round(am_last - price, 2)
                        am_change_pct = round((am_change / price) * 100, 2) if price else 0
                        result["postMarketPrice"] = am_last
                        result["postMarketChange"] = am_change
                        result["postMarketChangePercent"] = am_change_pct
                        result["postMarketVolume"] = int(post_market["Volume"].sum())
        except Exception as e:
            logger.debug(f"Extended hours fetch for {symbol}: {e}")

    return result


def _format_quote_context(quote: dict, ticker_symbol: str) -> str:
    if not quote:
        return f"Could not fetch live data for {ticker_symbol.upper()}."

    lines = [
        f"Live quote for {quote['symbol']}:",
        f"  Price: ${quote['price']}",
        f"  Change: {quote['change']} ({quote['changePercent']}%)",
        f"  Day High: ${quote['high']}",
        f"  Day Low: ${quote['low']}",
        f"  Volume: {quote['volume']:,}",
    ]

    if "preMarketPrice" in quote:
        lines.append(
            f"  Pre-Market Price: ${quote['preMarketPrice']} "
            f"({quote['preMarketChange']:+.2f}, {quote['preMarketChangePercent']:+.2f}%)"
        )
        if "preMarketHigh" in quote:
            lines.append(f"  Pre-Market High: ${quote['preMarketHigh']:.2f}")
            lines.append(f"  Pre-Market Low: ${quote['preMarketLow']:.2f}")
            lines.append(f"  Pre-Market Volume: {quote['preMarketVolume']:,}")

    if "postMarketPrice" in quote:
        lines.append(
            f"  Post-Market Price: ${quote['postMarketPrice']} "
            f"({quote['postMarketChange']:+.2f}, {quote['postMarketChangePercent']:+.2f}%)"
        )
        if "postMarketVolume" in quote:
            lines.append(f"  Post-Market Volume: {quote['postMarketVolume']:,}")

    return "\n".join(lines)


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
    "You provide concise, insightful analysis of stocks based on the market data and chart data provided. "
    "You have access to real-time market data including regular hours, pre-market, and post-market prices "
    "when available. You also have historical OHLC price data, technical indicators, and can identify chart "
    "patterns such as Cup and Handle, Head and Shoulders, Double Top/Bottom, Bull/Bear Flags, Triangles, "
    "Wedges, Breakouts, and more. Analyze the price action data to answer questions about patterns and trends. "
    "When pre-market or post-market data is included in the market data below, use it to answer questions "
    "about extended hours trading. "
    "Be helpful, professional, and data-driven. Keep responses focused and under 300 words. "
    "Reply in the same language the user writes in — if they write in Hebrew, respond in Hebrew; "
    "if they write in English, respond in English."
)


@router.post("/agent/ask")
def ask_agent(req: AskRequest):
    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY is not configured")

    quote = _fetch_quote(req.ticker)
    quote_context = _format_quote_context(quote, req.ticker)

    chart_data = _fetch_chart_data(req.ticker)
    logger.info(f"Chart data for {req.ticker}: {len(chart_data)} chars")

    system = f"{SYSTEM_PROMPT}\n\nCurrent market data:\n{quote_context}{chart_data}"

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    response = client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=2048,
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
    quote_context = _format_quote_context(quote, req.ticker)

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
