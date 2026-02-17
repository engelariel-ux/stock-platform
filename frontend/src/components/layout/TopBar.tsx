import { useState, useRef, useEffect } from 'react'
import { TrendingUp, Search, X } from 'lucide-react'
import { useTicker } from '../../context/TickerContext'
import { searchTicker, type SearchResult } from '../../services/api'

export default function TopBar() {
  const { selectedTicker, setSelectedTicker, watchlist, addToWatchlist } = useTicker()
  const ticker = watchlist.find((t) => t.symbol === selectedTicker)

  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
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
    setResults([])

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
        setResults(res)
        setError('')
      } catch {
        setResults([])
        setError(`No results for "${trimmed}"`)
      } finally {
        setSearching(false)
      }
    }, 400)
  }

  const selectResult = (symbol: string, name: string) => {
    if (!watchlist.some((t) => t.symbol === symbol)) {
      addToWatchlist(symbol, name)
    }
    setSelectedTicker(symbol)
    setQuery('')
    setShowDropdown(false)
    setResults([])
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
              if (e.key === 'Enter' && results.length > 0) selectResult(results[0].symbol, results[0].name)
              if (e.key === 'Escape') { setShowDropdown(false); setQuery('') }
            }}
            placeholder="Search ticker or company..."
            className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-56"
          />
          {query && (
            <button onClick={() => { setQuery(''); setShowDropdown(false); setResults([]) }}>
              <X className="h-3.5 w-3.5 text-gray-500 hover:text-gray-300" />
            </button>
          )}
        </div>

        {showDropdown && (
          <div className="absolute top-full mt-1 left-0 z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden w-80 max-h-72 overflow-y-auto">
            {searching && (
              <div className="px-3 py-2 text-xs text-gray-400">Searching...</div>
            )}
            {error && (
              <div className="px-3 py-2 text-xs text-red-400">{error}</div>
            )}
            {results.map((r) => {
              const inList = watchlist.some((t) => t.symbol === r.symbol)
              return (
                <button
                  key={r.symbol}
                  onClick={() => selectResult(r.symbol, r.name)}
                  className="flex items-center w-full px-3 py-2 hover:bg-gray-800 transition-colors border-b border-gray-800/50 last:border-0"
                >
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{r.symbol}</span>
                      <span className="text-[10px] text-gray-500 uppercase">{r.exchange}</span>
                    </div>
                    <span className="text-xs text-gray-400 truncate w-full text-left">{r.name}</span>
                  </div>
                  {inList ? (
                    <span className="ml-2 text-[10px] text-gray-600 shrink-0">In list</span>
                  ) : (
                    <span className="ml-2 text-[10px] text-yellow-400/70 shrink-0">+ Add</span>
                  )}
                </button>
              )
            })}
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
