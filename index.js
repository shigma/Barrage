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
      lastTime: 0,
      x: 0,
      y: 0,
      aleft: false, aright: false, aup: false, adown: false,
      v: 5,
    }
  },

  mounted() {
    const canvas = this.$refs.canvas

    this.x = this.$refs.canvas.width/2,
    this.y = this.$refs.canvas.height/8*7,

    this.context = canvas.getContext('2d')

    document.addEventListener("keydown",event => this.accelerate(event,true));
    document.addEventListener("keyup",event => this.accelerate(event,false));

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

      this.updateself();

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
    accelerate(event,dir){
      switch(event.key){
        case 'ArrowLeft':{//left
          this.aleft=dir;
          break;
        }
        case 'ArrowUp':{//up
          this.aup=dir;
          break;
        }
        case 'ArrowRight':{//right
          this.aright=dir;
          break;
        }
        case 'ArrowDown':{//down
          this.adown=dir;
          break;
        }
      }
    },
    updateself(){
      var speed = this.v;
      var ss = 0;
      var sizex = 10, sizey = 10;
      var scrw = this.$refs.canvas.width, scrh = this.$refs.canvas.height;

      if(this.aup||this.adown)ss++;
      if(this.aright||this.aleft)ss++;
      speed/=Math.sqrt(ss);
      
      if(this.aleft){
        this.x-=speed;
      }
      if(this.aright){
        this.x+=speed;
      }
      if(this.aup){
        this.y-=speed;
      }
      if(this.adown){
        this.y+=speed;
      }
      
      if(this.x<0)this.x=0;
      if(this.y<0)this.y=0;
      if(this.x>scrw-sizex)self.x=scrw-sizex;
      if(this.y>scrh-sizey)self.y=scrh-sizey;

      this.context.fillStyle = 'yellow';
      this.context.fillRect(this.x,this.y,sizex,sizey);

    }
  },

  template: `<div class="main">
    <canvas class="left" ref="canvas" width="400" height="600"/>
    <div class="right" ref="div">
      <button @click="toggle">
        <div>{{ active ? 'Pause' : active === null ? 'Start' : 'Resume' }}</div>
      </button>
      </div><p>{{x}}</p><p>{{aup}}</p>
    </div>
  </div>`
})
