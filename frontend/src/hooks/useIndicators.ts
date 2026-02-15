import { useEffect, useState } from 'react'
import { getIndicators } from '../services/api'

export function useIndicators(symbol: string, range: string, activeIndicators: string[]) {
  const [data, setData] = useState<Record<string, unknown[]>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (activeIndicators.length === 0) {
      setData({})
      return
    }

    let cancelled = false
    setLoading(true)

    getIndicators(symbol, range, activeIndicators.join(','))
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err) => {
        console.error('Failed to fetch indicators:', err)
        if (!cancelled) setData({})
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [symbol, range, activeIndicators.join(',')])

  return { data, loading }
}
