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

  mutate(time = 0) {
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

Barrage.mapBullet = function({mode, count, initial, step, mutate}) {
  const result = [], current = Object.assign({}, initial)
  for (let index = 0; index < count; index++) {
    result.push(Object.assign({mode, mutate}, current))
    for (const key in step) {
      if (step[key] instanceof Function) {
        current[key] = step[key](current[key])
      } else {
        current[key] += step[key]
      }
    }
  }
  return result
}

module.exports = Barrage