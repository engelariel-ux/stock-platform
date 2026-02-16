from fastapi import APIRouter, HTTPException, Query
import yfinance as yf
import cache

router = APIRouter()

RANGE_MAP = {
    "1D": ("1d", "5m"),
    "1W": ("5d", "15m"),
    "1M": ("1mo", "1d"),
    "3M": ("3mo", "1d"),
    "6M": ("6mo", "1d"),
    "1Y": ("1y", "1d"),
    "5Y": ("5y", "1wk"),
    "MAX": ("max", "1mo"),
}


@router.get("/search/{query}")
def search_ticker(query: str):
    cache_key = f"search:{query.upper()}"
    cached = cache.get(cache_key, ttl=300)
    if cached:
        return cached

    ticker = yf.Ticker(query)
    info = ticker.info

    if not info or info.get("regularMarketPrice") is None:
        raise HTTPException(status_code=404, detail=f"No ticker found for '{query}'")

    result = {
        "symbol": info.get("symbol", query.upper()),
        "name": info.get("shortName") or info.get("longName") or query.upper(),
        "price": info.get("regularMarketPrice", 0),
        "exchange": info.get("exchange", ""),
    }
    cache.set(cache_key, result)
    return result


@router.get("/quote/{symbol}")
def get_quote(symbol: str):
    cache_key = f"quote:{symbol.upper()}"
    cached = cache.get(cache_key, ttl=60)
    if cached:
        return cached

    ticker = yf.Ticker(symbol)
    info = ticker.info

    if not info or "regularMarketPrice" not in info:
        raise HTTPException(status_code=404, detail=f"No data found for {symbol}")

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
    cache.set(cache_key, result)
    return result


@router.get("/ohlc/{symbol}")
def get_ohlc(symbol: str, range: str = Query("1M")):
    cache_key = f"ohlc:{symbol.upper()}:{range}"
    cached = cache.get(cache_key, ttl=120)
    if cached:
        return cached

    period, interval = RANGE_MAP.get(range, ("1mo", "1d"))
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period=period, interval=interval)

    if hist.empty:
        raise HTTPException(status_code=404, detail=f"No OHLC data for {symbol}")

    bars = []
    is_intraday = interval in ("5m", "15m", "30m", "1h")
    for date, row in hist.iterrows():
        if is_intraday:
            time_str = int(date.timestamp())
        else:
            time_str = date.strftime("%Y-%m-%d")
        bars.append({
            "time": time_str,
            "open": round(row["Open"], 2),
            "high": round(row["High"], 2),
            "low": round(row["Low"], 2),
            "close": round(row["Close"], 2),
            "volume": int(row["Volume"]),
        })

    result = {"bars": bars, "interval": interval}
    cache.set(cache_key, result)
    return result
