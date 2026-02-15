import { useState } from 'react'
import { usePortfolio } from '../../hooks/usePortfolio'
import PortfolioSummary from './PortfolioSummary'
import HoldingsTable from './HoldingsTable'
import AddHoldingModal from './AddHoldingModal'
import { Plus } from 'lucide-react'

export default function PortfolioPanel() {
  const { holdings, summary, loading, error, add, remove, refresh } = usePortfolio()
  const [showModal, setShowModal] = useState(false)

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="animate-pulse h-32 bg-gray-800/50 rounded-lg" />
        <div className="animate-pulse h-64 bg-gray-800/50 rounded-lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 p-6">
        <div className="text-red-400 mb-2">Failed to load portfolio</div>
        <button onClick={refresh} className="text-sm text-yellow-400 hover:underline">Retry</button>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Portfolio</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-yellow-400/20 text-yellow-400 rounded hover:bg-yellow-400/30 transition-colors"
        >
          <Plus size={16} />
          Add Holding
        </button>
      </div>

      {summary && <PortfolioSummary summary={summary} />}
      <HoldingsTable holdings={holdings} onDelete={remove} />

      {showModal && (
        <AddHoldingModal
          onAdd={async (h) => { await add(h); setShowModal(false) }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
