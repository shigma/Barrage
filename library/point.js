const UpdateObject = require('./update')

class Point extends UpdateObject {
  constructor(...args) {
    super(...args)
    if (!this.x) this.x = 0
    if (!this.y) this.y = 0
  }

  get _x() {
    return this.x
  }

  get _y() {
    return this.y
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

  copy() {
    const _this = this
    function locate() {
      return Object.assign({}, _this, {
        _x: _this.x,
        _y: _this.y,
        locate
      })
    }
    return locate()
  }
}

module.exports = Point