import { useEffect, useState } from 'react'
import type { NewsArticle } from '../types/news'
import { getNews } from '../services/api'

export function useNews(symbol: string) {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getNews(symbol)
      .then((d) => { if (!cancelled) setArticles(d) })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [symbol])

  return { articles, loading, error }
}
