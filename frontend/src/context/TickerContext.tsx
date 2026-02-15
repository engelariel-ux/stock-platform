import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Ticker } from '../types/market'
import { getQuote } from '../services/api'

const DEFAULT_WATCHLIST: Ticker[] = [
  { symbol: 'GLXY', name: 'Galaxy Digital', price: 0, change: 0, changePercent: 0 },
  { symbol: 'HOOD', name: 'Robinhood Markets', price: 0, change: 0, changePercent: 0 },
  { symbol: 'LAES', name: 'SEALSQ Corp', price: 0, change: 0, changePercent: 0 },
  { symbol: 'AAPL', name: 'Apple Inc.', price: 0, change: 0, changePercent: 0 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 0, change: 0, changePercent: 0 },
]

interface TickerContextType {
  selectedTicker: string
  setSelectedTicker: (ticker: string) => void
  watchlist: Ticker[]
}

const TickerContext = createContext<TickerContextType | null>(null)

export function TickerProvider({ children }: { children: ReactNode }) {
  const [selectedTicker, setSelectedTicker] = useState('GLXY')
  const [watchlist, setWatchlist] = useState<Ticker[]>(DEFAULT_WATCHLIST)

  const refreshQuotes = useCallback(async () => {
    const updated = await Promise.all(
      watchlist.map(async (t) => {
        try {
          const q = await getQuote(t.symbol)
          return { ...t, price: q.price, change: q.change, changePercent: q.changePercent }
        } catch {
          return t
        }
      }),
    )
    setWatchlist(updated)
  }, [watchlist])

  useEffect(() => {
    refreshQuotes()
    const id = setInterval(refreshQuotes, 60_000)
    return () => clearInterval(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <TickerContext.Provider value={{ selectedTicker, setSelectedTicker, watchlist }}>
      {children}
    </TickerContext.Provider>
  )
}

export function useTicker() {
  const ctx = useContext(TickerContext)
  if (!ctx) throw new Error('useTicker must be used within TickerProvider')
  return ctx
}
