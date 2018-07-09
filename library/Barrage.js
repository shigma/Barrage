const { UpdateObject, Point } = require('./Bullet')

class Bullet extends Point {
  constructor(state, {events, listener}) {
    super(state, {
      events: Object.assign({}, Bullet.callback, events),
      listener: Object.assign({}, Bullet.listener, listener)
    })
    this.show = true
  }

  mount(display) {
    if (display instanceof Function) {
      this.display = function(...args) {
        if (this.show) display.call(this, ...args)
      }
    } else if (this.style in Bullet.template) {
      this.display = function(...args) {
        if (this.show) Bullet.template[this.style].call(this, ...args)
      }
    }
    if (this.mounted) this.mounted(this.parent)
  }

  destroy() {
    const id = this.id
    this.parent.setNextTick(function() {
      const index = this.bullets.findIndex(bullet => bullet.id === id)
      if (index) this.bullets.splice(index, 1)
    })
  }

  drawTemplate(style) {
    return Bullet.template[style].call(this)
  }

  fillCircle(fill = this.color, radius = this.radius) {
    this.context.beginPath()
    this.context.arc(this.xabs, this.yabs, radius, 0, Math.PI * 2)
    this.context.closePath()
    this.context.fillStyle = fill.output ? fill.output() : fill
    this.context.fill()
  }

  getGradient(c1, c2, r1, r2 = this.radius) {
    const gradient = this.context.createRadialGradient(
      this.xabs, this.yabs, r1,
      this.xabs, this.yabs, r2
    )
    gradient.addColorStop(0, c1.output ? c1.output() : c1)
    gradient.addColorStop(1, c2.output ? c2.output() : c2)
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
  hitSelf() {
    this.parent.ref.self.hp --
    this.destroy()
  },
  leave() {
    this.destroy()
  }
}

Bullet.listener = {
  hitSelf(){
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
  constructor({reference = {}, mutate, mounted, events = {}, listener = {}, methods = {}}) {
    super(Object.assign(methods, { mutate, mounted }), {
      events: Object.assign({}, Barrage.callback, events),
      listener: Object.assign({}, Barrage.listener, listener)
    })
    this._ref = reference
    this.bullets = []
  }

  // Display: bullets update cycle
  display(time) {
    this.bullets.forEach(bullet => bullet.update(time))
    if (this.bullets.length > Barrage.maxBulletCount) {
      throw new Error(`Error: The amount of bullets is beyond the limit!`)
    }
  }

  // Mount: bind context and register reference
  mount(context) {
    this.context = context

    // set reference
    this.ref = {}
    for (const key in this._ref) {
      this.setReference(key, this._ref[key])
    }
    delete this._ref

    // callback set by users
    if (this.mounted) this.mounted()

    // reference auto update
    this.setNextTick((time) => {
      for (const key in this.ref) {
        if (!this.ref[key].inserted) this.ref[key].update(time)
      }
      return true
    })
  }

  parsePoint(type, {state = {}, events, listener, mutate, mounted}) {
    return new type(Object.assign(state, {
      mutate,
      mounted,
      parent: this,
      context: this.context,
      birth: this.timestamp,
      id: Math.random() * 1e10
    }), {events, listener})
  }

  setReference(key, data) {
    const point = this.parsePoint(Point, data)
    if (point.mounted) point.mounted.call(point, this)
    this.ref[key] = point
  }

  pushBullet(data) {
    const bullet = this.parsePoint(Bullet, data)

    // Bind reference
    bullet.ref = {}
    for (const key in this.ref) {
      bullet.ref[key] = this.ref[key].copy()
    }
    bullet.mount(data.display)

    // Insert into bullet array
    const layer = bullet.layer = data.layer || 0
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

module.exports = { Barrage, Bullet }