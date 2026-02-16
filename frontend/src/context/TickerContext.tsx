import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Ticker } from '../types/market'
import { getQuote } from '../services/api'

export type TabId = 'chart' | 'fundamentals' | 'news' | 'portfolio' | 'analysis'

const DEFAULT_WATCHLIST: Ticker[] = [
  { symbol: 'SPY', name: 'S&P 500 ETF', price: 0, change: 0, changePercent: 0 },
  { symbol: 'QQQ', name: 'Nasdaq 100 ETF', price: 0, change: 0, changePercent: 0 },
  { symbol: 'XLE', name: 'Energy Select Sector', price: 0, change: 0, changePercent: 0 },
  { symbol: 'VRT', name: 'Vertiv Holdings', price: 0, change: 0, changePercent: 0 },
  { symbol: 'ANET', name: 'Arista Networks', price: 0, change: 0, changePercent: 0 },
  { symbol: 'MAGS', name: 'Roundhill Mag 7 ETF', price: 0, change: 0, changePercent: 0 },
  { symbol: 'BTC-USD', name: 'Bitcoin USD', price: 0, change: 0, changePercent: 0 },
]

const STORAGE_KEY = 'engelustocks_watchlist'

function loadWatchlist(): Ticker[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Ticker[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch { /* ignore */ }
  return DEFAULT_WATCHLIST
}

function saveWatchlist(list: Ticker[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

interface TickerContextType {
  selectedTicker: string
  setSelectedTicker: (ticker: string) => void
  watchlist: Ticker[]
  addToWatchlist: (symbol: string, name: string) => void
  removeFromWatchlist: (symbol: string) => void
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
  chartRange: string
  setChartRange: (range: string) => void
}

const TickerContext = createContext<TickerContextType | null>(null)

export function TickerProvider({ children }: { children: ReactNode }) {
  const [selectedTicker, setSelectedTicker] = useState('SPY')
  const [watchlist, setWatchlist] = useState<Ticker[]>(loadWatchlist)
  const [activeTab, setActiveTab] = useState<TabId>('chart')
  const [chartRange, setChartRange] = useState('1M')

  const addToWatchlist = useCallback((symbol: string, name: string) => {
    setWatchlist((prev) => {
      if (prev.some((t) => t.symbol === symbol)) return prev
      const updated = [...prev, { symbol, name, price: 0, change: 0, changePercent: 0 }]
      saveWatchlist(updated)
      return updated
    })
    // Fetch quote for the new ticker
    getQuote(symbol).then((q) => {
      setWatchlist((prev) => {
        const updated = prev.map((t) =>
          t.symbol === symbol ? { ...t, price: q.price, change: q.change, changePercent: q.changePercent } : t
        )
        saveWatchlist(updated)
        return updated
      })
    }).catch(() => {})
  }, [])

  const removeFromWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) => {
      const updated = prev.filter((t) => t.symbol !== symbol)
      saveWatchlist(updated)
      return updated
    })
    // If removing the selected ticker, switch to first remaining
    setSelectedTicker((current) => {
      if (current === symbol) {
        const remaining = watchlist.filter((t) => t.symbol !== symbol)
        return remaining.length > 0 ? remaining[0].symbol : 'SPY'
      }
      return current
    })
  }, [watchlist])

  const refreshQuotes = useCallback(async () => {
    const updated = await Promise.all(
      watchlist.map(async (t) => {
        try {
          const q = await getQuote(t.symbol)
          return {
            ...t, price: q.price, change: q.change, changePercent: q.changePercent,
            extPrice: q.extPrice, extChange: q.extChange, extChangePercent: q.extChangePercent, extLabel: q.extLabel,
          }
        } catch {
          return t
        }
      }),
    )
    setWatchlist(updated)
    saveWatchlist(updated)
  }, [watchlist])

  useEffect(() => {
    refreshQuotes()
    const id = setInterval(refreshQuotes, 60_000)
    return () => clearInterval(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <TickerContext.Provider value={{
      selectedTicker, setSelectedTicker, watchlist,
      addToWatchlist, removeFromWatchlist,
      activeTab, setActiveTab,
      chartRange, setChartRange,
    }}>
      {children}
    </TickerContext.Provider>
  )
}

export function useTicker() {
  const ctx = useContext(TickerContext)
  if (!ctx) throw new Error('useTicker must be used within TickerProvider')
  return ctx
}
