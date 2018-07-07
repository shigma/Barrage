const { dialog } = require('electron').remote
const Vue = require('vue/dist/vue.common')
Vue.config.productionTip = false

const { Self } = require('./Bullet')

const MinFrame = 10

new Vue({
  el: '#app',

  data() {
    const keyState = {
      ArrowLeft: false,
      ArrowDown: false,
      ArrowRight: false,
      ArrowUp: false,
      Shift: false
    }
    return {
      frameTime: 0,
      frameCount: 0,
      filename: '',
      active: null,
      stopTime: 0,
      lastTime: 0,
      self: new Self({
        hp: 1000,
        x: 0,
        y: 0,
        v: 6,
        radius: 6,
        color: 'grey',
        keyState
      })
    }
  },

  computed: {
    frameRate() {
      if (this.frameCount) {
        return Math.round(1000 / (this.frameTime - this.stopTime) * this.frameCount)
      } else {
        return Math.round(1000 / MinFrame)
      }
    }
  },

  mounted() {
    this.barrages = []
    this.backgroundcolor = 'black'
    const canvas = this.$refs.canvas
    this.context = canvas.getContext('2d')
    this.context.fillStyle = this.backgroundcolor
    this.context.fillRect(0, 0, this.$refs.canvas.width, this.$refs.canvas.height)
    this.self.initialize(this.context)
    addEventListener('keydown', event => this.self.keyState[event.key] = true)
    addEventListener('keyup', event => this.self.keyState[event.key] = false)
  },

  methods: {
    addBarrage(barrage) {
      barrage.id = Math.random() * 1e10
      barrage.setContext(this.context)
      barrage.ref.self = this.self
      this.barrages.push(barrage)
      return barrage.id
    },
    display(timestamp) {
      if (timestamp - this.frameTime > MinFrame) {
        this.context.fillStyle = this.backgroundcolor
        this.context.fillRect(0, 0, this.$refs.canvas.width, this.$refs.canvas.height)
        this.barrages.forEach(barrage => barrage.update(timestamp - this.stopTime))
        this.self.update()
        this.frameCount += 1
        this.frameTime = timestamp
      }
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

  template: `<div class="main">
    <canvas class="left" ref="canvas" width="400" height="600"/>
    <div class="right" align="center" ref="div">
      <button @click="toggle">
        <div>{{ active ? 'Pause' : active === null ? 'Start' : 'Resume' }}</div>
      </button>
      <button @click="loadFile">
        <div>Load</div>
      </button>
      <p>{{ filename || 'No file loaded.' }}</p>
      <p>Hp: {{ self.hp || 0 }}</p>
      <p>Fps: {{ frameRate }}</p>
    </div>
  </div>`
})
