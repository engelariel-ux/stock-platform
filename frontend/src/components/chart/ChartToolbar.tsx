import { useState } from 'react'
import { useTicker } from '../../context/TickerContext'
import IndicatorSelector from './IndicatorSelector'
import DrawingToolbar from './DrawingToolbar'
import type { DrawingToolType } from './drawings/types'

const RANGES = ['1D', '1W', '1M', '3M', '6M', '1Y', '5Y', 'MAX']
const CHART_TYPES = ['Candlestick', 'Line', 'Area'] as const
export type ChartType = typeof CHART_TYPES[number]

interface Props {
  chartType: ChartType
  onChartTypeChange: (t: ChartType) => void
  activeIndicators: string[]
  onToggleIndicator: (ind: string) => void
  activeDrawingTool: DrawingToolType
  onSelectDrawingTool: (tool: DrawingToolType) => void
  drawingCount: number
  onClearDrawings: () => void
}

export default function ChartToolbar({
  chartType, onChartTypeChange,
  activeIndicators, onToggleIndicator,
  activeDrawingTool, onSelectDrawingTool,
  drawingCount, onClearDrawings,
}: Props) {
  const { chartRange, setChartRange } = useTicker()
  const [showIndicators, setShowIndicators] = useState(false)

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800">
      <div className="flex gap-1">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setChartRange(r)}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              chartRange === r
                ? 'bg-yellow-400/20 text-yellow-400'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-gray-700 mx-1" />

      <div className="flex gap-1">
        {CHART_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => onChartTypeChange(t)}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              chartType === t
                ? 'bg-yellow-400/20 text-yellow-400'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-gray-700 mx-1" />

      <div className="relative">
        <button
          onClick={() => setShowIndicators(!showIndicators)}
          className="px-2.5 py-1 text-xs font-medium rounded text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
        >
          + Indicator
        </button>
        {showIndicators && (
          <IndicatorSelector
            activeIndicators={activeIndicators}
            onToggle={onToggleIndicator}
            onClose={() => setShowIndicators(false)}
          />
        )}
      </div>

      <div className="w-px h-5 bg-gray-700 mx-1" />

      <DrawingToolbar
        activeTool={activeDrawingTool}
        onSelectTool={onSelectDrawingTool}
        drawingCount={drawingCount}
        onClearAll={onClearDrawings}
      />

      {activeIndicators.length > 0 && (
        <>
          <div className="w-px h-5 bg-gray-700 mx-1" />
          <div className="flex gap-1 flex-wrap">
            {activeIndicators.map((ind) => (
              <span
                key={ind}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-gray-800 text-gray-300"
              >
                {ind}
                <button
                  onClick={() => onToggleIndicator(ind)}
                  className="text-gray-500 hover:text-red-400"
                >
                  x
                </button>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
