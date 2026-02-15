import { useEffect, useRef, useState, useCallback } from 'react'
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  ColorType,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
} from 'lightweight-charts'
import { useTicker } from '../../context/TickerContext'
import { useTickerData } from '../../hooks/useTickerData'
import { useIndicators } from '../../hooks/useIndicators'
import ChartToolbar, { type ChartType } from './ChartToolbar'

const OVERLAY_COLORS: Record<string, string> = {
  sma_20: '#f59e0b',
  sma_50: '#3b82f6',
  sma_200: '#ef4444',
  ema_12: '#a78bfa',
  ema_26: '#34d399',
  ema_50: '#f472b6',
  vwap: '#06b6d4',
}

const CHART_BG = '#0a0a0f'
const GRID_COLOR = '#1f2937'
const TEXT_COLOR = '#9ca3af'

function createChartOptions(width: number, height: number, timeVisible: boolean) {
  return {
    width,
    height,
    layout: { background: { type: ColorType.Solid as const, color: CHART_BG }, textColor: TEXT_COLOR },
    grid: { vertLines: { color: GRID_COLOR }, horzLines: { color: GRID_COLOR } },
    crosshair: {
      vertLine: { color: '#6b7280', width: 1 as const, style: 3 as const },
      horzLine: { color: '#6b7280', width: 1 as const, style: 3 as const },
    },
    timeScale: { borderColor: GRID_COLOR, timeVisible },
    rightPriceScale: { borderColor: GRID_COLOR },
  }
}

const SUB_INDICATORS = ['rsi', 'macd', 'stoch']

