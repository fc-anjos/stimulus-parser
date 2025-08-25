import { Application } from "@hotwired/stimulus"
import PlaygroundController from "./playground_controller"
import PrismEditorController from "./prism_editor_controller"

const application = Application.start()

application.register("playground", PlaygroundController)
application.register("prism-editor", PrismEditorController)
