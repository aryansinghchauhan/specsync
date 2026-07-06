import Fastify from 'fastify'
import httpProxy from '@fastify/http-proxy'
import 'dotenv/config'

import { loadSpec, extractResponseSchemas } from './services/specLoader.js'
import { registerInterceptor } from './middleware/responseInterceptor.js'
import { getViolations } from './services/violationLogger.js'
import fs from 'fs'

const app = Fastify({ logger: false })

const TARGET = process.env.TARGET_URL || 'http://localhost:4000'
const PORT = process.env.PORT || 3000
const SAMPLE_RATE = parseFloat(process.env.SAMPLE_RATE || '1.0')
const SPEC_PATH = process.env.SPEC_PATH || 'specs/api.yaml'

// 1. Load spec
const spec = loadSpec(SPEC_PATH)
const schemaMap = extractResponseSchemas(spec)

console.log('[SpecSync] Watching endpoints:')
Object.keys(schemaMap).forEach(key => console.log(`  ${key}`))

// 2. Register interceptor before proxy
registerInterceptor(app, schemaMap, { sampleRate: SAMPLE_RATE })

// 3. Register proxy
await app.register(httpProxy, {
  upstream: TARGET,
  rewriteRequestHeaders: (req, headers) => {
    return { ...headers, 'x-specsync': 'true' }
  }
})

// 4. Dashboard routes
app.get('/specsync/health', async () => ({
  status: 'ok',
  proxy_target: TARGET,
  spec: `${spec.info.title} v${spec.info.version}`,
  watching: Object.keys(schemaMap)
}))

app.get('/specsync/violations', async () => {
  const violations = getViolations()
  return { total: violations.length, violations }
})

app.delete('/specsync/violations', async () => {
  fs.writeFileSync('violations.json', JSON.stringify([], null, 2))
  return { message: 'Violations cleared' }
})

try {
  await app.listen({ port: PORT, host: '0.0.0.0' })
  console.log(`\n[SpecSync] Proxy running on http://localhost:${PORT}`)
  console.log(`[SpecSync] Forwarding to: ${TARGET}`)
  console.log(`[SpecSync] Sample rate: ${SAMPLE_RATE * 100}%`)
  console.log(`[SpecSync] Violations dashboard: http://localhost:${PORT}/specsync/violations\n`)
} catch (err) {
  console.error(err)
  process.exit(1)
}