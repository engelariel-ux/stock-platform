import { TrendingUp } from 'lucide-react'
import { useTicker } from '../../context/TickerContext'

export default function TopBar() {
  const { selectedTicker, watchlist } = useTicker()
  const ticker = watchlist.find((t) => t.symbol === selectedTicker)

  return (
    <header className="flex items-center justify-between border-b border-gray-800 bg-gray-950 px-6 py-3">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-6 w-6 text-yellow-400" />
        <h1 className="text-lg font-bold text-yellow-400">EngeluStocks</h1>
      </div>

      {ticker && (
        <div className="flex items-center gap-4">
          <span className="text-lg font-semibold text-white">{ticker.symbol}</span>
          <span className="text-sm text-gray-400">{ticker.name}</span>
          <span className="text-lg font-mono text-white">${ticker.price.toFixed(2)}</span>
          <span
            className={`text-sm font-mono ${ticker.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
          >
            {ticker.change >= 0 ? '+' : ''}
            {ticker.change.toFixed(2)} ({ticker.changePercent.toFixed(2)}%)
          </span>
        </div>
      )}
    </header>
  )
}
