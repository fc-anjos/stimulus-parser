// Example: Controller B - references Controller C
import { Controller } from "@hotwired/stimulus"

export class ControllerB extends Controller {
  static targets = ["content", "counter"]
  static outlets = ["c"]
  static values = {
    count: { type: Number, default: 0 },
    label: String
  }

  connect() {
    console.log("ControllerB connected")
    console.log("Available c outlets:", this.cOutlets)
    this.updateCounter()
  }

  increment() {
    this.countValue++
    this.updateCounter()
  }

  updateCounter() {
    this.counterTarget.textContent = `Count: ${this.countValue}`
  }

  addC() {
    const template = document.getElementById('controller-c-template')
    const cElement = template.content.cloneNode(true)
    this.contentTarget.appendChild(cElement)
  }
}
