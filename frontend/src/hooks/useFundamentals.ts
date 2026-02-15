import { useEffect, useState } from 'react'
import type { CompanyOverview, FinancialData, EarningsEntry, Recommendations, SecFiling } from '../types/fundamentals'
import { getOverview, getFinancials, getEarnings, getRecommendations, getSecFilings, getSecFinancials } from '../services/api'

export function useOverview(symbol: string) {
  const [data, setData] = useState<CompanyOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getOverview(symbol)
      .then((d) => { if (!cancelled) setData(d) })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [symbol])

  return { data, loading, error }
}

export function useFinancials(symbol: string, statement: string, period: string) {
  const [data, setData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    getFinancials(symbol, statement, period)
      .then((d) => { if (!cancelled) setData(d) })
      .catch(() => { if (!cancelled) setData(null) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [symbol, statement, period])

  return { data, loading }
}

export function useEarnings(symbol: string) {
  const [data, setData] = useState<EarningsEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    getEarnings(symbol)
      .then((d) => { if (!cancelled) setData(d) })
      .catch(() => { if (!cancelled) setData([]) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [symbol])

  return { data, loading }
}

export function useSecFilings(symbol: string) {
  const [data, setData] = useState<SecFiling[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    getSecFilings(symbol)
      .then((d) => { if (!cancelled) setData(d.filings) })
      .catch(() => { if (!cancelled) setData([]) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [symbol])

  return { data, loading }
}

export function useSecFinancials(symbol: string, period: string) {
  const [data, setData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    getSecFinancials(symbol, period)
      .then((d) => { if (!cancelled) setData(d) })
      .catch(() => { if (!cancelled) setData(null) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [symbol, period])

  return { data, loading }
}

export function useRecommendations(symbol: string) {
  const [data, setData] = useState<Recommendations | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    getRecommendations(symbol)
      .then((d) => { if (!cancelled) setData(d) })
      .catch(() => { if (!cancelled) setData(null) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [symbol])

  return { data, loading }
}
