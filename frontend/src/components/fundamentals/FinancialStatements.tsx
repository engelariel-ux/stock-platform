import { useState } from 'react'
import { useFinancials, useSecFinancials } from '../../hooks/useFundamentals'

function fmtCell(val: number | null) {
  if (val == null) return '-'
  if (Math.abs(val) >= 1e9) return `${(val / 1e9).toFixed(2)}B`
  if (Math.abs(val) >= 1e6) return `${(val / 1e6).toFixed(2)}M`
  if (Math.abs(val) >= 1e3) return `${(val / 1e3).toFixed(1)}K`
  return val.toFixed(2)
}

type Source = 'yahoo' | 'sec'

export default function FinancialStatements({ symbol }: { symbol: string }) {
  const [source, setSource] = useState<Source>('yahoo')
  const [statement, setStatement] = useState('income')
  const [period, setPeriod] = useState('annual')

  const yahoo = useFinancials(symbol, statement, period)
  const sec = useSecFinancials(symbol, period)

  const isSecSource = source === 'sec'
  const data = isSecSource ? sec.data : yahoo.data
  const loading = isSecSource ? sec.loading : yahoo.loading

  const statements = [
    { id: 'income', label: 'Income' },
    { id: 'balance', label: 'Balance Sheet' },
    { id: 'cashflow', label: 'Cash Flow' },
  ]

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Financial Statements</h3>
        <div className="flex bg-gray-800 rounded p-0.5">
          <button
            onClick={() => setSource('yahoo')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
              source === 'yahoo' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Yahoo Finance
          </button>
          <button
            onClick={() => setSource('sec')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
              source === 'sec' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            SEC EDGAR
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        {!isSecSource && statements.map((s) => (
          <button
            key={s.id}
            onClick={() => setStatement(s.id)}
            className={`px-3 py-1 text-xs rounded font-medium ${
              statement === s.id ? 'bg-yellow-400/20 text-yellow-400' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {s.label}
          </button>
        ))}
        {!isSecSource && <div className="w-px bg-gray-700 mx-1" />}
        {['annual', 'quarterly'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1 text-xs rounded font-medium capitalize ${
              period === p ? 'bg-yellow-400/20 text-yellow-400' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse h-40 bg-gray-800/50 rounded" />
      ) : !data || data.rows.length === 0 ? (
        <div className="text-sm text-gray-500 py-4">No data available</div>
      ) : (
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-2 pr-4 text-gray-400 font-medium sticky left-0 bg-gray-900">Item</th>
                {data.columns.map((col) => (
                  <th key={col} className="text-right py-2 px-3 text-gray-400 font-medium whitespace-nowrap">
                    {col.slice(0, 10)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.label} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="py-1.5 pr-4 text-gray-300 sticky left-0 bg-gray-900 whitespace-nowrap">
                    {row.label}
                  </td>
                  {data.columns.map((col) => (
                    <td key={col} className="text-right py-1.5 px-3 text-gray-400 whitespace-nowrap">
                      {fmtCell(row.values[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
