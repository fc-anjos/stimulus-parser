import { Project } from "../../src/project"
import type { ControllerDefinition } from "../../src/controller_definition"

export class TestProject extends Project {
  private controllerMap = new Map<string, ControllerDefinition>()

  constructor() {
    super("/test/project")
  }

  addController(identifier: string, controllerDef: ControllerDefinition): void {
    this.controllerMap.set(identifier, controllerDef)
  }

  addControllers(controllers: Array<{ identifier: string; controllerDef: ControllerDefinition }>): void {
    controllers.forEach(({ identifier, controllerDef }) => {
      this.controllerMap.set(identifier, controllerDef)
    })
  }

  controllerDefinitionForIdentifier(identifier: string): ControllerDefinition | undefined {
    return this.controllerMap.get(identifier)
  }
}
