class UpdateObject {
  constructor(self, {events = {}, listener = {}} = {}) {
    Object.assign(this, self)
    this.events = events
    this.listener = listener
    this.nextTick = []
    this.interval = []
    this.timeline = -1
    this.timestamp = 0
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
      if (result) this.triggerEvent(name, result)
    }

    // Display
    this.status = 'display'
    if (this.display) this.display(time, delta)
    this.timeline = time

    if (this.nextTick.length > UpdateObject.nextTickLimit) {
      throw new Error(`Error: The amount of nextTicks (${this.nextTick.length}) is beyond the limit!`)
    }
    if (this.interval.length > UpdateObject.intervalLimit) {
      throw new Error(`Error: The amount of intervals (${this.interval.length}) is beyond the limit!`)
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
      return true
    }
    return false
  }

  setTimeout(timeout, callback) {
    timeout += this.timestamp
    this.setNextTick(() => {
      if (this.timeline < timeout && this.timestamp >= timeout) {
        callback.call(this, this.timestamp, this.timestamp - this.timeline)
      } else {
        return true
      }
    })
  }

  triggerEvent(key, ...args) {
    if (key in this.events) {
      return this.events[key].call(this, ...args)
    }
  }
}

UpdateObject.nextTickLimit = 128
UpdateObject.intervalLimit = 16

module.exports = UpdateObject