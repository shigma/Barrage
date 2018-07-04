module.exports = class Bullet {
  constructor({x, y, r, v, t, c, ctx}) {
    this.x = x
    this.y = y
    this.r = r
    this.v = v
    this.t = t
    this.c = c
    this.ctx = ctx
  }

  draw() {
    this.ctx.beginPath()
    this.ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2, true)
    this.ctx.closePath()
    this.ctx.fillStyle = this.c
    this.ctx.fill()
  }

  mutate() {
    this.x += this.v * Math.cos(this.t)
    this.y += this.v * Math.sin(this.t)
    if (this.y > this.ctx.canvas.height || this.y < 0) {
      this.t = -this.t
    }
    if (this.x > this.ctx.canvas.width || this.x < 0) {
      this.t = Math.PI - this.t
    }
  }
}