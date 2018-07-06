const { Point, Bullet } = require('./Bullet')

class Barrage {
  constructor({state, reference, context, emitter}) {
    this.ref = {}
    this._ctx_ = context
    this.state = state || {}
    this.emitter = emitter
    this.bullets = []
    this.timeline = -1
    for (const key in reference) {
      if (reference[key] instanceof Point) {
        this.ref[key] = reference[key]
      } else {
        this.ref[key] = new Point(reference[key])
      }
      this.ref[key].context = context
    }
  }

  update(time = 0) {
    for (const key in this.ref) {
      this.ref[key].update(time)
    }
    this.bullets.push(...(this.emitter(time) || []).map((data) => {
      const bullet = new Bullet(data.mode, data.state, this.ref)
      bullet.mutate = data.mutate
      bullet.events = data.events || {}
      bullet.birth = time
      bullet.parent = this
      bullet.id = Math.random() * 1e10
      bullet.context = this._ctx_
      return bullet
    }))
    this.bullets.forEach(bullet => bullet.update(time))
    this.timeline = time
  }

  get context() {
    return this._ctx_
  }

  set context(val) {
    this._ctx_ = val
    for (const key in this.ref) {
      this.ref[key].context = val
    }
  }
}

module.exports = Barrage