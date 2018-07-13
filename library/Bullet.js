const Point = require('./point')

class Bullet extends Point {
  constructor(state, {events, listener}) {
    super(state, {
      events: Object.assign({}, Bullet.events, events),
      listener: Object.assign({}, Bullet.listener, listener)
    })
  }

  mount(display) {
    // display function
    this._display = display

    // style initialization
    if (this.style in Bullet.styles) {
      const data = Bullet.styles[this.style].state || {}
      for (const key in data) {
        if (this[key] === undefined) this[key] = data[key]
      }
    }

    // default values
    if (this.rel === undefined) this.rel = 'base'
    if (this.show === undefined) this.show = true
    if (this.judge === undefined) this.judge = 'circle'

    // mounted callback
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

  get _r() {
    return this.judgeR || this.radius
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
    } else if (this.style in Bullet.styles) {
      Bullet.styles[this.style].display.call(this, time, delta)
    } else {
      this.fillCircle()
    }
  }

  destroy() {
    const id = this.id
    this.parent.setNextTick(function() {
      const index = this.bullets.findIndex(bullet => bullet.id === id)
      if (index >= 0) this.bullets.splice(index, 1)
    })
  }

  drawTemplate(style) {
    if (style in Bullet.styles) {
      return Bullet.styles[style].display.call(this)
    }
  }
}

Bullet.events = {
  hitSelf() {
    this.link.self.hp --
    this.destroy()
  },
  leave() {
    this.destroy()
  }
}

Bullet.listener = {
  hitSelf() {
    if (this.judge === 'circle') {
      const self = this.link.self
      return (this._x - self._x) ** 2 + (this._y - self._y) ** 2 < this._r ** 2 + self._r ** 2
    } else if (this.judge === 'square') {
      const self = this.locate(this.link.self)
      return Math.abs(self.x) < this._r / 2 || Math.abs(self.y) < this._r / 2
    }
  },
  border() {
    return this._y < 0 || this._y > this.context.canvas.height
      || this._x < 0 || this._x > this.context.canvas.width
  },
  leave() {
    return this._x ** 2 + this._y ** 2 > 1e6
  }
}

Bullet.styles = {
  border: {
    state: {
      radius: 6
    },
    display() {
      const gradient = this.getGradient(this.color, this.innerR || 0, this.bdColor)
      this.fillCircle(gradient)
    }
  },
  glow: {
    state: {
      radius: 6
    },
    display() {
      const gradient = this.getGradient('rgba(0,0,0,0)', this.outerR, this.glColor)
      this.fillCircle(gradient, this.outerR)
      this.fillCircle(this.color, this.radius)
    }
  },
  rice: {
    state: {
      thickness: 2,
      radius: 2.5,
      length: 5,
      width: 2.5
    },
    display() {
      this.context.beginPath()
      this.quadraticCurve(
        - this.length, 0,
        - this.length / 2, this.width,
        0, this.width,
        this.length / 2, this.width,
        this.length, 0,
        this.length / 2, - this.width,
        0, - this.width,
        - this.length / 2, - this.width,
        - this.length, 0
      )
      this.context.closePath()
      this.context.lineWidth = this.thickness
      this.context.strokeStyle = this.bdColor.output ? this.bdColor.output() : this.bdColor
      this.context.fillStyle = this.color.output ? this.color.output() : this.color
      this.context.stroke()
      this.context.fill()
    }
  },
  scaly: {
    state: {
      radius: 6
    },
    display() {
      this.context.beginPath()
      this.bezierCurve(
        - this.width, - this.width,
        this.length / 2 - this.width, - this.width,
        this.length - this.width, - this.width / 2,
        this.length - this.width, 0,
        this.length - this.width, this.width / 2,
        this.length / 2 - this.width, this.width,
        - this.width, this.width
      )
      this.context.closePath()
      const color = this.color
      const gradient = this.context.createRadialGradient(
        this._x, this._y - this.width, 0,
        this._x, this._y - this.width, this.length
      )
      const ratio = this.width / this.length
      gradient.addColorStop(0, color.lighter(0.2).output())
      gradient.addColorStop(ratio / 2, color.alpha(0.4).output())
      gradient.addColorStop((ratio + 1) / 2, color.output())
      gradient.addColorStop(1, color.lighter(0.2).output())
      this.context.fillStyle = gradient
      this.context.fill()
    }
  }
}

module.exports = Bullet