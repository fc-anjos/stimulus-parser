import { describe, test, expect } from "vitest"
import { stubControllerDefinition } from "./stub_controller"

describe("stubControllerDefinition", () => {
  test("creates a complete controller with all property types and value shapes", () => {
    const controller = stubControllerDefinition({
      guessedIdentifier: "example",
      targets: ["input", "output"],
      classes: ["loading", "loaded"],
      actions: ["connect", "disconnect"],
      outlets: ["sidebar", "modal"],
      values: {
        // Shorthand: { name: "String" }
        url: "String",
        count: "Number",
        enabled: "Boolean",
        
        // Expanded: { name: { type: "String", default: '/path' } }
        apiUrl: { type: "String", default: "/api/v1" },
        maxRetries: { type: "Number", default: 3 },
        
        // Inferred: { name: "Number" } (string literal)
        message: "Hello World",
        version: "1.0.0",
        
        // Decorator: { name: { kind: "decorator", type: "String", default?: ValueDefinitionValue } }
        timeout: { kind: "decorator", type: "Number", default: 5000 },
        retryCount: { kind: "decorator", type: "Number" }
      }
    })

    // Test basic properties
    expect(controller.guessedIdentifier).toBe("example")
    expect(controller.targetNames).toEqual(["input", "output"])
    expect(controller.classNames).toEqual(["loading", "loaded"])
    expect(controller.actionNames).toEqual(["connect", "disconnect"])
    expect(controller.outletNames).toEqual(["sidebar", "modal"])

    // Test value names
    expect(controller.valueNames).toEqual([
      "url", "count", "enabled",
      "apiUrl", "maxRetries", 
      "message", "version",
      "timeout", "retryCount"
    ])

    // Test value definitions
    expect(controller.valueDefinitions).toHaveLength(9)

    // Test specific value types
    const urlValue = controller.valueDefinitions.find(v => v.name === "url")!
    expect(urlValue.definition.kind).toBe("shorthand")
    expect(urlValue.definitionType).toBe("static")
    expect(urlValue.type).toBe("String")
    expect(urlValue.default).toBe("")

    const apiUrlValue = controller.valueDefinitions.find(v => v.name === "apiUrl")!
    expect(apiUrlValue.definition.kind).toBe("expanded")
    expect(apiUrlValue.definitionType).toBe("static")
    expect(apiUrlValue.type).toBe("String")
    expect(apiUrlValue.default).toBe("/api/v1")
    expect(apiUrlValue.hasExplicitDefaultValue).toBe(true)

    const messageValue = controller.valueDefinitions.find(v => v.name === "message")!
    expect(messageValue.definition.kind).toBe("inferred")
    expect(messageValue.definitionType).toBe("static")
    expect(messageValue.type).toBe("Hello World")
    expect(messageValue.default).toBe("Hello World")

    const timeoutValue = controller.valueDefinitions.find(v => v.name === "timeout")!
    expect(timeoutValue.definition.kind).toBe("decorator")
    expect(timeoutValue.definitionType).toBe("decorator")
    expect(timeoutValue.type).toBe("Number")
    expect(timeoutValue.default).toBe(5000)
    expect(timeoutValue.hasExplicitDefaultValue).toBe(true)

    const retryCountValue = controller.valueDefinitions.find(v => v.name === "retryCount")!
    expect(retryCountValue.definition.kind).toBe("decorator")
    expect(retryCountValue.definitionType).toBe("decorator")
    expect(retryCountValue.type).toBe("Number")
    expect(retryCountValue.default).toBe(0) // Uses default for Number type
    expect(retryCountValue.hasExplicitDefaultValue).toBe(false)

    // Test inspect interface
    const inspect = controller.inspect
    expect(inspect.guessedIdentifier).toBe("example")
    expect(inspect.targets).toEqual(["input", "output"])
    expect(inspect.classes).toEqual(["loading", "loaded"])
    expect(inspect.actions).toEqual(["connect", "disconnect"])
    expect(inspect.outlets).toHaveLength(2)
    expect(inspect.values).toHaveLength(9)
  })
})
