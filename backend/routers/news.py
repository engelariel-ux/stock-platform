import logging
from fastapi import APIRouter
import yfinance as yf
import cache

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/news/{symbol}")
def get_news(symbol: str):
    cache_key = f"news:{symbol.upper()}"
    cached = cache.get(cache_key, ttl=1800)
    if cached is not None:
        return cached

    ticker = yf.Ticker(symbol)

    try:
        news = ticker.news
        if not news:
            logger.info(f"No news returned by yfinance for {symbol}")
            cache.set(cache_key, [])
            return []

        result = []
        for item in news:
            try:
                content = item.get("content") or {}
                title = content.get("title", "")
                if not title:
                    continue

                thumbnail_url = ""
                thumb = content.get("thumbnail")
                if thumb and isinstance(thumb, dict):
                    resolutions = thumb.get("resolutions") or []
                    if resolutions:
                        thumbnail_url = resolutions[-1].get("url", "")

                provider = content.get("provider") or {}
                click_through = content.get("clickThroughUrl") or {}

                result.append({
                    "title": title,
                    "publisher": provider.get("displayName", "Unknown"),
                    "link": click_through.get("url", ""),
                    "publishedAt": content.get("pubDate", ""),
                    "thumbnail": thumbnail_url,
                })
            except Exception:
                continue

        cache.set(cache_key, result)
        return result
    except Exception as e:
        logger.warning(f"Failed to fetch news for {symbol}: {e}")
        cache.set(cache_key, [])
        return []
