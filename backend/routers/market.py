from fastapi import APIRouter, HTTPException, Query
import yfinance as yf

router = APIRouter()

RANGE_MAP = {
    "1M": "1mo",
    "3M": "3mo",
    "6M": "6mo",
    "1Y": "1y",
}


@router.get("/quote/{symbol}")
def get_quote(symbol: str):
    ticker = yf.Ticker(symbol)
    info = ticker.info

    if not info or "regularMarketPrice" not in info:
        raise HTTPException(status_code=404, detail=f"No data found for {symbol}")

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


@router.get("/ohlc/{symbol}")
def get_ohlc(symbol: str, range: str = Query("1M")):
    period = RANGE_MAP.get(range, "1mo")
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period=period)

    if hist.empty:
        raise HTTPException(status_code=404, detail=f"No OHLC data for {symbol}")

    bars = []
    for date, row in hist.iterrows():
        bars.append({
            "time": date.strftime("%Y-%m-%d"),
            "open": round(row["Open"], 2),
            "high": round(row["High"], 2),
            "low": round(row["Low"], 2),
            "close": round(row["Close"], 2),
            "volume": int(row["Volume"]),
        })

    return bars
