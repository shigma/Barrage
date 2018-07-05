const { Bullet } = require('./Bullet')

class Barrage {
  constructor({source, target, generate, context, emitter}) {
    this.source = source
    this.target = target
    this.context = context
    this.emitter = emitter
    this.generate = generate
    this.bullets = []
    this.timeline = 0
  }

  update(time = 0) {
    if (this.source.mutate) this.source.mutate(time)
    if (this.emitter(time)) {
      this.bullets.push(...this.generate(time).map((data) => {
        return Bullet[data.mode](data, data.mutate, this.context)
      }))
    }
    this.timeline = time
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i]
      bullet.mutate(time)
      bullet.draw()
      if (bullet.offCanvas) this.bullets.splice(i, 1)
    }
  }
}

module.exports = Barrage