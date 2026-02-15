import { useSecFilings } from '../../hooks/useFundamentals'

const badgeColors: Record<string, string> = {
  '10-K': 'bg-yellow-400/20 text-yellow-400',
  '10-K/A': 'bg-yellow-400/20 text-yellow-400',
  '10-Q': 'bg-blue-400/20 text-blue-400',
  '10-Q/A': 'bg-blue-400/20 text-blue-400',
  '8-K': 'bg-gray-600/30 text-gray-400',
}

export default function SecFilings({ symbol }: { symbol: string }) {
  const { data, loading } = useSecFilings(symbol)

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-5">
      <h3 className="text-sm font-semibold text-white mb-3">SEC Filings</h3>

      {loading ? (
        <div className="animate-pulse h-32 bg-gray-800/50 rounded" />
      ) : data.length === 0 ? (
        <div className="text-sm text-gray-500 py-4">No SEC filings available</div>
      ) : (
        <div className="space-y-1.5 max-h-72 overflow-y-auto">
          {data.map((f, i) => (
            <a
              key={i}
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-800/50 transition-colors group"
            >
              <span className={`px-2 py-0.5 text-xs font-semibold rounded ${badgeColors[f.form] || 'bg-gray-600/30 text-gray-400'}`}>
                {f.form}
              </span>
              <span className="text-xs text-gray-500 w-20 shrink-0">{f.date}</span>
              <span className="text-xs text-gray-300 truncate group-hover:text-white transition-colors">
                {f.description || f.form}
              </span>
              <svg className="w-3 h-3 text-gray-600 group-hover:text-gray-400 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
