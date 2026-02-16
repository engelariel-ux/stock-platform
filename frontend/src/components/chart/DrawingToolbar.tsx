import { TrendingUp, Minus, GitBranch } from 'lucide-react'
import type { DrawingToolType } from './drawings/types'

interface Props {
  activeTool: DrawingToolType
  onSelectTool: (tool: DrawingToolType) => void
  drawingCount: number
  onClearAll: () => void
}

const TOOLS: { id: DrawingToolType; label: string; icon: typeof TrendingUp }[] = [
  { id: 'trendline', label: 'Trend Line', icon: TrendingUp },
  { id: 'hline', label: 'H-Line', icon: Minus },
  { id: 'fib', label: 'Fib', icon: GitBranch },
]

export default function DrawingToolbar({ activeTool, onSelectTool, drawingCount, onClearAll }: Props) {
  return (
    <div className="flex items-center gap-1">
      {TOOLS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onSelectTool(activeTool === id ? null : id)}
          title={label}
          className={`px-2 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 ${
            activeTool === id
              ? 'bg-yellow-400/20 text-yellow-400'
              : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
      {drawingCount > 0 && (
        <button
          onClick={onClearAll}
          className="px-2 py-1 text-xs font-medium rounded text-red-400 hover:text-red-300 hover:bg-gray-800 transition-colors"
        >
          Clear ({drawingCount})
        </button>
      )}
    </div>
  )
}
