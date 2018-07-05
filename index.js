const Vue = require('vue/dist/vue.common')
Vue.config.productionTip = false

const Barrage = require('./Barrage')

new Vue({
  el: '#app',

  data() {
    return {
      barrages: [],
      active: null,
      stopTime: 0,
      lastTime: 0
    }
  },

  mounted() {
    const canvas = this.$refs.canvas
    this.context = canvas.getContext('2d')
    this.addBarrage(require('./barrages/bar1'))
    this.barrages.forEach(barrage => barrage.mutate())
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
      this.barrages.forEach(barrage => barrage.mutate(timestamp - this.stopTime))
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

  template: `<div class="main">
    <canvas class="left" ref="canvas" width="400" height="600"/>
    <div class="right" ref="div">
      <button @click="toggle">
        <div>{{ active ? 'Pause' : active === null ? 'Start' : 'Resume' }}</div>
      </button>
    </div>
  </div>`
})
