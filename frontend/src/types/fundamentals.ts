export interface CompanyOverview {
  symbol: string
  name: string
  sector: string
  industry: string
  description: string
  marketCap: number
  pe: number | null
  forwardPe: number | null
  eps: number | null
  dividendYield: number | null
  beta: number | null
  fiftyTwoWeekHigh: number | null
  fiftyTwoWeekLow: number | null
  avgVolume: number
  price: number
}

export interface FinancialRow {
  label: string
  values: Record<string, number | null>
}

export interface FinancialData {
  columns: string[]
  rows: FinancialRow[]
}

export interface EarningsEntry {
  date: string
  epsActual: number | null
  epsEstimate: number | null
  surprise: number | null
}

export interface RecommendationSummary {
  strongBuy: number
  buy: number
  hold: number
  sell: number
  strongSell: number
}

export interface RecommendationEntry {
  date: string
  firm: string
  toGrade: string
  fromGrade: string
  action: string
}

export interface Recommendations {
  summary: RecommendationSummary
  recent: RecommendationEntry[]
}

export interface SecFiling {
  form: string
  date: string
  description: string
  url: string
}
