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
    cache_key = f"search:{query.strip().upper()}"
    cached = cache.get(cache_key, ttl=300)
    if cached:
        return cached

    import requests

    # Use Yahoo Finance search API for fuzzy name/ticker matching
    url = "https://query2.finance.yahoo.com/v1/finance/search"
    params = {
        "q": query.strip(),
        "quotesCount": 8,
        "newsCount": 0,
        "listsCount": 0,
        "enableFuzzyQuery": True,
        "quotesQueryId": "tss_match_phrase_query",
    }
    headers = {"User-Agent": "Mozilla/5.0"}

    try:
        resp = requests.get(url, params=params, headers=headers, timeout=5)
        resp.raise_for_status()
        data = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Search service unavailable")

    quotes = data.get("quotes", [])
    if not quotes:
        raise HTTPException(status_code=404, detail=f"No results for '{query}'")

    results = []
    for q in quotes:
        # Only include equities, ETFs, crypto — skip futures, options, etc.
        qtype = q.get("quoteType", "")
        if qtype not in ("EQUITY", "ETF", "CRYPTOCURRENCY", "MUTUALFUND"):
            continue
        results.append({
            "symbol": q.get("symbol", ""),
            "name": q.get("shortname") or q.get("longname") or q.get("symbol", ""),
            "exchange": q.get("exchDisp") or q.get("exchange", ""),
            "type": qtype,
        })

    if not results:
        raise HTTPException(status_code=404, detail=f"No results for '{query}'")

    cache.set(cache_key, results)
    return results


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

    # Extended hours data
    market_state = info.get("marketState", "")
    ext_price = None
    ext_change = None
    ext_change_pct = None
    ext_label = None

    if market_state in ("PRE", "PREPRE") and info.get("preMarketPrice") is not None:
        ext_price = round(info["preMarketPrice"], 2)
        ext_change = round(info.get("preMarketChange", 0), 2)
        ext_change_pct = round(info.get("preMarketChangePercent", 0), 2)
        ext_label = "Pre-Market"
    elif market_state in ("POST", "POSTPOST", "CLOSED") and info.get("postMarketPrice") is not None:
        ext_price = round(info["postMarketPrice"], 2)
        ext_change = round(info.get("postMarketChange", 0), 2)
        ext_change_pct = round(info.get("postMarketChangePercent", 0), 2)
        ext_label = "After Hours" if market_state == "POST" else "Post-Market"

    result = {
        "symbol": symbol.upper(),
        "price": price,
        "change": change,
        "changePercent": change_pct,
        "high": info.get("regularMarketDayHigh", 0),
        "low": info.get("regularMarketDayLow", 0),
        "volume": info.get("regularMarketVolume", 0),
        "extPrice": ext_price,
        "extChange": ext_change,
        "extChangePercent": ext_change_pct,
        "extLabel": ext_label,
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
