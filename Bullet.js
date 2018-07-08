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
    this.status = 'created'
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
    const delta = time - this.timeline

    // nextTick
    this.status = 'nextTick'
    this._NextTick = []
    this.nextTick.forEach((item) => {
      const result = item.func.call(this, time, delta)
      if (!result) item.birth = -1
    })
    this.nextTick = this.nextTick.filter(item => item.birth >= 0).concat(this._NextTick)

    // Interval
    this.status = 'interval'
    this._Interval = []
    this.interval.forEach(({args, birth}) => {
      const time = this.timestamp - birth
      const maxTime = args.length > 2 ? args[1] * args[0] : Infinity
      const period = args.length > 3 ? time % args[2] : time
      const start = args.length > 4 ? args[3] : 0
      const getAge = stamp => Math.floor((stamp - birth) / args[0])
      if (getAge(time) > getAge(this.timeline - birth) && period - start < maxTime) {
        const iWave = Math.floor((period - start) / args[0])
        const pWave = args.length > 3 ? Math.floor(time / args[2]) : 0
        return args[args.length - 1](time, delta, iWave, pWave)
      }
    })
    this.interval = this.interval.filter(item => item.birth >= 0).concat(this._Interval)

    // Mutate
    this.status = 'mutate'
    if (this.mutate) this.mutate(time, delta)

    // Listen
    this.status = 'listen'
    for (const name in this.listener) {
      const result = this.listener[name].call(this, time, delta)
      if (result) this.events.emit(name, result)
    }

    // Display
    this.status = 'display'
    if (this.display) this.display(time, delta)
    this.timeline = time

    if (this.nextTick.length > UpdateObject.maxNextTickCount) {
      throw `Error: The amount of next-ticks is beyond the limit!`
    }
    if (this.interval.length > UpdateObject.maxIntervalCount) {
      throw `Error: The amount of intervals is beyond the limit!`
    }
  }

  // API
  setNextTick(func) {
    const birth = this.timestamp
    if (this.status === 'nextTick') {
      this._NextTick.push({ func, birth })
    } else {
      this.nextTick.push({ func, birth })
    }
  }

  setInterval(...args) {
    const id = Math.random() * 1e10
    const birth = this.timestamp
    if (this.status === 'interval') {
      this._Interval.push({ id, args, birth })
    } else {
      this.interval.push({ id, args, birth })
    }
    return id
  }

  removeInterval(id) {
    const index = this.interval.findIndex(item => item.id === id)
    if (index) {
      if (this.status === 'interval') {
        this.interval[index].birth = -1
      } else {
        this.interval.splice(index, 1)
      }
    }
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

UpdateObject.maxNextTickCount = 64
UpdateObject.maxIntervalCount = 16

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

  polarLocate() {
    const relTheta = this.ref.base ? (this.ref.base.theta || 0) : 0
    this.x = this.rho * Math.cos(Math.PI * (relTheta + this.theta))
    this.y = this.rho * Math.sin(Math.PI * (relTheta + this.theta))
  }

  movePolar(rho, theta) {
    this.x += rho * Math.cos(Math.PI * theta)
    this.y += rho * Math.sin(Math.PI * theta)
  }

  getTheta(point) {
    if (point.x === this.xabs) {
      if (point.y >= this.yabs) {
        return 0.5
      } else {
        return -0.5
      }
    } else {
      const result = Math.atan((point.y - this.yabs) / (point.x - this.xabs)) / Math.PI
      if (point.x > this.xabs) {
        return result
      } else {
        return 1 + result
      }
    }
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
    this.keyState = {
      ArrowLeft: false,
      ArrowDown: false,
      ArrowRight: false,
      ArrowUp: false,
      Shift: false
    }
    this.display()
  }

  mutate() {
    const speed = this.v / Math.sqrt(
      (this.keyState.ArrowDown ^ this.keyState.ArrowUp) +
      (this.keyState.ArrowLeft ^ this.keyState.ArrowRight) || 1
    ) / (this.keyState.Shift ? 3 : 1)

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

module.exports = { UpdateObject, Point, Self }