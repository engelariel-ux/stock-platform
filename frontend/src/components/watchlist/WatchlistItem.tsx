import type { Ticker } from '../../types/market'

interface Props {
  ticker: Ticker
  active: boolean
  onClick: () => void
}

export default function WatchlistItem({ ticker, active, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${
        active
          ? 'bg-gray-800 ring-1 ring-emerald-500/40'
          : 'hover:bg-gray-800/60'
      }`}
    >
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-white">{ticker.symbol}</span>
        <span className="text-xs text-gray-500">{ticker.name}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-sm font-mono text-white">${ticker.price.toFixed(2)}</span>
        <span
          className={`text-xs font-mono ${
            ticker.change >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {ticker.change >= 0 ? '+' : ''}
          {ticker.changePercent.toFixed(2)}%
        </span>
      </div>
    </button>
  )
}
