from fastapi import APIRouter, HTTPException, Query
import yfinance as yf
import cache
import edgar

router = APIRouter()


@router.get("/fundamentals/{symbol}/overview")
def get_overview(symbol: str):
    cache_key = f"overview:{symbol.upper()}"
    cached = cache.get(cache_key, ttl=300)
    if cached:
        return cached

    ticker = yf.Ticker(symbol)
    info = ticker.info

    if not info or "regularMarketPrice" not in info:
        raise HTTPException(status_code=404, detail=f"No data for {symbol}")

    result = {
        "symbol": symbol.upper(),
        "name": info.get("shortName", ""),
        "sector": info.get("sector", "N/A"),
        "industry": info.get("industry", "N/A"),
        "description": info.get("longBusinessSummary", ""),
        "marketCap": info.get("marketCap", 0),
        "pe": info.get("trailingPE", None),
        "forwardPe": info.get("forwardPE", None),
        "eps": info.get("trailingEps", None),
        "dividendYield": info.get("dividendYield", None),
        "beta": info.get("beta", None),
        "fiftyTwoWeekHigh": info.get("fiftyTwoWeekHigh", None),
        "fiftyTwoWeekLow": info.get("fiftyTwoWeekLow", None),
        "avgVolume": info.get("averageVolume", 0),
        "price": info.get("regularMarketPrice", 0),
    }
    cache.set(cache_key, result)
    return result


@router.get("/fundamentals/{symbol}/financials")
def get_financials(
    symbol: str,
    statement: str = Query("income"),
    period: str = Query("annual"),
):
    ticker = yf.Ticker(symbol)

    try:
        if statement == "income":
            df = ticker.quarterly_financials if period == "quarterly" else ticker.financials
        elif statement == "balance":
            df = ticker.quarterly_balance_sheet if period == "quarterly" else ticker.balance_sheet
        elif statement == "cashflow":
            df = ticker.quarterly_cashflow if period == "quarterly" else ticker.cashflow
        else:
            raise HTTPException(status_code=400, detail="Invalid statement type")

        if df is None or df.empty:
            return {"columns": [], "rows": []}

        columns = [col.strftime("%Y-%m-%d") if hasattr(col, "strftime") else str(col) for col in df.columns]
        rows = []
        for idx, row in df.iterrows():
            label = str(idx)
            values = {}
            for col_name, val in zip(columns, row):
                if val is not None and str(val) != "nan":
                    values[col_name] = float(val)
                else:
                    values[col_name] = None
            rows.append({"label": label, "values": values})

        return {"columns": columns, "rows": rows}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/fundamentals/{symbol}/earnings")
def get_earnings(symbol: str):
    ticker = yf.Ticker(symbol)

    try:
        earnings = ticker.earnings_history
        if earnings is None or (hasattr(earnings, "empty") and earnings.empty):
            return []

        result = []
        for _, row in earnings.iterrows():
            result.append({
                "date": str(row.get("Earnings Date", "")),
                "epsActual": row.get("Reported EPS", None),
                "epsEstimate": row.get("EPS Estimate", None),
                "surprise": row.get("Surprise(%)", None),
            })
        return result
    except Exception:
        return []


@router.get("/fundamentals/{symbol}/sec-filings")
def get_sec_filings(symbol: str):
    cik = edgar.resolve_cik(symbol)
    if not cik:
        return {"filings": []}

    try:
        subs = edgar.get_submissions(cik)
    except Exception:
        return {"filings": []}

    if not subs:
        return {"filings": []}

    recent = subs.get("filings", {}).get("recent", {})
    if not recent:
        return {"filings": []}

    forms = recent.get("form", [])
    dates = recent.get("filingDate", [])
    descriptions = recent.get("primaryDocDescription", [])
    accessions = recent.get("accessionNumber", [])
    primary_docs = recent.get("primaryDocument", [])

    filings = []
    target_forms = {"10-K", "10-Q", "8-K", "10-K/A", "10-Q/A"}
    for i in range(min(len(forms), 100)):
        if forms[i] not in target_forms:
            continue
        acc_raw = accessions[i].replace("-", "")
        url = f"https://www.sec.gov/Archives/edgar/data/{cik}/{acc_raw}/{primary_docs[i]}"
        filings.append({
            "form": forms[i],
            "date": dates[i],
            "description": descriptions[i] if i < len(descriptions) else "",
            "url": url,
        })
        if len(filings) >= 20:
            break

    return {"filings": filings}


@router.get("/fundamentals/{symbol}/sec-financials")
def get_sec_financials(symbol: str, period: str = Query("annual")):
    cik = edgar.resolve_cik(symbol)
    if not cik:
        return {"columns": [], "rows": []}

    try:
        facts = edgar.get_company_facts(cik)
    except Exception:
        return {"columns": [], "rows": []}

    if not facts:
        return {"columns": [], "rows": []}

    return edgar.extract_financials(facts, period)


@router.get("/fundamentals/{symbol}/recommendations")
def get_recommendations(symbol: str):
    ticker = yf.Ticker(symbol)

    try:
        rec = ticker.recommendations
        if rec is None or rec.empty:
            return {"summary": {}, "recent": []}

        recent = rec.tail(10)
        recent_list = []
        for idx, row in recent.iterrows():
            recent_list.append({
                "date": idx.strftime("%Y-%m-%d") if hasattr(idx, "strftime") else str(idx),
                "firm": row.get("Firm", ""),
                "toGrade": row.get("To Grade", ""),
                "fromGrade": row.get("From Grade", ""),
                "action": row.get("Action", ""),
            })

        summary = {}
        if hasattr(ticker, "recommendations_summary") and ticker.recommendations_summary is not None:
            rs = ticker.recommendations_summary
            if not rs.empty:
                row = rs.iloc[0]
                summary = {
                    "strongBuy": int(row.get("strongBuy", 0)),
                    "buy": int(row.get("buy", 0)),
                    "hold": int(row.get("hold", 0)),
                    "sell": int(row.get("sell", 0)),
                    "strongSell": int(row.get("strongSell", 0)),
                }

        return {"summary": summary, "recent": recent_list}
    except Exception:
        return {"summary": {}, "recent": []}
