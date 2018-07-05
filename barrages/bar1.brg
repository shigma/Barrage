const { Point } = require('../Bullet')
const Utility = require('../utility')

module.exports = {
  source: new Point({
    x: 200,
    y: 200,
    f: 0,
    mutate(time) {
      this.face = time / 1000 * Math.PI
      this.x = 200 + Math.sin(time / 1000) * 100
    }
  }),
  generate: function(time) {
    const result = []
    for (let i = 0; i < 10; i++) {
      result.push({
        mode: 'relBullet',
        src: Object.assign({}, this.source),
        dist: 0,
        face: this.source.face + Math.PI / 6 * i,
        vdist: 2,
        vface: Math.PI / 200,
        r: 10,
        c: Utility.rgb(0,
          0.5 - 0.4 * Math.sin(time / 1000),
          0.5 + 0.4 * Math.sin(time / 1000)
        ),
        mutate(time) {
          this.vdist *= 1.02
        }
      })
    }
    return result
  },
  emitter(time) {
    return Math.floor(time / 200) > Math.floor(this.timeline / 200)
  }
}