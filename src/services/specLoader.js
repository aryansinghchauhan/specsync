import fs from 'fs'
import path from 'path'
import {load as yamlLoad } from 'js-yaml'

export function loadSpec(specPath) {
  const fullPath = path.resolve(specPath)

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Spec file not found at: ${fullPath}`)
  }

  const raw = fs.readFileSync(fullPath, 'utf8')
  const spec = yamlLoad(raw)

  console.log(`[SpecSync] Loaded spec: ${spec.info.title} v${spec.info.version}`)
  return spec
}

export function extractResponseSchemas(spec) {
  const schemaMap = {}

  for (const [routePath, methods] of Object.entries(spec.paths || {})) {
    for (const [method, operation] of Object.entries(methods)) {
      if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue

      const responses = operation.responses || {}

      for (const [statusCode, response] of Object.entries(responses)) {
        const schema = response?.content?.['application/json']?.schema
        if (!schema) continue

        const key = `${method.toUpperCase()} ${routePath}`
        schemaMap[key] = { schema, statusCode }
      }
    }
  }

  return schemaMap
}