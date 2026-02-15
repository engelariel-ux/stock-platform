import { useTicker } from '../../context/TickerContext'
import { useAnalysis } from '../../hooks/useAnalysis'
import AnalystSelector from './AnalystSelector'
import AnalystCard from './AnalystCard'
import { useState } from 'react'

export default function AnalysisPanel() {
  const { selectedTicker } = useTicker()
  const { results, loading, error, analyze } = useAnalysis()
  const [selectedAnalysts, setSelectedAnalysts] = useState<string[]>([
    'buffett', 'wood', 'lee', 'lynch', 'dalio',
  ])

  const handleAnalyze = () => {
    if (selectedAnalysts.length === 0) return
    analyze(selectedTicker, selectedAnalysts)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <h2 className="text-lg font-semibold text-white">AI Multi-Analyst Analysis</h2>
      <p className="text-sm text-gray-400">
        Get perspectives from legendary investors on {selectedTicker}
      </p>

      <AnalystSelector
        selected={selectedAnalysts}
        onChange={setSelectedAnalysts}
      />

      <button
        onClick={handleAnalyze}
        disabled={loading || selectedAnalysts.length === 0}
        className="px-6 py-2.5 bg-yellow-400 text-gray-900 font-medium rounded-lg text-sm hover:bg-yellow-300 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Analyzing...' : `Analyze ${selectedTicker}`}
      </button>

      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 p-3 rounded">{error}</div>
      )}

      {loading && (
        <div className="space-y-4">
          {selectedAnalysts.map((a) => (
            <div key={a} className="animate-pulse h-40 bg-gray-800/50 rounded-lg" />
          ))}
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          {results.map((r, i) => (
            <AnalystCard key={i} result={r} />
          ))}
        </div>
      )}
    </div>
  )
}
