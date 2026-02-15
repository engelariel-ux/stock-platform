import type { PortfolioSummaryData } from '../../types/portfolio'

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export default function PortfolioSummary({ summary }: { summary: PortfolioSummaryData }) {
  const cards = [
    { label: 'Total Value', value: fmt(summary.totalValue), color: 'text-white' },
    { label: 'Total Cost', value: fmt(summary.totalCost), color: 'text-gray-300' },
    {
      label: 'Total P&L',
      value: `${fmt(summary.totalGain)} (${summary.totalGainPercent >= 0 ? '+' : ''}${summary.totalGainPercent.toFixed(2)}%)`,
      color: summary.totalGain >= 0 ? 'text-emerald-400' : 'text-red-400',
    },
    {
      label: 'Daily Change',
      value: fmt(summary.dailyChange),
      color: summary.dailyChange >= 0 ? 'text-emerald-400' : 'text-red-400',
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-gray-900 rounded-lg border border-gray-800 p-4">
          <div className="text-xs text-gray-500 mb-1">{c.label}</div>
          <div className={`text-sm font-semibold ${c.color}`}>{c.value}</div>
        </div>
      ))}
    </div>
  )
}
