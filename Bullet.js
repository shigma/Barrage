const Events = require('events')

class Point {
  constructor(data) {
    Object.assign(this, data)
    if (!data.x) this.x = 0
    if (!data.y) this.y = 0
    if (!data.rel) this.rel = 'base'
    if (!data.ref) this.ref = {}
    this.timeline = -1
    this.birth = 0
  }

  get canvas() {
    return this.context ? this.context.canvas : undefined
  }

  get xabs() {
    const relative = this.ref[this.rel]
    return this.x + (relative ? relative.x : 0)
  }

  get yabs() {
    const relative = this.ref[this.rel]
    return this.y + (relative ? relative.y : 0)
  }

  switchRel(rel) {
    const relative = this.ref[this.rel]
    this.x += relative.x - this.ref[rel].x
    this.y += relative.y - this.ref[rel].y
    this.rel = rel
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

  distance(point) {
    const x = point.xabs || point.x
    const y = point.yabs || point.y
    return Math.sqrt((this.xabs - x) ^ 2 + (this.yabs - y) ^ 2)
  }

  update(time) {
    time -= this.birth
    this.timestamp = time
    if (this.mutate) this.mutate(time)
    this.draw(time)
    this.timeline = time
  }

  copy() {
    const _this = this
    function locate() {
      return Object.assign({}, _this, {locate})
    }
    return locate()
  }
}

class Self extends Point {
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
    ) / (this.keyState.Shift ? 4 : 1)

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

class BulletEvent extends Events {
  constructor(bullet, events) {
    super()
    for (const name in events) {
      this.on(name, (...args) => {
        if (events[name] instanceof Function) {
          events[name].call(bullet, ...args)
        }
      })
    }
  }
}

class Bullet extends Point {
  constructor(state, reference, events, listener) {
    super(state)
    this.ref = {}
    for (const key in reference) {
      this.ref[key] = reference[key].copy()
    }
    const _events = Object.assign({}, Bullet.callback, events)
    this.events = new BulletEvent(this, _events)
    this.listener = Object.assign({}, Bullet.listener, listener)
  }

  update(time) {
    time -= this.birth
    this.timestamp = time
    this.mutate(time)
    this.draw(time)
    for (const name in this.listener) {
      const result = this.listener[name].call(this, time)
      if (result) this.events.emit(name, result)
    }
    this.timeline = time
  }

  polarLocate() {
    const relTheta = this.ref.base ? (this.ref.base.theta || 0) : 0
    this.x = this.rho * Math.cos(relTheta + this.theta)
    this.y = this.rho * Math.sin(relTheta + this.theta)
  }

  movePolar(rho, theta) {
    this.x += rho * Math.cos(theta)
    this.y += rho * Math.sin(theta)
  }

  getTheta(point) {
    if (point.x === this.xabs) {
      if (point.y >= this.yabs) {
        return Math.PI / 2
      } else {
        return -Math.PI / 2
      }
    } else {
      const result = Math.atan((point.y - this.yabs) / (point.x - this.xabs))
      if (point.x > this.xabs) {
        return result
      } else {
        return Math.PI + result
      }
    }
  }
}

Bullet.callback = {
  collideSelf(event){
    this.ref.self.locate().hp = Math.min(event.dist, this.ref.self.locate().hp)
    if(event.result){
      this.parent.ref.self.hp --
      const index = this.parent.bullets.findIndex(bullet => bullet.id === this.id)
      if (index) this.parent.bullets.splice(index, 1)
    }
    //console.log(this.ref.self.locate().hp)
  },
  leave() {
    const index = this.parent.bullets.findIndex(bullet => bullet.id === this.id)
    if (index) this.parent.bullets.splice(index, 1)
  }
}

Bullet.listener = {
  collideSelf(){
    const self = this.parent.ref.self
    const dist = Math.sqrt((this.xabs - self.x) * (this.xabs - self.x) + 
                           (this.yabs - self.y) * (this.yabs - self.y)
    )
    const result = (dist < (this.radius + self.radius) )
    return { dist, result }
  },
  border() {
    const top = this.yabs < 0
    const left = this.xabs < 0
    const right = this.xabs > this.canvas.width
    const bottom = this.yabs > this.canvas.height
    if (top || left || right || bottom) {
      return { top, left, right, bottom }
    }
  },
  leave() {
    return this.x * this.x + this.y * this.y > 1e6
  }
}

Bullet.ReboundOnBorder = function() {
  const x = this.x + this.v * Math.cos(this.t)
  const y = this.y += this.v * Math.sin(this.t)
  if (y > this.context.canvas.height || y < 0) this.t = -this.t
  if (x > this.context.canvas.width || x < 0) this.t = Math.PI - this.t
}

module.exports = { Point, Bullet, Self }