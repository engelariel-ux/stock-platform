import { useEffect, useState, useCallback } from 'react'
import type { Holding, PortfolioSummaryData, HoldingRequest } from '../types/portfolio'
import { getPortfolio, getPortfolioSummary, addHolding, updateHolding, deleteHolding } from '../services/api'

export function usePortfolio() {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [summary, setSummary] = useState<PortfolioSummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [portfolio, sum] = await Promise.all([getPortfolio(), getPortfolioSummary()])
      setHoldings(portfolio.holdings)
      setSummary(sum)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load portfolio')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const add = async (holding: HoldingRequest) => {
    await addHolding(holding)
    await refresh()
  }

  const update = async (ticker: string, holding: HoldingRequest) => {
    await updateHolding(ticker, holding)
    await refresh()
  }

  const remove = async (ticker: string) => {
    await deleteHolding(ticker)
    await refresh()
  }

  return { holdings, summary, loading, error, add, update, remove, refresh }
}
