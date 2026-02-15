import { useEffect, useState } from 'react'
import type { Bar } from '../types/market'
import { getOHLC } from '../services/api'

export function useTickerData(symbol: string, range = '1M') {
  const [bars, setBars] = useState<Bar[]>([])
  const [interval, setInterval_] = useState('1d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    getOHLC(symbol, range)
      .then((data) => {
        if (!cancelled) {
          setBars(data.bars)
          setInterval_(data.interval)
        }
      })
      .catch((err) => {
        console.error('Failed to fetch OHLC:', err)
        if (!cancelled) setBars([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [symbol, range])

  return { bars, interval, loading }
}
