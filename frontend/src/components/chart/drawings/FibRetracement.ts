import type { CanvasRenderingTarget2D } from 'fancy-canvas'
import type { ISeriesPrimitive, Time, IPrimitivePaneView, IPrimitivePaneRenderer } from 'lightweight-charts'
import type { DrawingPoint, SeriesAttachedParams } from './types'

const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]
const FIB_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ef4444']

class FibRenderer implements IPrimitivePaneRenderer {
  private _levels: { y: number; label: string; color: string }[] = []
  private _width = 0
  private _x1 = 0
  private _x2 = 0

  update(levels: { y: number; label: string; color: string }[], width: number, x1: number, x2: number) {
    this._levels = levels
    this._width = width
    this._x1 = x1
    this._x2 = x2
  }

  draw(target: CanvasRenderingTarget2D) {
    target.useMediaCoordinateSpace(({ context: ctx }) => {
      for (const level of this._levels) {
        // Horizontal line
        ctx.beginPath()
        ctx.strokeStyle = level.color
        ctx.lineWidth = 1
        ctx.globalAlpha = 0.7
        ctx.moveTo(0, level.y)
        ctx.lineTo(this._width, level.y)
        ctx.stroke()
        ctx.globalAlpha = 1

        // Label
        ctx.font = '11px monospace'
        ctx.fillStyle = level.color
        ctx.fillText(level.label, 8, level.y - 4)
      }

      // Shaded region between x1 and x2
      if (this._levels.length >= 2) {
        const top = this._levels[0].y
        const bottom = this._levels[this._levels.length - 1].y
        ctx.fillStyle = 'rgba(245, 158, 11, 0.05)'
        ctx.fillRect(Math.min(this._x1, this._x2), Math.min(top, bottom), Math.abs(this._x2 - this._x1), Math.abs(bottom - top))
      }
    })
  }
}

class FibPaneView implements IPrimitivePaneView {
  private _renderer = new FibRenderer()
  private _source: FibRetracementPrimitive

  constructor(source: FibRetracementPrimitive) {
    this._source = source
  }

  renderer(): IPrimitivePaneRenderer {
    const s = this._source
    if (!s.params) return this._renderer

    const { chart, series } = s.params
    const ts = chart.timeScale()

    const x1 = ts.timeToCoordinate(s.p1.time)
    const x2 = ts.timeToCoordinate(s.p2.time)
    if (x1 === null || x2 === null) return this._renderer

    const highPrice = Math.max(s.p1.price, s.p2.price)
    const lowPrice = Math.min(s.p1.price, s.p2.price)
    const diff = highPrice - lowPrice

    const levels = FIB_LEVELS.map((fib, i) => {
      const price = highPrice - diff * fib
      const y = series.priceToCoordinate(price)
      return {
        y: y ?? 0,
        label: `${(fib * 100).toFixed(1)}% ($${price.toFixed(2)})`,
        color: FIB_COLORS[i],
      }
    })

    const width = ts.width()
    this._renderer.update(levels, width, x1, x2)
    return this._renderer
  }
}

export class FibRetracementPrimitive implements ISeriesPrimitive<Time> {
  p1: DrawingPoint
  p2: DrawingPoint
  params: SeriesAttachedParams | null = null
  private _paneViews: FibPaneView[]

  constructor(p1: DrawingPoint, p2: DrawingPoint) {
    this.p1 = p1
    this.p2 = p2
    this._paneViews = [new FibPaneView(this)]
  }

  attached(params: SeriesAttachedParams) {
    this.params = params
  }

  detached() {
    this.params = null
  }

  updateAllViews() {}

  paneViews() {
    return this._paneViews
  }
}
