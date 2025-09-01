import type { ControllerDefinition } from "./controller_definition"
import type { OutletDefinition, ControllerInterface } from "./controller_property_definition"
import type { Project } from "./project"

interface ControllerWithMappedOutlets extends Omit<ControllerInterface, 'outlets'> {
  outlets: OutletMapping[]
}

export type OutletMapping = OutletDefinition & {
  controller?: ControllerWithMappedOutlets
}

export class OutletMapper {
  private project: Project

  constructor(project: Project) {
    this.project = project
  }

  private async mapOutlet(
    outlet: OutletDefinition,
    mappingPath: string[]
  ): Promise<OutletMapping> {
    const resolvedController = this.project.controllerDefinitionForIdentifier(outlet.name)
    if (!resolvedController || mappingPath.includes(resolvedController.guessedIdentifier)) {
      return { ...outlet, controller: undefined }
    }

    const childOutlets = await this.mapOutletsForController(resolvedController, mappingPath)

    return { 
      ...outlet, 
      controller: { 
        ...resolvedController.inspect,
        outlets: childOutlets
      } as ControllerWithMappedOutlets
    }
  }

  async mapOutletsForController(
    controllerDef: ControllerDefinition, 
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
      return this.mapOutlet(outlet, mappingPath)
    }))
  }

  async mapOutlets(controllerDefinitions: ControllerDefinition[]): Promise<Map<ControllerDefinition, OutletMapping[]>> {
    const mappings = new Map<ControllerDefinition, OutletMapping[]>()
    
    for (const controllerDef of controllerDefinitions) {
      const mappedOutlets = await this.mapOutletsForController(controllerDef)
      mappings.set(controllerDef, mappedOutlets)
    }
    
    return mappings
  }
}