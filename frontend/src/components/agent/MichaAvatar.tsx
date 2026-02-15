import type { AgentState } from '../../types/agent'

interface Props {
  state: AgentState
  onClick: () => void
}

export default function MichaAvatar({ state, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/20 transition-transform hover:scale-105 ${
        state === 'thinking' ? 'animate-pulse' : ''
      }`}
    >
      <span className="text-2xl font-bold text-white">M</span>

      {state === 'thinking' && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-4 w-4 rounded-full bg-amber-400" />
        </span>
      )}

      {state === 'talking' && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-400" />
        </span>
      )}
    </button>
  )
}
