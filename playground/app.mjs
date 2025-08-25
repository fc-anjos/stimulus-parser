import express from "express"
import { Project, SourceFile, ClassDeclaration, ControllerDefinition, ExportDeclaration, ImportDeclaration } from "stimulus-parser"

const headers = { "Content-Type": "application/json" }

const app = express()
app.use(express.json())

function replacer(key, value) {
  if (key === "project") return undefined
  if (this instanceof SourceFile && key === "content") return undefined
  if (this instanceof ImportDeclaration && key === "sourceFile") return undefined
  if (this instanceof ExportDeclaration && key === "sourceFile") return undefined
  if (this instanceof ClassDeclaration && key === "sourceFile") return undefined
  if (this instanceof ControllerDefinition && key === "classDeclaration") return undefined

  return value
}

app.post("/api/analyze", async (request, response) => {
  console.log("API analyze called")
  try {
    console.log("Creating project")
    const project = new Project("playground")
    const files = request.body?.files || []
    console.log("Files received:", files.length)
    
    // If no files provided, return empty response
    if (files.length === 0) {
      console.log("No files, returning empty response")
      const responseData = { 
        simple: null, 
        full: null,
        project: {
          registeredControllers: [],
          controllerDefinitions: []
        }
      }
      const responseJson = JSON.stringify(responseData)
      response.status(200).set(headers).end(responseJson)
      return
    }
    
    // Add all files to the project
    console.log("Adding files to project")
    files.forEach(file => {
      if (file.path && file.content) {
        const sourceFile = new SourceFile(project, file.path, file.content)
        project.projectFiles.push(sourceFile)
      }
    })

    // Initialize and analyze the project (this will find registered controllers and resolve outlets)
    console.log("Analyzing project")
    await project.analyze()
    console.log("Project analyzed, projectFiles count:", project.projectFiles.length)
    
    // Return parser's outputs
    console.log("Creating response data")
    const responseData = { 
      simple: project.inspectResolved(),
      full: { sourceFiles: project.projectFiles }
    }
    console.log("Response data created")

    const responseJson = JSON.stringify(responseData, replacer)
    console.log("JSON stringified, sending response")
    response.status(200).set(headers).end(responseJson)
    
  } catch(e) {
    console.error("Error in analyze:", e)
    console.error("Error stack:", e.stack)
    response.status(500).set(headers).end(JSON.stringify({ error: e.message }))
  }
});

export { app }
