import { BarChart3, FileText, Newspaper, Briefcase, Brain } from 'lucide-react'
import { useTicker, type TabId } from '../../context/TickerContext'

const TABS: { id: TabId; label: string; icon: typeof BarChart3 }[] = [
  { id: 'chart', label: 'Chart', icon: BarChart3 },
  { id: 'fundamentals', label: 'Fundamentals', icon: FileText },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'analysis', label: 'AI Analysis', icon: Brain },
]

export default function TabBar() {
  const { activeTab, setActiveTab } = useTicker()

  return (
    <div className="flex border-b border-gray-800 bg-gray-950 px-4">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === id
              ? 'border-yellow-400 text-yellow-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Icon size={16} />
          {label}
        </button>
      ))}
    </div>
  )
}
