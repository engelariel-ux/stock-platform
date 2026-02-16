import type { AnalystResult } from '../../types/analysis'

const HEB_RE = /[\u0590-\u05FF]/

export default function AnalystCard({ result }: { result: AnalystResult }) {
  const isRtl = HEB_RE.test(result.analysis)

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-5" dir={isRtl ? 'rtl' : 'ltr'}>
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