export default function StockChart() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const mainChartRef = useRef<HTMLDivElement>(null)
  const subChartsRef = useRef<HTMLDivElement>(null)
  const chartApiRef = useRef<IChartApi | null>(null)
  const subChartApisRef = useRef<Map<string, IChartApi>>(new Map())

  const { selectedTicker, chartRange } = useTicker()
  const { bars, interval } = useTickerData(selectedTicker, chartRange)

  const [chartType, setChartType] = useState<ChartType>('Candlestick')
  const [activeIndicators, setActiveIndicators] = useState<string[]>([])

  const overlayIndicators = activeIndicators.filter((i) => !SUB_INDICATORS.includes(i))
  const subIndicators = activeIndicators.filter((i) => SUB_INDICATORS.includes(i))

  const { data: indicatorData } = useIndicators(selectedTicker, chartRange, activeIndicators)

  const toggleIndicator = useCallback((ind: string) => {
    setActiveIndicators((prev) =>
      prev.includes(ind) ? prev.filter((i) => i !== ind) : [...prev, ind]
    )
  }, [])

  const isIntraday = ['5m', '15m', '30m', '1h'].includes(interval)

  // Main chart
  useEffect(() => {
    const container = mainChartRef.current
    const wrapper = wrapperRef.current
    if (!container || !wrapper) return

    while (container.firstChild) container.removeChild(container.firstChild)

    const subCount = subIndicators.length
    const totalHeight = wrapper.clientHeight - 44 // toolbar height
    const mainHeight = subCount > 0 ? Math.floor(totalHeight * 0.6) : totalHeight

    const chart = createChart(container, createChartOptions(wrapper.clientWidth, mainHeight, isIntraday))

    // Main series
    let mainSeries: ISeriesApi<any>
    if (chartType === 'Candlestick') {
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#ef4444',
        borderDownColor: '#ef4444',
        borderUpColor: '#10b981',
        wickDownColor: '#ef4444',
        wickUpColor: '#10b981',
      })
      mainSeries.setData(bars)
    } else if (chartType === 'Line') {
      mainSeries = chart.addSeries(LineSeries, {
        color: '#10b981',
        lineWidth: 2,
      })
      mainSeries.setData(bars.map((b) => ({ time: b.time, value: b.close })))
    } else {
      mainSeries = chart.addSeries(AreaSeries, {
        topColor: 'rgba(16,185,129,0.4)',
        bottomColor: 'rgba(16,185,129,0.05)',
        lineColor: '#10b981',
        lineWidth: 2,
      })
      mainSeries.setData(bars.map((b) => ({ time: b.time, value: b.close })))
    }

    // Overlay indicators
    for (const ind of overlayIndicators) {
      const indData = indicatorData[ind]
      if (!indData || !Array.isArray(indData)) continue

      if (ind === 'bbands') {
        const upper = chart.addSeries(LineSeries, { color: '#6366f1', lineWidth: 1 })
        const middle = chart.addSeries(LineSeries, { color: '#6366f1', lineWidth: 1, lineStyle: 2 })
        const lower = chart.addSeries(LineSeries, { color: '#6366f1', lineWidth: 1 })
        upper.setData(indData.map((d: any) => ({ time: d.time, value: d.upper })))
        middle.setData(indData.map((d: any) => ({ time: d.time, value: d.middle })))
        lower.setData(indData.map((d: any) => ({ time: d.time, value: d.lower })))
      } else {
        const color = OVERLAY_COLORS[ind] || '#f59e0b'
        const series = chart.addSeries(LineSeries, { color, lineWidth: 2 })
        series.setData(indData.map((d: any) => ({ time: d.time, value: d.value })))
      }
    }

    chart.timeScale().fitContent()
    chartApiRef.current = chart

    const handleResize = () => {
      if (wrapper.clientWidth > 0) {
        const newTotal = wrapper.clientHeight - 44
        const newMain = subCount > 0 ? Math.floor(newTotal * 0.6) : newTotal
        chart.applyOptions({ width: wrapper.clientWidth, height: newMain })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
      chartApiRef.current = null
    }
  }, [bars, chartType, overlayIndicators.join(','), JSON.stringify(indicatorData), isIntraday, subIndicators.length])

  // Sub-charts (RSI, MACD, Stochastic)
  useEffect(() => {
    const container = subChartsRef.current
    const wrapper = wrapperRef.current
    if (!container || !wrapper) return

    // Clean previous sub-charts
    subChartApisRef.current.forEach((c) => c.remove())
    subChartApisRef.current.clear()
    while (container.firstChild) container.removeChild(container.firstChild)

    if (subIndicators.length === 0) return

    const totalHeight = wrapper.clientHeight - 44
    const subHeight = Math.floor((totalHeight * 0.4) / subIndicators.length)

    for (const ind of subIndicators) {
      const indData = indicatorData[ind]
      if (!indData || !Array.isArray(indData)) continue

      const div = document.createElement('div')
      container.appendChild(div)

      const subChart = createChart(div, {
        ...createChartOptions(wrapper.clientWidth, subHeight, isIntraday),
        rightPriceScale: { borderColor: GRID_COLOR, scaleMargins: { top: 0.1, bottom: 0.1 } },
      })

      if (ind === 'rsi') {
        const series = subChart.addSeries(LineSeries, { color: '#a78bfa', lineWidth: 2 })
        series.setData(indData.map((d: any) => ({ time: d.time, value: d.value })))
        // Overbought/oversold reference lines - just using the RSI series data range
      } else if (ind === 'macd') {
        const macdLine = subChart.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 2 })
        const signalLine = subChart.addSeries(LineSeries, { color: '#ef4444', lineWidth: 1 })
        const histogram = subChart.addSeries(HistogramSeries, {
          color: '#22c55e',
        })
        macdLine.setData(indData.map((d: any) => ({ time: d.time, value: d.macd })))
        signalLine.setData(indData.map((d: any) => ({ time: d.time, value: d.signal })))
        histogram.setData(
          indData.map((d: any) => ({
            time: d.time,
            value: d.histogram,
            color: d.histogram >= 0 ? '#22c55e' : '#ef4444',
          }))
        )
      } else if (ind === 'stoch') {
        const kLine = subChart.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 2 })
        const dLine = subChart.addSeries(LineSeries, { color: '#ef4444', lineWidth: 1 })
        kLine.setData(indData.map((d: any) => ({ time: d.time, value: d.k })))
        dLine.setData(indData.map((d: any) => ({ time: d.time, value: d.d })))
      }

      subChart.timeScale().fitContent()

      // Sync time scales
      if (chartApiRef.current) {
        const mainChart = chartApiRef.current
        mainChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
          if (range) subChart.timeScale().setVisibleLogicalRange(range)
        })
        subChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
          if (range) mainChart.timeScale().setVisibleLogicalRange(range)
        })
      }

      subChartApisRef.current.set(ind, subChart)
    }

    const handleResize = () => {
      if (wrapper.clientWidth > 0) {
        const newTotal = wrapper.clientHeight - 44
        const newSub = Math.floor((newTotal * 0.4) / subIndicators.length)
        subChartApisRef.current.forEach((c) => {
          c.applyOptions({ width: wrapper.clientWidth, height: newSub })
        })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      subChartApisRef.current.forEach((c) => c.remove())
      subChartApisRef.current.clear()
    }
  }, [subIndicators.join(','), JSON.stringify(indicatorData), isIntraday, bars])

  return (
    <div ref={wrapperRef} className="flex-1 flex flex-col overflow-hidden">
      <ChartToolbar
        chartType={chartType}
        onChartTypeChange={setChartType}
        activeIndicators={activeIndicators}
        onToggleIndicator={toggleIndicator}
      />
      <div ref={mainChartRef} className="overflow-hidden" />
      <div ref={subChartsRef} className="overflow-hidden" />
    </div>
  )
}
