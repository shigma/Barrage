const Point = require('./point')
const Bullet = require('./bullet')
const UpdateObject = require('./update')

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
    const id = Math.random() * 1e10
    return new type(Object.assign(state, {
      id,
      mutate,
      mounted,
      parent: this,
      context: this.context,
      birth: this.timestamp
    }), {events, listener})
  }

  setReference(key, data) {
    const point = this.parsePoint(Point, data)
    if (point.mounted) point.mounted.call(point, this)
    if (data.display) point.display = function(time, delta) {
      if (this.show !== false) data.display.call(this, time, delta)
    }
    this.ref[key] = point
  }

  pushBullet(data) {
    const bullet = this.parsePoint(Bullet, data)

    // Bind reference and display
    bullet.ref = {}
    bullet.link = Object.assign({}, this.ref)
    for (const key in this.ref) {
      bullet.ref[key] = this.ref[key].copy()
    }
    bullet.mount(data.display)

    // Insert into bullet array
    const layer = bullet.layer = data.layer || 0
    const index = this.bullets.findIndex(bullet => bullet.layer > layer)
    if (index < 0) {
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

Barrage.maxBulletCount = 4096

Barrage.callback = {}

Barrage.listener = {}

module.exports = Barrage