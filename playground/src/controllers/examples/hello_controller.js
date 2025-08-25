// Example: Hello controller with outlet reference
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["message"]
  static outlets = ["goodbye"]
  static values = {
    greeting: String
  }

  connect() {
    console.log("Hello controller connected")
    if (this.hasGoodbyeOutlet) {
      console.log("Found goodbye outlet:", this.goodbyeOutlet)
    }
  }

  greet() {
    this.messageTarget.textContent = this.greetingValue || "Hello!"
  }
}
