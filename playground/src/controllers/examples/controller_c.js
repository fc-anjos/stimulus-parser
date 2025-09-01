import { Controller } from "@hotwired/stimulus"

export class ControllerC extends Controller {
  static targets = ["text", "indicator"]
  static outlets = ["a"]
  static values = {
    label: String,
    isActive: Boolean
  }

  connect() {
    console.log("ControllerC connected")
    console.log("Available a outlets:", this.aOutlets)
    this.updateIndicator()
  }

  activate() {
    this.isActiveValue = !this.isActiveValue
    this.updateIndicator()
    
    if (this.hasAOutlet) {
      this.aOutlet.toggleB()
    }
  }

  updateIndicator() {
    this.indicatorTarget.textContent = this.isActiveValue ? "🟢 Active" : "🔴 Inactive"
  }
}
