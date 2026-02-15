import { useEarnings } from '../../hooks/useFundamentals'

export default function EarningsChart({ symbol }: { symbol: string }) {
  const { data, loading } = useEarnings(symbol)

  if (loading) return <div className="animate-pulse h-32 bg-gray-800/50 rounded-lg" />
  if (data.length === 0) return null

  const maxEps = Math.max(...data.map((d) => Math.max(Math.abs(d.epsActual ?? 0), Math.abs(d.epsEstimate ?? 0))))

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-5">
      <h3 className="text-sm font-semibold text-white mb-3">Earnings History</h3>
      <div className="flex items-end gap-3 overflow-x-auto pb-2">
        {data.slice(-8).map((entry, i) => {
          const actual = entry.epsActual ?? 0
          const estimate = entry.epsEstimate ?? 0
          const beat = actual >= estimate
          const barH = maxEps > 0 ? (Math.abs(actual) / maxEps) * 80 : 0
          const estH = maxEps > 0 ? (Math.abs(estimate) / maxEps) * 80 : 0

          return (
            <div key={i} className="flex flex-col items-center min-w-[60px]">
              <div className="flex items-end gap-1 h-20">
                <div
                  className="w-4 rounded-t"
                  style={{ height: `${estH}px`, background: '#6b7280' }}
                  title={`Est: $${estimate.toFixed(2)}`}
                />
                <div
                  className={`w-4 rounded-t ${beat ? 'bg-emerald-500' : 'bg-red-500'}`}
                  style={{ height: `${barH}px` }}
                  title={`Actual: $${actual.toFixed(2)}`}
                />
              </div>
              <div className="text-[10px] text-gray-500 mt-1 whitespace-nowrap">
                {entry.date.slice(0, 10)}
              </div>
              {entry.surprise != null && (
                <div className={`text-[10px] ${beat ? 'text-emerald-400' : 'text-red-400'}`}>
                  {entry.surprise > 0 ? '+' : ''}{entry.surprise.toFixed(1)}%
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="flex gap-4 mt-2 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 bg-gray-500 rounded" /> Estimate</span>
        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 bg-emerald-500 rounded" /> Beat</span>
        <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 bg-red-500 rounded" /> Miss</span>
      </div>
    </div>
  )
}
