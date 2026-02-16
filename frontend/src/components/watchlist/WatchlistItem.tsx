import { X } from 'lucide-react'
import type { Ticker } from '../../types/market'

interface Props {
  ticker: Ticker
  active: boolean
  onClick: () => void
  onRemove: () => void
}

export default function WatchlistItem({ ticker, active, onClick, onRemove }: Props) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${
        active
          ? 'bg-gray-800 ring-1 ring-emerald-500/40'
          : 'hover:bg-gray-800/60'
      }`}
    >
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-white">{ticker.symbol}</span>
        <span className="text-xs text-gray-500">{ticker.name}</span>
      </div>
      <div className="flex items-center gap-2">
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
        <span
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="hidden group-hover:flex items-center justify-center h-5 w-5 rounded text-gray-500 hover:text-red-400 hover:bg-gray-700 transition-colors cursor-pointer"
        >
          <X className="h-3 w-3" />
        </span>
      </div>
    </button>
  )
}
