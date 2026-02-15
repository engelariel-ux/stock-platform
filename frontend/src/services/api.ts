import type { Quote, Bar } from '../types/market'
import type { ChatMessage } from '../types/agent'

const BASE = '/api'

export async function getQuote(symbol: string): Promise<Quote> {
  const res = await fetch(`${BASE}/quote/${symbol}`)
  if (!res.ok) throw new Error(`Failed to fetch quote for ${symbol}`)
  return res.json()
}

export async function getOHLC(symbol: string, range = '1M'): Promise<Bar[]> {
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
  if (!res.ok) throw new Error('Failed to get response from Micha')
  return res.json()
}
