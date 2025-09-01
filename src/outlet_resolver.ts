import type { ControllerDefinition } from "./controller_definition"
import type { OutletDefinition, ControllerInterface } from "./controller_property_definition"

export type OutletMapping = OutletDefinition & {
  controller?: ControllerInterface & {
    outlets: OutletMapping[]
  }
}

export class OutletMapper {
  private async mapOutlet(
    outlet: OutletDefinition,
    availableControllers: ControllerDefinition[],
    mappingPath: string[]
  ): Promise<OutletMapping> {
    const resolvedController = availableControllers.find(c => c.guessedIdentifier === outlet.name)
    if (!resolvedController || mappingPath.includes(resolvedController.guessedIdentifier)) {
      return { ...outlet, controller: undefined }
    }

    const childOutlets = await this.mapOutletsForController(resolvedController, availableControllers, mappingPath)

    return { 
      ...outlet, 
      controller: { 
        ...resolvedController.inspect,
        outlets: childOutlets
      } 
    }
  }

  async mapOutletsForController(
    controllerDef: ControllerDefinition, 
    availableControllers: ControllerDefinition[],
    path: string[] = []
  ): Promise<OutletMapping[]> {
    const currentId = controllerDef.guessedIdentifier

    if (path.includes(currentId)) {
      return controllerDef.outletNames.map(name => {
        const outlet = controllerDef.outlets.find(o => o.name === name)!
        return { ...outlet, controller: undefined }
      })
    }

    const mappingPath = [...path, currentId]

    return Promise.all(controllerDef.outletNames.map(name => {
      const outlet = controllerDef.outlets.find(o => o.name === name)!
      return this.mapOutlet(outlet, availableControllers, mappingPath)
    }))
  }

  async mapOutlets(controllerDefinitions: ControllerDefinition[]): Promise<Map<ControllerDefinition, OutletMapping[]>> {
    const mappings = new Map<ControllerDefinition, OutletMapping[]>()
    
    for (const controllerDef of controllerDefinitions) {
      const mappedOutlets = await this.mapOutletsForController(controllerDef, controllerDefinitions)
      mappings.set(controllerDef, mappedOutlets)
    }
    
    return mappings
  }
}