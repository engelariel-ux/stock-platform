import { useState, useRef, useEffect } from 'react'
import { TrendingUp, Search, X } from 'lucide-react'
import { useTicker } from '../../context/TickerContext'
import { searchTicker } from '../../services/api'

export default function TopBar() {
  const { selectedTicker, setSelectedTicker, watchlist, addToWatchlist } = useTicker()
  const ticker = watchlist.find((t) => t.symbol === selectedTicker)

  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState<{ symbol: string; name: string; price: number } | null>(null)
  const [error, setError] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (value: string) => {
    setQuery(value)
    setError('')
    setResult(null)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = value.trim()
    if (!trimmed) {
      setShowDropdown(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      setShowDropdown(true)
      try {
        const res = await searchTicker(trimmed)
        setResult(res)
        setError('')
      } catch {
        setResult(null)
        setError(`No results for "${trimmed}"`)
      } finally {
        setSearching(false)
      }
    }, 400)
  }

  const selectResult = (symbol: string, name?: string) => {
    if (name && !watchlist.some((t) => t.symbol === symbol)) {
      addToWatchlist(symbol, name)
    }
    setSelectedTicker(symbol)
    setQuery('')
    setShowDropdown(false)
    setResult(null)
  }

  return (
    <header className="flex items-center justify-between border-b border-gray-800 bg-gray-950 px-6 py-3">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-6 w-6 text-yellow-400" />
        <h1 className="text-lg font-bold text-yellow-400">EngeluStocks</h1>
      </div>

      <div ref={dropdownRef} className="relative">
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5">
          <Search className="h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && result) selectResult(result.symbol, result.name)
              if (e.key === 'Escape') { setShowDropdown(false); setQuery('') }
            }}
            placeholder="Search ticker..."
            className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-48"
          />
          {query && (
            <button onClick={() => { setQuery(''); setShowDropdown(false); setResult(null) }}>
              <X className="h-3.5 w-3.5 text-gray-500 hover:text-gray-300" />
            </button>
          )}
        </div>

        {showDropdown && (
          <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
            {searching && (
              <div className="px-3 py-2 text-xs text-gray-400">Searching...</div>
            )}
            {error && (
              <div className="px-3 py-2 text-xs text-red-400">{error}</div>
            )}
            {result && !searching && (
              <button
                onClick={() => selectResult(result.symbol, result.name)}
                className="flex items-center justify-between w-full px-3 py-2 hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm font-semibold text-white">{result.symbol}</span>
                  <span className="text-xs text-gray-400 truncate">{result.name}</span>
                  <span className="text-xs text-gray-300 font-mono ml-auto">${result.price.toFixed(2)}</span>
                </div>
                {!watchlist.some((t) => t.symbol === result.symbol) ? (
                  <span className="ml-2 text-[10px] text-yellow-400/70">+ Add</span>
                ) : (
                  <span className="ml-2 text-[10px] text-gray-600">In list</span>
                )}
              </button>
            )}
          </div>
        )}
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
          {ticker.extPrice != null && ticker.extLabel && (
            <div className="flex items-center gap-2 ml-2 pl-3 border-l border-gray-700">
              <span className="text-[10px] font-semibold text-gray-500 uppercase">{ticker.extLabel}</span>
              <span className="text-sm font-mono text-gray-300">${ticker.extPrice.toFixed(2)}</span>
              <span
                className={`text-xs font-mono ${(ticker.extChange ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
              >
                {(ticker.extChange ?? 0) >= 0 ? '+' : ''}
                {(ticker.extChange ?? 0).toFixed(2)} ({(ticker.extChangePercent ?? 0).toFixed(2)}%)
              </span>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
