class Point {
  constructor(data) {
    Object.assign(this, data)
  }

  draw() {
    if (!this.context) return
    this.context.beginPath()
    this.context.arc(this.x, this.y, this.r, 0, Math.PI * 2, true)
    this.context.closePath()
    this.context.fillStyle = this.c
    this.context.fill()
  }

  get canvas() {
    if (this.context) {
      return this.context.canvas
    } else {
      return undefined
    }
  }

  get offCanvas() {
    if (!this.context) return false
    return this.x > this.canvas.width || this.x < 0
      || this.y > this.canvas.height || this.y < 0
  }
}

class Self extends Point {
  constructor(data) {
    super(data)
  }

  update() {
    const speed = this.v / Math.sqrt(
      (this.keyState.ArrowDown ^ this.keyState.ArrowUp) +
      (this.keyState.ArrowLeft ^ this.keyState.ArrowRight) || 1
    )

    this.x += speed * this.keyState.ArrowRight
    this.x -= speed * this.keyState.ArrowLeft
    this.y += speed * this.keyState.ArrowDown
    this.y -= speed * this.keyState.ArrowUp
    
    if (this.x < 0) this.x = 0
    if (this.y < 0) this.y = 0
    if (this.x > this.canvas.width) this.x = this.canvas.width
    if (this.y > this.canvas.height) this.y = this.canvas.height

    this.draw()
  }
}

class Bullet extends Point {
  constructor(state, mutate, context) {
    super(state)
    this.mutate = mutate
    this.context = context
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

module.exports = { Point, Bullet, Self }