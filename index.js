const Vue = require('vue')
const VueCompiler = require('vue-template-compiler/browser')

global.VueCompile = (template) => {
  return VueCompiler.compileToFunctions(template).render
}


new Vue({
  el: '#app',
  mounted() {
    this.ctx = this.$refs.canvas.getContext('2d')
    function draw(context) {
      context.fillStyle = "red"; // 填充颜色为红色
      context.strokeStyle = "blue"; //描边颜色为蓝色	
      context.fillRect(10, 10, 150, 150);
      context.strokeRect(50, 50, 150, 150);
    }
    draw(this.ctx)
  },
  render: VueCompile(`<div class="main">
    <canvas class="left" ref="canvas" width="400" height="600"/>
    <div class="right" ref="div">红红火火恍恍惚惚</div>
  </div>`)
})
