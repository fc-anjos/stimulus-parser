import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["message"]
  static values = {
    farewell: String
  }

  connect() {
    console.log("Goodbye controller connected")
  }

  farewell() {
    this.messageTarget.textContent = this.farewellValue || "Goodbye!"
  }
}
