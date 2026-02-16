import type { CanvasRenderingTarget2D } from 'fancy-canvas'
import type { ISeriesPrimitive, Time, IPrimitivePaneView, IPrimitivePaneRenderer, ISeriesPrimitiveAxisView } from 'lightweight-charts'
import type { SeriesAttachedParams } from './types'

class HLineRenderer implements IPrimitivePaneRenderer {
  private _y = 0
  private _width = 0

  update(y: number, width: number) {
    this._y = y
    this._width = width
  }

  draw(target: CanvasRenderingTarget2D) {
    target.useMediaCoordinateSpace(({ context: ctx }) => {
      ctx.beginPath()
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 1.5
      ctx.setLineDash([6, 4])
      ctx.moveTo(0, this._y)
      ctx.lineTo(this._width, this._y)
      ctx.stroke()
      ctx.setLineDash([])
    })
  }
}

class HLinePaneView implements IPrimitivePaneView {
  private _renderer = new HLineRenderer()
  private _source: HorizontalLinePrimitive

  constructor(source: HorizontalLinePrimitive) {
    this._source = source
  }

  renderer(): IPrimitivePaneRenderer {
    const s = this._source
    if (!s.params) return this._renderer

    const { chart, series } = s.params
    const y = series.priceToCoordinate(s.price)
    if (y === null) return this._renderer

    const width = chart.timeScale().width()
    this._renderer.update(y, width)
    return this._renderer
  }
}

class HLinePriceAxisView implements ISeriesPrimitiveAxisView {
  private _source: HorizontalLinePrimitive

  constructor(source: HorizontalLinePrimitive) {
    this._source = source
  }

  coordinate() {
    if (!this._source.params) return 0
    return this._source.params.series.priceToCoordinate(this._source.price) ?? 0
  }

  text() {
    return this._source.price.toFixed(2)
  }

  textColor() {
    return '#ffffff'
  }

  backColor() {
    return '#3b82f6'
  }

  visible() {
    return true
  }
}

export class HorizontalLinePrimitive implements ISeriesPrimitive<Time> {
  price: number
  params: SeriesAttachedParams | null = null
  private _paneViews: HLinePaneView[]
  private _priceAxisViews: HLinePriceAxisView[]

  constructor(price: number) {
    this.price = price
    this._paneViews = [new HLinePaneView(this)]
    this._priceAxisViews = [new HLinePriceAxisView(this)]
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

  priceAxisViews() {
    return this._priceAxisViews
  }
}
