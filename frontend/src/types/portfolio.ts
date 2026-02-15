export interface Holding {
  ticker: string
  shares: number
  buyPrice: number
  buyDate: string
  currentPrice: number
  value: number
  cost: number
  gain: number
  gainPercent: number
  dailyChange: number
  dailyChangePercent: number
}

export interface PortfolioSummaryData {
  totalValue: number
  totalCost: number
  totalGain: number
  totalGainPercent: number
  dailyChange: number
  allocation: { ticker: string; value: number; percent: number }[]
}

export interface HoldingRequest {
  ticker: string
  shares: number
  buyPrice: number
  buyDate: string
}
