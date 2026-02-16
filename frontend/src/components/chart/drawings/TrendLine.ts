import type { CanvasRenderingTarget2D } from 'fancy-canvas'
import type { ISeriesPrimitive, Time, IPrimitivePaneView, IPrimitivePaneRenderer } from 'lightweight-charts'
import type { DrawingPoint, SeriesAttachedParams } from './types'

class TrendLineRenderer implements IPrimitivePaneRenderer {
  private _p1x = 0
  private _p1y = 0
  private _p2x = 0
  private _p2y = 0

  update(p1x: number, p1y: number, p2x: number, p2y: number) {
    this._p1x = p1x
    this._p1y = p1y
    this._p2x = p2x
    this._p2y = p2y
  }

  draw(target: CanvasRenderingTarget2D) {
    target.useMediaCoordinateSpace(({ context: ctx }) => {
      ctx.beginPath()
      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 2
      ctx.moveTo(this._p1x, this._p1y)
      ctx.lineTo(this._p2x, this._p2y)
      ctx.stroke()

      // Draw small circles at endpoints
      for (const [x, y] of [[this._p1x, this._p1y], [this._p2x, this._p2y]]) {
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fillStyle = '#f59e0b'
        ctx.fill()
      }
    })
  }
}

class TrendLinePaneView implements IPrimitivePaneView {
  private _renderer = new TrendLineRenderer()
  private _source: TrendLinePrimitive

  constructor(source: TrendLinePrimitive) {
    this._source = source
  }

  renderer(): IPrimitivePaneRenderer {
    const s = this._source
    if (!s.params) return this._renderer

    const { chart, series } = s.params
    const ts = chart.timeScale()

    const x1 = ts.timeToCoordinate(s.p1.time)
    const y1 = series.priceToCoordinate(s.p1.price)
    const x2 = ts.timeToCoordinate(s.p2.time)
    const y2 = series.priceToCoordinate(s.p2.price)

    if (x1 === null || y1 === null || x2 === null || y2 === null) return this._renderer

    this._renderer.update(x1, y1, x2, y2)
    return this._renderer
  }
}

export class TrendLinePrimitive implements ISeriesPrimitive<Time> {
  p1: DrawingPoint
  p2: DrawingPoint
  params: SeriesAttachedParams | null = null
  private _paneViews: TrendLinePaneView[]

  constructor(p1: DrawingPoint, p2: DrawingPoint) {
    this.p1 = p1
    this.p2 = p2
    this._paneViews = [new TrendLinePaneView(this)]
  }

  attached(params: SeriesAttachedParams) {
    this.params = params
  }

  detached() {
    this.params = null
  }

  updateAllViews() {
    // coordinates recalculated in renderer
  }

  paneViews() {
    return this._paneViews
  }
}
