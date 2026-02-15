import { useEffect, useRef } from 'react'
import { createChart, type IChartApi, ColorType, CandlestickSeries } from 'lightweight-charts'
import { useTicker } from '../../context/TickerContext'
import { useTickerData } from '../../hooks/useTickerData'

export default function StockChart() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const { selectedTicker } = useTicker()
  const { bars } = useTickerData(selectedTicker)

  useEffect(() => {
    const container = chartContainerRef.current
    const wrapper = wrapperRef.current
    if (!container || !wrapper) return

    while (container.firstChild) {
      container.removeChild(container.firstChild)
    }

    const chart = createChart(container, {
      width: wrapper.clientWidth,
      height: wrapper.clientHeight - 32,
      layout: {
        background: { type: ColorType.Solid, color: '#0a0a0f' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      crosshair: {
        vertLine: { color: '#6b7280', width: 1, style: 3 },
        horzLine: { color: '#6b7280', width: 1, style: 3 },
      },
      timeScale: {
        borderColor: '#1f2937',
        timeVisible: false,
      },
      rightPriceScale: {
        borderColor: '#1f2937',
      },
    })

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#10b981',
      wickDownColor: '#ef4444',
      wickUpColor: '#10b981',
    })

    series.setData(bars)
    chart.timeScale().fitContent()
    chartRef.current = chart

    const handleResize = () => {
      if (wrapper.clientWidth > 0 && wrapper.clientHeight > 0) {
        chart.applyOptions({
          width: wrapper.clientWidth,
          height: wrapper.clientHeight - 32,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
      chartRef.current = null
    }
  }, [bars])

  return (
    <div ref={wrapperRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="px-4 py-2 text-xs text-gray-500">
        {selectedTicker} &middot; Daily &middot; Candlestick
      </div>
      <div ref={chartContainerRef} style={{ overflow: 'hidden' }} />
    </div>
  )
}
