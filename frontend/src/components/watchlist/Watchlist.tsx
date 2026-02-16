import { Eye } from 'lucide-react'
import { useTicker } from '../../context/TickerContext'
import WatchlistItem from './WatchlistItem'

export default function Watchlist() {
  const { watchlist, selectedTicker, setSelectedTicker, removeFromWatchlist } = useTicker()

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-800 bg-gray-950">
      <div className="flex items-center gap-2 border-b border-gray-800 px-4 py-3">
        <Eye className="h-4 w-4 text-gray-400" />
        <h2 className="text-sm font-semibold text-gray-300">Watchlist</h2>
        <span className="ml-auto text-xs text-gray-600">{watchlist.length}</span>
      </div>
      <div className="flex flex-col gap-1 overflow-y-auto p-2">
        {watchlist.map((t) => (
          <WatchlistItem
            key={t.symbol}
            ticker={t}
            active={t.symbol === selectedTicker}
            onClick={() => setSelectedTicker(t.symbol)}
            onRemove={() => removeFromWatchlist(t.symbol)}
          />
        ))}
        {watchlist.length === 0 && (
          <div className="px-3 py-6 text-center text-xs text-gray-500">
            Search for tickers in the top bar to add them to your watchlist
          </div>
        )}
      </div>
    </aside>
  )
}
