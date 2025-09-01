import { ControllerDefinition } from "../../src"
import type { ControllerInterface } from "../../src/controller_property_definition"
import type { OutletDefinition, ValueDefinition, TargetDefinition, ClassDefinition, MethodDefinition } from "../../src/controller_property_definition"
import type { ValueDefinition as ValueDefinitionType, ValueDefinitionValue } from "../../src/types"
import { ValueDefinition as ValueDefinitionClass } from "../../src/controller_property_definition"
import * as ast from "../../src/util/ast"

type StubDefinition<T> = Omit<T, 'node' | 'elementNode' | 'loc'>

function createValueDefinition(name: string, valueDef: any): ValueDefinition {
  let definition: ValueDefinitionType
  
  if (typeof valueDef === 'string') {
    if (valueDef in ValueDefinitionClass.defaultValuesForType) {
      const typeName = valueDef as keyof typeof ValueDefinitionClass.defaultValuesForType
      definition = {
        type: typeName as string,
        default: ValueDefinitionClass.defaultValuesForType[typeName],
        kind: "shorthand"
      }
    } else {
      definition = { type: valueDef, default: valueDef, kind: "inferred" }
    }
  } else if (valueDef && typeof valueDef === 'object' && 'kind' in valueDef && valueDef.kind === 'decorator') {
    const decoratorDef = valueDef as { kind: "decorator"; type: keyof typeof ValueDefinitionClass.defaultValuesForType; default?: ValueDefinitionValue }
    definition = {
      type: decoratorDef.type as string,
      default: decoratorDef.default ?? ValueDefinitionClass.defaultValuesForType[decoratorDef.type],
      kind: "decorator"
    }
  } else if (valueDef && typeof valueDef === 'object' && 'type' in valueDef) {
    const expandedDef = valueDef as { type: keyof typeof ValueDefinitionClass.defaultValuesForType; default?: ValueDefinitionValue }
    definition = {
      type: expandedDef.type as string,
      default: expandedDef.default ?? ValueDefinitionClass.defaultValuesForType[expandedDef.type],
      kind: "expanded"
    }
  } else {
    throw new Error(`Invalid value definition for ${name}: ${JSON.stringify(valueDef)}`)
  }
  
  return {
    name,
    definition,
    definitionType: (valueDef && typeof valueDef === 'object' && 'kind' in valueDef && valueDef.kind === 'decorator') ? "decorator" as const : "static" as const,
    type: definition.type,
    default: definition.default,
    hasExplicitDefaultValue: !!(valueDef && typeof valueDef === 'object' && 'default' in valueDef)
  } as ValueDefinition
}

type StubControllerInput = {
  guessedIdentifier: string
  outlets?: string[]
  targets?: string[]
  classes?: string[]
  actions?: string[]
  values?: { 
    [key: string]: 
      | keyof typeof ValueDefinitionClass.defaultValuesForType
      | { type: keyof typeof ValueDefinitionClass.defaultValuesForType; default?: ValueDefinitionValue }
      | string
      | { kind: "decorator"; type: keyof typeof ValueDefinitionClass.defaultValuesForType; default?: ValueDefinitionValue }
  }
}

export function stubControllerDefinition(
  input: StubControllerInput
): ControllerDefinition {
  return new (class extends ControllerDefinition {
    private _guessedIdentifier: string
    private _config: StubControllerInput

    constructor(input: StubControllerInput) {
      const klass: any = { sourceFile: { path: "" } }
      super({} as any, klass)

      this._guessedIdentifier = input.guessedIdentifier
      this._config = input

      input.targets?.forEach(name => {
        this.targetDefinitions.push({ name } as StubDefinition<TargetDefinition> as TargetDefinition)
      })

      input.classes?.forEach(name => {
        this.classDefinitions.push({ name } as StubDefinition<ClassDefinition> as ClassDefinition)
      })

      input.actions?.forEach(name => {
        this.methodDefinitions.push({ name } as StubDefinition<MethodDefinition> as MethodDefinition)
      })

      input.outlets?.forEach(name => {
        this.outletDefinitions.push({ name } as StubDefinition<OutletDefinition> as OutletDefinition)
      })

      Object.entries(input.values ?? {}).forEach(([name, valueDef]) => {
        this.valueDefinitions.push(createValueDefinition(name, valueDef))
      })
    }

    get guessedIdentifier() { return this._guessedIdentifier }

    get targetNames() { return this._config.targets || [] }
    get classNames() { return this._config.classes || [] }
    get actionNames() { return this._config.actions || [] }
    get outletNames() { return this._config.outlets || [] }
    get valueNames() { return Object.keys(this._config.values || {}) }

    get outlets() {
      return this.outletDefinitions
    }

    get inspect(): ControllerInterface {
      return {
        guessedIdentifier: this._guessedIdentifier,
        targets: this.targetNames,
        outlets: this.outletDefinitions,
        values: this.valueDefinitions,
        classes: this.classNames,
        actions: this.actionNames
      }
    }
      })(input)
}
