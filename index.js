const Vue = require('vue/dist/vue.common')
Vue.config.productionTip = false

const Bullet = require('./Bullet')

new Vue({
  el: '#app',

  data() {
    return {
      active: 0
    }
  },

  mounted() {
    const canvas = this.$refs.canvas
    this.ctx = canvas.getContext('2d')
    this.bullet = new Bullet({
      x: 100,
      y: 100,
      r: 25,
      v: 5,
      t: Math.PI / 3,
      c: 'blue',
      ctx: this.ctx
    })
    this.bullet.draw()
  },

  methods: {
    display() {
      this.ctx.clearRect(0, 0, this.$refs.canvas.width, this.$refs.canvas.height)
      this.bullet.draw()
      this.bullet.mutate()
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
