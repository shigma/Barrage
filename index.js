const Vue = require('vue/dist/vue.common')
Vue.config.productionTip = false

const { Point } = require('./Bullet')
const Barrage = require('./Barrage')

new Vue({
  el: '#app',

  data() {
    return {
      active: 0
    }
  },

  mounted() {
    const canvas = this.$refs.canvas
    this.context = canvas.getContext('2d')
    this.barrage = new Barrage({
      context: this.context,
      source: new Point({ x: 200, y: 200, v: 0, t: 0 }),
      generator() {
        const result = []
        for (let i = 0; i < 6; i++) {
          result.push({
            x: this.source.x,
            y: this.source.y,
            r: 10,
            v: 6,
            t: Math.PI / 5 + Math.PI / 6 * i,
            c: 'blue' 
          })
        }
        return result
      },
      interval: 5000,
      waves: 5
    })
    this.barrage.draw()
  },

  methods: {
    display() {
      this.context.clearRect(0, 0, this.$refs.canvas.width, this.$refs.canvas.height)
      this.barrage.draw()
      this.active = requestAnimationFrame(this.display)
    },
    toggle() {
      if (this.active) {
        window.cancelAnimationFrame(this.active)
        this.active = 0
      } else {
        this.active = requestAnimationFrame(this.display)
      }
    }
  },

  template: `<div class="main">
    <canvas class="left" ref="canvas" width="400" height="600"/>
    <div class="right" ref="div">
      <button @click="toggle">红红火火恍恍惚惚</button>
    </div>
  </div>`
})
