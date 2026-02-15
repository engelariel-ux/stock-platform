import { useMemo } from 'react'
import type { Bar } from '../types/market'

function generateMockBars(symbol: string): Bar[] {
  const bars: Bar[] = []
  const seed = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  let price = (seed % 200) + 20
  const now = new Date()

  for (let i = 60; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    if (date.getDay() === 0 || date.getDay() === 6) continue

    const change = (Math.sin(seed + i * 0.3) * 3) + (Math.random() - 0.5) * 2
    const open = price
    const close = price + change
    const high = Math.max(open, close) + Math.random() * 2
    const low = Math.min(open, close) - Math.random() * 2
    price = close

    bars.push({
      time: date.toISOString().split('T')[0],
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume: Math.floor(Math.random() * 10_000_000) + 500_000,
    })
  }

  return bars
}

export function useTickerData(symbol: string) {
  const bars = useMemo(() => generateMockBars(symbol), [symbol])
  return { bars, loading: false }
}
