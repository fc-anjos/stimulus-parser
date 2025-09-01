import lz from "lz-string"
import dedent from "dedent"

import { Controller } from "@hotwired/stimulus"

const exampleFilesGlob = import.meta.glob('./examples/*.js', { query: '?raw', import: 'default', eager: true })

const exampleFiles = [
  {
    path: "app/javascript/controllers/application.js",
    content: exampleFilesGlob['./examples/application.js']
  },
  {
    path: "app/javascript/controllers/index.js",
    content: exampleFilesGlob['./examples/index.js']
  },
  {
    path: "app/javascript/controllers/hello_controller.js", 
    content: exampleFilesGlob['./examples/hello_controller.js']
  },
  {
    path: "app/javascript/controllers/goodbye_controller.js",
    content: exampleFilesGlob['./examples/goodbye_controller.js']
  },
  {
    path: "app/javascript/controllers/controller_a.js",
    content: exampleFilesGlob['./examples/controller_a.js']
  },
  {
    path: "app/javascript/controllers/controller_b.js",
    content: exampleFilesGlob['./examples/controller_b.js']
  },
  {
    path: "app/javascript/controllers/controller_c.js",
    content: exampleFilesGlob['./examples/controller_c.js']
  }
]

const simpleControllerTemplate = exampleFilesGlob['./examples/hello_controller.js']
const goodbyeControllerTemplate = exampleFilesGlob['./examples/goodbye_controller.js']
const circularControllerTemplate = exampleFilesGlob['./examples/controller_a.js']

export default class extends Controller {
  static targets = ["filesContainer", "simpleViewer", "fullViewer", "viewerButton", "editor", "emptyState", "noFileState"]
  static values = { currentFileId: Number }
  static outlets = ["prism-editor"]
  
  initialize() {
    console.log('Playground controller outlets:', this.constructor.outlets)
  }
  
  static FILENAME_MAX_LENGTH = 30
  static ELLIPSIS_LENGTH = 3

  connect() {
    console.log("Playground controller connected")
    console.log("Targets:", this.targets)
    console.log("filesContainerTarget:", this.filesContainerTarget)
    
    console.log("Playground element:", this.element)
    console.log("Looking for outlet with selector:", this.element.getAttribute('data-playground-prism-editor-outlet'))
    const foundElements = this.element.querySelectorAll(this.element.getAttribute('data-playground-prism-editor-outlet') || '')
    console.log("Found elements matching outlet selector:", foundElements)
    console.log("Has prism editor outlet on connect:", this.hasPrismEditorOutlet)
    
    this.files = []
    this.currentFileIdValue = null
    this.restoreFiles()
    this.renderFileExplorer()
    
    
    console.log("After initial render:", {
      currentFileIdValue: this.currentFileIdValue,
      actionCount: this.filesContainerTarget?.querySelectorAll('[data-action]').length
    })
    this.updateEditorState()
    this.analyze()
    
    setTimeout(() => {
      console.log("Has prism editor outlet after timeout:", this.hasPrismEditorOutlet)
      if (this.hasPrismEditorOutlet) {
        console.log("Prism editor outlet found:", this.prismEditorOutlet)
      }
    }, 100)
  }

  addFile() {
    const newFile = {
      id: Date.now(),
      path: `controller_${this.files.length + 1}.js`,
      content: simpleControllerTemplate
    }
    
    this.files.push(newFile)
    this.currentFileIdValue = newFile.id
    this.renderFileExplorer()
    this.updateEditorState()
    this.analyze()
  }

  removeFile(event) {
    event.stopPropagation()
    
    let fileId = Number(event.target.dataset.fileId)
    if (isNaN(fileId)) {
      fileId = Number(event.currentTarget.dataset.fileId)
    }
    
    if (!isNaN(fileId)) {
      const removedIndex = this.files.findIndex(f => f.id === fileId)
      this.files = this.files.filter(f => f.id !== fileId)
      
      if (this.currentFileIdValue === fileId) {
        const prevIndex = Math.max(0, removedIndex - 1)
        this.currentFileIdValue = this.files[prevIndex]?.id ?? null
      }
      
      this.renderFileExplorer()
      this.updateEditorState()
      this.analyze()
    }
  }

  selectFile(event) {
    const fromInput = event.target.tagName === 'INPUT'
    const datasetEl = fromInput ? event.target : event.currentTarget
    const fileId = Number(datasetEl.dataset.fileId)
    
    if (!isNaN(fileId)) {
      if (this.currentFileIdValue !== fileId) {
        this.currentFileIdValue = fileId
      }
      if (!fromInput) {
        this.renderFileExplorer()
      }
      this.updateEditorState()
    }
  }

