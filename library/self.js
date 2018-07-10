const Point = require('./point')

class Self extends Point {
  initialize(context) {
    if (context) this.context = context
    this.x = this.context.canvas.width / 2
    this.y = this.context.canvas.height / 8 * 7
    this.keyState = {
      ArrowLeft: false,
      ArrowDown: false,
      ArrowRight: false,
      ArrowUp: false,
      Shift: false
    }
    this.display()
  }

  mutate() {
    const speed = this.v / Math.sqrt(
      (this.keyState.ArrowDown ^ this.keyState.ArrowUp) +
      (this.keyState.ArrowLeft ^ this.keyState.ArrowRight) || 1
    ) / (this.keyState.Shift ? 3 : 1)

    this.x += speed * this.keyState.ArrowRight
    this.x -= speed * this.keyState.ArrowLeft
    this.y += speed * this.keyState.ArrowDown
    this.y -= speed * this.keyState.ArrowUp
    
    if (this.x < 0) this.x = 0
    if (this.y < 0) this.y = 0
    if (this.x > this.context.canvas.width) this.x = this.context.canvas.width
    if (this.y > this.context.canvas.height) this.y = this.context.canvas.height
  }

  display() {
    const gradient = this.getGradient('white', this.radius / 2)
    this.fillCircle(gradient)
  }
}

module.exports = Self