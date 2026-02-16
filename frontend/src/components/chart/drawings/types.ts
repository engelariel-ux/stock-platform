import type { Time, IChartApi, ISeriesApi, SeriesType } from 'lightweight-charts'

export interface DrawingPoint {
  time: Time
  price: number
}

export type DrawingToolType = 'trendline' | 'hline' | 'fib' | null

export interface SeriesAttachedParams {
  chart: IChartApi
  series: ISeriesApi<SeriesType>
  requestUpdate: () => void
}
