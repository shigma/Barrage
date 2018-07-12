const UpdateObject = require('./update')
const Coordinate = require('./coordinate')

class Point extends UpdateObject {
  constructor(...args) {
    super(...args)
    if (this.x === undefined) this.x = 0
    if (this.y === undefined) this.y = 0
  }

  get _x() {
    return this.x
  }

  get _y() {
    return this.y
  }

  get _r() {
    return this.radius || 0
  }

  display() {
    if (!this.context) return
    if (this.show === false) return
    this.context.beginPath()
    this.context.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    this.context.closePath()
    this.context.fillStyle = this.color.output ? this.color.output() : this.color
    this.context.fill()
  }

  movePolar(rho = this.rho, theta = this.theta) {
    this.x += rho * Math.cos(Math.PI * theta)
    this.y += rho * Math.sin(Math.PI * theta)
  }

  smooth(from, to, progress) {
    this.x = from.x + (to.x - from.x) / 2 * (1 - Math.cos(Math.PI * progress))
    this.y = from.y + (to.y - from.y) / 2 * (1 - Math.cos(Math.PI * progress))
  }

  emitBullets(...args) {
    // set temporary source
    this.parent.ref.src = this
    this.parent.emitBullets(...args)
    delete this.parent.ref.src
  }

  getTheta(point) {
    if (point._x === this._x) {
      if (point._y >= this._y) {
        return 0.5
      } else {
        return -0.5
      }
    } else {
      const result = Math.atan((point._y - this._y) / (point._x - this._x)) / Math.PI
      if (point._x > this._x) {
        return result
      } else {
        return 1 + result
      }
    }
  }

  getDistance(point) {
    return Math.sqrt((this._x - point._x) ** 2 + (this._y - point._y) ** 2)
  }

  fillCircle(fill = this.color, radius = this.radius) {
    this.context.beginPath()
    this.context.arc(this._x, this._y, radius, 0, Math.PI * 2)
    this.context.closePath()
    this.context.fillStyle = fill.output ? fill.output() : fill
    this.context.fill()
  }

  getGradient(c1, r1, c2 = this.color, r2 = this.radius) {
    const gradient = this.context.createRadialGradient(
      this._x, this._y, r1,
      this._x, this._y, r2
    )
    gradient.addColorStop(0, c1.output ? c1.output() : c1)
    gradient.addColorStop(1, c2.output ? c2.output() : c2)
    return gradient
  }

  copy() {
    this._coord = new Coordinate(this)
    this._timestamp = this.timestamp
    return this._coord
  }

  resolve(...args) {
    if (!this._coord || this._timestamp !== this.timestamp) {
      return this.copy().resolve(...args)
    } else {
      return this._coord.resolve(...args)
    }
  }

  locate(...args) {
    if (!this._coord || this._timestamp !== this.timestamp) {
      return this.copy().locate(...args)
    } else {
      return this._coord.locate(...args)
    }
  }
}

module.exports = Point