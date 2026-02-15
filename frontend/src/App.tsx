import { TickerProvider } from './context/TickerContext'
import DashboardLayout from './components/layout/DashboardLayout'
import StockChart from './components/chart/StockChart'
import MichaAgent from './components/agent/MichaAgent'

export default function App() {
  return (
    <TickerProvider>
      <DashboardLayout>
        <StockChart />
      </DashboardLayout>
      <MichaAgent />
    </TickerProvider>
  )
}
