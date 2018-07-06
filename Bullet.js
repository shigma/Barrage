class Point {
  constructor(data) {
    Object.assign(this, data)
    this.timeline = -1
  }

  get rel() {
    return this.ref ? this.ref[this.relkey || 'base'] : undefined
  }

  get canvas() {
    return this.context ? this.context.canvas : undefined
  }

  get xabs() {
    return this.x + (this.rel ? this.rel.x : 0)
  }

  get yabs() {
    return this.y + (this.rel ? this.rel.y : 0)
  }

  draw() {
    if (!this.context) return
    if (this.show === false) return
    this.context.beginPath()
    this.context.arc(this.xabs, this.yabs, this.radius, 0, Math.PI * 2)
    this.context.closePath()
    this.context.fillStyle = this.color
    this.context.fill()
  }

  update(time) {
    if (this.mutate) this.mutate(time)
    this.draw(time)
    this.timeline = time
  }

  copy() {
    return Object.assign({}, this)
  }
}

class Self extends Point {
  constructor(data) {
    super(data)
  }

  initialize(context) {
    if (context) this.context = context
    this.x = this.canvas.width / 2
    this.y = this.canvas.height / 8 * 7
    this.draw()
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
  constructor(mode, state, reference) {
    super(state)
    this.ref = {}
    for (const key in reference) {
      this.ref[key] = reference[key].copy()
    }
    this.move = Bullet.defaultMotions[mode]
  }

  update(time) {
    time -= this.birth || 0
    if (this.move) this.move(time)
    if (this.mutate) this.mutate(time)
    this.draw(time)
    this.listen(time)
  }

  listen(time) {
    for (const name of Bullet.eventList) {
      const event = this['has' + name](time)
      if (event.result) {
        event.target = this
        if (this.events.onLeaveCanvas instanceof Function) {
          this.events['on' + name].call(this.parent, event)
        } else if (this.events.onLeaveCanvas !== 'none') {
          Bullet.defaultCallback['on' + name].call(this.parent, event)
        }
      }
    }
  }
  
  hasLeaveCanvas() {
    const top = this.yabs < 0
    const left = this.xabs < 0
    const right = this.xabs > this.canvas.width
    const bottom = this.yabs > this.canvas.height
    const result = top || left || right || bottom
    return { top, left, right, bottom, result }
  }
}

Bullet.eventList = [ 'LeaveCanvas' ]

Bullet.defaultMotions = {
  xyBullet() {
    this.x += this.vpho * Math.cos(this.vtheta)
    this.y += this.vpho * Math.sin(this.vtheta)
  },
  ptBullet() {
    this.pho += this.dpho
    this.theta += this.dtheta
    const relTheta = this.ref.base.theta || 0
    this.x = this.pho * Math.cos(relTheta + this.theta)
    this.y = this.pho * Math.sin(relTheta + this.theta)
  }
}

Bullet.defaultCallback = {
  onLeaveCanvas(event) {
    const index = this.bullets.findIndex(bullet => bullet.id === event.target.id)
    if (index) this.bullets.splice(index, 1)
  }
}

Bullet.ReboundOnBorder = function() {
  const x = this.x + this.v * Math.cos(this.t)
  const y = this.y += this.v * Math.sin(this.t)
  if (y > this.context.canvas.height || y < 0) this.t = -this.t
  if (x > this.context.canvas.width || x < 0) this.t = Math.PI - this.t
}

module.exports = { Point, Bullet, Self }