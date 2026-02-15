export interface Ticker {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
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
}
