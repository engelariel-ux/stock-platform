import { useTicker } from '../../context/TickerContext'
import { useNews } from '../../hooks/useNews'
import NewsCard from './NewsCard'

export default function NewsPanel() {
  const { selectedTicker } = useTicker()
  const { articles, loading, error } = useNews(selectedTicker)

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse h-24 bg-gray-800/50 rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="flex-1 p-6 text-red-400">Failed to load news</div>
  }

  if (articles.length === 0) {
    return <div className="flex-1 p-6 text-gray-500">No news available for {selectedTicker}</div>
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-3">
      <h2 className="text-lg font-semibold text-white mb-2">News for {selectedTicker}</h2>
      {articles.map((article, i) => (
        <NewsCard key={i} article={article} />
      ))}
    </div>
  )
}
