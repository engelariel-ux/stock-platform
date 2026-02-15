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

interface TickerContextType {
  selectedTicker: string
  setSelectedTicker: (ticker: string) => void
  watchlist: Ticker[]
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
  chartRange: string
  setChartRange: (range: string) => void
}

const TickerContext = createContext<TickerContextType | null>(null)

export function TickerProvider({ children }: { children: ReactNode }) {
  const [selectedTicker, setSelectedTicker] = useState('SPY')
  const [watchlist, setWatchlist] = useState<Ticker[]>(DEFAULT_WATCHLIST)
  const [activeTab, setActiveTab] = useState<TabId>('chart')
  const [chartRange, setChartRange] = useState('1M')

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
    <TickerContext.Provider value={{
      selectedTicker, setSelectedTicker, watchlist,
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
