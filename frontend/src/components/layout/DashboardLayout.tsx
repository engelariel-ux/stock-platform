import TopBar from './TopBar'
import TabBar from './TabBar'
import Watchlist from '../watchlist/Watchlist'
import StockChart from '../chart/StockChart'
import FundamentalsPanel from '../fundamentals/FundamentalsPanel'
import NewsPanel from '../news/NewsPanel'
import PortfolioPanel from '../portfolio/PortfolioPanel'
import AnalysisPanel from '../analysis/AnalysisPanel'
import { useTicker } from '../../context/TickerContext'

const TAB_COMPONENTS = {
  chart: StockChart,
  fundamentals: FundamentalsPanel,
  news: NewsPanel,
  portfolio: PortfolioPanel,
  analysis: AnalysisPanel,
}

export default function DashboardLayout() {
  const { activeTab } = useTicker()
  const TabContent = TAB_COMPONENTS[activeTab]

  return (
    <div className="flex h-screen w-screen flex-col bg-gray-950 text-white">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Watchlist />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TabBar />
          <main className="flex flex-1 overflow-hidden">
            <TabContent />
          </main>
        </div>
      </div>
    </div>
  )
}
