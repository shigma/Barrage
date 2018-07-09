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
        this.parent.ref.self.hp --
        this.destroy()
      },
      leave() {
        this.destroy()
      }
    },
    listener: {
      hitSelf() {
        const self = this.ref.self.locate()
        const dist = this.getDistance(self)
        const result = dist < this.radius + self.radius
        if (result) return true
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

  }
}

module.exports = Bullet