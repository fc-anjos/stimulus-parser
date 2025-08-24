import dedent from "dedent"
import { describe, test, expect } from "vitest"
import { parseController } from "../helpers/parse"
import { extractLoc } from "../helpers/matchers"

describe("parse outlets", () => {
  test("static outlets", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        static outlets = ["sidebar", "avatar", "user-status"]
      }
    `

    const controller = parseController(code, "outlet_controller.js")

    expect(controller.isTyped).toBeFalsy()
    expect(controller.outletNames).toEqual(["sidebar", "avatar", "user-status"])
  })

  test("single @Outlet decorator", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"
      import { Outlet, TypedController } from "@vytant/stimulus-decorators";

      @TypedController
      export default class extends Controller {
        @Outlet private readonly sidebarOutlet!: Controller;
      }
    `

    const controller = parseController(code, "outlet_controller.ts")

    expect(controller.isTyped).toBeTruthy()
    expect(controller.outletNames).toEqual(["sidebar"])
  })

  test("single @Outlets decorator", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"
      import { Outlets, TypedController } from "@vytant/stimulus-decorators";

      @TypedController
      export default class extends Controller {
        @Outlets private readonly sidebarOutlets!: Controller[];
      }
    `

    const controller = parseController(code, "outlet_controller.ts")

    expect(controller.isTyped).toBeTruthy()
    expect(controller.outletNames).toEqual(["sidebar"])
  })

  test("parse mix decorator and static definitions", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"
      import { Outlet, Outlets, TypedController } from "@vytant/stimulus-decorators";

      @TypedController
      export default class extends Controller {
        @Outlet private readonly sidebarOutlet!: Controller;
        @Outlets private readonly itemOutlets!: Controller[]

        static outlets = ['profile', 'avatar']
      }
    `

    const controller = parseController(code, "outlet_controller.ts")

    expect(controller.isTyped).toBeTruthy()
    expect(controller.outletNames).toEqual(["sidebar", "item", "profile", "avatar"])
  })

  test("duplicate outlet in mix", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"
      import { Outlet, TypedController } from "@vytant/stimulus-decorators";

      @TypedController
      export default class extends Controller {
        static outlets = ['sidebar']

        @Outlet private readonly sidebarOutlet!: Controller;
      }
    `

    const controller = parseController(code, "outlet_controller.ts")

    expect(controller.isTyped).toBeTruthy()
    expect(controller.outletNames).toEqual(["sidebar", "sidebar"])
    expect(controller.hasErrors).toBeTruthy()
    expect(controller.errors).toHaveLength(1)
    expect(controller.errors[0].message).toEqual(`Duplicate definition of Stimulus Outlet "sidebar"`)
    expect(extractLoc(controller.errors[0].loc!)).toEqual([6, 20, 6, 29])
  })

  test("duplicate static outlets", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      export default class extends Controller {
        static outlets = ["sidebar", "sidebar", "avatar"]
      }
    `

    const controller = parseController(code, "outlet_controller.js")

    expect(controller.isTyped).toBeFalsy()
    expect(controller.outletNames).toEqual(["sidebar", "sidebar", "avatar"])
    expect(controller.hasErrors).toBeTruthy()
    expect(controller.errors).toHaveLength(1)
    expect(controller.errors[0].message).toEqual(`Duplicate definition of Stimulus Outlet "sidebar"`)
    expect(extractLoc(controller.errors[0].loc!)).toEqual([4, 31, 4, 40])
  })

  test("duplicate static outlets from parent", () => {
    const code = dedent`
      import { Controller } from "@hotwired/stimulus"

      class Parent extends Controller {
        static outlets = ["sidebar"]
      }

      export default class Child extends Parent {
        static outlets = ["sidebar", "avatar"]
      }
    `

    const controller = parseController(code, "outlet_controller.js", "Child")

    expect(controller.isTyped).toBeFalsy()
    expect(controller.outletNames).toEqual(["sidebar", "avatar", "sidebar"]) // local first, then inherited
    expect(controller.hasErrors).toBeTruthy()
    expect(controller.errors).toHaveLength(1)
    expect(controller.errors[0].message).toEqual(`Duplicate definition of Stimulus Outlet "sidebar". A parent controller already defines this Outlet.`)
    expect(extractLoc(controller.errors[0].loc!)).toEqual([8, 20, 8, 29])
  })
})


