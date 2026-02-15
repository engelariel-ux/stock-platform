import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Ticker } from '../types/market'

const DEFAULT_WATCHLIST: Ticker[] = [
  { symbol: 'GLXY', name: 'Galaxy Digital', price: 26.84, change: 1.23, changePercent: 4.8 },
  { symbol: 'HOOD', name: 'Robinhood Markets', price: 54.12, change: -0.87, changePercent: -1.58 },
  { symbol: 'LAES', name: 'SEALSQ Corp', price: 3.42, change: 0.15, changePercent: 4.59 },
  { symbol: 'AAPL', name: 'Apple Inc.', price: 232.50, change: 2.10, changePercent: 0.91 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 415.80, change: -1.45, changePercent: -0.35 },
]

interface TickerContextType {
  selectedTicker: string
  setSelectedTicker: (ticker: string) => void
  watchlist: Ticker[]
}

const TickerContext = createContext<TickerContextType | null>(null)

export function TickerProvider({ children }: { children: ReactNode }) {
  const [selectedTicker, setSelectedTicker] = useState('GLXY')
  const [watchlist] = useState<Ticker[]>(DEFAULT_WATCHLIST)

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
