const { dialog } = require('electron').remote
const Vue = require('vue/dist/vue.common')
Vue.config.productionTip = false

const Barrage = require('./Barrage')
const { Self } = require('./Bullet')

new Vue({
  el: '#app',

  data() {
    const keyState = {
      ArrowLeft: false,
      ArrowDown: false,
      ArrowRight: false,
      ArrowUp: false
    }
    return {
      filename: '',
      barrages: [],
      active: null,
      stopTime: 0,
      lastTime: 0,
      keyState,
      self: new Self({
        x: 0,
        y: 0,
        v: 8,
        r: 6,
        c: 'black',
        keyState
      })
    }
  },

  mounted() {
    const canvas = this.$refs.canvas
    this.context = canvas.getContext('2d')
    this.self.initialize(this.context)
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
    },
    loadFile() {
      dialog.showOpenDialog(null, {
        title: 'Load Barrage',
        properties: ['openFile'],
        filters: [
          { name: 'Barrage', extensions: ['brg'] }
        ]
      }, (filepaths) => {
        if (filepaths) {
          this.barrages = []
          if (this.active) {
            this.lastTime = performance.now()
            window.cancelAnimationFrame(this.active)
          }
          this.active = null
          this.context.clearRect(0, 0, this.$refs.canvas.width, this.$refs.canvas.height)
          this.self.initialize()
          try {
            this.addBarrage(require(filepaths[0]))
            this.filename = filepaths[0].slice(__dirname.length + 10, -4)
          } catch (error) {
            this.filename = ''
            console.error(error)
          }
        }
      })
    }
  },

  template: `<div class="main"
    @keydown="keyState[$event.key] = true"
    @keyup="keyState[$event.key] = false">
    <canvas class="left" ref="canvas" width="400" height="600"/>
    <div class="right" align="center" ref="div">
      <button @click="toggle">
        <div>{{ active ? 'Pause' : active === null ? 'Start' : 'Resume' }}</div>
      </button>
      <button @click="loadFile">
        <div>Load</div>
      </button>
      <p>{{ filename || 'No file loaded.' }}</p>
    </div>
  </div>`
})
