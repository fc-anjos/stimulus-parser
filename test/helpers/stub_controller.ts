import { ControllerDefinition } from "../../src"
import type { ControllerInterface } from "../../src/controller_property_definition"
import type { OutletDefinition, ValueDefinition, TargetDefinition, ClassDefinition, MethodDefinition } from "../../src/controller_property_definition"
import type { ValueDefinition as ValueDefinitionType, ValueDefinitionValue } from "../../src/types"
import { ValueDefinition as ValueDefinitionClass } from "../../src/controller_property_definition"
import * as ast from "../../src/util/ast"

// Generic utility type that omits AST-related properties we don't need in stubs
type StubDefinition<T> = Omit<T, 'node' | 'elementNode' | 'loc'>

// Helper to create value definitions from simplified input
function createValueDefinition(name: string, valueDef: any): ValueDefinition {
  let definition: ValueDefinitionType
  
  if (typeof valueDef === 'string') {
    // Check if it's a valid Stimulus type (shorthand) or a string literal (inferred)
    if (valueDef in ValueDefinitionClass.defaultValuesForType) {
      // Shorthand: { name: "String" } - valid Stimulus type
      const typeName = valueDef as keyof typeof ValueDefinitionClass.defaultValuesForType
      definition = {
        type: typeName as string,
        default: ValueDefinitionClass.defaultValuesForType[typeName],
        kind: "shorthand"
      }
    } else {
      // Inferred: { name: "Number" } (string literal)
      definition = { type: valueDef, default: valueDef, kind: "inferred" }
    }
  } else if (valueDef && typeof valueDef === 'object' && 'kind' in valueDef && valueDef.kind === 'decorator') {
    // Decorator: { name: { kind: "decorator", type: "String", default?: ValueDefinitionValue } }
    const decoratorDef = valueDef as { kind: "decorator"; type: keyof typeof ValueDefinitionClass.defaultValuesForType; default?: ValueDefinitionValue }
    definition = {
      type: decoratorDef.type as string,
      default: decoratorDef.default ?? ValueDefinitionClass.defaultValuesForType[decoratorDef.type],
      kind: "decorator"
    }
  } else if (valueDef && typeof valueDef === 'object' && 'type' in valueDef) {
    // Expanded: { name: { type: "String", default: '/path' } }
    const expandedDef = valueDef as { type: keyof typeof ValueDefinitionClass.defaultValuesForType; default?: ValueDefinitionValue }
    definition = {
      type: expandedDef.type as string,
      default: expandedDef.default ?? ValueDefinitionClass.defaultValuesForType[expandedDef.type],
      kind: "expanded"
    }
  } else {
    // This should never happen with our current type definitions
    throw new Error(`Invalid value definition for ${name}: ${JSON.stringify(valueDef)}`)
  }
  
  // Create simple ValueDefinition object with only the essential fields
  return {
    name,
    definition,
    definitionType: (valueDef && typeof valueDef === 'object' && 'kind' in valueDef && valueDef.kind === 'decorator') ? "decorator" as const : "static" as const,
    type: definition.type,
    default: definition.default,
    hasExplicitDefaultValue: !!(valueDef && typeof valueDef === 'object' && 'default' in valueDef)
  } as ValueDefinition
}

// Input data for creating stub controllers - mirrors AST parsing input but simplified
type StubControllerInput = {
  guessedIdentifier: string  // Required - the controller identifier
  outlets?: string[]  // Array of outlet names (like static outlets = ["hello", "world"])
  targets?: string[]  // Array of target names (like static targets = ["input", "output"])
  classes?: string[]  // Array of class names (like static classes = ["loading", "loaded"])
  actions?: string[]  // Array of action names (like static actions = ["connect", "disconnect"])
  values?: { 
    [key: string]: 
      // Shorthand: { name: "String" } or { name: String }
      | keyof typeof ValueDefinitionClass.defaultValuesForType
      // Expanded: { name: { type: "String", default: '/path' } }
      | { type: keyof typeof ValueDefinitionClass.defaultValuesForType; default?: ValueDefinitionValue }
      // Inferred: { name: "Number" } (string literal)
      | string
      // Decorator: { name: { kind: "decorator", type: "String", default?: ValueDefinitionValue } }
      | { kind: "decorator"; type: keyof typeof ValueDefinitionClass.defaultValuesForType; default?: ValueDefinitionValue }
  }  // Supports all ValueDefinitionKind types: shorthand, expanded, inferred, decorator
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

      // Populate targetDefinitions
      input.targets?.forEach(name => {
        this.targetDefinitions.push({ name } as StubDefinition<TargetDefinition> as TargetDefinition)
      })

      // Populate classDefinitions
      input.classes?.forEach(name => {
        this.classDefinitions.push({ name } as StubDefinition<ClassDefinition> as ClassDefinition)
      })

      // Populate methodDefinitions
      input.actions?.forEach(name => {
        this.methodDefinitions.push({ name } as StubDefinition<MethodDefinition> as MethodDefinition)
      })

      // Populate outletDefinitions
      input.outlets?.forEach(name => {
        this.outletDefinitions.push({ name } as StubDefinition<OutletDefinition> as OutletDefinition)
      })

      // Create value definitions using helper function
      Object.entries(input.values ?? {}).forEach(([name, valueDef]) => {
        this.valueDefinitions.push(createValueDefinition(name, valueDef))
      })
    }

    get guessedIdentifier() { return this._guessedIdentifier }

    // Override the *Names getters to return our config values
    get targetNames() { return this._config.targets || [] }
    get classNames() { return this._config.classes || [] }
    get actionNames() { return this._config.actions || [] }
    get outletNames() { return this._config.outlets || [] }
    get valueNames() { return Object.keys(this._config.values || {}) }

    // Override outlets getter to return our populated outletDefinitions
    get outlets() {
      return this.outletDefinitions
    }

    get inspect(): ControllerInterface {
      return {
        guessedIdentifier: this._guessedIdentifier,
        targets: this.targetNames,
        outlets: this.outletDefinitions, // Now populated with minimal objects
        values: this.valueDefinitions,
        classes: this.classNames,
        actions: this.actionNames
      }
    }
      })(input)
}
