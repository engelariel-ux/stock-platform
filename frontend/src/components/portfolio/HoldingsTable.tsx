import type { Holding } from '../../types/portfolio'
import { Trash2 } from 'lucide-react'

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

interface Props {
  holdings: Holding[]
  onDelete: (ticker: string) => void
}

export default function HoldingsTable({ holdings, onDelete }: Props) {
  if (holdings.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center text-gray-500 text-sm">
        No holdings yet. Add your first position to get started.
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-xs text-gray-500">
            <th className="text-left py-3 px-4">Ticker</th>
            <th className="text-right py-3 px-4">Shares</th>
            <th className="text-right py-3 px-4">Avg Cost</th>
            <th className="text-right py-3 px-4">Price</th>
            <th className="text-right py-3 px-4">Value</th>
            <th className="text-right py-3 px-4">P&L</th>
            <th className="text-right py-3 px-4">P&L %</th>
            <th className="py-3 px-4" />
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => (
            <tr key={h.ticker} className="border-b border-gray-800/50 hover:bg-gray-800/30">
              <td className="py-3 px-4 font-medium text-white">{h.ticker}</td>
              <td className="text-right py-3 px-4 text-gray-300">{h.shares}</td>
              <td className="text-right py-3 px-4 text-gray-300">{fmt(h.buyPrice)}</td>
              <td className="text-right py-3 px-4 text-gray-300">{fmt(h.currentPrice)}</td>
              <td className="text-right py-3 px-4 text-white font-medium">{fmt(h.value)}</td>
              <td className={`text-right py-3 px-4 ${h.gain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {fmt(h.gain)}
              </td>
              <td className={`text-right py-3 px-4 ${h.gainPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {h.gainPercent >= 0 ? '+' : ''}{h.gainPercent.toFixed(2)}%
              </td>
              <td className="py-3 px-4">
                <button
                  onClick={() => onDelete(h.ticker)}
                  className="text-gray-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
