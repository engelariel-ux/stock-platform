import { useRecommendations } from '../../hooks/useFundamentals'

const COLORS: Record<string, string> = {
  strongBuy: '#10b981',
  buy: '#34d399',
  hold: '#f59e0b',
  sell: '#f87171',
  strongSell: '#ef4444',
}

const LABELS: Record<string, string> = {
  strongBuy: 'Strong Buy',
  buy: 'Buy',
  hold: 'Hold',
  sell: 'Sell',
  strongSell: 'Strong Sell',
}

export default function AnalystRatings({ symbol }: { symbol: string }) {
  const { data, loading } = useRecommendations(symbol)

  if (loading) return <div className="animate-pulse h-24 bg-gray-800/50 rounded-lg" />
  if (!data || !data.summary || Object.keys(data.summary).length === 0) return null

  const s = data.summary
  const total = s.strongBuy + s.buy + s.hold + s.sell + s.strongSell
  if (total === 0) return null

  const segments = [
    { key: 'strongBuy', count: s.strongBuy },
    { key: 'buy', count: s.buy },
    { key: 'hold', count: s.hold },
    { key: 'sell', count: s.sell },
    { key: 'strongSell', count: s.strongSell },
  ]

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-5">
      <h3 className="text-sm font-semibold text-white mb-3">Analyst Ratings</h3>
      <div className="flex rounded-full overflow-hidden h-6 mb-3">
        {segments.map(({ key, count }) =>
          count > 0 ? (
            <div
              key={key}
              className="flex items-center justify-center text-[10px] font-bold text-gray-900"
              style={{ width: `${(count / total) * 100}%`, background: COLORS[key] }}
            >
              {count}
            </div>
          ) : null,
        )}
      </div>
      <div className="flex justify-between text-[10px] text-gray-400">
        {segments.map(({ key, count }) => (
          <div key={key} className="text-center">
            <div style={{ color: COLORS[key] }}>{count}</div>
            <div>{LABELS[key]}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
