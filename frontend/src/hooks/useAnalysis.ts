import { useState } from 'react'
import type { AnalystResult } from '../types/analysis'
import { getAnalysis } from '../services/api'

export function useAnalysis() {
  const [results, setResults] = useState<AnalystResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyze = async (ticker: string, analysts: string[]) => {
    setLoading(true)
    setError(null)
    setResults([])
    try {
      const data = await getAnalysis(ticker, analysts)
      setResults(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  return { results, loading, error, analyze }
}
