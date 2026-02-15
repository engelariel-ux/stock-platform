import { TickerProvider } from './context/TickerContext'
import DashboardLayout from './components/layout/DashboardLayout'
import MichaAgent from './components/agent/MichaAgent'

export default function App() {
  return (
    <TickerProvider>
      <DashboardLayout />
      <MichaAgent />
    </TickerProvider>
  )
}
