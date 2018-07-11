function location(x, y) {
  const result = [ x, y ]
  return Object.assign(result, {
    x, y,
    get rho() {
      const result = Math.sqrt(x ** 2 + y ** 2)
      this.rho = result
      return result
    },
    get theta() {
      const result = Math.atan2(y, x)
      this.theta = result
      return result
    }
  })
}

class Coordinate {
  constructor(point) {
    Object.assign(this, point)
    this._x = point._x
    this._y = point._y
    this._c = Math.cos(Math.PI * point.face || 0)
    this._s = Math.sin(Math.PI * point.face || 0)
  }

  resolve(...args) {
    let x, y
    if (args.length === 1) {
      x = args[0].x
      y = args[0].y
    } else {
      x = args[0]
      y = args[1]
    }
    return location(
      this._x + x * this._c - y * this._s,
      this._y + x * this._s + y * this._c
    )
  }

  locate(...args) {
    let x, y
    if (args.length === 1) {
      x = args[0]._x - this._x
      y = args[0]._y - this._y
    } else {
      x = args[0] - this._x
      y = args[1] - this._y
    }
    return location(
      x * this._c + y * this._s,
      y * this._c - x * this._s
    )
  }
}

module.exports = Coordinate
