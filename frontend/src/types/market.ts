export interface Ticker {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  extPrice?: number | null
  extChange?: number | null
  extChangePercent?: number | null
  extLabel?: string | null
}

export interface Bar {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

export interface Quote {
  symbol: string
  price: number
  change: number
  changePercent: number
  high: number
  low: number
  volume: number
  extPrice?: number | null
  extChange?: number | null
  extChangePercent?: number | null
  extLabel?: string | null
}
