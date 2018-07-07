const { Point, Bullet } = require('./Bullet')

class Barrage {
  constructor({reference = {}, mutate, mounted}) {
    this._ref = {}
    this.prop = {}
    this.bullets = []
    this.timeline = -1
    this.mutate = mutate
    this.mounted = mounted
    for (const key in reference) {
      if (reference[key] instanceof Point) {
        this._ref[key] = reference[key]
      } else {
        this._ref[key] = new Point(reference[key])
      }
    }
    this.ref = this._ref
  }

  update(time) {
    if (!this.birth) this.birth = time
    time -= this.birth
    this.timestamp = time
    for (const key in this._ref) {
      this._ref[key].update(time)
    }
    for (const item of (this.mutate(time) || [])) {
      this.pushBullet(item)
    }
    this.bullets.forEach(bullet => bullet.update(time))
    this.timeline = time
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
    const bullet = new Bullet(state, this.ref, events, listener)
    Object.assign(bullet, this.prop)
    bullet.id = Math.random() * 1e10
    bullet.parent = this
    bullet.mutate = item.mutate
    bullet.context = this.context
    bullet.birth = this.timestamp
    this.bullets.push(bullet)
  }

  setInterval(interval, ...args) {
    const maxTime = args.length > 1 ? args[0] * interval : Infinity
    const period = args.length > 2 ? this.timestamp % args[1] : this.timestamp
    const start = args.length > 3 ? args[2] : 0
    const getAge = stamp => Math.floor(stamp / interval)
    if (getAge(this.timestamp) > getAge(this.timeline) && start + period < maxTime) {
      return args[args.length - 1](this.timestamp)
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

module.exports = Barrage