import { useState } from 'react'
import type { HoldingRequest } from '../../types/portfolio'
import { X } from 'lucide-react'

interface Props {
  onAdd: (holding: HoldingRequest) => Promise<void>
  onClose: () => void
}

export default function AddHoldingModal({ onAdd, onClose }: Props) {
  const [ticker, setTicker] = useState('')
  const [shares, setShares] = useState('')
  const [buyPrice, setBuyPrice] = useState('')
  const [buyDate, setBuyDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticker || !shares || !buyPrice) {
      setError('Ticker, shares, and buy price are required')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await onAdd({
        ticker: ticker.toUpperCase(),
        shares: parseFloat(shares),
        buyPrice: parseFloat(buyPrice),
        buyDate,
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add holding')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-96 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Add Holding</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Ticker</label>
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder="e.g. AAPL"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Shares</label>
            <input
              type="number"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              step="any"
              placeholder="10"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Buy Price</label>
            <input
              type="number"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              step="any"
              placeholder="150.00"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Buy Date (optional)</label>
            <input
              type="date"
              value={buyDate}
              onChange={(e) => setBuyDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:border-yellow-400 focus:outline-none"
            />
          </div>

          {error && <div className="text-xs text-red-400">{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-yellow-400 text-gray-900 font-medium rounded text-sm hover:bg-yellow-300 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Adding...' : 'Add Holding'}
          </button>
        </form>
      </div>
    </div>
  )
}
