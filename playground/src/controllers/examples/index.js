import { application } from "./application"
import HelloController from "./hello_controller"
import GoodbyeController from "./goodbye_controller"
import { ControllerA } from "./controller_a"
import { ControllerB } from "./controller_b"
import { ControllerC } from "./controller_c"

application.register("hello", HelloController)
application.register("goodbye", GoodbyeController)
application.register("a", ControllerA)
application.register("b", ControllerB)
application.register("c", ControllerC)
