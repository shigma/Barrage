class Point {
  constructor(state = { x: 0, y: 0, v: 0, t: 0 }, onMove) {
    Object.assign(this, state)
    this.onMove = onMove
  }

  mutate() {
    this.x += this.v * Math.cos(this.t)
    this.y += this.v * Math.sin(this.t)
    if (this.onMove) this.onMove()
  }
}

class Bullet extends Point {
  constructor({x, y, r, v, t, c}, context) {
    super({x, y, r, v, t, c}, function() {
      if (this.y > this.context.canvas.height || this.y < 0) {
        this.t = -this.t
      }
      if (this.x > this.context.canvas.width || this.x < 0) {
        this.t = Math.PI - this.t
      }
    })
    this.context = context
  }

  draw() {
    this.context.beginPath()
    this.context.arc(this.x, this.y, this.r, 0, Math.PI * 2, true)
    this.context.closePath()
    this.context.fillStyle = this.c
    this.context.fill()
  }
}

module.exports = { Point, Bullet }