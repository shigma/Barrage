const Vue = require('vue/dist/vue.common')
Vue.config.productionTip = false

const Barrage = require('./Barrage')
const { Self } = require('./Bullet')

new Vue({
  el: '#app',

  data() {
    return {
      barrages: [],
      active: null,
      stopTime: 0,
      lastTime: 0,
      keyState: {
        ArrowLeft: false,
        ArrowDown: false,
        ArrowRight: false,
        ArrowUp: false
      }
    }
  },

  mounted() {
    const canvas = this.$refs.canvas
    this.context = canvas.getContext('2d')

    this.self = new Self({
      context: this.context,
      keyState: this.keyState,
      x: canvas.width / 2,
      y: canvas.height / 8 * 7,
      v: 8,
      r: 4,
      c: 'black'
    })

    this.self.draw()
    this.addBarrage(require('./barrages/bar1'))
    this.barrages.forEach(barrage => barrage.update())
  },

  methods: {
    addBarrage(object) {
      const barrage = new Barrage(object)
      barrage.id = Math.random() * 1e10
      barrage.context = this.context
      this.barrages.push(barrage)
      return barrage.id
    },
    clearBarrages() {
      this.barrages = []
    },
    display(timestamp) {
      this.context.clearRect(0, 0, this.$refs.canvas.width, this.$refs.canvas.height)
      this.barrages.forEach(barrage => barrage.update(timestamp - this.stopTime))
      this.self.update()
      this.active = requestAnimationFrame(this.display)
    },
    toggle() {
      if (this.active) {
        this.lastTime = performance.now()
        window.cancelAnimationFrame(this.active)
        this.active = 0
      } else {
        this.stopTime += performance.now() - this.lastTime
        this.active = requestAnimationFrame(this.display)
      }
    }
  },

  template: `<div class="main"
    @keydown="keyState[$event.key] = true"
    @keyup="keyState[$event.key] = false">
    <canvas class="left" ref="canvas" width="400" height="600"/>
    <div class="right" ref="div">
      <button @click="toggle">
        <div>{{ active ? 'Pause' : active === null ? 'Start' : 'Resume' }}</div>
      </button>
    </div>
  </div>`
})
