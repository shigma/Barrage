const { Point, Bullet } = require('./Bullet')

module.exports = class Barrage {
  constructor({source, target, generator, context, interval, waves = 1}) {
    this.source = source 
    this.target = target
    this.context = context
    this.bullets = []
    const _this = this
    function emit() {
      _this.bullets.push(...generator.call(_this).map((data) => {
        return new Bullet(data, context)
      }))
      if (--waves) clearTimeout(task)
    }
    const task = setInterval(emit, interval)
  }

  draw() {
    this.bullets.forEach(bullet => {
      bullet.draw()
      bullet.mutate()
    })
  }
}