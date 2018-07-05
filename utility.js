function rgb(red, green, blue) {
  function to256(scale) {
    scale *= 256
    return scale > 255 ? 255 : scale < 0 ? 0 : Math.floor(scale)
  }
  return `rgb(${to256(red)},${to256(green)},${to256(blue)})`
}

module.exports = { rgb }