  updateCurrentFile() {
    if (this.currentFileIdValue && this.hasEditorTarget) {
      const file = this.files.find(f => f.id === this.currentFileIdValue)
      if (file) {
              if (this.hasPrismEditorOutlet) {
        file.content = this.prismEditorOutlet.getValue()
      } else {
        file.content = this.editorTarget.value
      }
        this.analyze()
      }
    }
  }

  renameFile(event) {
    const fileId = Number(event.target.dataset.fileId)
    const newPath = event.target.value
    const file = this.files.find(f => f.id === fileId)
    if (file && newPath) {
      if (newPath.startsWith('...') && file.path && file.path.length > this.constructor.FILENAME_MAX_LENGTH) {
        const remainingLength = this.constructor.FILENAME_MAX_LENGTH - this.constructor.ELLIPSIS_LENGTH
        const originalTruncated = '...' + file.path.slice(-remainingLength)
        if (newPath !== originalTruncated) {
          file.path = newPath
        }
      } else {
        file.path = newPath
      }
      this.renderFileExplorer()
  
      this.analyze()
    }
  }

  resizeFilename(event) {
    const input = event.target
    const filename = input.value
    
    if (filename.length > this.constructor.FILENAME_MAX_LENGTH) {
      const remainingLength = this.constructor.FILENAME_MAX_LENGTH - this.constructor.ELLIPSIS_LENGTH
      const truncated = '...' + filename.slice(-remainingLength)
      input.value = truncated
    }
    
    input.size = Math.max(1, input.value.length)
  }

  restoreFullFilename(event) {
    const input = event.target
    const fileId = Number(input.dataset.fileId)
    const file = this.files.find(f => f.id === fileId)
    
    if (file && file.path && file.path.length > this.constructor.FILENAME_MAX_LENGTH) {
      input.value = file.path
      input.size = Math.max(1, file.path.length)
    }
  }

  stop(event) {
    event.stopPropagation()
  }



  renderFileExplorer() {
    if (!this.hasFilesContainerTarget) {
      return
    }

    this.filesContainerTarget.innerHTML = ""

    if (this.files.length === 0) {
      if (this.hasEmptyStateTarget) {
        this.emptyStateTarget.style.display = "block"
      }
      return
    }

    if (this.hasEmptyStateTarget) {
      this.emptyStateTarget.style.display = "none"
    }

    this.files.forEach(file => {
      const isSelected = file.id === this.currentFileIdValue
      
      const displayPath = (file.path || '').length > this.constructor.FILENAME_MAX_LENGTH 
        ? '...' + (file.path || '').slice(-(this.constructor.FILENAME_MAX_LENGTH - this.constructor.ELLIPSIS_LENGTH)) 
        : (file.path || '')
      
      const template = document.getElementById('file-item-template')
      const fileElement = template.content.cloneNode(true).querySelector('div')
      
      fileElement.dataset.fileId = String(file.id)
      fileElement.setAttribute('data-action', 'mousedown->playground#selectFile')
      
      fileElement.className = `flex items-center group px-2 py-1.5 rounded cursor-pointer transition-colors ${
        isSelected 
          ? 'bg-blue-100 text-blue-900' 
          : 'hover:bg-gray-100 text-gray-700'
      }`
      
      const icon = fileElement.querySelector('i.fas.fa-file-code')
      icon.className = `fas fa-file-code text-xs w-4 mr-2 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`
      
      const input = fileElement.querySelector('input')
      input.value = displayPath
      input.dataset.fileId = file.id
      input.size = displayPath.length || 1
      
      const deleteButton = fileElement.querySelector('button')
      deleteButton.dataset.fileId = file.id
      
      this.filesContainerTarget.appendChild(fileElement)
    })
  }



  updateEditorState() {
    if (!this.hasEditorTarget || !this.hasNoFileStateTarget) return

    if (this.files.length === 0 || !this.currentFileIdValue) {
      this.editorTarget.style.display = "none"
      this.noFileStateTarget.style.display = "flex"
      return
    }

    const currentFile = this.files.find(f => f.id === this.currentFileIdValue)
    if (currentFile) {
      this.editorTarget.style.display = "block"
      this.noFileStateTarget.style.display = "none"
      
      if (this.hasPrismEditorOutlet) {
        this.prismEditorOutlet.setValue(currentFile.content || "")
      } else {
        this.editorTarget.value = currentFile.content || ""
      }
      this.editorTarget.placeholder = `Edit ${currentFile.path}...`
    }
  }

  handleRenameKeydown(event) {
    if (event.key === 'Enter') {
      event.target.blur()
    }
    if (event.key === 'Escape') {
      const fileId = Number(event.target.dataset.fileId)
      const file = this.files.find(f => f.id === fileId)
      if (file) {
        event.target.value = file.path
      }
      event.target.blur()
    }
  }



