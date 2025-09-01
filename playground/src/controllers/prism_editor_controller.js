import { Controller } from "@hotwired/stimulus"
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'


export default class extends Controller {
  static targets = ["textarea"]
  static values = { content: String, theme: String }

  connect() {
    console.log('PrismEditor connect() called')
    if (!this.themeValue) {
      this.themeValue = 'default'
    }
    console.log('Initial theme value:', this.themeValue)
    this.setupHighlighting()
    this.setupEventListeners()
    this.loadTheme(this.themeValue)
    this.highlightCode()
  }

  disconnect() {
    if (this.highlightContainer && this.highlightContainer.parentElement) {
      this.highlightContainer.parentElement.removeChild(this.highlightContainer)
    }
  }

  setupHighlighting() {
    if (!this.hasTextareaTarget) return

    this.highlightContainer = document.createElement('div')
    this.highlightContainer.className = 'prism-highlight absolute inset-0 pointer-events-none'
    this.highlightContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 1;
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;
      padding: inherit;
      border: none;
      background: transparent;
      overflow: hidden; /* no own scrollbars; we mirror textarea scroll via transform */
      box-shadow: none;
      margin: 0;
    `

    const container = this.textareaTarget.parentElement
    if (container) {
      container.style.position = 'relative'
      container.appendChild(this.highlightContainer)
    }

    this.textareaTarget.style.cssText += `
      background: transparent !important;
      color: transparent !important;
      caret-color: #fff !important;
      position: relative;
      z-index: 2;
      resize: none !important;
      box-shadow: none !important;
      border: none !important;
      outline: none !important;
      white-space: pre !important;
      overflow: auto !important;
    `

    this.textareaTarget.setAttribute('wrap', 'off')
  }

  setupEventListeners() {
    if (!this.hasTextareaTarget) return

    let highlightTimeout = null

    const debouncedHighlight = () => {
      if (highlightTimeout) {
        clearTimeout(highlightTimeout)
      }
      highlightTimeout = window.setTimeout(() => {
        this.highlightCode()
      }, 100)
    }

    this.textareaTarget.addEventListener('input', () => {
      this.contentValue = this.textareaTarget.value
      debouncedHighlight()
    })

    this.textareaTarget.addEventListener('scroll', () => {
      if (this.highlightPre) {
        const x = this.textareaTarget.scrollLeft || 0
        const y = this.textareaTarget.scrollTop || 0
        this.highlightPre.style.transform = `translate(${-x}px, ${-y}px)`
      }
    })

    const resizeObserver = new ResizeObserver(() => {
      this.syncDimensions()
    })
    resizeObserver.observe(this.textareaTarget)
  }

  highlightCode() {
    console.log('highlightCode called, current theme:', this.themeValue)
    if (!this.hasTextareaTarget || !this.highlightContainer) return

    const content = this.textareaTarget.value
    if (!content.trim()) {
      this.highlightContainer.innerHTML = ''
      return
    }

    try {
      const highlighted = Prism.highlight(content, Prism.languages.javascript, 'javascript')
      
      this.highlightContainer.innerHTML = `<pre class="language-javascript" style="margin: 0; background: transparent; padding: 0; border: none; box-shadow: none; white-space: pre; display: inline-block; will-change: transform;"><code style="display: inline-block; white-space: pre;">${highlighted}</code></pre>`
      this.highlightPre = this.highlightContainer.querySelector('pre')
      if (this.highlightPre) {
        const x = this.textareaTarget.scrollLeft || 0
        const y = this.textareaTarget.scrollTop || 0
        this.highlightPre.style.transform = `translate(${-x}px, ${-y}px)`
      }
      console.log('Highlighted code applied, highlight container HTML:', this.highlightContainer.innerHTML.substring(0, 200) + '...')
      this.syncDimensions()
    } catch (error) {
      console.warn('Prism highlighting failed:', error)
      this.highlightContainer.innerHTML = `<pre style="margin: 0; white-space: pre-wrap; padding: 0; border: none; box-shadow: none;">${this.escapeHtml(content)}</pre>`
    }
  }

  syncDimensions() {
    if (!this.hasTextareaTarget || !this.highlightContainer) return

    this.highlightContainer.style.width = `${this.textareaTarget.offsetWidth}px`
    this.highlightContainer.style.height = `${this.textareaTarget.offsetHeight}px`
    this.highlightContainer.style.padding = window.getComputedStyle(this.textareaTarget).padding
    this.highlightContainer.style.fontFamily = window.getComputedStyle(this.textareaTarget).fontFamily
    this.highlightContainer.style.fontSize = window.getComputedStyle(this.textareaTarget).fontSize
    this.highlightContainer.style.lineHeight = window.getComputedStyle(this.textareaTarget).lineHeight
  }

  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  getValue() {
    return this.hasTextareaTarget ? this.textareaTarget.value : ''
  }

  setValue(content) {
    if (this.hasTextareaTarget) {
      this.textareaTarget.value = content
      this.contentValue = content
      this.highlightCode()
    }
  }

  focus() {
    if (this.hasTextareaTarget) {
      this.textareaTarget.focus()
    }
  }

  loadTheme(theme) {
    console.log('Loading theme:', theme)
    
    const existingLink = document.querySelector('link[data-prism-theme]')
    if (existingLink) {
      existingLink.remove()
    }

    let themePath, backgroundColor, textColor
    switch (theme) {
      case 'tomorrow':
        themePath = '/node_modules/prismjs/themes/prism-tomorrow.css'
        backgroundColor = '#2d2d2d'
        textColor = '#cccccc'
        break
      case 'dark':
        themePath = '/node_modules/prismjs/themes/prism-dark.css'
        backgroundColor = '#1e1e1e'
        textColor = '#d4d4d4'
        break
      case 'okaidia':
        themePath = '/node_modules/prismjs/themes/prism-okaidia.css'
        backgroundColor = '#272822'
        textColor = '#f8f8f2'
        break
      case 'twilight':
        themePath = '/node_modules/prismjs/themes/prism-twilight.css'
        backgroundColor = '#141414'
        textColor = '#f7f3ff'
        break
      case 'coy':
        themePath = '/node_modules/prismjs/themes/prism-coy.css'
        backgroundColor = '#fdfdfd'
        textColor = '#5e6687'
        break
      case 'funky':
        themePath = '/node_modules/prismjs/themes/prism-funky.css'
        backgroundColor = '#000000'
        textColor = '#ffffff'
        break
      case 'solarizedlight':
        themePath = '/node_modules/prismjs/themes/prism-solarizedlight.css'
        backgroundColor = '#fdf6e3'
        textColor = '#657b83'
        break
      case 'default':
        themePath = '/node_modules/prismjs/themes/prism.css'
        backgroundColor = '#f5f2f0'
        textColor = '#000000'
        break
      default:
        themePath = '/node_modules/prismjs/themes/prism-tomorrow.css'
        backgroundColor = '#2d2d2d'
        textColor = '#cccccc'
    }

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = themePath
    link.setAttribute('data-prism-theme', theme)
    document.head.appendChild(link)
    
    if (this.highlightContainer) {
      this.highlightContainer.style.backgroundColor = backgroundColor
      this.highlightContainer.style.color = textColor
    }
    
    if (this.hasTextareaTarget) {
      this.textareaTarget.style.caretColor = textColor
    }
    
    console.log('Theme loaded:', theme, 'from', themePath, 'with background:', backgroundColor)
  }

  switchTheme(theme) {
    console.log('PrismEditor switchTheme called with:', theme)
    console.log('Current themeValue before:', this.themeValue)
    this.themeValue = theme
    console.log('Current themeValue after:', this.themeValue)
    this.loadTheme(theme)
    setTimeout(() => {
      this.highlightCode()
    }, 50)
  }


}
