const Vue = require('vue/dist/vue.common')
Vue.config.productionTip = false

const Utility = require('./utility')
const Barrage = require('./Barrage')
const { Point } = require('./Bullet')

new Vue({
  el: '#app',

  data() {
    return {
      barrages: [],
      active: 0,
      stopTime: 0,
      lastTime: 0
    }
  },

  mounted() {
    const canvas = this.$refs.canvas
    this.context = canvas.getContext('2d')
    this.addBarrage({
      source: new Point({ x: 200, y: 200, f: 0 }, function(timeline) {
        this.face = timeline / 1000 * Math.PI
      }),
      generate: function(time) {
        return Barrage.mapBullet({
          mode: 'relBullet',
          count: 10,
          initial: {
            src: Object.assign({}, this.source),
            dist: 0,
            face: this.source.face,
            vdist: 2,
            vface: Math.PI / 200,
            r: 10,
            c: Utility.rgb(0,
              0.5 - 0.4 * Math.sin(time / 1000),
              0.5 + 0.4 * Math.sin(time / 1000)
            )
          },
          step: {
            face: Math.PI / 6
          },
          mutate(time) {
            this.vdist *= 1.02
          }
        })
      },
      emitter(time) {
        return Math.floor(time / 200) > Math.floor(this.timeline / 200)
      }
    })
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
      <button @click="toggle">红红火火恍恍惚惚</button>
    </div><p>{{stopTime}}</p><p>{{lastTime}}</p>
  </div>`
})
