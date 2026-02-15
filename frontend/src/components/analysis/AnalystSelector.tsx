const ANALYSTS = [
  { id: 'buffett', name: 'Warren Buffett', style: 'Value Investing' },
  { id: 'wood', name: 'Cathie Wood', style: 'Disruptive Innovation' },
  { id: 'lee', name: 'Tom Lee', style: 'Macro Strategy' },
  { id: 'lynch', name: 'Peter Lynch', style: 'GARP' },
  { id: 'dalio', name: 'Ray Dalio', style: 'Global Macro' },
]

interface Props {
  selected: string[]
  onChange: (ids: string[]) => void
}

export default function AnalystSelector({ selected, onChange }: Props) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id))
    } else {
      onChange([...selected, id])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ANALYSTS.map((a) => {
        const active = selected.includes(a.id)
        return (
          <button
            key={a.id}
            onClick={() => toggle(a.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
              active
                ? 'border-yellow-400/50 bg-yellow-400/10 text-yellow-400'
                : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
            }`}
          >
            <input type="checkbox" checked={active} readOnly className="accent-yellow-400" />
            <div className="text-left">
              <div className="font-medium">{a.name}</div>
              <div className="text-[10px] opacity-70">{a.style}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
