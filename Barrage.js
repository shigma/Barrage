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

  update(time = 0) {
    for (const key in this._ref) {
      this._ref[key].update(time)
    }
    this.bullets.push(...(this.mutate(time) || []).map(({
      state = {},
      events = {},
      listener = {},
      mutate = () => {}
    }) => {
      const bullet = new Bullet(state, this.ref, events, listener)
      Object.assign(bullet, this.prop)
      bullet.id = Math.random() * 1e10
      bullet.birth = time
      bullet.mutate = mutate
      bullet.parent = this
      bullet.context = this.context
      return bullet
    }))
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
}

module.exports = Barrage