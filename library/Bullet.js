const Point = require('./point')

class Bullet extends Point {
  constructor(state, {events, listener}) {
    const _events = Object.assign({}, Bullet.styles.default.events)
    const _listener = Object.assign({}, Bullet.styles.default.listener)
    if (state.style in Bullet.styles) {
      Object.assign(_events, Bullet.styles[state.style].events)
      Object.assign(_listener, Bullet.styles[state.style].listener)
    }
    super(state, {
      events: Object.assign(_events, events),
      listener: Object.assign(_listener, listener)
    })
    if (this.rel === undefined) this.rel = 'base'
    if (this.show === undefined) this.show = true
  }

  mount(display) {
    this._display = display
    if (this.mounted) this.mounted(this.parent)
  }

  get _x() {
    const rel = this.ref[this.rel] || {}
    return this.x + (rel.x || 0)
  }

  get _y() {
    const rel = this.ref[this.rel] || {}
    return this.y + (rel.y || 0)
  }

  polarLocate(rho = this.rho, theta = this.theta) {
    theta += ((this.ref[this.rel] || {}).face || 0)
    this.x = rho * Math.cos(Math.PI * theta)
    this.y = rho * Math.sin(Math.PI * theta)
  }

  display(time, delta) {
    if (!this.show) return
    if (this._display) {
      this._display.call(this, time, delta)
    } else {
      Bullet.styles[this.style || 'default'].display.call(this, time, delta)
    }
  }

  destroy() {
    const id = this.id
    this.parent.setNextTick(function() {
      const index = this.bullets.findIndex(bullet => bullet.id === id)
      if (index) this.bullets.splice(index, 1)
    })
  }

  drawTemplate(style) {
    return Bullet.styles[style].display.call(this)
  }

  fillCircle(fill = this.color, radius = this.radius) {
    this.context.beginPath()
    this.context.arc(this._x, this._y, radius, 0, Math.PI * 2)
    this.context.closePath()
    this.context.fillStyle = fill.output ? fill.output() : fill
    this.context.fill()
  }

  getGradient(c1, c2, r1, r2 = this.radius) {
    const gradient = this.context.createRadialGradient(
      this._x, this._y, r1,
      this._x, this._y, r2
    )
    gradient.addColorStop(0, c1.output ? c1.output() : c1)
    gradient.addColorStop(1, c2.output ? c2.output() : c2)
    return gradient
  }
}

Bullet.styles = {
  default: {
    events: {
      hitSelf() {
        this.link.self.hp --
        this.destroy()
      },
      leave() {
        this.destroy()
      }
    },
    listener: {
      hitSelf() {
        const self = this.link.self
        return (this._x - self._x) ** 2 + (this._y - self._y) ** 2 <
          (this.radius + self.radius) ** 2
      },
      border() {
        return this._y < 0 || this._y > this.context.canvas.height
          || this._x < 0 || this._x > this.context.canvas.width
      },
      leave() {
        return this._x ** 2 + this._y ** 2 > 1e6
      }
    },
    display() {
      this.fillCircle()
    }
  },
  border: {
    display() {
      const gradient = this.getGradient(this.color, this.bdColor, this.innerR || 0)
      this.fillCircle(gradient)
    }
  },
  wedge: {
    display() {
      const coord = this.copy()
      this.context.beginPath()
      this.context.moveTo(...coord.resolve(0, -this.width))
      this.context.bezierCurveTo(
        ...coord.resolve(this.length / 2, -this.width),
        ...coord.resolve(this.length, -this.width / 2),
        ...coord.resolve(this.length, 0))
      this.context.bezierCurveTo(
        ...coord.resolve(this.length, this.width / 2),
        ...coord.resolve(this.length / 2, this.width),
        ...coord.resolve(0, this.width))
      this.context.closePath()
      const color = this.color
      const gradient = this.context.createRadialGradient(
        this._x, this._y, 0,
        this._x, this._y, this.length
      )
      const ratio = this.width / this.length
      gradient.addColorStop(0, color.lighter(0.2).output())
      gradient.addColorStop(ratio / 2, color.alpha(0.4).output())
      gradient.addColorStop((ratio + 1) / 2, color.output())
      gradient.addColorStop(1, color.lighter(0.2).output())
      this.context.fillStyle = gradient
      this.context.fill()
    },
    listener: {
      hitSelf() {
        const pos = this.copy().locate(this.link.self)
        const r = this.link.self.radius
        if (pos.x > 0) {
          const x = pos.x - r * Math.cos(pos.theta)
          const y = pos.y - r * Math.sin(pos.theta)
          return (x / this.length) ** 2 + (y / this.width) ** 2 < 1
        } else if (pos.x > -r) {
          if (pos.y > this.width + r) {
            return false
          } else if (pos.y > this.width) {
            return pos.x ** 2 + (pos.y - this.width) ** 2 < r ** 2
          } else if (pos.y > -this.width) {
            return true
          } else if (pos.y > -this.width - r) {
            return pos.x ** 2 + (pos.y + this.width) ** 2 < r ** 2
          } else {
            return false
          }
        } else {
          return false
        }
      }
    }
  }
}

module.exports = Bullet