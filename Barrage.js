const { UpdateObject, Point, Bullet } = require('./Bullet')

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
  }

  setContext(context) {
    this.context = context
    for (const key in this.ref) {
      this.ref[key].context = context
    }
    if (this.mounted) this.mounted()
  }

  pushBullet(item) {
    const state = item.state || {}
    const events = item.events || {}
    const listener = item.listener || {}
    const bullet = new Bullet(state, this.ref, events, listener, item.display)
    Object.assign(bullet, this.prop)
    bullet.id = Math.random() * 1e10
    bullet.parent = this
    bullet.mutate = item.mutate
    bullet.context = this.context
    bullet.birth = this.timestamp
    if (item.mounted) item.mounted.call(bullet)
    this.bullets.push(bullet)
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

Barrage.callback = {}

Barrage.listener = {}

module.exports = Barrage