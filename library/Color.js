const builtin = require('./builtin.json')

function to256(scale) {
  scale *= 256
  return scale > 255 ? 255 : scale < 0 ? 0 : Math.floor(scale)
}

class Color {
  constructor(r, g, b, a) {
    this.r = r || 0
    this.g = g || 0
    this.b = b || 0
    this.a = a || 1
  }

  blend(color, prop = 0.5) {
    return new Color(
      this.r * (1 - prop) + color.r * prop,
      this.g * (1 - prop) + color.g * prop,
      this.b * (1 - prop) + color.b * prop,
      this.a * (1 - prop) + color.a * prop
    )
  }

  darker(scale = 0.5) {
    return new Color(
      this.r * (1 - scale),
      this.g * (1 - scale),
      this.b * (1 - scale),
      this.a
    )
  }

  lighter(scale = 0.5) {
    return new Color(
      1 - (1 - this.r) * (1 - scale),
      1 - (1 - this.g) * (1 - scale),
      1 - (1 - this.b) * (1 - scale),
      this.a
    )
  }

  inverse() {
    return new Color(
      1 - this.r,
      1 - this.g,
      1 - this.b,
      this.a
    )
  }

  alpha(a) {
    return new Color(this.r, this.g, this.b, a)
  }

  opacify(scale) {
    return new Color(this.r, this.g, this.b, 1 - (1 - this.a) * (1 - scale))
  }

  transparentize(scale) {
    return new Color(this.r, this.g, this.b, this.a * (1 - scale))
  }

  output() {
    return `rgba(${to256(this.r)},${to256(this.g)},${to256(this.b)},${this.a})`
  }
}

Object.assign(Color, {
  rgba(r, g, b, a) {
    return new Color(r, g, b, a)
  },

  hsla(h, s = 1, l = 1, a) {
    const tg = (h >= 0 ? h % 2 : h % 2 + 2) / 2
    const tr = tg + 1 / 3 > 1 ? tg - 2 / 3 : tg + 1 / 3
    const tb = tg - 1 / 3 > 0 ? tg - 1 / 3 : tg + 2 / 3
    const q = (l < 0.5) ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    function convert(t) {
      return t >= 2 / 3 ? p :
        t >= 1 / 2 ? p + (q - p) * 6 * (2 / 3 - t) :
        t >= 1 / 6 ? q : p + (q - p) * 6 * t
    }
    return new Color(convert(tr), convert(tg), convert(tb), a)
  },

  hsva(h, s = 1, v = 1, a) {
    const k = h * 3
    const f = k - Math.floor(k)
    const p = v * (1 - s)
    const q = v * (1 - f * s)
    const t = v * (1 - (1 - f) * s)
    switch (Math.floor(k >= 0 ? k % 6 : k % 6 + 6)) {
      case 0: return new Color(v, t, p, a)
      case 1: return new Color(q, v, p, a)
      case 2: return new Color(p, v, t, a)
      case 3: return new Color(p, q, v, a)
      case 4: return new Color(t, p, v, a)
      case 5: return new Color(v, p, q, a)
    }
  },

  from(key) {
    return Color.hex(builtin[key.toLowerCase()])
  },

  hex(code) {
    if (code.charAt(0) === '#') code = code.slice(1)
    if (code.length === 3 || code.length === 4) {
      return new Color(
        parseInt(code.charAt(0), 16) / 16,
        parseInt(code.charAt(1), 16) / 16,
        parseInt(code.charAt(2), 16) / 16,
        parseInt(code.charAt(3), 16) / 16
      )
    } else if (code.length === 6 || code.length === 8) {
      return new Color(
        parseInt(code.slice(0, 2), 16) / 256,
        parseInt(code.slice(2, 4), 16) / 256,
        parseInt(code.slice(4, 6), 16) / 256,
        parseInt(code.slice(6, 8), 16) / 256
      )
    }
  },

  blend(...args) {
    let color = new Color(), rest = 1
    for (let i = 0; i < args.length; i += 2) {
      const prop = args[i + 1] || rest
      color.r += args[i].r * prop
      color.g += args[i].g * prop
      color.b += args[i].b * prop
      color.a += args[i].a * prop
      rest -= args[i + 1]
    }
    return color
  }
})

module.exports = Color