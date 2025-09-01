import { describe, test, expect } from "vitest"
import { OutletMapper } from "../../src/outlet_resolver"
import { stubControllerDefinition } from "../helpers/stub_controller"

describe("ControllerDefinition → outlets mapping", () => {
  test("registered-first resolution uses provided controller set when available", async () => {
    const helloDef = stubControllerDefinition({ guessedIdentifier: "hello" })
    const hostDef = stubControllerDefinition({ guessedIdentifier: "host", outlets: ["hello"] })

    const resolver = new OutletMapper()
    const hostResolved = await resolver.mapOutletsForController(hostDef, [hostDef, helloDef])
    const helloOutlet = hostResolved.find(o => o.name === "hello")
    expect(helloOutlet).toBeDefined()
    expect(helloOutlet!.controller?.guessedIdentifier).toBe("hello")
  })

  test("resolves outlets by identifier from provided controller definitions (no Project)", async () => {
    const helloDef = stubControllerDefinition({ guessedIdentifier: "hello" })
    const hostDef = stubControllerDefinition({ guessedIdentifier: "host", outlets: ["hello"] })

    const resolver = new OutletMapper()
    const hostResolved = await resolver.mapOutletsForController(hostDef, [hostDef, helloDef])
    const helloOutlet = hostResolved.find(o => o.name === "hello")
    expect(helloOutlet).toBeDefined()
    expect(helloOutlet!.controller?.guessedIdentifier).toBe("hello")
  })

  test("namespaced outlets resolve by exact identifier match", async () => {
    const userStatusDef = stubControllerDefinition({ guessedIdentifier: "admin--user-status" })
    const hostDef = stubControllerDefinition({ guessedIdentifier: "host", outlets: ["admin--user-status"] })

    const resolver = new OutletMapper()
    const hostResolved = await resolver.mapOutletsForController(hostDef, [hostDef, userStatusDef])
    const nsOutlet = hostResolved.find(o => o.name === "admin--user-status")
    expect(nsOutlet).toBeDefined()
    expect(nsOutlet!.controller?.guessedIdentifier).toBe("admin--user-status")
  })

  test("unresolved outlet yields empty array and no errors added", async () => {
    const hostDef = stubControllerDefinition({ guessedIdentifier: "host", outlets: ["missing"] })
    const hostResolved = await new OutletMapper().mapOutletsForController(hostDef, [hostDef])
    const missing = hostResolved.find(o => o.name === "missing")
    expect(missing?.controller).toBeUndefined()
  })

  test("outlet pointing to non-existent controller returns unresolved outlet", async () => {
    const hostDef = stubControllerDefinition({ guessedIdentifier: "host", outlets: ["non-existent-controller"] })
    const otherController = stubControllerDefinition({ guessedIdentifier: "other-controller" })
    
    const resolver = new OutletMapper()
    const hostResolved = await resolver.mapOutletsForController(hostDef, [hostDef, otherController])
    
    const nonExistentOutlet = hostResolved.find(o => o.name === "non-existent-controller")
    expect(nonExistentOutlet).toBeDefined()
    expect(nonExistentOutlet!.name).toBe("non-existent-controller")
    expect(nonExistentOutlet!.controller).toBeUndefined()
    
    const otherOutlet = hostResolved.find(o => o.name === "other-controller")
    expect(otherOutlet).toBeUndefined()
  })

  test("duplicate outlet declarations preserve order in flattened list", async () => {
    const helloDef = stubControllerDefinition({ guessedIdentifier: "hello" })
    const hostDef = stubControllerDefinition({ guessedIdentifier: "host", outlets: ["hello", "hello"] })

    const resolver = new OutletMapper()
    const hostResolved = await resolver.mapOutletsForController(hostDef, [hostDef, helloDef])
    const hellos = hostResolved.filter(o => o.name === "hello")
    expect(hellos.map(o => o.controller?.guessedIdentifier)).toEqual(["hello", "hello"])
  })

  test("static properties are properly represented when provided", async () => {
    const helloDef = stubControllerDefinition({ guessedIdentifier: "hello" })
    const hostDef = stubControllerDefinition({ guessedIdentifier: "host", outlets: ["hello"] })

    expect(hostDef.outletDefinitions.map(o => o.name)).toEqual(["hello"])
  })

test("controller resolution independent of pool membership (playground scenario)", async () => {
    const hostDef = stubControllerDefinition({ guessedIdentifier: "playground", outlets: ["hello"] })
    const resolved = await new OutletMapper().mapOutletsForController(hostDef, [hostDef])
    const helloOutlet = resolved.find(o => o.name === "hello")
    expect(helloOutlet).toBeDefined()
    expect(helloOutlet!.controller).toBeUndefined()
  })



  test("circular references are detected and marked appropriately", async () => {
    const controllerA = stubControllerDefinition({ guessedIdentifier: "a", outlets: ["b"] })
    const controllerB = stubControllerDefinition({ guessedIdentifier: "b", outlets: ["a"] })
    const resolver = new OutletMapper()

    const aResolved = await resolver.mapOutletsForController(controllerA, [controllerA, controllerB])
    const aToB = aResolved.find(o => o.name === "b")
    expect(aToB).toBeDefined()
    expect(aToB!.controller).toBeDefined()
    expect(aToB!.controller!.guessedIdentifier).toBe("b")

    const resolvedB = aToB!.controller!
    const bToAInsideAContext = resolvedB.outlets.find(o => o.name === "a")
    expect(bToAInsideAContext).toBeDefined()
    expect(bToAInsideAContext!.controller).toBeUndefined()

    const bResolved = await resolver.mapOutletsForController(controllerB, [controllerA, controllerB])
    const bToA = bResolved.find(o => o.name === "a")
    expect(bToA).toBeDefined()
    expect(bToA!.controller).toBeDefined()

    const resolvedA = bToA!.controller!
    const aToBInsideBContext = resolvedA.outlets.find(o => o.name === "b")
    expect(aToBInsideBContext).toBeDefined()
    expect(aToBInsideBContext!.controller).toBeUndefined()
  })

  test("detects cycles at any point in path, not just back to root", async () => {
    const controllerA = stubControllerDefinition({ guessedIdentifier: "a", outlets: ["b"] })
    const controllerB = stubControllerDefinition({ guessedIdentifier: "b", outlets: ["c"] })
    const controllerC = stubControllerDefinition({ guessedIdentifier: "c", outlets: ["d"] })
    const controllerD = stubControllerDefinition({ guessedIdentifier: "d", outlets: ["b"] })

    const resolver = new OutletMapper()

    const aResolved = await resolver.mapOutletsForController(controllerA, [controllerA, controllerB, controllerC, controllerD])
    const aToB = aResolved.find(o => o.name === "b")!
    expect(aToB.controller!.guessedIdentifier).toBe("b")

    const resolvedB = aToB.controller!
    const bToC = resolvedB.outlets.find(o => o.name === "c")!
    expect(bToC.controller!.guessedIdentifier).toBe("c")

    const resolvedC = bToC.controller!
    const cToD = resolvedC.outlets.find(o => o.name === "d")!
    expect(cToD.controller!.guessedIdentifier).toBe("d")

    const resolvedD = cToD.controller!
    const dToB = resolvedD.outlets.find(o => o.name === "b")!
    expect(dToB.controller).toBeUndefined()
  })

  test("outlets resolve correctly with contextual circular detection", async () => {
    const controllerA = stubControllerDefinition({ guessedIdentifier: "a", outlets: ["b"] })
    const controllerB = stubControllerDefinition({ guessedIdentifier: "b", outlets: ["c"] })
    const controllerC = stubControllerDefinition({ guessedIdentifier: "c", outlets: ["a"] })

    const resolver = new OutletMapper()

    const aResolved = await resolver.mapOutletsForController(controllerA, [controllerA, controllerB, controllerC])
    const aToB = aResolved.find(o => o.name === "b")!
    expect(aToB.controller!.guessedIdentifier).toBe("b")

    const resolvedB = aToB.controller!
    expect(resolvedB.outlets).toHaveLength(1)
    const bToC = resolvedB.outlets.find(o => o.name === "c")!
    expect(bToC.controller!.guessedIdentifier).toBe("c")

    const resolvedC = bToC.controller!
    expect(resolvedC.outlets).toHaveLength(1)
    const cToA = resolvedC.outlets.find(o => o.name === "a")!
    expect(cToA.controller).toBeUndefined()

    const bResolved = await resolver.mapOutletsForController(controllerB, [controllerA, controllerB, controllerC])
    const bToC2 = bResolved.find(o => o.name === "c")!
    expect(bToC2.controller!.guessedIdentifier).toBe("c")

    const resolvedC2 = bToC2.controller!
    const cToA2 = resolvedC2.outlets.find(o => o.name === "a")!
    expect(cToA2.controller!.guessedIdentifier).toBe("a")

    const resolvedA2 = cToA2.controller!
    const aToB2 = resolvedA2.outlets.find(o => o.name === "b")!
    expect(aToB2.controller).toBeUndefined()
  })


})


