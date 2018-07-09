function to256(scale) {
  scale *= 256
  return scale > 255 ? 255 : scale < 0 ? 0 : Math.floor(scale)
}

function rgb(red, green, blue) {
  return `rgb(${to256(red)},${to256(green)},${to256(blue)})`
}

function rgba(red, green, blue, alpha) {
  return `rgba(${to256(red)},${to256(green)},${to256(blue)},${alpha})`
}

function interval(period, previous, current) {
  return Math.floor(current / period) > Math.floor(previous / period)
}

function smooth(x1, x2, t) {
  return x1 + (x2 - x1) / 2 * (1 - Math.cos(Math.PI * t))
}

function rpm() {
  return Math.floor(Math.random() * 2) * 2 - 1
}

function rreal(...args) {
  const start = args.length > 1 ? args[0] : 0
  const end = args[args.length - 1]
  return Math.random() * (end - start) + start
}

function rint(...args) {
  return Math.floor(rreal(...args))
}

module.exports = {
  rgb,
  rgba,
  interval,
  smooth,
  rpm,
  rint,
  rreal
}