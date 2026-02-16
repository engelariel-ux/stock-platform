import { useEffect, useRef } from 'react'

const INDICATORS = [
  { id: 'sma_20', label: 'SMA 20', category: 'Overlay' },
  { id: 'sma_50', label: 'SMA 50', category: 'Overlay' },
  { id: 'sma_150', label: 'SMA 150', category: 'Overlay' },
  { id: 'sma_200', label: 'SMA 200', category: 'Overlay' },
  { id: 'ema_12', label: 'EMA 12', category: 'Overlay' },
  { id: 'ema_26', label: 'EMA 26', category: 'Overlay' },
  { id: 'ema_50', label: 'EMA 50', category: 'Overlay' },
  { id: 'bbands', label: 'Bollinger Bands', category: 'Overlay' },
  { id: 'vwap', label: 'VWAP', category: 'Overlay' },
  { id: 'rsi', label: 'RSI', category: 'Sub-chart' },
  { id: 'macd', label: 'MACD', category: 'Sub-chart' },
  { id: 'stoch', label: 'Stochastic', category: 'Sub-chart' },
]

interface Props {
  activeIndicators: string[]
  onToggle: (id: string) => void
  onClose: () => void
}

export default function IndicatorSelector({ activeIndicators, onToggle, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const overlays = INDICATORS.filter((i) => i.category === 'Overlay')
  const subCharts = INDICATORS.filter((i) => i.category === 'Sub-chart')

  return (
    <div ref={ref} className="absolute top-full left-0 mt-1 z-50 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-3">
      <div className="text-xs font-semibold text-gray-400 mb-2">Overlays</div>
      {overlays.map((ind) => (
        <label key={ind.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-800 cursor-pointer">
          <input
            type="checkbox"
            checked={activeIndicators.includes(ind.id)}
            onChange={() => onToggle(ind.id)}
            className="accent-yellow-400"
          />
          <span className="text-sm text-gray-200">{ind.label}</span>
        </label>
      ))}
      <div className="text-xs font-semibold text-gray-400 mt-3 mb-2">Sub-charts</div>
      {subCharts.map((ind) => (
        <label key={ind.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-800 cursor-pointer">
          <input
            type="checkbox"
            checked={activeIndicators.includes(ind.id)}
            onChange={() => onToggle(ind.id)}
            className="accent-yellow-400"
          />
          <span className="text-sm text-gray-200">{ind.label}</span>
        </label>
      ))}
    </div>
  )
}
