import { useOverview } from '../../hooks/useFundamentals'

function fmt(n: number | null | undefined, prefix = '', suffix = '') {
  if (n == null) return 'N/A'
  if (Math.abs(n) >= 1e12) return `${prefix}${(n / 1e12).toFixed(2)}T${suffix}`
  if (Math.abs(n) >= 1e9) return `${prefix}${(n / 1e9).toFixed(2)}B${suffix}`
  if (Math.abs(n) >= 1e6) return `${prefix}${(n / 1e6).toFixed(2)}M${suffix}`
  return `${prefix}${n.toFixed(2)}${suffix}`
}

export default function CompanyOverview({ symbol }: { symbol: string }) {
  const { data, loading, error } = useOverview(symbol)

  if (loading) return <div className="animate-pulse h-48 bg-gray-800/50 rounded-lg" />
  if (error || !data) return <div className="text-red-400 p-4">Failed to load overview</div>

  const stats = [
    { label: 'Market Cap', value: fmt(data.marketCap, '$') },
    { label: 'P/E Ratio', value: data.pe?.toFixed(2) ?? 'N/A' },
    { label: 'Forward P/E', value: data.forwardPe?.toFixed(2) ?? 'N/A' },
    { label: 'EPS', value: data.eps != null ? `$${data.eps.toFixed(2)}` : 'N/A' },
    { label: 'Dividend Yield', value: data.dividendYield != null ? `${(data.dividendYield * 100).toFixed(2)}%` : 'N/A' },
    { label: 'Beta', value: data.beta?.toFixed(2) ?? 'N/A' },
    { label: '52W High', value: data.fiftyTwoWeekHigh != null ? `$${data.fiftyTwoWeekHigh.toFixed(2)}` : 'N/A' },
    { label: '52W Low', value: data.fiftyTwoWeekLow != null ? `$${data.fiftyTwoWeekLow.toFixed(2)}` : 'N/A' },
    { label: 'Avg Volume', value: fmt(data.avgVolume) },
  ]

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-5">
      <div className="flex items-baseline gap-3 mb-1">
        <h2 className="text-lg font-semibold text-white">{data.name}</h2>
        <span className="text-sm text-gray-400">{data.symbol}</span>
      </div>
      <div className="text-sm text-gray-400 mb-4">
        {data.sector} &middot; {data.industry}
      </div>
      {data.description && (
        <p className="text-sm text-gray-300 mb-4 line-clamp-3">{data.description}</p>
      )}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="text-xs text-gray-500">{s.label}</div>
            <div className="text-sm font-medium text-white">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
