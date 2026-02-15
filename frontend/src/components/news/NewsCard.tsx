import type { NewsArticle } from '../../types/news'
import { ExternalLink } from 'lucide-react'

function timeAgo(dateStr: string) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <a
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-4 p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors group"
    >
      {article.thumbnail && (
        <img
          src={article.thumbnail}
          alt=""
          className="w-24 h-18 object-cover rounded flex-shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      )}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-200 group-hover:text-white line-clamp-2 mb-1">
          {article.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {article.publisher && <span>{article.publisher}</span>}
          {article.publishedAt && <span>{timeAgo(article.publishedAt)}</span>}
          <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </a>
  )
}