  restoreFiles() {
    if (window.location.hash) {
      try {
        const decompressed = lz.decompressFromEncodedURIComponent(window.location.hash.slice(1))
        if (decompressed) {
          const restoredFiles = JSON.parse(decompressed)
          this.files = restoredFiles.map(file => ({
            ...file,
            id: file.id || Date.now() + Math.random()
          }))
          this.currentFileIdValue = this.files[0]?.id || null
        }
      } catch (error) {
      }
    }
  }

  updateURL() {
    const filesData = this.files.map(f => ({ id: f.id, path: f.path, content: f.content }))
    window.location.hash = lz.compressToEncodedURIComponent(JSON.stringify(filesData))
  }

  async share(event) {
    const button = this.getClosestButton(event.target)

    try {
      await navigator.clipboard.writeText(window.location.href)

      button.querySelector(".fa-circle-check").classList.remove("hidden")
    } catch (error) {
      button.querySelector(".fa-circle-xmark").classList.remove("hidden")
    }

    button.querySelector(".fa-copy").classList.add("hidden")

    setTimeout(() => {
      button.querySelector(".fa-copy").classList.remove("hidden")
      button.querySelector(".fa-circle-xmark").classList.add("hidden")
      button.querySelector(".fa-circle-check").classList.add("hidden")
    }, 1000)
  }

  async insertExamples(event) {
    if (this.files.length > 0 && !confirm("Do you want to overwrite the current files?")) {
      return
    }

    this.files = []
    
    const allDemoFiles = exampleFiles
    
    this.files.push(...allDemoFiles.map(file => ({
      ...file,
      id: Date.now() + Math.random()
    })))

    this.currentFileIdValue = this.files[0]?.id || null

    const button = this.getClosestButton(event.target)

    button.querySelector(".fa-file").classList.add("hidden")
    button.querySelector(".fa-circle-check").classList.remove("hidden")

    setTimeout(() => {
      button.querySelector(".fa-file").classList.remove("hidden")
      button.querySelector(".fa-circle-check").classList.add("hidden")
    }, 1000)

    this.renderFileExplorer()
    this.updateEditorState()
    this.analyze()
  }


  prismEditorOutletConnected(outlet, element) {
    console.log('🎉 Prism editor outlet connected!', outlet, element)
    console.log('Outlet controller:', outlet.constructor.name)
    console.log('Outlet element:', element)
  }

  switchTheme(event) {
    console.log('Playground switchTheme called with:', event.target.value)
    console.log('Has prism editor outlet:', this.hasPrismEditorOutlet)
    if (this.hasPrismEditorOutlet) {
      console.log('Calling prism editor switchTheme with:', event.target.value)
      this.prismEditorOutlet.switchTheme(event.target.value)
    } else {
      console.log('No prism editor outlet found')
    }
  }

  getClosestButton(element) {
    return (element instanceof HTMLButtonElement) ? element : element.closest("button")
  }

  selectViewer(event) {
    const button = this.getClosestButton(event.target)

    this.viewerButtonTargets.forEach(button => button.dataset.active = false)
    button.dataset.active = true

    if (button.dataset.viewer === "simple") {
      this.simpleViewerTarget.classList.remove("hidden")
      this.fullViewerTarget.classList.add("hidden")
    } else {
      this.simpleViewerTarget.classList.add("hidden")
      this.fullViewerTarget.classList.remove("hidden")
    }
  }

  async analyze() {
    console.log("Frontend analyze called")
    this.updateURL()

    if (this.files.length === 0) {
      console.log("No files, showing empty state")
      this.showEmptyState()
      return
    }

    try {
      console.log("Sending request to API")
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: this.files })
      })

      console.log("Response received, status:", response.status)
      if (response.ok) {
        const data = await response.json()
        console.log("Data received:", data)
        this.updateViewers(data)
      } else {
        console.error("Server error, status:", response.status)
        this.showError("Server error")
      }
    } catch (error) {
      console.error("Frontend error:", error)
      this.showError(error.message)
    }
  }

  updateViewers(data) {
    if (this.hasSimpleViewerTarget) {
      this.simpleViewerTarget.data = data.simple
    }
    
    if (this.hasFullViewerTarget) {
      this.fullViewerTarget.data = data.full
    }
  }

  showEmptyState() {
    this.simpleViewerTarget.data = { message: "No files to analyze" }
    this.fullViewerTarget.data = { message: "No files to analyze" }
  }

  showError(message) {
    this.simpleViewerTarget.data = { error: message }
    this.fullViewerTarget.data = { error: message }
  }
}

