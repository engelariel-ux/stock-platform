import json
import os
import threading
from pathlib import Path

import yfinance as yf
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

DATA_DIR = Path(__file__).parent.parent / "data"
PORTFOLIO_FILE = DATA_DIR / "portfolio.json"
_lock = threading.Lock()


class HoldingRequest(BaseModel):
    ticker: str
    shares: float
    buyPrice: float
    buyDate: str = ""


def _read_portfolio() -> dict:
    if not PORTFOLIO_FILE.exists():
        return {"holdings": []}
    with open(PORTFOLIO_FILE, "r") as f:
        return json.load(f)


def _write_portfolio(data: dict):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(PORTFOLIO_FILE, "w") as f:
        json.dump(data, f, indent=2)


def _enrich_with_prices(holdings: list) -> list:
    enriched = []
    for h in holdings:
        try:
            ticker = yf.Ticker(h["ticker"])
            info = ticker.info
            current_price = info.get("regularMarketPrice", 0)
            prev_close = info.get("regularMarketPreviousClose", current_price)
            daily_change = round(current_price - prev_close, 2) if prev_close else 0
            daily_change_pct = round((daily_change / prev_close) * 100, 2) if prev_close else 0
        except Exception:
            current_price = 0
            daily_change = 0
            daily_change_pct = 0

        value = round(h["shares"] * current_price, 2)
        cost = round(h["shares"] * h["buyPrice"], 2)
        gain = round(value - cost, 2)
        gain_pct = round((gain / cost) * 100, 2) if cost else 0

        enriched.append({
            **h,
            "currentPrice": current_price,
            "value": value,
            "cost": cost,
            "gain": gain,
            "gainPercent": gain_pct,
            "dailyChange": daily_change,
            "dailyChangePercent": daily_change_pct,
        })
    return enriched


@router.get("/portfolio")
def get_portfolio():
    portfolio = _read_portfolio()
    enriched = _enrich_with_prices(portfolio["holdings"])
    return {"holdings": enriched}


@router.get("/portfolio/summary")
def get_portfolio_summary():
    portfolio = _read_portfolio()
    enriched = _enrich_with_prices(portfolio["holdings"])

    total_value = sum(h["value"] for h in enriched)
    total_cost = sum(h["cost"] for h in enriched)
    total_gain = round(total_value - total_cost, 2)
    total_gain_pct = round((total_gain / total_cost) * 100, 2) if total_cost else 0
    daily_change = sum(h["dailyChange"] * h["shares"] for h in enriched)

    allocation = []
    for h in enriched:
        allocation.append({
            "ticker": h["ticker"],
            "value": h["value"],
            "percent": round((h["value"] / total_value) * 100, 2) if total_value else 0,
        })

    return {
        "totalValue": round(total_value, 2),
        "totalCost": round(total_cost, 2),
        "totalGain": total_gain,
        "totalGainPercent": total_gain_pct,
        "dailyChange": round(daily_change, 2),
        "allocation": allocation,
    }


@router.post("/portfolio/holdings")
def add_holding(req: HoldingRequest):
    with _lock:
        portfolio = _read_portfolio()
        existing = next((h for h in portfolio["holdings"] if h["ticker"] == req.ticker.upper()), None)
        if existing:
            raise HTTPException(status_code=400, detail=f"{req.ticker} already in portfolio. Use PUT to update.")

        portfolio["holdings"].append({
            "ticker": req.ticker.upper(),
            "shares": req.shares,
            "buyPrice": req.buyPrice,
            "buyDate": req.buyDate,
        })
        _write_portfolio(portfolio)
    return {"status": "ok"}


@router.put("/portfolio/holdings/{ticker}")
def update_holding(ticker: str, req: HoldingRequest):
    with _lock:
        portfolio = _read_portfolio()
        found = False
        for h in portfolio["holdings"]:
            if h["ticker"] == ticker.upper():
                h["shares"] = req.shares
                h["buyPrice"] = req.buyPrice
                h["buyDate"] = req.buyDate
                found = True
                break
        if not found:
            raise HTTPException(status_code=404, detail=f"{ticker} not found in portfolio")
        _write_portfolio(portfolio)
    return {"status": "ok"}


@router.delete("/portfolio/holdings/{ticker}")
def delete_holding(ticker: str):
    with _lock:
        portfolio = _read_portfolio()
        original_len = len(portfolio["holdings"])
        portfolio["holdings"] = [h for h in portfolio["holdings"] if h["ticker"] != ticker.upper()]
        if len(portfolio["holdings"]) == original_len:
            raise HTTPException(status_code=404, detail=f"{ticker} not found in portfolio")
        _write_portfolio(portfolio)
    return {"status": "ok"}
