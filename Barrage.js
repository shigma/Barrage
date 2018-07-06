const { Point, Bullet } = require('./Bullet')

class Barrage {
  constructor({reference, context, emitter}) {
    this.ref = {}
    this.context = context
    this.emitter = emitter
    this.bullets = []
    this.timeline = 0
    for (const key in reference) {
      if (reference[key] instanceof Point) {
        this.ref[key] = reference[key]
      } else {
        this.ref[key] = new Point(reference[key])
      }
    }
  }

  update(time = 0) {
    for (const key in this.ref) {
      if (this.ref[key].mutate) this.ref[key].mutate(time)
    }
    this.bullets.push(...(this.emitter(time) || []).map((data) => {
      const bullet = new Bullet(data.mode, data.state, this.ref)
      bullet.mutate = data.mutate
      bullet.events = data.events
      bullet.parent = this
      bullet.id = Math.random() * 1e10
      bullet.context = this.context
      return bullet
    }))
    this.timeline = time
    this.bullets.forEach(bullet => bullet.update(time))
  }
}

module.exports = Barrage