const fs = require('fs')
const open = require('opn')
const Lexer = require('./Lexer')
const Vue = require('vue/dist/vue.common')
const SmoothScroll = require('./SmoothScroll')

;[
  'List', 'Split', 'Table', 'Textblock',
  'Paragraph', 'Heading', 'Section', 'Blockquote', 'Usage'
].forEach(name => Vue.component(name, require('./components/' + name)))

function getTopLevelText(element) {
  let result = '', child = element.firstChild
  while (child) {
    if (child.nodeType === 3) result += child.data
    child = child.nextSibling
  }
  return result.trim()
}

new Vue({
  el: '#app',

  data() {
    const data = fs.readFileSync(__dirname + '/document.tmd', {encoding: 'utf8'})
    return {
      root: new Lexer().lex(data),
      docScrolled: false,
      height: window.innerHeight,
      width: window.innerWidth
    }
  },

  mounted() {
    this.h2nodes = Array.from(this.$refs.doc.getElementsByTagName('h2'))

    addEventListener('resize', () => {
      this.height = window.innerHeight
      this.width = window.innerWidth
    }, {passive: true})

    this.docScroll = SmoothScroll(this.$refs.doc, {
      callback: (doc) => {
        this.docScrolled = doc.scrollTop > 0
      }
    })
  },

  methods: {
    navigate(event) {
      let url = event.srcElement.dataset.rawUrl
      if (!url) return
      if (url.startsWith('$issue#')) {
        open('https://github.com/Shigma/Barrage/issues/' + url.slice(7))
      } else if (url.startsWith('#')) {
        this.switchDoc(this.current.path + url)
      } else {
        const docParts = this.current.path.split('/')
        const back = /^(?:\.\.\/)*/.exec(url)[0].length
        docParts.splice(-1 - back / 3, Infinity, url.slice(back))
        if (!docParts[docParts.length - 1].endsWith('.tmd')) {
          docParts[docParts.length - 1] += '.tmd'
        }
        this.switchDoc(docParts.join('/'))
      }
    },
    switchToAnchor(text) {
      if (!text) {
        text = this.current.anchor
      } else {
        this.current.anchor = text
      }
      const result = this.h2nodes.find(node => getTopLevelText(node) === text)
      if (result) {
        this.docScroll.scrollByPos(result.offsetTop)
      }
    }
  },

  template: `<div class="main">
    <div class="tm-doc" ref="doc" @click="navigate" :class="{ scrolled: docScrolled }"
      @mousewheel.prevent.stop="docScroll.scrollByDelta($event.deltaY)" :style="{
        'padding-left': Math.max(32, width / 6) + 'px',
        'padding-right': Math.max(32, width / 6) + 'px'
      }">
      <component v-for="(comp, index) in root" :is="comp.type" :node="comp" :key="index"/>
    </div>
  </div>`
})
