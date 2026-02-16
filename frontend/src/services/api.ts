import type { Quote, Bar } from '../types/market'
import type { ChatMessage } from '../types/agent'
import type { CompanyOverview, FinancialData, EarningsEntry, Recommendations, SecFiling } from '../types/fundamentals'
import type { NewsArticle } from '../types/news'
import type { Holding, PortfolioSummaryData, HoldingRequest } from '../types/portfolio'
import type { AnalystResult } from '../types/analysis'

const BASE = '/api'

export async function searchTicker(query: string): Promise<{ symbol: string; name: string; price: number; exchange: string }> {
  const res = await fetch(`${BASE}/search/${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error(`No results for ${query}`)
  return res.json()
}

export async function getQuote(symbol: string): Promise<Quote> {
  const res = await fetch(`${BASE}/quote/${symbol}`)
  if (!res.ok) throw new Error(`Failed to fetch quote for ${symbol}`)
  return res.json()
}

export async function getOHLC(symbol: string, range = '1M'): Promise<{ bars: Bar[]; interval: string }> {
  const res = await fetch(`${BASE}/ohlc/${symbol}?range=${range}`)
  if (!res.ok) throw new Error(`Failed to fetch OHLC for ${symbol}`)
  return res.json()
}

export async function askMicha(
  message: string,
  ticker: string,
): Promise<ChatMessage> {
  const res = await fetch(`${BASE}/agent/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, ticker }),
  })
  if (!res.ok) throw new Error('Failed to get response from Engelus')
  return res.json()
}

// Indicators
export async function getIndicators(
  symbol: string,
  range = '1M',
  indicators = 'sma_20,rsi,macd',
): Promise<Record<string, unknown[]>> {
  const res = await fetch(`${BASE}/indicators/${symbol}?range=${range}&indicators=${indicators}`)
  if (!res.ok) throw new Error(`Failed to fetch indicators for ${symbol}`)
  return res.json()
}

// Fundamentals
export async function getOverview(symbol: string): Promise<CompanyOverview> {
  const res = await fetch(`${BASE}/fundamentals/${symbol}/overview`)
  if (!res.ok) throw new Error(`Failed to fetch overview for ${symbol}`)
  return res.json()
}

export async function getFinancials(
  symbol: string,
  statement = 'income',
  period = 'annual',
): Promise<FinancialData> {
  const res = await fetch(`${BASE}/fundamentals/${symbol}/financials?statement=${statement}&period=${period}`)
  if (!res.ok) throw new Error(`Failed to fetch financials for ${symbol}`)
  return res.json()
}

export async function getEarnings(symbol: string): Promise<EarningsEntry[]> {
  const res = await fetch(`${BASE}/fundamentals/${symbol}/earnings`)
  if (!res.ok) throw new Error(`Failed to fetch earnings for ${symbol}`)
  return res.json()
}

export async function getRecommendations(symbol: string): Promise<Recommendations> {
  const res = await fetch(`${BASE}/fundamentals/${symbol}/recommendations`)
  if (!res.ok) throw new Error(`Failed to fetch recommendations for ${symbol}`)
  return res.json()
}

// SEC EDGAR
export async function getSecFilings(symbol: string): Promise<{ filings: SecFiling[] }> {
  const res = await fetch(`${BASE}/fundamentals/${symbol}/sec-filings`)
  if (!res.ok) throw new Error(`Failed to fetch SEC filings for ${symbol}`)
  return res.json()
}

export async function getSecFinancials(symbol: string, period = 'annual'): Promise<FinancialData> {
  const res = await fetch(`${BASE}/fundamentals/${symbol}/sec-financials?period=${period}`)
  if (!res.ok) throw new Error(`Failed to fetch SEC financials for ${symbol}`)
  return res.json()
}

// News
export async function getNews(symbol: string): Promise<NewsArticle[]> {
  const res = await fetch(`${BASE}/news/${symbol}`)
  if (!res.ok) throw new Error(`Failed to fetch news for ${symbol}`)
  return res.json()
}

// Portfolio
export async function getPortfolio(): Promise<{ holdings: Holding[] }> {
  const res = await fetch(`${BASE}/portfolio`)
  if (!res.ok) throw new Error('Failed to fetch portfolio')
  return res.json()
}

export async function getPortfolioSummary(): Promise<PortfolioSummaryData> {
  const res = await fetch(`${BASE}/portfolio/summary`)
  if (!res.ok) throw new Error('Failed to fetch portfolio summary')
  return res.json()
}

export async function addHolding(holding: HoldingRequest): Promise<void> {
  const res = await fetch(`${BASE}/portfolio/holdings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(holding),
  })
  if (!res.ok) throw new Error('Failed to add holding')
}

export async function updateHolding(ticker: string, holding: HoldingRequest): Promise<void> {
  const res = await fetch(`${BASE}/portfolio/holdings/${ticker}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(holding),
  })
  if (!res.ok) throw new Error('Failed to update holding')
}

export async function deleteHolding(ticker: string): Promise<void> {
  const res = await fetch(`${BASE}/portfolio/holdings/${ticker}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete holding')
}

// Analysis
export async function getAnalysis(
  ticker: string,
  analysts: string[] = ['buffett', 'wood', 'lee', 'micha', 'dalio'],
): Promise<AnalystResult[]> {
  const res = await fetch(`${BASE}/agent/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticker, analysts }),
  })
  if (!res.ok) throw new Error('Failed to get analysis')
  return res.json()
}
