import type { Project } from "../../src/project"
import type { ControllerDefinition } from "../../src/controller_definition"

export const createFakeProject = (
  controllers: Array<{ identifier: string; controllerDef: ControllerDefinition }>
): Project => {
  const controllerMap = new Map<string, ControllerDefinition>()
  
  controllers.forEach(({ identifier, controllerDef }) => {
    controllerMap.set(identifier, controllerDef)
  })

  return {
    controllerDefinitionForIdentifier: (identifier: string) => {
      return controllerMap.get(identifier)
    }
  } as Project
}
