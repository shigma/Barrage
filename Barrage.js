const { UpdateObject, Point } = require('./Bullet')

class Bullet extends Point {
  constructor(state, reference, events, listener, display) {
    super(state, {
      events: Object.assign({}, Bullet.callback, events),
      listener: Object.assign({}, Bullet.listener, listener)
    })
    this.show = true
    this.ref = {}
    for (const key in reference) {
      this.ref[key] = reference[key].copy()
    }

    if (display instanceof Function) {
      this.display = function(...args) {
        if (this.show) display.call(this, ...args)
      }
    } else if (this.style in Bullet.template) {
      this.display = function(...args) {
        if (this.show) Bullet.template[this.style].call(this, ...args)
      }
    }
  }

  destroy() {
    const id = this.id
    this.parent.setNextTick(function() {
      const index = this.bullets.findIndex(bullet => bullet.id === id)
      if (index) this.bullets.splice(index, 1)
    })
  }

  drawTemplate(style, ...args) {
    return Bullet.template[style].call(this, ...args)
  }

  fillCircle(fill = this.color, radius = this.radius) {
    this.context.beginPath()
    this.context.arc(this.xabs, this.yabs, radius, 0, Math.PI * 2)
    this.context.closePath()
    this.context.fillStyle = fill
    this.context.fill()
  }

  getGradient(c1, c2, r1, r2 = this.radius) {
    const gradient = this.context.createRadialGradient(
      this.xabs, this.yabs, r1,
      this.xabs, this.yabs, r2
    )
    gradient.addColorStop(0, c1)
    gradient.addColorStop(1, c2)
    return gradient
  }
}

Bullet.template = {
  border() {
    const gradient = this.getGradient(this.color, this.bdColor, this.innerR || 0)
    this.fillCircle(gradient)
  }
}

Bullet.callback = {
  collideSelf() {
    this.parent.ref.self.hp --
    this.destroy()
  },
  leave() {
    this.destroy()
  }
}

Bullet.listener = {
  collideSelf(){
    const self = this.parent.ref.self
    const dist = this.getDistance(self)
    const result = dist < this.radius + self.radius
    if (result) return true
  },
  border() {
    const top = this.yabs < 0
    const left = this.xabs < 0
    const right = this.xabs > this.context.canvas.width
    const bottom = this.yabs > this.context.canvas.height
    if (top || left || right || bottom) {
      return { top, left, right, bottom }
    }
  },
  leave() {
    return this.x * this.x + this.y * this.y > 1e6
  }
}

class Barrage extends UpdateObject {
  constructor({reference = {}, mutate, mounted, events = {}, listener = {}}) {
    super({ mutate, mounted }, {
      events: Object.assign({}, Barrage.callback, events),
      listener: Object.assign({}, Barrage.listener, listener)
    })
    this._ref = {}
    for (const key in reference) {
      if (reference[key] instanceof Point) {
        this._ref[key] = reference[key]
      } else {
        const point = new Point(reference[key].state || {})
        point.mutate = reference[key].mutate
        if (reference[key].mounted) {
          reference[key].mounted.call(point)
        }
        this._ref[key] = point
      }
    }
    this.prop = {}
    this.bullets = []
    this.ref = this._ref
    this.setNextTick((time) => {
      for (const key in this._ref) {
        this._ref[key].update(time)
      }
      return true
    })
  }

  display(time) {
    this.bullets.forEach(bullet => bullet.update(time))
    if (this.bullets.length > Barrage.maxBulletCount) {
      throw new Error(`Error: The amount of bullets is beyond the limit!`)
    }
  }

  setContext(context) {
    this.context = context
    for (const key in this.ref) {
      this.ref[key].context = context
    }
    if (this.mounted) this.mounted()
  }

  pushBullet({
    layer = 0,
    state = {},
    events = {},
    listener = {},
    mounted,
    mutate,
    display
  }) {
    const bullet = new Bullet(state, this.ref, events, listener, display)
    Object.assign(bullet, this.prop)
    bullet.id = Math.random() * 1e10
    bullet.layer = layer
    bullet.mutate = mutate
    bullet.parent = this
    bullet.context = this.context
    bullet.birth = this.timestamp
    if (mounted) mounted.call(bullet)
    const index = this.bullets.findIndex(bullet => bullet.layer > layer)
    if (!index) {
      this.bullets.push(bullet)
    } else {
      this.bullets.splice(index, 0, bullet)
    }
  }

  emitBullets(...args) {
    const start = args.length > 2 ? args[0] : 0
    const end = args.length > 1 ? args.length > 2 ? args[1] : args[0] : 1
    const step = args.length > 3 ? args[2] : 1
    for (let index = start; index < end; index += step) {
      const callback = args[args.length - 1]
      if (callback instanceof Function) {
        this.pushBullet(callback(index))
      } else {
        this.pushBullet(callback)
      }
    }
  }
}

Barrage.maxBulletCount = 1024

Barrage.callback = {}

Barrage.listener = {}

module.exports = Barrage