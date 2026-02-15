from fastapi import APIRouter, HTTPException
import yfinance as yf

router = APIRouter()


@router.get("/news/{symbol}")
def get_news(symbol: str):
    ticker = yf.Ticker(symbol)

    try:
        news = ticker.news
        if not news:
            return []

        result = []
        for item in news:
            content = item.get("content", {})
            thumbnail_url = ""
            thumb = content.get("thumbnail")
            if thumb and isinstance(thumb, dict):
                resolutions = thumb.get("resolutions", [])
                if resolutions:
                    thumbnail_url = resolutions[-1].get("url", "")

            result.append({
                "title": content.get("title", ""),
                "publisher": content.get("provider", {}).get("displayName", ""),
                "link": content.get("clickThroughUrl", {}).get("url", ""),
                "publishedAt": content.get("pubDate", ""),
                "thumbnail": thumbnail_url,
            })

        return result
    except Exception:
        return []
