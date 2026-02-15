import { useEffect, useRef } from 'react'
import { createChart, type IChartApi, ColorType } from 'lightweight-charts'
import { useTicker } from '../../context/TickerContext'
import { useTickerData } from '../../hooks/useTickerData'

export default function StockChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const { selectedTicker } = useTicker()
  const { bars } = useTickerData(selectedTicker)

  useEffect(() => {
    const container = chartContainerRef.current
    if (!container) return

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: '#0a0a0f' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      width: container.clientWidth,
      height: container.clientHeight,
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

    const series = chart.addCandlestickSeries({
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
      chart.applyOptions({
        width: container.clientWidth,
        height: container.clientHeight,
      })
    }

    const observer = new ResizeObserver(handleResize)
    observer.observe(container)

    return () => {
      observer.disconnect()
      chart.remove()
      chartRef.current = null
    }
  }, [bars])

  return (
    <div className="flex flex-1 flex-col bg-[#0a0a0f]">
      <div className="px-4 py-2 text-xs text-gray-500">
        {selectedTicker} &middot; Daily &middot; Candlestick
      </div>
      <div ref={chartContainerRef} className="flex-1" />
    </div>
  )
}
