class Point {
  constructor(state, mutate) {
    Object.assign(this, state)
    this.mutate = mutate || (() => {})
  }
}

class Bullet extends Point {
  constructor(state, mutate, context) {
    super(state, mutate)
    this.context = context
  }

  draw() {
    this.context.beginPath()
    this.context.arc(this.x, this.y, this.r, 0, Math.PI * 2, true)
    this.context.closePath()
    this.context.fillStyle = this.c
    this.context.fill()
  }

  get offCanvas() {
    return this.x > this.context.canvas.width || this.x < 0
      || this.y > this.context.canvas.height || this.y < 0
  }
}

Bullet.xyBullet = function(state, mutate, context) {
  return new Bullet(state, function() {
    this.x += this.v * Math.cos(this.t)
    this.y += this.v * Math.sin(this.t)
    if (mutate) mutate.call(this)
  }, context)
}

Bullet.relBullet = function(state, mutate, context) {
  return new Bullet(state, function() {
    this.x = this.src.x + this.dist * Math.cos(this.face)
    this.y = this.src.y + this.dist * Math.sin(this.face)
    this.dist += this.vdist
    this.face += this.vface
    if (mutate) mutate.call(this)
  }, context)
}

Bullet.ReboundOnBorder = function() {
  const x = this.x + this.v * Math.cos(this.t)
  const y = this.y += this.v * Math.sin(this.t)
  if (y > this.context.canvas.height || y < 0) this.t = -this.t
  if (x > this.context.canvas.width || x < 0) this.t = Math.PI - this.t
}

module.exports = { Point, Bullet }