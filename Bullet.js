const Events = require('events')

class UpdateObject {
  constructor(self, {events = {}, listener = {}} = {}) {
    Object.assign(this, self)
    this.events = new Events()
    this.listener = listener
    this.nextTick = []
    this.interval = []
    this.timeline = -1
    this.timestamp = 0
    for (const name in events) {
      this.events.on(name, (result) => {
        if (events[name] instanceof Function) {
          events[name].call(this, result)
        }
      })
    }
  }

  update(time) {
    if (!this.birth) this.birth = time
    time -= this.birth
    this.timestamp = time

    // nextTick
    this.nextTick.forEach(({id, func}) => {
      const result = func.call(this, time)
      if (!result) {
        const index = this.nextTick.findIndex(item => item.id === id)
        if (index) this.nextTick.splice(index, 1)
      }
    })

    // Interval
    this.interval.forEach(({args, birth}) => {
      const maxTime = args.length > 2 ? args[1] * args[0] : Infinity
      const period = args.length > 3 ? (this.timestamp - birth) % args[2] : this.timestamp - birth
      const start = args.length > 4 ? args[3] : 0
      const getAge = stamp => Math.floor((stamp - birth) / args[0])
      if (getAge(this.timestamp) > getAge(this.timeline) && start + period < maxTime) {
        return args[args.length - 1](this.timestamp)
      }
    })

    // Mutate
    if (this.mutate) this.mutate(time)

    // Listen
    for (const name in this.listener) {
      const result = this.listener[name].call(this, time)
      if (result) this.events.emit(name, result)
    }

    // Display
    if (this.display) this.display(time)
    this.timeline = time
  }

  // API
  setNextTick(func) {
    const id = Math.random() * 1e10
    this.nextTick.push({ id, func })
  }

  setInterval(...args) {
    const id = Math.random() * 1e10
    const birth = this.timestamp
    this.interval.push({ id, args, birth })
    return id
  }

  removeInterval(id) {
    const index = this.interval.findIndex(item => item.id === id)
    if (index) this.interval.splice(index, 1)
  }

  setTimeout(time, callback) {
    this.setNextTick(() => {
      if (this.timeline < time && this.timestamp >= time) {
        callback.call(this, time)
      } else {
        return true
      }
    })
  }
}

class Point extends UpdateObject {
  constructor(...args) {
    super(...args)
    if (!this.x) this.x = 0
    if (!this.y) this.y = 0
    if (!this.rel) this.rel = 'base'
    if (!this.ref) this.ref = {}
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

  display() {
    if (!this.context) return
    if (this.show === false) return
    this.context.beginPath()
    this.context.arc(this.xabs, this.yabs, this.radius, 0, Math.PI * 2)
    this.context.closePath()
    this.context.fillStyle = this.color
    this.context.fill()
  }

  getDistance(point) {
    return Math.sqrt((this.xabs - point.xabs) ** 2 + (this.yabs - point.yabs) ** 2)
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
    this.x = this.context.canvas.width / 2
    this.y = this.context.canvas.height / 8 * 7
    this.display()
  }

  mutate() {
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
    if (this.x > this.context.canvas.width) this.x = this.context.canvas.width
    if (this.y > this.context.canvas.height) this.y = this.context.canvas.height
  }
}

class Bullet extends Point {
  constructor(state, reference, events, listener) {
    super(state, {
      events: Object.assign({}, Bullet.callback, events),
      listener: Object.assign({}, Bullet.listener, listener)
    })
    this.ref = {}
    for (const key in reference) {
      this.ref[key] = reference[key].copy()
    }
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
    //this.ref.self.locate().hp = Math.min(event.dist, this.ref.self.locate().hp)
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
    const right = this.xabs > this.context.canvas.width
    const bottom = this.yabs > this.context.canvas.height
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

module.exports = { UpdateObject, Point, Bullet, Self }