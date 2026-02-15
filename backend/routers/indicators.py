import numpy as np
from fastapi import APIRouter, HTTPException, Query
import yfinance as yf

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


def _time_str(date, is_intraday):
    if is_intraday:
        return int(date.timestamp())
    return date.strftime("%Y-%m-%d")


def _sma(close, period):
    return close.rolling(window=period).mean()


def _ema(close, period):
    return close.ewm(span=period, adjust=False).mean()


def _rsi(close, period=14):
    delta = close.diff()
    gain = delta.where(delta > 0, 0.0)
    loss = (-delta).where(delta < 0, 0.0)
    avg_gain = gain.rolling(window=period).mean()
    avg_loss = loss.rolling(window=period).mean()
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))


def _macd(close, fast=12, slow=26, signal=9):
    ema_fast = close.ewm(span=fast, adjust=False).mean()
    ema_slow = close.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line
    return macd_line, signal_line, histogram


def _bbands(close, period=20, std_dev=2):
    sma = close.rolling(window=period).mean()
    std = close.rolling(window=period).std()
    upper = sma + std_dev * std
    lower = sma - std_dev * std
    return upper, sma, lower


def _vwap(high, low, close, volume):
    typical = (high + low + close) / 3
    cum_tp_vol = (typical * volume).cumsum()
    cum_vol = volume.cumsum()
    return cum_tp_vol / cum_vol


def _stochastic(high, low, close, k_period=14, d_period=3):
    lowest_low = low.rolling(window=k_period).min()
    highest_high = high.rolling(window=k_period).max()
    k = 100 * (close - lowest_low) / (highest_high - lowest_low)
    d = k.rolling(window=d_period).mean()
    return k, d


@router.get("/indicators/{symbol}")
def get_indicators(
    symbol: str,
    range: str = Query("1M"),
    indicators: str = Query("sma_20,rsi,macd"),
):
    period, interval = RANGE_MAP.get(range, ("1mo", "1d"))
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period=period, interval=interval)

    if hist.empty:
        raise HTTPException(status_code=404, detail=f"No data for {symbol}")

    is_intraday = interval in ("5m", "15m", "30m", "1h")
    close = hist["Close"]
    high = hist["High"]
    low = hist["Low"]
    volume = hist["Volume"]
    dates = hist.index

    requested = [i.strip() for i in indicators.split(",")]
    result = {}

    for ind in requested:
        if ind.startswith("sma_"):
            p = int(ind.split("_")[1])
            vals = _sma(close, p)
            result[ind] = [
                {"time": _time_str(d, is_intraday), "value": round(v, 2)}
                for d, v in zip(dates, vals) if not np.isnan(v)
            ]
        elif ind.startswith("ema_"):
            p = int(ind.split("_")[1])
            vals = _ema(close, p)
            result[ind] = [
                {"time": _time_str(d, is_intraday), "value": round(v, 2)}
                for d, v in zip(dates, vals) if not np.isnan(v)
            ]
        elif ind == "rsi":
            vals = _rsi(close)
            result["rsi"] = [
                {"time": _time_str(d, is_intraday), "value": round(v, 2)}
                for d, v in zip(dates, vals) if not np.isnan(v)
            ]
        elif ind == "macd":
            macd_line, signal_line, histogram = _macd(close)
            result["macd"] = [
                {
                    "time": _time_str(d, is_intraday),
                    "macd": round(m, 4),
                    "signal": round(s, 4),
                    "histogram": round(h, 4),
                }
                for d, m, s, h in zip(dates, macd_line, signal_line, histogram)
                if not (np.isnan(m) or np.isnan(s) or np.isnan(h))
            ]
        elif ind == "bbands":
            upper, middle, lower = _bbands(close)
            result["bbands"] = [
                {
                    "time": _time_str(d, is_intraday),
                    "upper": round(u, 2),
                    "middle": round(mi, 2),
                    "lower": round(lo, 2),
                }
                for d, u, mi, lo in zip(dates, upper, middle, lower)
                if not (np.isnan(u) or np.isnan(mi) or np.isnan(lo))
            ]
        elif ind == "vwap":
            vals = _vwap(high, low, close, volume)
            result["vwap"] = [
                {"time": _time_str(d, is_intraday), "value": round(v, 2)}
                for d, v in zip(dates, vals) if not np.isnan(v)
            ]
        elif ind == "stoch":
            k, d_line = _stochastic(high, low, close)
            result["stoch"] = [
                {
                    "time": _time_str(dt, is_intraday),
                    "k": round(kv, 2),
                    "d": round(dv, 2),
                }
                for dt, kv, dv in zip(dates, k, d_line)
                if not (np.isnan(kv) or np.isnan(dv))
            ]

    return result
