// Example: Controller A - references Controller B (creates circular reference)
import { Controller } from "@hotwired/stimulus"

export class ControllerA extends Controller {
  static targets = ["message", "status"]
  static outlets = ["b"]
  static values = {
    title: String,
    isEnabled: Boolean
  }

  connect() {
    console.log("ControllerA connected")
    console.log("Available b outlets:", this.bOutlets)
    this.updateStatus()
  }

  updateStatus() {
    this.statusTarget.textContent = `A is enabled: ${this.isEnabledValue}`
  }

  toggleB() {
    if (this.hasBOutlet) {
      this.bOutlet.toggle()
    }
  }
}
