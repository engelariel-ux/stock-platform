import { useTicker } from '../../context/TickerContext'
import CompanyOverview from './CompanyOverview'
import FinancialStatements from './FinancialStatements'
import EarningsChart from './EarningsChart'
import AnalystRatings from './AnalystRatings'
import SecFilings from './SecFilings'

export default function FundamentalsPanel() {
  const { selectedTicker } = useTicker()

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <CompanyOverview symbol={selectedTicker} />
      <AnalystRatings symbol={selectedTicker} />
      <SecFilings symbol={selectedTicker} />
      <EarningsChart symbol={selectedTicker} />
      <FinancialStatements symbol={selectedTicker} />
    </div>
  )
}
