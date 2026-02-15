import type { AnalystResult } from '../../types/analysis'

export default function AnalystCard({ result }: { result: AnalystResult }) {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-5">
      <div className="flex items-baseline gap-2 mb-1">
        <h3 className="text-sm font-semibold text-white">{result.analyst}</h3>
        <span className="text-xs text-yellow-400/70">{result.style}</span>
      </div>
      <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">
        {result.analysis}
      </p>
    </div>
  )
}
